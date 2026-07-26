// Package importer scans a folder of book folders (see docs/d01_book-import.md)
// and registers their images into the database as manifests, pages, and
// images. Each book folder becomes one manifest, and each folder's images
// become one page (and one manifest_page linking it into the manifest) apiece.
package importer

import (
	"crypto/sha256"
	"encoding/hex"
	"image"
	_ "image/jpeg" // registers the JPEG format with image.DecodeConfig
	_ "image/png"  // registers the PNG format with image.DecodeConfig
	"io"
	"os"
	"path/filepath"
	"slices"
	"sort"
	"strings"

	_ "golang.org/x/image/webp" // registers the WebP format with image.DecodeConfig

	"github.com/asano69/folio2/internal/errs"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
)

// imageExtensions lists the file extensions treated as book pages.
// Everything else (metadata files, hidden files like .DS_Store, ...) is ignored.
var imageExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".webp": true,
}

// Progress reports incremental status while Run processes each folder.
type Progress struct {
	Total     int
	Processed int
	Message   string
}

// Result summarizes what Run created across all folders.
type Result struct {
	ManifestsCreated int `json:"manifests_created"`
	// ManifestsSkipped counts folders whose image sequence exactly
	// matched an existing manifest, so no new manifest was created.
	ManifestsSkipped int `json:"manifests_skipped"`
	ImagesCreated    int `json:"images_created"`
	ImagesReused     int `json:"images_reused"`
}

// Run scans dir for book folders and imports each one as a manifest.
// onProgress is called after every folder is processed (or skipped), so
// callers can persist progress (e.g. to a jobs record) as it happens.
//
// Folders with no recognised image files are skipped without creating a
// manifest. Running Run again on the same dir always creates new
// manifests; it does not detect or skip folders imported previously.
func Run(app core.App, dir string, onProgress func(Progress)) (*Result, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, errs.Newf("read import dir: %v", err)
	}

	var folders []string
	for _, e := range entries {
		if e.IsDir() {
			folders = append(folders, e.Name())
		}
	}
	sort.Strings(folders)

	result := &Result{}
	total := len(folders)

	for i, name := range folders {
		if onProgress != nil {
			onProgress(Progress{Total: total, Processed: i, Message: "importing: " + name})
		}

		if _, err := importFolder(app, filepath.Join(dir, name), name, result); err != nil {
			return nil, errs.Newf("import folder %q: %v", name, err)
		}
	}

	if onProgress != nil {
		onProgress(Progress{Total: total, Processed: total, Message: "done"})
	}

	return result, nil
}

// importFolder registers a single book folder as one manifest, inside a
// single transaction so a partially-imported book is never left behind.
// It returns false (with no error) if the folder contains no recognised
// image files, or if an existing manifest already has the exact same
// ordered sequence of images, in which case nothing is created.
func importFolder(app core.App, path, label string, result *Result) (bool, error) {
	files, err := listImageFiles(path)
	if err != nil {
		return false, err
	}
	if len(files) == 0 {
		return false, nil
	}

	// Hash every file up front. This lets duplicate detection run before
	// any records are created, and lets findOrCreateImage below reuse the
	// hash instead of reading each file a second time.
	hashes := make([]string, len(files))
	for i, file := range files {
		hash, err := hashFile(file)
		if err != nil {
			return false, err
		}
		hashes[i] = hash
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
		manifest, err := createManifest(txApp, label)
		if err != nil {
			return err
		}

		// position is 0-based, so the first image in a folder gets
		// position=0.
		for index, file := range files {
			image, reused, err := findOrCreateImage(txApp, file, hashes[index])
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

			if err := createManifestPage(txApp, manifest, page, index, filepath.Join(label, filepath.Base(file))); err != nil {
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

// findDuplicateManifest returns an existing manifest whose pages carry the
// exact same ordered sequence of image hashes as hashes, or nil if no such
// manifest exists. This lets re-importing an unchanged folder reuse the
// existing manifest instead of creating a duplicate.
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

// listImageFiles returns the image files directly inside dir, sorted by
// filename using a plain string sort (no natural-order handling).
// Subfolders are not descended into.
func listImageFiles(dir string) ([]string, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, errs.Newf("read book folder: %v", err)
	}

	var files []string
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		if !imageExtensions[strings.ToLower(filepath.Ext(e.Name()))] {
			continue
		}
		files = append(files, filepath.Join(dir, e.Name()))
	}
	sort.Strings(files)
	return files, nil
}

// hashFile returns the hex-encoded SHA-256 digest of the file at path.
func hashFile(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", errs.Newf("open file: %v", err)
	}
	defer f.Close()

	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", errs.Newf("hash file: %v", err)
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

// decodeImageSize returns the pixel width and height of the image file at
// path, used to populate images.width/height so viewers (e.g. PhotoSwipe)
// can lay out pages without loading the full image first.
func decodeImageSize(path string) (width, height int, err error) {
	f, err := os.Open(path)
	if err != nil {
		return 0, 0, errs.Newf("open image for size check: %v", err)
	}
	defer f.Close()

	cfg, _, err := image.DecodeConfig(f)
	if err != nil {
		return 0, 0, errs.Newf("decode image config: %v", err)
	}
	return cfg.Width, cfg.Height, nil
}

// findOrCreateImage returns the images record for the file at path,
// reusing an existing record with the same content hash instead of
// storing the same bytes twice. hash is the file's already-computed
// SHA-256 digest (see importFolder), so the file is never read twice.
func findOrCreateImage(app core.App, path, hash string) (record *core.Record, reused bool, err error) {
	if existing, findErr := app.FindFirstRecordByFilter("images", "hash = {:hash}", map[string]any{"hash": hash}); findErr == nil && existing != nil {
		return existing, true, nil
	}

	collection, err := app.FindCollectionByNameOrId("images")
	if err != nil {
		return nil, false, errs.Newf("find images collection: %v", err)
	}

	file, err := filesystem.NewFileFromPath(path)
	if err != nil {
		return nil, false, errs.Newf("read image file: %v", err)
	}

	width, height, err := decodeImageSize(path)
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
// Folio2 always creates a new manifest on import, even if a manifest with
// the same label already exists; images are still deduplicated by hash,
// so re-importing the same folder does not waste storage.
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
// original file path preserved for troubleshooting.
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
