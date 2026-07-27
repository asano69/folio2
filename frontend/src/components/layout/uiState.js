import { createSignal } from "solid-js";

// Whether the sidebar panel is open (vs. collapsed). Kept as a small
// global signal (rather than route or component state) so any component
// -- NavBar today, maybe a keyboard shortcut later -- can toggle it
// without prop drilling. Lives alongside AppShell/SideBar (its main
// subscribers) rather than in the generic lib/ folder.
const [sidebarOpen, setSidebarOpen] = createSignal(false);

export { sidebarOpen, setSidebarOpen };
