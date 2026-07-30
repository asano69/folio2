// Package gc (queries.go): raw DB reads used to compute the orphan plan
// (see gc.go). Kept separate from the pure set-difference logic in gc.go
// so that logic can be unit tested without a database.
package gc

import (
	"github.com/asano69/folio/internal/errs"

	"github.com/pocketbase/pocketbase/core"
)

// pageRow is one row of pages.id/pages.image, used to determine which
// image each page currently points at.
type pageRow struct {
	ID    string `db:"id"`
	Image string `db:"image"`
}

// imageRow is one row of images.id/hash/size, used to report orphaned
// images with enough detail to identify them without opening PocketBase's
// admin UI.
type imageRow struct {
	ID   string `db:"id"`
	Hash string `db:"hash"`
	Size int    `db:"size"`
}

// manifestPageRef is one row of manifest_pages.page, used to build the
// set of page ids still linked from some manifest.
type manifestPageRef struct {
	Page string `db:"page"`
}

// referencedPageIDs returns the distinct set of page ids linked from at
// least one manifest_pages record.
func referencedPageIDs(app core.App) (map[string]bool, error) {
	var rows []manifestPageRef
	err := app.DB().
		NewQuery(`SELECT DISTINCT {{manifest_pages}}.page AS page FROM {{manifest_pages}}`).
		All(&rows)
	if err != nil {
		return nil, errs.Newf("list referenced pages: %v", err)
	}

	ids := make(map[string]bool, len(rows))
	for _, r := range rows {
		ids[r.Page] = true
	}
	return ids, nil
}

// allPages loads every page's id and image reference. Small-scale load
// (whole table at once), matching this app's personal-use scale -- see
// internal/importer/duplicate_index.go for the same tradeoff.
func allPages(app core.App) ([]pageRow, error) {
	var rows []pageRow
	err := app.DB().NewQuery(`SELECT id, image FROM {{pages}}`).All(&rows)
	if err != nil {
		return nil, errs.Newf("list pages: %v", err)
	}
	return rows, nil
}

// allImages loads every image's id, hash, and size.
func allImages(app core.App) ([]imageRow, error) {
	var rows []imageRow
	err := app.DB().NewQuery(`SELECT id, hash, size FROM {{images}}`).All(&rows)
	if err != nil {
		return nil, errs.Newf("list images: %v", err)
	}
	return rows, nil
}
