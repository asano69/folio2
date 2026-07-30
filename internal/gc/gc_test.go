package gc

import (
	"reflect"
	"testing"
)

// An image shared between a kept page and an orphan page must not be
// deleted -- only the orphan page itself, and any image left with no
// kept page pointing at it.
func TestOrphansOf(t *testing.T) {
	referenced := map[string]bool{"page-kept": true}
	pages := []pageRow{
		{ID: "page-kept", Image: "image-shared"},
		{ID: "page-orphan", Image: "image-shared"},
		{ID: "page-orphan-2", Image: "image-orphan"},
	}
	images := []imageRow{
		{ID: "image-shared", Hash: "h1", Size: 100},
		{ID: "image-orphan", Hash: "h2", Size: 200},
	}

	plan := orphansOf(referenced, pages, images)

	var gotPages []string
	for _, p := range plan.OrphanPages {
		gotPages = append(gotPages, p.ID)
	}
	wantPages := []string{"page-orphan", "page-orphan-2"}
	if !reflect.DeepEqual(gotPages, wantPages) {
		t.Errorf("OrphanPages = %v, want %v", gotPages, wantPages)
	}

	var gotImages []string
	for _, img := range plan.OrphanImages {
		gotImages = append(gotImages, img.ID)
	}
	wantImages := []string{"image-orphan"}
	if !reflect.DeepEqual(gotImages, wantImages) {
		t.Errorf("OrphanImages = %v, want %v", gotImages, wantImages)
	}
}

func TestOrphansOf_NoOrphans(t *testing.T) {
	referenced := map[string]bool{"page-a": true}
	pages := []pageRow{{ID: "page-a", Image: "image-a"}}
	images := []imageRow{{ID: "image-a", Hash: "h", Size: 1}}

	plan := orphansOf(referenced, pages, images)
	if !plan.Empty() {
		t.Errorf("expected empty plan, got %+v", plan)
	}
}
