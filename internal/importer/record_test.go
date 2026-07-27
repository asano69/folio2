package importer

import (
	"reflect"
	"testing"
)

func TestResolveLabel(t *testing.T) {
	cases := []struct {
		name        string
		sourceLabel string
		meta        *folioMeta
		want        string
	}{
		{"no meta", "folder-name", nil, "folder-name"},
		{"meta without title", "folder-name", &folioMeta{}, "folder-name"},
		{"meta with title", "folder-name", &folioMeta{Title: "Book Title"}, "Book Title"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := resolveLabel(tc.sourceLabel, tc.meta); got != tc.want {
				t.Errorf("resolveLabel(%q, %+v) = %q, want %q", tc.sourceLabel, tc.meta, got, tc.want)
			}
		})
	}
}

func TestToBookMetadataFields_Mapping(t *testing.T) {
	meta := &folioMeta{
		ID:           "019da294-f490-73d7-8dbd-a81da1aec5f2",
		Title:        "知識管理のためのノート術",
		OrigTitle:    "Note-taking for Knowledge Management",
		Abstract:     "abstract",
		Language:     "ja",
		Author:       []PersonName{{Family: "Yamada", Given: "Taro"}},
		Translator:   []PersonName{{Family: "細谷", Given: "貞雄"}},
		Edition:      "2",
		Volume:       "1",
		Series:       "情報学ライブラリ",
		SeriesNumber: "12",
		Publisher:    "架空出版",
		Year:         "2024",
		Note:         "参考文献と索引あり",
		Keywords:     []string{"知識管理", "ノート術"},
		Links:        []string{"https://example.org/books/asano2026-example"},
		CreatedAt:    "2026-04-18T07:12:20+09:00",
	}

	fields := toBookMetadataFields("manifest-id", meta)

	// "id" -> UUID, "origtitle" -> Title. meta.Title (the legacy "title")
	// is deliberately not reflected here; it becomes manifest.label
	// instead, via resolveLabel (see TestResolveLabel).
	if fields.ManifestID != "manifest-id" {
		t.Errorf("ManifestID = %q", fields.ManifestID)
	}
	if fields.UUID != meta.ID {
		t.Errorf("UUID = %q, want %q", fields.UUID, meta.ID)
	}
	if fields.Title != meta.OrigTitle {
		t.Errorf("Title = %q, want %q", fields.Title, meta.OrigTitle)
	}
	if !reflect.DeepEqual(fields.Author, meta.Author) {
		t.Errorf("Author = %+v, want %+v", fields.Author, meta.Author)
	}
	if !reflect.DeepEqual(fields.Translator, meta.Translator) {
		t.Errorf("Translator = %+v, want %+v", fields.Translator, meta.Translator)
	}
	if !reflect.DeepEqual(fields.Keywords, meta.Keywords) {
		t.Errorf("Keywords = %+v, want %+v", fields.Keywords, meta.Keywords)
	}
	if !reflect.DeepEqual(fields.Links, meta.Links) {
		t.Errorf("Links = %+v, want %+v", fields.Links, meta.Links)
	}

	if !fields.HasOriginalCreated {
		t.Fatal("expected HasOriginalCreated to be true")
	}
	if fields.OriginalCreated != meta.CreatedAt {
		t.Errorf("OriginalCreated = %q, want %q", fields.OriginalCreated, meta.CreatedAt)
	}
}

func TestToBookMetadataFields_InvalidCreatedAt(t *testing.T) {
	meta := &folioMeta{CreatedAt: "not-a-date"}

	fields := toBookMetadataFields("manifest-id", meta)

	if fields.HasOriginalCreated {
		t.Error("expected HasOriginalCreated to be false for an unparsable created_at")
	}
}

func TestToBookMetadataFields_NoCreatedAt(t *testing.T) {
	meta := &folioMeta{}

	fields := toBookMetadataFields("manifest-id", meta)

	if fields.HasOriginalCreated {
		t.Error("expected HasOriginalCreated to be false when created_at is empty")
	}
}
