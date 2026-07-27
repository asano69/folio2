import { Show } from "solid-js";
import NavBar from "../NavBar";
import { isDesktop } from "../../lib/viewport";
import { collectionsSidebarOpen, setCollectionsSidebarOpen } from "./uiState";
import CollectionSidebar from "./CollectionSidebar";

// Wraps every route so NavBar renders once regardless of page (it's
// global chrome, not something that should vary per route), and so
// desktop-only overlay panels can render on top of whichever page is
// currently active, without each route needing to know about them. On
// mobile the overlay below renders nothing extra: Collections there is
// just the normal /collections route (see NavBar).
export default function AppShell(props) {
  return (
    <>
      <div class="mx-auto w-full max-w-4xl px-6 pt-12">
        <NavBar />
      </div>
      {props.children}
      <Show when={isDesktop() && collectionsSidebarOpen()}>
        <div
          class="fixed inset-0 z-[100000] bg-black/30"
          onClick={() => setCollectionsSidebarOpen(false)}
        />
        <aside class="fixed top-0 left-0 z-[100001] flex h-screen w-80 flex-col gap-4 overflow-y-auto border-r border-[var(--color-border-soft)] bg-[var(--color-bg)] p-6">
          <h2 class="text-2xl">Collections</h2>
          <CollectionSidebar />
        </aside>
      </Show>
    </>
  );
}
