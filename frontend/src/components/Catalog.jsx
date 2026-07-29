import { Show, createResource, createMemo } from "solid-js";
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

  // Covers are fetched once for the full, unfiltered manifest list (not
  // re-run every time a manifest is hidden -- see below). Solid re-runs
  // this fetcher automatically whenever `manifests` itself changes.
  const [withCovers] = createResource(manifests, attachCovers);

  // Excludes manifests just dropped onto a collection (see
  // lib/classification.js). This is a plain synchronous filter over
  // whatever's already loaded, so a drop hides the item instantly
  // instead of waiting on another cover-fetch round-trip.
  const visible = createMemo(() =>
    (withCovers() ?? manifests())?.filter(
      (m) => !hiddenManifestIds().has(m.id),
    ),
  );

  return (
    <Show when={manifests()} fallback={<Loading />}>
      <ManifestGrid manifests={visible()} />
    </Show>
  );
}
