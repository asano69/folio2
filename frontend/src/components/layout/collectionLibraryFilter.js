import { createSignal } from "solid-js";
import pb from "../../lib/pb";

// Key used to store this preference as a single row in the (generic)
// "settings" collection, alongside sidebar_view/sidebar_open.
const SETTINGS_KEY = "collection_library_filter";

// Sentinel values stored in the "value" text field alongside real
// library ids, so CollectionSidebar can tell "no filter" and "only
// unclassified" apart from an actual library selection. Both must be
// non-empty strings: Kobalte's Select treats an empty-string value as
// "nothing selected" (matching native <select> placeholder semantics),
// which otherwise left the "All" option's label blank in the trigger.
export const FILTER_ALL = "__all__";
export const FILTER_UNCLASSIFIED = "__unclassified__";

// Which library (by id), if any, CollectionSidebar currently filters by.
const [collectionLibraryFilter, setCollectionLibraryFilterSignal] =
  createSignal(FILTER_ALL);

// Loads the persisted choice once, called from CollectionSidebar on
// mount. Leaves the signal at its default (FILTER_ALL) if no record
// exists yet or the request fails.
export async function loadCollectionLibraryFilter() {
  try {
    const record = await pb
      .collection("settings")
      .getFirstListItem(pb.filter("key = {:key}", { key: SETTINGS_KEY }));
    setCollectionLibraryFilterSignal(record.value ?? FILTER_ALL);
  } catch {
    // No saved preference yet (or the request failed); keep the default.
  }
}

// Switches the signal immediately, then persists the choice in the
// background -- same pattern as setSidebarView/setSidebarOpen.
export async function setCollectionLibraryFilter(value) {
  setCollectionLibraryFilterSignal(value);
  try {
    const existing = await pb
      .collection("settings")
      .getFirstListItem(pb.filter("key = {:key}", { key: SETTINGS_KEY }))
      .catch(() => null);
    if (existing) {
      await pb.collection("settings").update(existing.id, { value });
    } else {
      await pb.collection("settings").create({ key: SETTINGS_KEY, value });
    }
  } catch {
    // Best-effort persistence: the in-memory signal already reflects the
    // change, so a failed save only means it won't survive a reload.
  }
}

export { collectionLibraryFilter };
