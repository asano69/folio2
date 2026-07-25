// frontend/src/routes/ManifestViewer.jsx
import { createResource, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import NavBar from "../components/NavBar";
import PageGallery from "../components/PageGallery";
import pb from "../lib/pb";

// Loads a manifest's pages, ordered by position, expanded down to their
// image record (width/height/file), so PageGallery can render thumbnails
// and hand a ready-to-use dataSource to PhotoSwipe.
async function fetchImages(manifestId) {
  const records = await pb.collection("manifest_pages").getFullList({
    filter: pb.filter("manifest = {:id}", { id: manifestId }),
    sort: "position",
    expand: "page.image",
  });
  return records.map((r) => r.expand.page.expand.image);
}

export default function ManifestViewer() {
  const params = useParams();
  const [images] = createResource(() => params.id, fetchImages);

  return (
    <div class="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 bg-[var(--color-bg)] px-6 py-12 text-[var(--color-text)]">
      <NavBar />
      <Show when={images()} fallback={<p>Loading…</p>}>
        <PageGallery images={images()} />
      </Show>
    </div>
  );
}
