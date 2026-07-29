// Package serve (image_hooks.go): compresses image files uploaded
// through the API -- e.g. EditManifestButton's cover replace (see
// frontend/src/lib/manifestCover.js) -- the same way internal/importer
// compresses images during a folder import, so results are consistent
// regardless of which path an image took into the database. Images
// created internally by the importer bypass this hook entirely (they're
// saved directly via app.Save, not through an API request) and already
// go through the same internal/imageproc compression themselves.
package serve

import (
	"io"
	"log/slog"

	"github.com/asano69/folio/internal/imageproc"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
)

// registerImageHooks compresses a newly uploaded "images" record's file
// before the create request is validated and persisted.
func registerImageHooks(app *pocketbase.PocketBase) {
	app.OnRecordCreateRequest("images").BindFunc(func(e *core.RecordRequestEvent) error {
		if err := compressUploadedImage(e.Record); err != nil {
			return err
		}
		return e.Next()
	})
}

// compressUploadedImage reads the "image" field's newly uploaded file,
// recompresses it via internal/imageproc, and fills in the record's
// image/width/height/size/hash/status fields with the result. A record
// with no uploaded file is left untouched.
func compressUploadedImage(record *core.Record) error {
	files := record.GetUnsavedFiles("image")
	if len(files) != 1 {
		return nil
	}

	reader, err := files[0].Reader.Open()
	if err != nil {
		return err
	}
	data, err := io.ReadAll(reader)
	_ = reader.Close()
	if err != nil {
		return err
	}

	compressed, name := imageproc.CompressForStorage(data, files[0].OriginalName)

	newFile, err := filesystem.NewFileFromBytes(compressed, name)
	if err != nil {
		return err
	}
	record.Set("image", []*filesystem.File{newFile})

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
