import { createSignal } from "solid-js";

// Whether the desktop Collections sidebar panel is open. Kept as a small
// global signal (rather than route or component state) so any component
// -- NavBar today, maybe a keyboard shortcut later -- can toggle it
// without prop drilling. Add further panel-open signals here the same
// way as more desktop-only overlays are introduced. Lives alongside
// AppShell (its sole subscriber) rather than in the generic lib/ folder.
const [collectionsSidebarOpen, setCollectionsSidebarOpen] = createSignal(false);

export { collectionsSidebarOpen, setCollectionsSidebarOpen };
