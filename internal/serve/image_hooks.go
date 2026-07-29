// Package serve (image_hooks.go): compresses image files uploaded
// through the API -- e.g. EditManifestButton's cover replace (see
// frontend/src/lib/manifestCover.js), or a collection/library cover
// upload -- the same way internal/importer compresses images during a
// folder import, so results are consistent regardless of which path an
// image took into the database. Images created internally by the
// importer bypass this hook entirely (they're saved directly via
// app.Save, not through an API request) and already go through the same
// internal/imageproc compression themselves.
package serve

import (
	"io"
	"log/slog"

	"github.com/asano69/folio/internal/imageproc"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
)

// registerImageHooks compresses uploaded image files before the request
// is validated and persisted: the "images" collection's own "image"
// field (with its accompanying metadata fields), and the plain cover
// field on "collections"/"libraries". Covers can be set on create or
// changed later via update (see CollectionEditButton/LibraryEditButton),
// so both request types are hooked for those two collections.
func registerImageHooks(app *pocketbase.PocketBase) {
	app.OnRecordCreateRequest("images").BindFunc(func(e *core.RecordRequestEvent) error {
		if err := compressUploadedImage(e.Record); err != nil {
			return err
		}
		return e.Next()
	})

	for _, name := range []string{"collections", "libraries"} {
		compressCover := func(e *core.RecordRequestEvent) error {
			if _, err := compressUploadedFile(e.Record, "cover"); err != nil {
				return err
			}
			return e.Next()
		}
		app.OnRecordCreateRequest(name).BindFunc(compressCover)
		app.OnRecordUpdateRequest(name).BindFunc(compressCover)
	}
}

// compressUploadedFile reads fieldName's newly uploaded file (if any),
// recompresses it via internal/imageproc, and sets fieldName on record to
// the compressed result. It returns the compressed bytes so callers that
// need to derive further metadata (e.g. compressUploadedImage) can do so
// without re-reading the file; nil is returned (with no error) when the
// record carries no uploaded file for fieldName.
func compressUploadedFile(record *core.Record, fieldName string) ([]byte, error) {
	files := record.GetUnsavedFiles(fieldName)
	if len(files) != 1 {
		return nil, nil
	}

	reader, err := files[0].Reader.Open()
	if err != nil {
		return nil, err
	}
	data, err := io.ReadAll(reader)
	_ = reader.Close()
	if err != nil {
		return nil, err
	}

	compressed, name := imageproc.CompressForStorage(data, files[0].OriginalName)

	newFile, err := filesystem.NewFileFromBytes(compressed, name)
	if err != nil {
		return nil, err
	}
	record.Set(fieldName, newFile)

	return compressed, nil
}

// compressUploadedImage compresses the "images" record's "image" field
// and fills in the record's width/height/size/hash/status fields with the
// result. A record with no uploaded file is left untouched.
func compressUploadedImage(record *core.Record) error {
	compressed, err := compressUploadedFile(record, "image")
	if err != nil {
		return err
	}
	if compressed == nil {
		return nil
	}

	width, height, err := imageproc.DecodeSize(compressed)
	if err != nil {
		slog.Warn("decode uploaded image size", "error", err)
	}
	record.Set("width", width)
	record.Set("height", height)
	record.Set("size", len(compressed))

	// The frontend upload doesn't send these (see lib/manifestCover.js);
	// fill them in here so the "images" collection's required "hash"
	// field is satisfied and status matches what the importer sets.
	if record.GetString("hash") == "" {
		record.Set("hash", imageproc.HashBytes(compressed))
	}
	if record.GetString("status") == "" {
		record.Set("status", "imported")
	}
	return nil
}
