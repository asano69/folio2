import { createSignal } from "solid-js";
import pb from "./pb";

// Shared reactive list of libraries, so every consumer (the /libraries
// page and LibrarySidebar) reads the same data and stays in sync -- e.g.
// a newly created library shows up in both places immediately, without a
// page reload or refetch. Libraries have an explicit "position" field for
// manual ordering (unlike collections, which use -created).
const [libraries, setLibraries] = createSignal(null);

// Loads the full library list into the shared signal. Safe to call from
// every consumer's onMount; whichever call resolves last just wins.
export async function loadLibraries() {
  setLibraries(
    await pb.collection("libraries").getFullList({ sort: "position" }),
  );
}

// Appends a newly created library to the end of the list (see
// CreateEntityButton's onCreated). A brand new library has no explicit
// position yet, so it belongs at the end, matching the manual "position"
// order used by loadLibraries.
export function addLibrary(record) {
  setLibraries((prev) => [...(prev ?? []), record]);
}

// Patches a single library's fields in the shared signal (e.g. after
// renaming it or replacing its cover via LibraryEditButton), so
// LibrarySidebar reflects the change immediately without a refetch or a
// full page reload.
export function updateLibrary(id, patch) {
  setLibraries((prev) =>
    (prev ?? []).map((l) => (l.id === id ? { ...l, ...patch } : l)),
  );
}

export { libraries };
