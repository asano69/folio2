// Package importer scans a folder of book items (see docs/d01_book-import.md)
// and registers them into the database as manifests, pages, and images. An
// "item" is either a folder of image files or an archive (ZIP/CBZ) of image
// files -- see source.go and item_type.go for how new formats get added.
// Each item becomes one manifest, and each of its pages becomes one pages
// record (and one manifest_page linking it into the manifest).
package importer

import (
	"os"
	"path/filepath"
	"sort"

	"github.com/asano69/folio/internal/errs"

	"github.com/pocketbase/pocketbase/core"
)

// Progress reports incremental status while Run processes each item.
type Progress struct {
	Total     int
	Processed int
	Message   string
}

// Result summarizes what Run created across all items.
type Result struct {
	ManifestsCreated int `json:"manifests_created"`
	// ManifestsSkipped counts items whose image sequence exactly matched
	// an existing manifest, so no new manifest was created.
	ManifestsSkipped int `json:"manifests_skipped"`
	ImagesCreated    int `json:"images_created"`
	ImagesReused     int `json:"images_reused"`
}

// Run scans dir for book items (folders and archives) and imports each
// one as a manifest. onProgress is called after every item is processed
// (or skipped), so callers can persist progress (e.g. to a jobs record)
// as it happens.
//
// Items with no recognised image pages are skipped without creating a
// manifest. Running Run again on the same dir always creates new
// manifests; it does not detect or skip items imported previously.
func Run(app core.App, dir string, onProgress func(Progress)) (*Result, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, errs.Newf("read import dir: %v", err)
	}

	var names []string
	for _, e := range entries {
		if detectItemType(e.Name(), e.IsDir()) != itemUnknown {
			names = append(names, e.Name())
		}
	}
	sort.Strings(names)

	result := &Result{}
	total := len(names)

	for i, name := range names {
		if onProgress != nil {
			onProgress(Progress{Total: total, Processed: i + 1, Message: "importing: " + name})
		}

		src, err := newSource(filepath.Join(dir, name), name)
		if err != nil {
			return nil, err
		}
		if _, err := importSource(app, src, result); err != nil {
			return nil, errs.Newf("import %q: %v", name, err)
		}
	}

	if onProgress != nil {
		onProgress(Progress{Total: total, Processed: total, Message: "done"})
	}

	return result, nil
}

// ImportPaths imports the given paths directly, without scanning a
// configured import directory and without moving anything afterward
// (unlike Run, which is built around FOLIO_IMPORT_DIR). Each path is
// resolved independently:
//
//   - an archive file (ZIP/CBZ) is imported as a single book item
//   - any other plain file is skipped
//   - a directory containing image files directly is treated as a single
//     book item
//   - a directory containing no image files directly, but with
//     subdirectories or archive files, is treated as a container: each
//     subdirectory/archive is expanded as its own book item (one level
//     deep, same as Run does for FOLIO_IMPORT_DIR)
//
// onProgress is called the same way as in Run.
func ImportPaths(app core.App, paths []string, onProgress func(Progress)) (*Result, error) {
	items, err := expandBookFolders(paths)
	if err != nil {
		return nil, err
	}

	result := &Result{}
	total := len(items)

	for i, path := range items {
		label := filepath.Base(path)
		if onProgress != nil {
			onProgress(Progress{Total: total, Processed: i + 1, Message: "importing: " + label})
		}

		src, err := newSource(path, label)
		if err != nil {
			return nil, err
		}
		if _, err := importSource(app, src, result); err != nil {
			return nil, errs.Newf("import %q: %v", path, err)
		}
	}

	if onProgress != nil {
		onProgress(Progress{Total: total, Processed: total, Message: "done"})
	}

	return result, nil
}

// expandBookFolders resolves each of the given paths into the list of
// book items to import (see ImportPaths for the resolution rules).
func expandBookFolders(paths []string) ([]string, error) {
	var items []string

	for _, p := range paths {
		info, err := os.Stat(p)
		if err != nil {
			return nil, errs.Newf("stat %q: %v", p, err)
		}

		if !info.IsDir() {
			if detectItemType(p, false) == itemArchive {
				items = append(items, p)
			}
			continue
		}

		hasImages, err := hasImageFiles(p)
		if err != nil {
			return nil, err
		}
		if hasImages {
			items = append(items, p)
			continue
		}

		entries, err := os.ReadDir(p)
		if err != nil {
			return nil, errs.Newf("read dir %q: %v", p, err)
		}
		for _, e := range entries {
			if detectItemType(e.Name(), e.IsDir()) != itemUnknown {
				items = append(items, filepath.Join(p, e.Name()))
			}
		}
	}

	sort.Strings(items)
	return items, nil
}
