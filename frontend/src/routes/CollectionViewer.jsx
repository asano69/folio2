import { createResource } from "solid-js";
import { useParams } from "@solidjs/router";
import ManifestGrid from "../components/ManifestGrid";
import ViewerPage from "../components/ViewerPage";
import pb from "../lib/pb";

// Loads one collection plus the manifests linked to it, ordered by
// collection_manifests.position. Each manifest's cover is borrowed from
// its first page (manifest_pages.position === 0), same as Catalog.jsx
// does for the top-level manifest list.
async function fetchCollectionManifests(collectionId) {
  const collection = await pb.collection("collections").getOne(collectionId);

  const links = await pb.collection("collection_manifests").getFullList({
    filter: pb.filter("collection = {:id}", { id: collectionId }),
    sort: "position",
    expand: "manifest",
  });

  const manifests = links.map((link) => link.expand.manifest);

  const covers = await Promise.all(
    manifests.map((manifest) =>
      pb
        .collection("manifest_pages")
        .getFirstListItem(
          pb.filter("manifest = {:id} && position = 0", { id: manifest.id }),
          { expand: "page.image" },
        )
        .catch(() => null),
    ),
  );

  return {
    label: collection.label,
    manifests: manifests.map((manifest, i) => ({
      ...manifest,
      coverImage: covers[i]?.expand?.page?.expand?.image ?? null,
    })),
  };
}

export default function CollectionViewer() {
  const params = useParams();
  const [data] = createResource(() => params.id, fetchCollectionManifests);

  return (
    <ViewerPage resource={data}>
      <h1 class="text-4xl">{data().label}</h1>
      <ManifestGrid manifests={data().manifests} />
    </ViewerPage>
  );
}
