import { Show, createMemo } from "solid-js";
import Loading from "./Loading";
import ManifestGrid from "./ManifestGrid";
import { hiddenManifestIds } from "../lib/manifestsRefresh";
import { fetchManifestsPage } from "../lib/manifests";
import { useInfiniteList } from "../lib/useInfiniteList";

// Home's "inbox" of manifests not yet linked to any collection. Loaded
// page by page via the same infinite-scroll hook the /manifests page
// uses (see lib/useInfiniteList.js and routes/Manifests.jsx), asking the
// server to only return unclassified manifests (fetchManifestsPage's
// unclassifiedOnly option) instead of fetching every manifest and every
// collection_manifests link and filtering client-side. Once a manifest
// is added to a collection (see lib/classification.js), it disappears
// from here.
export default function Catalog() {
  const { items, loading, sentinelRef } = useInfiniteList((_query, page) =>
    fetchManifestsPage(undefined, page, { unclassifiedOnly: true }),
  );

  // Excludes manifests just dropped onto a collection (see
  // lib/classification.js). This is a plain synchronous filter over
  // whatever's already loaded, so a drop hides the item instantly
  // instead of waiting on the next scroll-triggered page fetch to
  // reflect it.
  const visible = createMemo(() =>
    items().filter((m) => !hiddenManifestIds().has(m.id)),
  );

  return (
    <>
      <ManifestGrid manifests={visible()} />
      {/* Invisible marker the IntersectionObserver watches; when it
          scrolls into view, the hook fetches the next page. */}
      <div ref={sentinelRef} />
      <Show when={loading()}>
        <Loading />
      </Show>
    </>
  );
}
