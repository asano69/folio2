// Package importer (item_type.go): classifies scanned paths into the item
// type that determines which source implementation to use. Adding a new
// importable format is a matter of adding its extension here and a
// matching case in newSource.
package importer

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/asano69/folio/internal/errs"
)

// itemType identifies which source implementation handles a given import
// target (a folder or a file) discovered while scanning.
type itemType int

const (
	itemUnknown itemType = iota
	itemFolder
	itemArchive
)

// archiveExtensions lists the file extensions treated as page archives.
// CBZ is just a ZIP file under a different extension, so both map to the
// same zipSource implementation.
var archiveExtensions = map[string]bool{
	".zip": true,
	".cbz": true,
}

// detectItemType classifies a name (directory or file) so the caller
// knows which source constructor applies. isDir must reflect whether name
// refers to a directory.
func detectItemType(name string, isDir bool) itemType {
	if isDir {
		return itemFolder
	}
	if archiveExtensions[strings.ToLower(filepath.Ext(name))] {
		return itemArchive
	}
	return itemUnknown
}

// newSource builds the source implementation matching path's item type,
// using label as the resulting manifest's label.
func newSource(path, label string) (source, error) {
	info, err := os.Stat(path)
	if err != nil {
		return nil, errs.Newf("stat %q: %v", path, err)
	}

	switch detectItemType(path, info.IsDir()) {
	case itemFolder:
		return newFolderSource(path, label), nil
	case itemArchive:
		return newZipSource(path, label), nil
	default:
		return nil, errs.Newf("unsupported import item %q", path)
	}
}
