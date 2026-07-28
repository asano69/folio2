import { Show, createResource } from "solid-js";
import pb from "../lib/pb";
import Loading from "./Loading";
import ManifestGrid from "./ManifestGrid";
import { refreshKey } from "../lib/manifestsRefresh";

// Fetches every manifest that isn't linked to any collection yet, so Home
// acts as an "inbox" of unclassified manifests. Once a manifest is added
// to a collection (see lib/classification.js), it disappears from here.
//
// manifests has no cover field of its own, so the thumbnail shown here is
// borrowed from each manifest's first page (manifest_pages.position === 0).
// Manifests without a first page simply fall back to the placeholder icon.
async function fetchManifests() {
  const [manifests, links] = await Promise.all([
    pb.collection("manifests").getFullList({ sort: "-created" }),
    pb.collection("collection_manifests").getFullList({ fields: "manifest" }),
  ]);

  const classifiedIds = new Set(links.map((link) => link.manifest));
  const unclassified = manifests.filter((m) => !classifiedIds.has(m.id));

  const covers = await Promise.all(
    unclassified.map((manifest) =>
      pb
        .collection("manifest_pages")
        .getFirstListItem(
          pb.filter("manifest = {:id} && position = 0", { id: manifest.id }),
          { expand: "page.image" },
        )
        .catch(() => null),
    ),
  );

  return unclassified.map((manifest, i) => ({
    ...manifest,
    coverImage: covers[i]?.expand?.page?.expand?.image ?? null,
  }));
}

export default function Catalog() {
  // refreshKey is only used as a createResource dependency: bumping it
  // re-runs fetchManifests, which is how a just-classified manifest
  // disappears from this list without a page reload.
  const [manifests] = createResource(refreshKey, fetchManifests);

  return (
    <Show when={manifests()} fallback={<Loading />}>
      <ManifestGrid manifests={manifests()} />
    </Show>
  );
}
