// Package importer (source.go): defines the source abstraction that lets
// the rest of the importer treat a folder of images and an archive of
// images identically.
package importer

import "io"

// source abstracts over where a book's pages come from (a folder on disk,
// a zip/cbz archive, etc.), so the rest of the importer only ever deals
// with an ordered list of named byte streams regardless of origin.
type source interface {
	// Label returns the manifest label to use for this source.
	Label() string
	// Pages returns the book's pages in order, already filtered to
	// recognised image extensions and sorted by name.
	Pages() ([]sourcePage, error)
}

// sourcePage is one page within a source: a name (used for
// manifest_pages.original_path) and a function to open its content.
type sourcePage struct {
	Name string
	Open func() (io.ReadCloser, error)
}
