// Package importer (record.go): turns a single source's pages into
// manifest/page/image database records inside one transaction, and
// contains the DB-facing helpers that support it. This is the only place
// that writes importer records, regardless of which source produced the
// pages.
package importer

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"image"
	_ "image/jpeg" // registers the JPEG format with image.DecodeConfig
	_ "image/png"  // registers the PNG format with image.DecodeConfig
	"io"
	"log/slog"
	"path/filepath"

	_ "golang.org/x/image/webp" // registers the WebP format with image.DecodeConfig
	"time"

	"github.com/asano69/folio/internal/errs"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
)

// resolveLabel picks the manifest label to use: folio.json's "title"
// takes priority when present, otherwise the source's own label
// (folder/archive name) is used.
func resolveLabel(sourceLabel string, meta *folioMeta) string {
	if meta != nil && meta.Title != "" {
		return meta.Title
	}
	return sourceLabel
}

// importSource registers src as one manifest, inside a single transaction
// so a partially-imported book is never left behind. It returns false
// (with no error) if src has no pages, or if dupIndex reports an existing
// manifest with the exact same ordered sequence of images, in which case
// nothing is created.
func importSource(app core.App, src source, result *Result, dupIndex *manifestIndex) (bool, error) {
	pages, err := src.Pages()
	if err != nil {
		return false, err
	}
	if len(pages) == 0 {
		return false, nil
	}

	// meta is the legacy folio.json content, if any. A malformed file
	// fails the whole item's import rather than being silently ignored.
	meta, err := src.Meta()
	if err != nil {
		return false, err
	}

	label := resolveLabel(src.Label(), meta)

	// Read and hash every page up front. This lets duplicate detection
	// run before any records are created, and lets findOrCreateImage
	// below reuse the already-read bytes instead of opening each page a
	// second time.
	contents := make([][]byte, len(pages))
	hashes := make([]string, len(pages))
	for i, p := range pages {
		data, err := readPage(p)
		if err != nil {
			return false, err
		}
		contents[i] = data
		hashes[i] = hashBytes(data)
	}

	if dupIndex.Has(hashes) {
		result.ManifestsSkipped++
		return false, nil
	}

	err = app.RunInTransaction(func(txApp core.App) error {
		manifest, err := createManifest(txApp, label)
		if err != nil {
			return err
		}

		if meta != nil {
			if err := createBookMetadata(txApp, manifest, meta); err != nil {
				return err
			}
		}

		// position is 0-based, so the first page gets position=0.
		for index, p := range pages {
			image, reused, err := findOrCreateImage(txApp, p.Name, contents[index], hashes[index])
			if err != nil {
				return err
			}
			if reused {
				result.ImagesReused++
			} else {
				result.ImagesCreated++
			}

			page, err := createPage(txApp, image)
			if err != nil {
				return err
			}

			originalPath := filepath.Join(src.Label(), p.Name)
			if err := createManifestPage(txApp, manifest, page, index, originalPath); err != nil {
				return err
			}
		}

		result.ManifestsCreated++
		return nil
	})
	if err != nil {
		return false, err
	}
	dupIndex.Add(hashes)
	return true, nil
}

// readPage fully reads one page's content, closing it afterward.
func readPage(p sourcePage) ([]byte, error) {
	rc, err := p.Open()
	if err != nil {
		return nil, errs.Newf("open page %q: %v", p.Name, err)
	}
	defer func() { _ = rc.Close() }()

	data, err := io.ReadAll(rc)
	if err != nil {
		return nil, errs.Newf("read page %q: %v", p.Name, err)
	}
	return data, nil
}

// hashBytes returns the hex-encoded SHA-256 digest of data.
func hashBytes(data []byte) string {
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:])
}

// compressForStorage resizes/recompresses data if it is a JPEG or PNG
// that exceeds the thresholds in image.go. Anything else -- a WebP page,
// or a JPEG/PNG that fails to decode/encode -- is stored as-is; a
// compression failure should never abort an otherwise-valid import.
func compressForStorage(data []byte, name string) ([]byte, string) {
	if !isCompressibleImage(name) {
		return data, name
	}
	processed, newName, _, err := processImage(data, name)
	if err != nil {
		slog.Warn("image compression failed, storing original", "file", name, "error", err)
		return data, name
	}
	return processed, newName
}

// decodeImageSize returns the pixel width and height of image data, used
// to populate images.width/height so viewers (e.g. PhotoSwipe) can lay
// out pages without loading the full image first.
func decodeImageSize(data []byte) (width, height int, err error) {
	cfg, _, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil {
		return 0, 0, errs.Newf("decode image config: %v", err)
	}
	return cfg.Width, cfg.Height, nil
}

// findOrCreateImage returns the images record for a page, reusing an
// existing record with the same content hash instead of storing the same
// bytes twice. hash is the page's already-computed SHA-256 digest (see
// importSource), so the content is never read twice.
func findOrCreateImage(app core.App, name string, data []byte, hash string) (record *core.Record, reused bool, err error) {
	if existing, findErr := app.FindFirstRecordByFilter("images", "hash = {:hash}", map[string]any{"hash": hash}); findErr == nil && existing != nil {
		return existing, true, nil
	}

	collection, err := app.FindCollectionByNameOrId("images")
	if err != nil {
		return nil, false, errs.Newf("find images collection: %v", err)
	}

	// Compression is applied only when actually writing a new file, not
	// during hashing/dedup above: hash identifies the source image
	// regardless of compression settings, so re-importing the same page
	// after a compression tweak still reuses the existing record instead
	// of creating a duplicate.
	data, name = compressForStorage(data, name)

	file, err := filesystem.NewFileFromBytes(data, name)
	if err != nil {
		return nil, false, errs.Newf("create image file: %v", err)
	}

	width, height, err := decodeImageSize(data)
	if err != nil {
		return nil, false, err
	}

	// Named imageRecord (not "image") to avoid shadowing the image package.
	imageRecord := core.NewRecord(collection)
	imageRecord.Set("hash", hash)
	imageRecord.Set("status", "imported")
	imageRecord.Set("image", file)
	imageRecord.Set("width", width)
	imageRecord.Set("height", height)
	// Stored file size in bytes. data here is already the post-compression
	// bytes (see compressForStorage above), so this reflects what actually
	// ends up in storage rather than the original upload size.
	imageRecord.Set("size", len(data))

	if err := app.Save(imageRecord); err != nil {
		return nil, false, errs.Newf("save image record: %v", err)
	}
	return imageRecord, false, nil
}

// createManifest creates a new manifest record with the given label.
// Folio always creates a new manifest on import, even if a manifest with
// the same label already exists; images are still deduplicated by hash,
// so re-importing the same folder/archive does not waste storage.
func createManifest(app core.App, label string) (*core.Record, error) {
	collection, err := app.FindCollectionByNameOrId("manifests")
	if err != nil {
		return nil, errs.Newf("find manifests collection: %v", err)
	}

	manifest := core.NewRecord(collection)
	manifest.Set("label", label)

	if err := app.Save(manifest); err != nil {
		return nil, errs.Newf("save manifest record: %v", err)
	}
	return manifest, nil
}

// bookMetadataFields holds the book_metadata field values derived from
// legacy folio.json, before they're written onto a record. Kept separate
// from createBookMetadata so the mapping itself can be unit tested
// without a running PocketBase app.
type bookMetadataFields struct {
	ManifestID         string
	UUID               string
	Title              string
	Abstract           string
	Language           string
	Author             []PersonName
	Translator         []PersonName
	Edition            string
	Volume             string
	Series             string
	SeriesNumber       string
	Publisher          string
	Year               string
	Note               string
	Keywords           []string
	ISBN               string
	Links              []string
	OriginalCreated    string
	HasOriginalCreated bool
}

// toBookMetadataFields maps legacy folio.json fields onto the current
// book_metadata schema (see docs/cbz-follio-json.md for the mapping):
// "id" -> uuid, "origtitle" -> title (the source's own "title" instead
// becomes manifest.label, see resolveLabel), "created_at" ->
// original_created. "version" and "updated_at" are intentionally
// discarded. created_at is expected in RFC3339 (see
// docs/cbz-follio-json.md); an unparsable value is left unset rather than
// failing the import.
func toBookMetadataFields(manifestID string, meta *folioMeta) bookMetadataFields {
	fields := bookMetadataFields{
		ManifestID:   manifestID,
		UUID:         meta.ID,
		Title:        meta.OrigTitle,
		Abstract:     meta.Abstract,
		Language:     meta.Language,
		Author:       meta.Author,
		Translator:   meta.Translator,
		Edition:      meta.Edition,
		Volume:       meta.Volume,
		Series:       meta.Series,
		SeriesNumber: meta.SeriesNumber,
		Publisher:    meta.Publisher,
		Year:         meta.Year,
		Note:         meta.Note,
		Keywords:     meta.Keywords,
		ISBN:         meta.ISBN,
		Links:        meta.Links,
	}

	if _, err := time.Parse(time.RFC3339, meta.CreatedAt); err == nil {
		fields.OriginalCreated = meta.CreatedAt
		fields.HasOriginalCreated = true
	}

	return fields
}

// createBookMetadata creates a book_metadata record from legacy folio.json
// data and links it to manifest.
func createBookMetadata(app core.App, manifest *core.Record, meta *folioMeta) error {
	collection, err := app.FindCollectionByNameOrId("book_metadata")
	if err != nil {
		return errs.Newf("find book_metadata collection: %v", err)
	}

	fields := toBookMetadataFields(manifest.Id, meta)

	record := core.NewRecord(collection)
	record.Set("manifest", fields.ManifestID)
	record.Set("uuid", fields.UUID)
	record.Set("title", fields.Title)
	record.Set("abstract", fields.Abstract)
	record.Set("language", fields.Language)
	record.Set("author", fields.Author)
	record.Set("translator", fields.Translator)
	record.Set("edition", fields.Edition)
	record.Set("volume", fields.Volume)
	record.Set("series", fields.Series)
	record.Set("series_number", fields.SeriesNumber)
	record.Set("publisher", fields.Publisher)
	record.Set("year", fields.Year)
	record.Set("note", fields.Note)
	record.Set("keywords", fields.Keywords)
	record.Set("isbn", fields.ISBN)
	record.Set("links", fields.Links)
	// PocketBase's date field accepts an RFC3339 string directly.
	if fields.HasOriginalCreated {
		record.Set("original_created", fields.OriginalCreated)
	}

	if err := app.Save(record); err != nil {
		return errs.Newf("save book_metadata record: %v", err)
	}
	return nil
}

// createPage creates a new pages record pointing at the given image.
// page_number is left unset; it is filled in later by the user or by a
// future folio.json metadata file.
func createPage(app core.App, image *core.Record) (*core.Record, error) {
	collection, err := app.FindCollectionByNameOrId("pages")
	if err != nil {
		return nil, errs.Newf("find pages collection: %v", err)
	}

	page := core.NewRecord(collection)
	page.Set("image", image.Id)

	if err := app.Save(page); err != nil {
		return nil, errs.Newf("save page record: %v", err)
	}
	return page, nil
}

// createManifestPage links page into manifest at position, with the
// original page name (folder-relative path or archive entry name)
// preserved for troubleshooting.
func createManifestPage(app core.App, manifest, page *core.Record, position int, originalPath string) error {
	collection, err := app.FindCollectionByNameOrId("manifest_pages")
	if err != nil {
		return errs.Newf("find manifest_pages collection: %v", err)
	}

	manifestPage := core.NewRecord(collection)
	manifestPage.Set("manifest", manifest.Id)
	manifestPage.Set("page", page.Id)
	manifestPage.Set("position", position)
	manifestPage.Set("status", "NOT_STARTED")
	manifestPage.Set("original_path", originalPath)

	if err := app.Save(manifestPage); err != nil {
		return errs.Newf("save manifest_page record: %v", err)
	}
	return nil
}
