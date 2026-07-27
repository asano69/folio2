package importer

import (
	"os"
	"path/filepath"
	"testing"
)

func writeFile(t *testing.T, path, content string) {
	t.Helper()
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatalf("write %s: %v", path, err)
	}
}

func TestFolderSourceMeta_Present(t *testing.T) {
	dir := t.TempDir()
	writeFile(t, filepath.Join(dir, metaFileName), `{"id": "abc", "title": "T"}`)

	src := newFolderSource(dir, "label")
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

func TestFolderSourceMeta_Absent(t *testing.T) {
	dir := t.TempDir()

	src := newFolderSource(dir, "label")
	meta, err := src.Meta()
	if err != nil {
		t.Fatalf("Meta: %v", err)
	}
	if meta != nil {
		t.Errorf("expected nil meta, got %+v", meta)
	}
}

func TestFolderSourceMeta_Malformed(t *testing.T) {
	dir := t.TempDir()
	writeFile(t, filepath.Join(dir, metaFileName), `{not json`)

	src := newFolderSource(dir, "label")
	if _, err := src.Meta(); err == nil {
		t.Fatal("expected an error for malformed folio.json, got nil")
	}
}
