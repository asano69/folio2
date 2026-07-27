import { Show } from "solid-js";
import { Button } from "@kobalte/core/button";
import { isDesktop } from "../../lib/viewport";
import { sidebarOpen, setSidebarOpen } from "./uiState";

// Generic sidebar panel. What it shows is entirely up to the caller via
// `children` -- today that's CollectionSidebar, but it could just as
// well be a library list or a book's table of contents later.
//
// It has two states:
//   - open (sidebarOpen() === true): the full panel. On desktop it's an
//     ordinary flex child, pushing the rest of the layout aside; on
//     mobile there's no room to push content around, so it becomes a
//     fixed overlay on top of the page instead, with a dimmed backdrop.
//   - collapsed (sidebarOpen() === false): a narrow rail with just a
//     toggle button on desktop, so the sidebar is always reachable.
//     On mobile, collapsed renders nothing at all -- mobile has no
//     persistent chrome, and opens the sidebar via NavBar's Sidebar
//     button instead.
export default function SideBar(props) {
  return (
    <Show
      when={sidebarOpen()}
      fallback={
        <Show when={isDesktop()}>
          <div class="flex h-screen w-12 shrink-0 flex-col items-center border-r border-[var(--color-border-soft)] bg-[var(--color-bg)] p-2">
            <Button onClick={() => setSidebarOpen(true)}>›</Button>
          </div>
        </Show>
      }
    >
      <Show when={!isDesktop()}>
        <div
          class="fixed inset-0 z-[100000] bg-black/30"
          onClick={() => setSidebarOpen(false)}
        />
      </Show>
      <aside
        classList={{
          "flex h-screen w-80 shrink-0 flex-col gap-4 overflow-y-auto border-r border-[var(--color-border-soft)] bg-[var(--color-bg)] p-6": true,
          "fixed inset-y-0 left-0 z-[100001]": !isDesktop(),
        }}
      >
        <div class="flex items-center justify-between">
          <h2 class="text-2xl">{props.title}</h2>
          <Button onClick={() => setSidebarOpen(false)}>‹</Button>
        </div>
        {props.children}
      </aside>
    </Show>
  );
}
