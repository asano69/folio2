package importer

import (
	"archive/zip"
	"os"
	"path/filepath"
	"testing"
)

// writeZip creates a zip file at path containing the given name -> content
// entries.
func writeZip(t *testing.T, path string, entries map[string]string) {
	t.Helper()
	f, err := os.Create(path)
	if err != nil {
		t.Fatalf("create %s: %v", path, err)
	}
	defer f.Close()

	w := zip.NewWriter(f)
	for name, content := range entries {
		fw, err := w.Create(name)
		if err != nil {
			t.Fatalf("create entry %s: %v", name, err)
		}
		if _, err := fw.Write([]byte(content)); err != nil {
			t.Fatalf("write entry %s: %v", name, err)
		}
	}
	if err := w.Close(); err != nil {
		t.Fatalf("close zip: %v", err)
	}
}

func TestZipSourceMeta_Present(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "book.zip")
	writeZip(t, path, map[string]string{
		metaFileName: `{"id": "abc", "title": "T"}`,
		"001.jpg":    "fake image data",
	})

	src := newZipSource(path, "label")
	meta, err := src.Meta()
	if err != nil {
		t.Fatalf("Meta: %v", err)
	}
	if meta == nil {
		t.Fatal("expected non-nil meta")
	}
	if meta.ID != "abc" || meta.Title != "T" {
		t.Errorf("meta = %+v", meta)
	}
}

func TestZipSourceMeta_Absent(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "book.zip")
	writeZip(t, path, map[string]string{
		"001.jpg": "fake image data",
	})

	src := newZipSource(path, "label")
	meta, err := src.Meta()
	if err != nil {
		t.Fatalf("Meta: %v", err)
	}
	if meta != nil {
		t.Errorf("expected nil meta, got %+v", meta)
	}
}

func TestZipSourceMeta_Malformed(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "book.zip")
	writeZip(t, path, map[string]string{
		metaFileName: `{not json`,
	})

	src := newZipSource(path, "label")
	if _, err := src.Meta(); err == nil {
		t.Fatal("expected an error for malformed folio.json, got nil")
	}
}

// A folio.json nested inside a subfolder must be ignored, matching how
// Pages() only considers root-level entries.
func TestZipSourceMeta_IgnoresNested(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "book.zip")
	writeZip(t, path, map[string]string{
		"sub/" + metaFileName: `{"id": "abc"}`,
		"001.jpg":              "fake image data",
	})

	src := newZipSource(path, "label")
	meta, err := src.Meta()
	if err != nil {
		t.Fatalf("Meta: %v", err)
	}
	if meta != nil {
		t.Errorf("expected nil meta, got %+v", meta)
	}
}
