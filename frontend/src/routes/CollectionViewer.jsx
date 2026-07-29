import { createResource } from "solid-js";
import { useParams } from "@solidjs/router";
import ManifestGrid from "../components/ManifestGrid";
import ViewerPage from "../components/ViewerPage";
import CollectionEditButton from "../components/CollectionEditButton";
import pb from "../lib/pb";
import { attachCovers } from "../lib/manifests";

// Loads one collection plus the manifests linked to it, ordered by
// collection_manifests.position. Each manifest's cover is borrowed from
// its first page (manifest_pages.position === 0), same as Catalog.jsx
// and the /manifests page.
async function fetchCollectionManifests(collectionId) {
  const collection = await pb.collection("collections").getOne(collectionId);

  const links = await pb.collection("collection_manifests").getFullList({
    filter: pb.filter("collection = {:id}", { id: collectionId }),
    sort: "position",
    expand: "manifest",
  });

  return {
    label: collection.label,
    manifests: links.map((link) => link.expand.manifest),
  };
}

export default function CollectionViewer() {
  const params = useParams();
  const [data, { refetch }] = createResource(
    () => params.id,
    fetchCollectionManifests,
  );

  // Covers are fetched as a second resource, sourced from `data`, so the
  // grid can render (with fallback icons) as soon as the manifest list
  // itself arrives, instead of waiting for every cover too. Solid
  // re-runs this fetcher automatically whenever `data` changes.
  const [manifestsWithCovers] = createResource(
    () => data()?.manifests,
    attachCovers,
  );

  return (
    <ViewerPage resource={data}>
      <div class="flex items-center gap-2">
        <h1 class="text-4xl">{data().label}</h1>
        {/* Refetches this page's data once the edit dialog closes, so a
            renamed label or new cover shows up immediately. */}
        <CollectionEditButton
          collectionId={params.id}
          label={data().label}
          onClose={refetch}
        />
      </div>
      <ManifestGrid manifests={manifestsWithCovers() ?? data().manifests} />
    </ViewerPage>
  );
}
