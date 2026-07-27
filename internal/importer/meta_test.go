package importer

import (
	"strings"
	"testing"
)

func TestDecodeFolioMeta(t *testing.T) {
	input := `{
		"version": "2026-04-20",
		"id": "019da294-f490-73d7-8dbd-a81da1aec5f2",
		"title": "知識管理のためのノート術",
		"origtitle": "Note-taking for Knowledge Management",
		"language": "ja",
		"author": [{"family": "Yamada", "given": "Taro"}],
		"created_at": "2026-04-18T07:12:20+09:00"
	}`

	meta, err := decodeFolioMeta(strings.NewReader(input))
	if err != nil {
		t.Fatalf("decodeFolioMeta: %v", err)
	}

	if meta.ID != "019da294-f490-73d7-8dbd-a81da1aec5f2" {
		t.Errorf("ID = %q", meta.ID)
	}
	if meta.Title != "知識管理のためのノート術" {
		t.Errorf("Title = %q", meta.Title)
	}
	if meta.OrigTitle != "Note-taking for Knowledge Management" {
		t.Errorf("OrigTitle = %q", meta.OrigTitle)
	}
	if len(meta.Author) != 1 || meta.Author[0].Family != "Yamada" || meta.Author[0].Given != "Taro" {
		t.Errorf("Author = %+v", meta.Author)
	}
	if meta.CreatedAt != "2026-04-18T07:12:20+09:00" {
		t.Errorf("CreatedAt = %q", meta.CreatedAt)
	}
}

func TestDecodeFolioMeta_Malformed(t *testing.T) {
	if _, err := decodeFolioMeta(strings.NewReader("{not json")); err == nil {
		t.Fatal("expected an error for malformed JSON, got nil")
	}
}
