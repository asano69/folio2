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

// manifestPageHash is one row of the manifest/position/hash join query
// used by newManifestIndex below.
type manifestPageHash struct {
	Manifest string `db:"manifest"`
	Position int    `db:"position"`
	Hash     string `db:"hash"`
}

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

// newManifestIndex loads every manifest's page image hashes with a single
// SQL join across manifest_pages -> pages -> images, ordered so each
// manifest's hashes arrive already in page order. A single join avoids
// building an "id IN (...)" query over every page/image id, which would
// otherwise hit SQLite's bound-variable limit once a library has enough
// pages.
func newManifestIndex(app core.App) (*manifestIndex, error) {
	var rows []manifestPageHash
	err := app.DB().NewQuery(`
		SELECT {{manifest_pages}}.manifest AS manifest,
		       {{manifest_pages}}.position AS position,
		       {{images}}.hash AS hash
		FROM {{manifest_pages}}
		INNER JOIN {{pages}} ON {{pages}}.id = {{manifest_pages}}.page
		INNER JOIN {{images}} ON {{images}}.id = {{pages}}.image
		ORDER BY {{manifest_pages}}.manifest, {{manifest_pages}}.position
	`).All(&rows)
	if err != nil {
		return nil, errs.Newf("list manifest page hashes: %v", err)
	}

	// rows is already ordered by manifest, then position, so hashes for
	// each manifest are appended below in the correct page order.
	hashesByManifest := make(map[string][]string)
	var order []string
	for _, row := range rows {
		if _, seen := hashesByManifest[row.Manifest]; !seen {
			order = append(order, row.Manifest)
		}
		hashesByManifest[row.Manifest] = append(hashesByManifest[row.Manifest], row.Hash)
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
