import { createSignal } from "solid-js";
import pb from "./pb";

// Shared reactive list of collections, so every consumer (the
// /collections page and CollectionSidebar) reads the same data and stays
// in sync -- e.g. a newly created collection shows up in both places
// immediately, without a page reload or refetch.
const [collections, setCollections] = createSignal(null);

// Loads the full collection list into the shared signal. Safe to call
// from every consumer's onMount; whichever call resolves last just wins.
export async function loadCollections() {
  setCollections(
    await pb.collection("collections").getFullList({ sort: "-created" }),
  );
}

// Prepends a newly created collection to the list (see
// CreateEntityButton's onCreated), matching the "-created" sort order
// used by loadCollections.
export function addCollection(record) {
  setCollections((prev) => [record, ...(prev ?? [])]);
}

// Patches a single collection's fields in the shared signal (e.g. after
// renaming it or replacing its cover via CollectionEditButton), so
// CollectionSidebar reflects the change immediately without a refetch
// or a full page reload.
export function updateCollection(id, patch) {
  setCollections((prev) =>
    (prev ?? []).map((c) => (c.id === id ? { ...c, ...patch } : c)),
  );
}

export { collections };
