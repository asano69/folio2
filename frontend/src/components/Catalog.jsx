import { Show, createResource } from "solid-js";
import pb from "../lib/pb";
import Loading from "./Loading";
import ManifestGrid from "./ManifestGrid";
import { hiddenManifestIds } from "../lib/manifestsRefresh";
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
  return manifests.filter((m) => !classifiedIds.has(m.id));
}

export default function Catalog() {
  const [manifests] = createResource(fetchManifests);

  // Excludes manifests just dropped onto a collection (see
  // lib/classification.js), so the list updates the instant a drop
  // happens instead of waiting for a request/refetch to land.
  const visibleManifests = () =>
    manifests()?.filter((m) => !hiddenManifestIds().has(m.id));

  // Covers are fetched as a second resource, sourced from
  // `visibleManifests`, so the grid can render immediately once the
  // manifest list itself is ready (with fallback icons), instead of
  // waiting for covers too. Solid re-runs this fetcher automatically
  // whenever `visibleManifests` changes.
  const [withCovers] = createResource(visibleManifests, attachCovers);

  return (
    <Show when={manifests()} fallback={<Loading />}>
      <ManifestGrid manifests={withCovers() ?? visibleManifests()} />
    </Show>
  );
}
