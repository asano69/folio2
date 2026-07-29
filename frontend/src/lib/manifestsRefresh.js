import { createSignal } from "solid-js";

// Manifest ids hidden from Home's "unclassified" list the instant they
// are dropped onto a collection (see lib/classification.js). Hiding
// happens locally, before the classification request even starts, so
// the list updates immediately and a second drag can begin right away
// instead of waiting for a request/refetch round-trip to land.
const [hiddenManifestIds, setHiddenManifestIds] = createSignal(new Set());

export function hideManifest(id) {
  setHiddenManifestIds((prev) => new Set(prev).add(id));
}

// Reverses hideManifest, used when the classification request fails so
// the manifest reappears instead of staying hidden incorrectly.
export function unhideManifest(id) {
  setHiddenManifestIds((prev) => {
    const next = new Set(prev);
    next.delete(id);
    return next;
  });
}

export { hiddenManifestIds };
