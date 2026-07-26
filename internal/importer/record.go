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
	"path/filepath"
	"slices"

	_ "golang.org/x/image/webp" // registers the WebP format with image.DecodeConfig

	"github.com/asano69/folio/internal/errs"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
)

// importSource registers src as one manifest, inside a single transaction
// so a partially-imported book is never left behind. It returns false
// (with no error) if src has no pages, or if an existing manifest already
// has the exact same ordered sequence of images, in which case nothing is
// created.
func importSource(app core.App, src source, result *Result) (bool, error) {
	pages, err := src.Pages()
	if err != nil {
		return false, err
	}
	if len(pages) == 0 {
		return false, nil
	}

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

	duplicate, err := findDuplicateManifest(app, hashes)
	if err != nil {
		return false, err
	}
	if duplicate != nil {
		result.ManifestsSkipped++
		return false, nil
	}

	err = app.RunInTransaction(func(txApp core.App) error {
		manifest, err := createManifest(txApp, src.Label())
		if err != nil {
			return err
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

// findDuplicateManifest returns an existing manifest whose pages carry the
// exact same ordered sequence of image hashes as hashes, or nil if no such
// manifest exists. This lets re-importing an unchanged folder/archive
// reuse the existing manifest instead of creating a duplicate.
func findDuplicateManifest(app core.App, hashes []string) (*core.Record, error) {
	manifests, err := app.FindRecordsByFilter("manifests", "", "-created", 0, 0)
	if err != nil {
		return nil, errs.Newf("list manifests: %v", err)
	}

	for _, manifest := range manifests {
		existing, err := manifestImageHashes(app, manifest.Id)
		if err != nil {
			return nil, err
		}
		if slices.Equal(existing, hashes) {
			return manifest, nil
		}
	}
	return nil, nil
}

// manifestImageHashes returns the ordered list of image hashes for a
// manifest's pages, following manifest_pages -> pages -> images.
func manifestImageHashes(app core.App, manifestID string) ([]string, error) {
	manifestPages, err := app.FindRecordsByFilter(
		"manifest_pages",
		"manifest = {:id}",
		"position",
		0, 0,
		map[string]any{"id": manifestID},
	)
	if err != nil {
		return nil, errs.Newf("list manifest pages: %v", err)
	}

	hashes := make([]string, 0, len(manifestPages))
	for _, mp := range manifestPages {
		page, err := app.FindRecordById("pages", mp.GetString("page"))
		if err != nil {
			return nil, errs.Newf("find page: %v", err)
		}
		image, err := app.FindRecordById("images", page.GetString("image"))
		if err != nil {
			return nil, errs.Newf("find image: %v", err)
		}
		hashes = append(hashes, image.GetString("hash"))
	}
	return hashes, nil
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
