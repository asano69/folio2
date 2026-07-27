import { createResource, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import ManifestGrid from "../components/ManifestGrid";
import Loading from "../components/Loading";
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
    <div class="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <Show when={data()} fallback={<Loading />}>
        <h1 class="text-4xl">{data().label}</h1>
        <ManifestGrid manifests={data().manifests} />
      </Show>
    </div>
  );
}
