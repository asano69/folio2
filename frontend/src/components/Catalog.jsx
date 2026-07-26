import { Show, createResource } from "solid-js";
import pb from "../lib/pb";
import Loading from "./Loading";
import ManifestGrid from "./ManifestGrid";

// Fetches all manifests so Home can link into /manifests/:id; this is
// currently the only entry point into a manifest's viewer.
//
// manifests has no cover field of its own, so the thumbnail shown here is
// borrowed from each manifest's first page (manifest_pages.position === 0).
// Manifests without a first page simply fall back to the placeholder icon.
async function fetchManifests() {
  const manifests = await pb.collection("manifests").getFullList({ sort: "-created" });

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

  return manifests.map((manifest, i) => ({
    ...manifest,
    coverImage: covers[i]?.expand?.page?.expand?.image ?? null,
  }));
}

export default function Catalog() {
  const [manifests] = createResource(fetchManifests);

  return (
    <Show when={manifests()} fallback={<Loading />}>
      <ManifestGrid manifests={manifests()} />
    </Show>
  );
}
