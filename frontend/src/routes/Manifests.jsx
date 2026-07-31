import { Show, createSignal, createResource } from "solid-js";
import ManifestGrid from "../components/ManifestGrid";
import Loading from "../components/Loading";
import SearchBox from "../components/SearchBox";
import {
  fetchShuffledIds,
  fetchManifestsPageByIds,
  shuffleToken,
} from "../lib/manifests";
import { useInfiniteList } from "../lib/useInfiniteList";

// Complete list of every manifest, regardless of collection membership --
// unlike Home/Catalog, which only shows manifests not yet added to a
// collection. Cards are draggable onto a CollectionSidebar row the same
// way as on Home; ManifestGrid already wires that up, so no extra work
// is needed here.
//
// Shown in a random order, reshuffled every time this page is opened:
// createResource fetches the matching manifest ids and shuffles them
// once (see lib/manifests.js's fetchShuffledIds), then that fixed order
// is paginated through via lib/useInfiniteList.js -- instead of fetching
// and rendering everything up front, since a library can hold close to a
// thousand manifests. Further pages are loaded automatically as the user
// scrolls near the bottom, via an IntersectionObserver watching a
// sentinel element placed after the grid.
//
// `query` (what was actually searched for) is a signal fed by SearchBox's
// onSearch, kept separate from the box's own internal input text -- see
// components/SearchBox.jsx.
export default function Manifests() {
  const [query, setQuery] = createSignal("");

  // Re-shuffles whenever the search query changes, or whenever
  // shuffleToken is bumped -- which happens on mount (createResource
  // runs its fetcher immediately) and also whenever NavBar's Manifests
  // link is clicked while already on this page, since Solid Router
  // doesn't remount the route in that case.
  const [orderedIds] = createResource(
    () => [query(), shuffleToken()],
    ([q]) => fetchShuffledIds(q),
  );

  const { items, loading, sentinelRef } = useInfiniteList(
    (ids, page) => fetchManifestsPageByIds(ids, page),
    () => orderedIds(),
  );

  return (
    <div class="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center gap-8 px-6 py-12">
      <SearchBox placeholder="Search by label" onSearch={setQuery} />
      <ManifestGrid manifests={items()} />
      {/* Invisible marker the IntersectionObserver watches; when it
          scrolls into view, the hook fetches the next page. */}
      <div ref={sentinelRef} />
      <Show when={loading()}>
        <Loading />
      </Show>
    </div>
  );
}
