import { Show } from "solid-js";
import { sidebarOpen, setSidebarOpen } from "./uiState";

// Generic overlay sidebar panel. What it shows is entirely up to the
// caller via `children` -- today that's CollectionSidebar, but it could
// just as well be a library list or a book's table of contents later.
// Mounted once by AppShell so it renders on top of whichever route is
// currently active.
export default function SideBar(props) {
  return (
    <Show when={sidebarOpen()}>
      <div
        class="fixed inset-0 z-[100000] bg-black/30"
        onClick={() => setSidebarOpen(false)}
      />
      <aside class="fixed top-0 left-0 z-[100001] flex h-screen w-80 flex-col gap-4 overflow-y-auto border-r border-[var(--color-border-soft)] bg-[var(--color-bg)] p-6">
        <h2 class="text-2xl">{props.title}</h2>
        {props.children}
      </aside>
    </Show>
  );
}
