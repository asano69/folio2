// frontend/src/routes/ManifestViewer.jsx
import { createResource } from "solid-js";
import { useParams, useSearchParams } from "@solidjs/router";
import PageGallery from "../components/PageGallery";
import ViewerPage from "../components/ViewerPage";
import EditManifestButton from "../components/EditManifestButton";
import pb from "../lib/pb";

// Loads the manifest's label plus its pages, ordered by position,
// expanded down to their image record (width/height/file), so
// PageGallery can render thumbnails, hand a ready-to-use dataSource to
// PhotoSwipe, and open the note editor for the currently viewed page.
// The note itself is just pages.description.
async function fetchManifestData(manifestId) {
  const [manifest, records] = await Promise.all([
    pb.collection("manifests").getOne(manifestId),
    pb.collection("manifest_pages").getFullList({
      filter: pb.filter("manifest = {:id}", { id: manifestId }),
      sort: "position",
      expand: "page.image",
    }),
  ]);

  const images = records
    // position 0 is the cover page, already shown in the Catalog, so it
    // is excluded here to avoid showing it twice.
    .filter((r) => r.position !== 0)
    .map((r) => ({
      manifestPageId: r.id,
      pageId: r.expand.page.id,
      image: r.expand.page.expand.image,
      description: r.expand.page.description,
      position: r.position,
    }));

  return { label: manifest.label, images };
}

export default function ManifestViewer() {
  const params = useParams();
  // `i` tracks the manifest_pages.position of the page PhotoSwipe currently
  // shows, so each page gets its own shareable URI (e.g. .../manifests/abc?i=2).
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, { refetch }] = createResource(() => params.id, fetchManifestData);

  return (
    <ViewerPage resource={data}>
      <div class="flex items-center gap-2">
        <h1 class="text-4xl">{data().label}</h1>
        {/* Refetches this page's data once the edit dialog closes, so a
            renamed label or replaced cover shows up immediately. */}
        <EditManifestButton
          manifestId={params.id}
          label={data().label}
          onClose={refetch}
        />
      </div>
      <PageGallery
        images={data().images}
        position={searchParams.i}
        onPositionChange={(i) => setSearchParams({ i }, { replace: true })}
      />
    </ViewerPage>
  );
}
