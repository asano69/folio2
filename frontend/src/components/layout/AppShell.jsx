import { Show } from "solid-js";
import { isDesktop } from "../../lib/viewport";
import { collectionsSidebarOpen, setCollectionsSidebarOpen } from "../../lib/uiState";
import CollectionList from "../CollectionList";

// Wraps every route so desktop-only overlay panels can render on top of
// whichever page is currently active, without each route needing to know
// about them. On mobile this renders nothing extra: Collections there is
// just the normal /collections route (see NavBar).
export default function AppShell(props) {
  return (
    <>
      {props.children}
      <Show when={isDesktop() && collectionsSidebarOpen()}>
        <div
          class="fixed inset-0 z-[100000] bg-black/30"
          onClick={() => setCollectionsSidebarOpen(false)}
        />
        <aside class="fixed top-0 right-0 z-[100001] flex h-screen w-80 flex-col gap-4 overflow-y-auto border-l border-[var(--color-border-soft)] bg-[var(--color-bg)] p-6">
          <h2 class="text-2xl">Collections</h2>
          <CollectionList />
        </aside>
      </Show>
    </>
  );
}
