import { Show, createMemo, createSignal } from "solid-js";
import { TextField } from "@kobalte/core/text-field";
import { Button } from "@kobalte/core/button";
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
  // The search box only searches on submit (Enter or the button), not on
  // every keystroke, so `query` (what was actually searched for) is kept
  // separate from `input` (the field's current text) -- same split as
  // routes/Manifests.jsx.
  const [input, setInput] = createSignal("");
  const [query, setQuery] = createSignal("");

  const { items, loading, sentinelRef } = useInfiniteList(
    (q, page) => fetchManifestsPage(q, page, { unclassifiedOnly: true }),
    query,
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(input());
  };

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
