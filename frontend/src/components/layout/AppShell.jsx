import { onMount, Show } from "solid-js";
import { DragDropProvider } from "@dnd-kit/solid";
import { AutoScroller } from "@dnd-kit/dom";
import NavBar from "../NavBar";
import SideBar from "./SideBar";
import CollectionSidebar from "./CollectionSidebar";
import LibrarySidebar from "./LibrarySidebar";
import SidebarViewSelect from "./SidebarViewSelect";
import InlineCreateButton from "./InlineCreateButton";
import { sidebarView, loadSidebarView } from "./sidebarView";
import { loadSidebarOpen } from "./uiState";
import { handleClassificationDrop } from "../../lib/classification";
import { addCollection } from "../../lib/collections";
import { addLibrary } from "../../lib/libraries";

// Wraps every route so NavBar renders once regardless of page (it's
// global chrome, not something that should vary per route). SideBar is
// laid out in the same flex row as the routed content, since it's now
// always part of the page layout (either a collapsed rail or an
// expanded panel) rather than an overlay on top of it. Which list the
// sidebar shows (Collections or Libraries) is decided here, driven by
// sidebarView (see lib/sidebarView.js and SidebarViewSelect.jsx); the
// panel itself (SideBar) doesn't know or care what's inside it.
export default function AppShell(props) {
  // Both preferences are loaded once, on mount: which sidebar view is
  // shown (see sidebarView.js) and whether the panel starts open or
  // collapsed (see uiState.js). Both fall back to their signal's default
  // if no settings record exists yet or the request fails.
  onMount(() => {
    loadSidebarView();
    loadSidebarOpen();
  });

  // A single provider wraps both the sidebar (drop targets) and the
  // routed content (drag sources), so classification drags work
  // regardless of which sidebar view is active. See
  // lib/classification.js for what happens on drop, and
  // lib/dragTypes.js for the payload vocabulary.
  //
  // AutoScroller is excluded: dnd-kit's default behavior auto-scrolls
  // the page when the pointer nears the top/bottom edge while dragging,
  // which made the Viewer scroll unexpectedly while carrying a card
  // toward the sidebar. Classification drags here never need that.
  return (
    <DragDropProvider
      onDragEnd={handleClassificationDrop}
      plugins={(defaults) =>
        defaults.filter((plugin) => plugin !== AutoScroller)
      }
    >
      <div class="flex min-h-screen w-full">
        <SideBar
          title={<SidebarViewSelect />}
          footer={
            <Show
              when={sidebarView() === "collections"}
              fallback={
                <InlineCreateButton
                  collection="libraries"
                  label="New Library"
                  onCreated={addLibrary}
                />
              }
            >
              <InlineCreateButton
                collection="collections"
                label="New Collection"
                onCreated={addCollection}
              />
            </Show>
          }
        >
          <Show when={sidebarView() === "collections"}>
            <CollectionSidebar />
          </Show>
          <Show when={sidebarView() === "libraries"}>
            <LibrarySidebar />
          </Show>
        </SideBar>
        <div class="min-w-0 flex-1">
          {/* Full-width (not max-w-4xl) so the Logo lands on the true
              left edge and the Settings menu on the true right edge of
              the sidebar-excluded area, matching Home/Manifests's own
              side margins instead of sitting in a narrower centered
              column above them. Margin only widens on desktop (lg:) --
              on mobile there's no room to spare, and NavBar's own
              flex-wrap already handles narrow widths on its own. */}
          <div class="w-full px-6 pt-12 lg:px-24">
            <NavBar />
          </div>
          {props.children}
        </div>
      </div>
    </DragDropProvider>
  );
}
