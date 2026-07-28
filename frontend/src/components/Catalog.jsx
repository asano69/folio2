import { Show, createResource } from "solid-js";
import pb from "../lib/pb";
import Loading from "./Loading";
import ManifestGrid from "./ManifestGrid";
import { refreshKey } from "../lib/manifestsRefresh";
import { attachCovers } from "../lib/manifests";

// Fetches every manifest that isn't linked to any collection yet, so Home
// acts as an "inbox" of unclassified manifests. Once a manifest is added
// to a collection (see lib/classification.js), it disappears from here.
// For the complete list regardless of collection membership, see the
// /manifests page (lib/manifests.js's fetchAllManifests).
async function fetchManifests() {
  const [manifests, links] = await Promise.all([
    pb.collection("manifests").getFullList({ sort: "-created" }),
    pb.collection("collection_manifests").getFullList({ fields: "manifest" }),
  ]);

  const classifiedIds = new Set(links.map((link) => link.manifest));
  const unclassified = manifests.filter((m) => !classifiedIds.has(m.id));

  return attachCovers(unclassified);
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
