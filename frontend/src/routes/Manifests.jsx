import { Show, createSignal } from "solid-js";
import ManifestGrid from "../components/ManifestGrid";
import Loading from "../components/Loading";
import SearchBox from "../components/SearchBox";
import { fetchManifestsPage } from "../lib/manifests";
import { useInfiniteList } from "../lib/useInfiniteList";

// Complete list of every manifest, regardless of collection membership --
// unlike Home/Catalog, which only shows manifests not yet added to a
// collection. Cards are draggable onto a CollectionSidebar row the same
// way as on Home; ManifestGrid already wires that up, so no extra work
// is needed here.
//
// Loaded page by page (see lib/useInfiniteList.js) instead of all at
// once, since a library can hold close to a thousand manifests and
// fetching/rendering them all up front made this page slow to open.
// Further pages are loaded automatically as the user scrolls near the
// bottom, via an IntersectionObserver watching a sentinel element placed
// after the grid.
//
// `query` (what was actually searched for) is a signal fed by SearchBox's
// onSearch, kept separate from the box's own internal input text -- see
// components/SearchBox.jsx.
export default function Manifests() {
  const [query, setQuery] = createSignal("");

  const { items, loading, sentinelRef } = useInfiniteList(
    fetchManifestsPage,
    query,
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
