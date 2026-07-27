// Package importer (meta.go): parses the legacy folio.json format used by
// the previous version of folio (see docs/cbz-follio-json.md). Only the
// fields consumed during import are decoded; "version" and "updated_at"
// are intentionally ignored per the current import mapping.
package importer

import (
	"encoding/json"
	"io"

	"github.com/asano69/folio/internal/errs"
)

// metaFileName is the name of the legacy metadata file, stored at the
// root of a book folder or a CBZ/ZIP archive.
const metaFileName = "folio.json"

// PersonName mirrors a single author/translator entry in folio.json.
type PersonName struct {
	Family string `json:"family,omitempty"`
	Given  string `json:"given,omitempty"`
}

// folioMeta is the legacy folio.json contents. Fields map directly to the
// JSON keys used by the previous version of folio.
type folioMeta struct {
	ID           string       `json:"id"`
	Title        string       `json:"title"`
	OrigTitle    string       `json:"origtitle"`
	Abstract     string       `json:"abstract"`
	Language     string       `json:"language"`
	Author       []PersonName `json:"author"`
	Translator   []PersonName `json:"translator"`
	Edition      string       `json:"edition"`
	Volume       string       `json:"volume"`
	Series       string       `json:"series"`
	SeriesNumber string       `json:"series_number"`
	Publisher    string       `json:"publisher"`
	Year         string       `json:"year"`
	Note         string       `json:"note"`
	Keywords     []string     `json:"keywords"`
	ISBN         string       `json:"isbn"`
	Links        []string     `json:"links"`
	CreatedAt    string       `json:"created_at"`
}

// decodeFolioMeta parses folio.json content from r. A malformed file is
// treated as a hard error, failing the whole item's import (see
// importSource), rather than being silently skipped.
func decodeFolioMeta(r io.Reader) (*folioMeta, error) {
	var m folioMeta
	if err := json.NewDecoder(r).Decode(&m); err != nil {
		return nil, errs.Newf("decode %s: %v", metaFileName, err)
	}
	return &m, nil
}
