import {
  createEffect,
  createSignal,
  on,
  onCleanup,
  onMount,
  untrack,
} from "solid-js";

// Generic infinite-scroll pagination: fetches `fetchPage(query, page)` page
// by page as the returned sentinel element scrolls into view, appending
// each page to the running list. Shared by routes/Manifests.jsx (the full
// manifest list) and components/Catalog.jsx (Home's unclassified inbox),
// so both get the same paging/loading behavior from one place.
//
// `fetchPage` must resolve to { items, hasMore }. `query`, if given, is a
// reactive accessor (e.g. a signal); whenever its value changes, the list
// restarts from page 1 -- this is what lets Manifests.jsx's search box
// reuse the same hook. Callers with nothing to search by (Catalog) can
// simply omit it.
export function useInfiniteList(fetchPage, query = () => undefined) {
  const [items, setItems] = createSignal([]);
  const [page, setPage] = createSignal(1);
  const [hasMore, setHasMore] = createSignal(true);
  const [loading, setLoading] = createSignal(false);

  // Guarded by loading()/hasMore() so the IntersectionObserver below can
  // call this on every intersection without causing duplicate or
  // out-of-range requests.
  const loadMore = async () => {
    if (loading() || !hasMore()) return;
    setLoading(true);
    try {
      const { items: pageItems, hasMore: more } = await fetchPage(
        query(),
        page(),
      );
      setItems((prev) => [...prev, ...pageItems]);
      setHasMore(more);
      setPage((p) => p + 1);
    } finally {
      setLoading(false);
    }
  };

  // Restarts the list from page 1 whenever `query` changes (including the
  // initial load, since this also runs once on mount). Wrapped in
  // on(query, ...) so only `query` is tracked as a dependency --
  // loadMore() also reads page()/hasMore()/loading() (before its first
  // await), and without on()/untrack() those reads would make this
  // effect a dependent of them too. Since loadMore() itself calls
  // setPage()/setHasMore() once its fetch resolves, that would re-trigger
  // this same effect, wiping the list and restarting from page 1 in an
  // infinite loop.
  createEffect(
    on(query, () => {
      setItems([]);
      setPage(1);
      setHasMore(true);
      untrack(loadMore);
    }),
  );

  // Invisible marker the caller places after its rendered list; when it
  // scrolls into view, loadMore() fetches the next page.
  let sentinel;
  onMount(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    });
    observer.observe(sentinel);
    onCleanup(() => observer.disconnect());
  });

  return { items, loading, sentinelRef: (el) => (sentinel = el) };
}
