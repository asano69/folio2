// Package importer (zip_source.go): source implementation backed by a
// ZIP or CBZ archive (CBZ is the same ZIP format under a different
// extension). Subfolders inside the archive are not supported: only
// entries directly at the archive root are treated as pages.
package importer

import (
	"archive/zip"
	"bytes"
	"io"
	"path/filepath"
	"sort"
	"strings"

	"github.com/asano69/folio/internal/errs"
)

// zipSource is a source backed by a ZIP/CBZ archive.
type zipSource struct {
	path  string
	label string
}

func newZipSource(path, label string) *zipSource {
	return &zipSource{path: path, label: label}
}

func (s *zipSource) Label() string { return s.label }

// Meta reads folio.json from the archive root, if present.
func (s *zipSource) Meta() (*folioMeta, error) {
	r, err := zip.OpenReader(s.path)
	if err != nil {
		return nil, errs.Newf("open archive: %v", err)
	}
	defer func() { _ = r.Close() }()

	for _, f := range r.File {
		if f.FileInfo().IsDir() || strings.ContainsRune(f.Name, '/') {
			continue
		}
		if f.Name != metaFileName {
			continue
		}

		rc, err := f.Open()
		if err != nil {
			return nil, errs.Newf("open archive entry %q: %v", f.Name, err)
		}
		defer func() { _ = rc.Close() }()

		return decodeFolioMeta(rc)
	}
	return nil, nil
}

// Pages opens the archive, reads every root-level image entry fully into
// memory, then closes the archive before returning. This keeps
// sourcePage.Open simple (a plain byte reader, no archive handle to keep
// alive across pages), at the cost of holding one book's worth of image
// data in memory at once -- acceptable for the personal-use scale this
// app targets.
func (s *zipSource) Pages() ([]sourcePage, error) {
	r, err := zip.OpenReader(s.path)
	if err != nil {
		return nil, errs.Newf("open archive: %v", err)
	}
	defer func() { _ = r.Close() }()

	var entries []*zip.File
	for _, f := range r.File {
		// Skip directory entries and anything nested in a subfolder; only
		// root-level files are treated as pages.
		if f.FileInfo().IsDir() || strings.ContainsRune(f.Name, '/') {
			continue
		}
		if imageExtensions[strings.ToLower(filepath.Ext(f.Name))] {
			entries = append(entries, f)
		}
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Name < entries[j].Name })

	pages := make([]sourcePage, len(entries))
	for i, f := range entries {
		data, err := readZipEntry(f)
		if err != nil {
			return nil, err
		}
		pages[i] = sourcePage{
			Name: f.Name,
			Open: func() (io.ReadCloser, error) { return io.NopCloser(bytes.NewReader(data)), nil },
		}
	}
	return pages, nil
}

func readZipEntry(f *zip.File) ([]byte, error) {
	rc, err := f.Open()
	if err != nil {
		return nil, errs.Newf("open archive entry %q: %v", f.Name, err)
	}
	defer func() { _ = rc.Close() }()

	data, err := io.ReadAll(rc)
	if err != nil {
		return nil, errs.Newf("read archive entry %q: %v", f.Name, err)
	}
	return data, nil
}
