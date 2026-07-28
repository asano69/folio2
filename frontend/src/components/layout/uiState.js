import { createSignal } from "solid-js";
import pb from "../../lib/pb";

// Key used to store this preference as a single row in the (generic)
// "settings" collection, alongside sidebar_view and any other app-wide
// preference stored there.
const SETTINGS_KEY = "sidebar_open";

// Whether the sidebar panel is open (vs. collapsed). Kept as a small
// global signal (rather than route or component state) so any component
// -- NavBar today, maybe a keyboard shortcut later -- can toggle it
// without prop drilling. Lives alongside AppShell/SideBar (its main
// subscribers) rather than in the generic lib/ folder.
const [sidebarOpen, setSidebarOpenSignal] = createSignal(false);

// Loads the persisted choice once, called from AppShell on mount. Leaves
// the signal at its default (false, i.e. collapsed) if no record exists
// yet or the request fails, so the sidebar is always usable even on the
// very first run or while offline.
export async function loadSidebarOpen() {
  try {
    const record = await pb
      .collection("settings")
      .getFirstListItem(pb.filter("key = {:key}", { key: SETTINGS_KEY }));
    setSidebarOpenSignal(record.value === "true");
  } catch {
    // No saved preference yet (or the request failed); keep the default.
  }
}

// Switches the signal immediately, then persists the choice in the
// background. The settings record is created on first use and updated
// afterward -- there's exactly one row per key.
export async function setSidebarOpen(value) {
  setSidebarOpenSignal(value);
  try {
    const existing = await pb
      .collection("settings")
      .getFirstListItem(pb.filter("key = {:key}", { key: SETTINGS_KEY }))
      .catch(() => null);
    if (existing) {
      await pb
        .collection("settings")
        .update(existing.id, { value: String(value) });
    } else {
      await pb
        .collection("settings")
        .create({ key: SETTINGS_KEY, value: String(value) });
    }
  } catch {
    // Best-effort persistence: the in-memory signal already reflects the
    // change, so a failed save only means it won't survive a reload.
  }
}

export { sidebarOpen };
