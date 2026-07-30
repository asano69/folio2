import { Show, createSignal } from "solid-js";
import { TextField } from "@kobalte/core/text-field";
import { Button } from "@kobalte/core/button";
import ManifestGrid from "../components/ManifestGrid";
import Loading from "../components/Loading";
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
// The search box only searches on submit (Enter or the button), not on
// every keystroke, so `query` (what was actually searched for) is kept
// separate from `input` (the field's current text).
export default function Manifests() {
  const [input, setInput] = createSignal("");
  const [query, setQuery] = createSignal("");

  const { items, loading, sentinelRef } = useInfiniteList(
    fetchManifestsPage,
    query,
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(input());
  };

  return (
    <div class="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center gap-8 px-6 py-12">
      <form onSubmit={handleSearch} class="flex w-full gap-2">
        <TextField value={input()} onChange={setInput} class="flex-1">
          <TextField.Input
            type="search"
            placeholder="Search by label"
            class="w-full rounded-md border px-3 py-2"
          />
        </TextField>
        <Button type="submit">Search</Button>
      </form>
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
