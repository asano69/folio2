// Package gc implements "folio gc": deleting pages and images that are no
// longer referenced from anywhere in the database.
//
// A page is orphaned when no manifest_pages record links to it. An image
// is orphaned when, after orphan pages are removed, no remaining (kept)
// page points at it -- an image can be shared by multiple pages via
// content hashing (see internal/importer/record.go), so it only becomes
// orphaned once every page using it is gone.
package gc

import (
	"github.com/asano69/folio/internal/errs"

	"github.com/pocketbase/pocketbase/core"
)

// OrphanPage is one pages record with no manifest_pages link.
type OrphanPage struct {
	ID string
}

// OrphanImage is one images record no longer referenced by any kept page.
type OrphanImage struct {
	ID   string
	Hash string
	Size int
}

// Plan is the set of records a gc run would delete (or has deleted, once
// Run has committed the transaction).
type Plan struct {
	OrphanPages  []OrphanPage
	OrphanImages []OrphanImage
}

// Empty reports whether there is nothing to delete.
func (p *Plan) Empty() bool {
	return len(p.OrphanPages) == 0 && len(p.OrphanImages) == 0
}

// Run computes the current orphan plan. With dryRun, it only returns the
// plan without deleting anything.
//
// Otherwise, the whole computation and deletion happens inside a single
// transaction, so the plan that gets acted on can never be stale against
// changes made to the database in between.
func Run(app core.App, dryRun bool) (*Plan, error) {
	if dryRun {
		return computePlan(app)
	}

	var plan *Plan
	err := app.RunInTransaction(func(txApp core.App) error {
		p, err := computePlan(txApp)
		if err != nil {
			return err
		}
		plan = p

		for _, op := range p.OrphanPages {
			record, err := txApp.FindRecordById("pages", op.ID)
			if err != nil {
				return errs.Newf("find orphan page %q: %v", op.ID, err)
			}
			// Deletes the page's stored files too (PocketBase handles
			// that as part of deleting the record).
			if err := txApp.Delete(record); err != nil {
				return errs.Newf("delete orphan page %q: %v", op.ID, err)
			}
		}

		for _, oi := range p.OrphanImages {
			record, err := txApp.FindRecordById("images", oi.ID)
			if err != nil {
				return errs.Newf("find orphan image %q: %v", oi.ID, err)
			}
			if err := txApp.Delete(record); err != nil {
				return errs.Newf("delete orphan image %q: %v", oi.ID, err)
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return plan, nil
}

// computePlan reads the current state of pages/manifest_pages/images and
// derives the orphan plan from it (see orphansOf for the actual
// set-difference logic).
func computePlan(app core.App) (*Plan, error) {
	referenced, err := referencedPageIDs(app)
	if err != nil {
		return nil, err
	}
	pages, err := allPages(app)
	if err != nil {
		return nil, err
	}
	images, err := allImages(app)
	if err != nil {
		return nil, err
	}

	return orphansOf(referenced, pages, images), nil
}

// orphansOf is the pure set-difference logic behind computePlan, kept
// separate so it can be unit tested without a database (see gc_test.go).
//
// A page is orphaned when its id is absent from referencedPageIDs. An
// image is orphaned when no *kept* page (i.e. one that is not itself
// orphaned) points at it.
func orphansOf(referencedPageIDs map[string]bool, pages []pageRow, images []imageRow) *Plan {
	var orphanPages []OrphanPage
	keptImageIDs := make(map[string]bool, len(pages))

	for _, p := range pages {
		if referencedPageIDs[p.ID] {
			keptImageIDs[p.Image] = true
		} else {
			orphanPages = append(orphanPages, OrphanPage{ID: p.ID})
		}
	}

	var orphanImages []OrphanImage
	for _, img := range images {
		if !keptImageIDs[img.ID] {
			orphanImages = append(orphanImages, OrphanImage{ID: img.ID, Hash: img.Hash, Size: img.Size})
		}
	}

	return &Plan{OrphanPages: orphanPages, OrphanImages: orphanImages}
}
