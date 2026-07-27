import { onMount, Show } from "solid-js";
import NavBar from "../NavBar";
import SideBar from "./SideBar";
import CollectionSidebar from "./CollectionSidebar";
import LibrarySidebar from "./LibrarySidebar";
import SidebarViewSelect from "./SidebarViewSelect";
import { sidebarView, loadSidebarView } from "../../lib/sidebarView";

// Wraps every route so NavBar renders once regardless of page (it's
// global chrome, not something that should vary per route). SideBar is
// laid out in the same flex row as the routed content, since it's now
// always part of the page layout (either a collapsed rail or an
// expanded panel) rather than an overlay on top of it. Which list the
// sidebar shows (Collections or Libraries) is decided here, driven by
// sidebarView (see lib/sidebarView.js and SidebarViewSelect.jsx); the
// panel itself (SideBar) doesn't know or care what's inside it.
export default function AppShell(props) {
  onMount(loadSidebarView);

  return (
    <div class="flex min-h-screen w-full">
      <SideBar title={<SidebarViewSelect />}>
        <Show when={sidebarView() === "collections"}>
          <CollectionSidebar />
        </Show>
        <Show when={sidebarView() === "libraries"}>
          <LibrarySidebar />
        </Show>
      </SideBar>
      <div class="min-w-0 flex-1">
        <div class="mx-auto w-full max-w-4xl px-6 pt-12">
          <NavBar />
        </div>
        {props.children}
      </div>
    </div>
  );
}
