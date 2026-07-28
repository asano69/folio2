import { createSignal } from "solid-js";

// Bumped whenever a manifest's collection membership changes (see
// lib/classification.js), so Catalog's createResource can depend on it
// and refetch the "unclassified" list without a full page reload.
const [refreshKey, setRefreshKey] = createSignal(0);

export function triggerManifestsRefresh() {
  setRefreshKey((k) => k + 1);
}

export { refreshKey };
