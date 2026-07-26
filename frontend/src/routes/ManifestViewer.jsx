// frontend/src/routes/ManifestViewer.jsx
import { createResource, Show } from "solid-js";
import { useParams, useSearchParams } from "@solidjs/router";
import NavBar from "../components/NavBar";
import PageGallery from "../components/PageGallery";
import pb from "../lib/pb";

// Loads a manifest's pages, ordered by position, expanded down to their
// image record (width/height/file) and their note (if any), so PageGallery
// can render thumbnails, hand a ready-to-use dataSource to PhotoSwipe, and
// open the note editor for the currently viewed page.
async function fetchImages(manifestId) {
  const records = await pb.collection("manifest_pages").getFullList({
    filter: pb.filter("manifest = {:id}", { id: manifestId }),
    sort: "position",
    expand: "page.image,note",
  });
  return records.map((r) => ({
    manifestPageId: r.id,
    image: r.expand.page.expand.image,
    note: r.expand.note ?? null,
  }));
}

export default function ManifestViewer() {
  const params = useParams();
  // `p` (1-indexed) tracks which page PhotoSwipe currently shows, so each
  // page gets its own shareable URI (e.g. .../manifests/abc?p=2).
  const [searchParams, setSearchParams] = useSearchParams();
  const [images] = createResource(() => params.id, fetchImages);

  return (
    <div class="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 bg-[var(--color-bg)] px-6 py-12 text-[var(--color-text)]">
      <NavBar />
      <Show when={images()} fallback={<p>Loading…</p>}>
        <PageGallery
          images={images()}
          page={searchParams.p}
          onPageChange={(p) => setSearchParams({ p }, { replace: true })}
        />
      </Show>
    </div>
  );
}
