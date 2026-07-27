// Package importer (folder_source.go): source implementation backed by a
// plain directory of image files.
package importer

import (
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/asano69/folio/internal/errs"
)

// imageExtensions lists the file extensions treated as book pages.
// Everything else (metadata files, hidden files like .DS_Store, ...) is ignored.
var imageExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".webp": true,
}

// folderSource is a source backed by a directory of image files directly
// inside it (subfolders are not descended into).
type folderSource struct {
	path  string
	label string
}

func newFolderSource(path, label string) *folderSource {
	return &folderSource{path: path, label: label}
}

func (s *folderSource) Label() string { return s.label }

// Meta reads folio.json from directly inside the book folder, if present.
func (s *folderSource) Meta() (*folioMeta, error) {
	f, err := os.Open(filepath.Join(s.path, metaFileName))
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, errs.Newf("open %s: %v", metaFileName, err)
	}
	defer func() { _ = f.Close() }()

	return decodeFolioMeta(f)
}

func (s *folderSource) Pages() ([]sourcePage, error) {
	entries, err := os.ReadDir(s.path)
	if err != nil {
		return nil, errs.Newf("read book folder: %v", err)
	}

	var names []string
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		if imageExtensions[strings.ToLower(filepath.Ext(e.Name()))] {
			names = append(names, e.Name())
		}
	}
	sort.Strings(names)

	pages := make([]sourcePage, len(names))
	for i, name := range names {
		full := filepath.Join(s.path, name)
		pages[i] = sourcePage{
			Name: name,
			Open: func() (io.ReadCloser, error) { return os.Open(full) },
		}
	}
	return pages, nil
}

// hasImageFiles reports whether dir directly contains at least one
// recognised image file (not descending into subfolders). Used by
// ImportPaths to decide whether a directory itself is a book folder or a
// container of book folders.
func hasImageFiles(dir string) (bool, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return false, errs.Newf("read dir %q: %v", dir, err)
	}
	for _, e := range entries {
		if !e.IsDir() && imageExtensions[strings.ToLower(filepath.Ext(e.Name()))] {
			return true, nil
		}
	}
	return false, nil
}
