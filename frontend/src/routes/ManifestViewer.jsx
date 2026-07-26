// frontend/src/routes/ManifestViewer.jsx
import { createResource, Show } from "solid-js";
import { useParams, useSearchParams } from "@solidjs/router";
import NavBar from "../components/NavBar";
import PageGallery from "../components/PageGallery";
import Loading from "../components/Loading";
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
  return records
    // position 0 is the cover page, already shown in the Catalog, so it
    // is excluded here to avoid showing it twice.
    .filter((r) => r.position !== 0)
    .map((r) => ({
      manifestPageId: r.id,
      image: r.expand.page.expand.image,
      note: r.expand.note ?? null,
      position: r.position,
    }));
}

export default function ManifestViewer() {
  const params = useParams();
  // `i` tracks the manifest_pages.position of the page PhotoSwipe currently
  // shows, so each page gets its own shareable URI (e.g. .../manifests/abc?i=2).
  const [searchParams, setSearchParams] = useSearchParams();
  const [images] = createResource(() => params.id, fetchImages);

  return (
    <div class="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <NavBar />
      <Show when={images()} fallback={<Loading />}>
        <PageGallery
          images={images()}
          position={searchParams.i}
          onPositionChange={(i) => setSearchParams({ i }, { replace: true })}
        />
      </Show>
    </div>
  );
}
