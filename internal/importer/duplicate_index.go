// Package importer (duplicate_index.go): a lookup that lets importSource
// check whether a manifest with the same ordered sequence of page image
// hashes already exists, without re-querying and re-comparing every
// existing manifest for each item being imported (the previous
// implementation used to live in record.go).
package importer

import (
	"strings"

	"github.com/asano69/folio/internal/errs"

	"github.com/pocketbase/pocketbase/core"
)

// manifestIndex caches the content signature (see signatureOf) of every
// existing manifest, so a duplicate check is a single map lookup instead
// of a linear scan that re-fetches each manifest's pages and images.
type manifestIndex struct {
	signatures map[string]bool
}

// signatureOf turns an ordered sequence of page image hashes into a
// single string usable as a map key. NUL never appears in a hex SHA-256
// hash, so it's a safe separator.
func signatureOf(hashes []string) string {
	return strings.Join(hashes, "\x00")
}

// newManifestIndex loads every manifest's page image hashes in only three
// queries total, regardless of how many manifests or pages exist: one for
// every manifest_pages record, one batch fetch of the referenced pages,
// and one batch fetch of the referenced images. The previous
// implementation issued two additional queries (FindRecordById for the
// page, then for the image) per manifest_pages row, for every existing
// manifest, for every single item being imported.
func newManifestIndex(app core.App) (*manifestIndex, error) {
	manifestPages, err := app.FindRecordsByFilter("manifest_pages", "", "manifest,position", 0, 0)
	if err != nil {
		return nil, errs.Newf("list manifest pages: %v", err)
	}
	if len(manifestPages) == 0 {
		return &manifestIndex{signatures: map[string]bool{}}, nil
	}

	pageIDs := make([]string, 0, len(manifestPages))
	for _, mp := range manifestPages {
		pageIDs = append(pageIDs, mp.GetString("page"))
	}
	pages, err := app.FindRecordsByIds("pages", pageIDs)
	if err != nil {
		return nil, errs.Newf("find pages: %v", err)
	}
	pageByID := make(map[string]*core.Record, len(pages))
	imageIDs := make([]string, 0, len(pages))
	for _, page := range pages {
		pageByID[page.Id] = page
		imageIDs = append(imageIDs, page.GetString("image"))
	}

	images, err := app.FindRecordsByIds("images", imageIDs)
	if err != nil {
		return nil, errs.Newf("find images: %v", err)
	}
	hashByImageID := make(map[string]string, len(images))
	for _, image := range images {
		hashByImageID[image.Id] = image.GetString("hash")
	}

	// manifestPages is sorted by manifest, then position, so hashes for
	// each manifest are appended below in the correct page order.
	hashesByManifest := make(map[string][]string)
	var order []string
	for _, mp := range manifestPages {
		page := pageByID[mp.GetString("page")]
		if page == nil {
			continue
		}
		hash, ok := hashByImageID[page.GetString("image")]
		if !ok {
			continue
		}
		manifestID := mp.GetString("manifest")
		if _, seen := hashesByManifest[manifestID]; !seen {
			order = append(order, manifestID)
		}
		hashesByManifest[manifestID] = append(hashesByManifest[manifestID], hash)
	}

	signatures := make(map[string]bool, len(order))
	for _, id := range order {
		signatures[signatureOf(hashesByManifest[id])] = true
	}
	return &manifestIndex{signatures: signatures}, nil
}

// Has reports whether an existing manifest (or one already imported
// earlier in the same run, see Add) has the exact same ordered sequence
// of page image hashes as hashes.
func (idx *manifestIndex) Has(hashes []string) bool {
	return idx.signatures[signatureOf(hashes)]
}

// Add records a newly created manifest's signature, so a duplicate
// appearing later in the same run (e.g. the same folder listed twice) is
// also caught, without reloading the index from the database.
func (idx *manifestIndex) Add(hashes []string) {
	idx.signatures[signatureOf(hashes)] = true
}
