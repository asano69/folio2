import { createSignal } from "solid-js";
import pb from "../../lib/pb";

// Key used to store this preference as a single row in the (generic)
// "settings" collection, alongside any other app-wide preference that
// might be added there later.
const SETTINGS_KEY = "sidebar_view";

const VALID_VALUES = ["collections", "libraries"];

// Which list SideBar currently shows: "collections" or "libraries". See
// AppShell.jsx (switches between CollectionSidebar/LibrarySidebar) and
// SidebarViewSelect.jsx (the Kobalte Select that changes it).
const [sidebarView, setSidebarViewSignal] = createSignal("collections");

// Loads the persisted choice once, called from AppShell on mount. Leaves
// the signal at its default ("collections") if no record exists yet or
// the request fails, so the sidebar is always usable even on the very
// first run or while offline.
export async function loadSidebarView() {
  try {
    const record = await pb
      .collection("settings")
      .getFirstListItem(pb.filter("key = {:key}", { key: SETTINGS_KEY }));
    if (VALID_VALUES.includes(record.value)) {
      setSidebarViewSignal(record.value);
    }
  } catch {
    // No saved preference yet (or the request failed); keep the default.
  }
}

// Switches the signal immediately, then persists the choice in the
// background. The settings record is created on first use and updated
// afterward -- there's exactly one row per key.
export async function setSidebarView(value) {
  setSidebarViewSignal(value);
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

export { sidebarView };
