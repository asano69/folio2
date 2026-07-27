import { Show } from "solid-js";
import PanelLeft from "lucide-solid/icons/panel-left";
import { isDesktop } from "../../lib/viewport";
import { sidebarOpen, setSidebarOpen } from "./uiState";
import Logo from "../Logo";

// Icon-only toggle button shared by the desktop rail and the panel
// header. Plain <button> (not Kobalte's Button) so it can get its own
// compact hover style instead of the global bordered button look.
function ToggleButton(props) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-label="Toggle sidebar"
      class={`icon-btn cursor-pointer rounded-md p-1.5 text-[var(--color-text)] transition-colors duration-150 hover:bg-[var(--color-hover-bg)] ${props.class ?? ""}`}
    >
      <PanelLeft size={20} />
    </button>
  );
}

// Generic sidebar panel. What it shows is entirely up to the caller via
// `children` -- today that's CollectionSidebar, but it could just as
// well be a library list or a book's table of contents later.
//
// It has two states:
//   - open (sidebarOpen() === true): the full panel. On desktop it's an
//     ordinary flex child, pushing the rest of the layout aside; on
//     mobile there's no room to push content around, so it becomes a
//     fixed overlay on top of the page instead, with a dimmed backdrop,
//     rather than shrinking/pushing the page underneath it.
//   - collapsed (sidebarOpen() === false): a narrow rail with just a
//     toggle button on desktop, so the sidebar is always reachable.
//     On mobile, collapsed renders nothing at all -- mobile has no
//     persistent chrome, and opens the sidebar via NavBar's Sidebar
//     button instead.
//
// On desktop the rail and the open panel are the same <aside>, whose
// width is animated with a CSS transition, so toggling slides smoothly
// instead of cutting instantly between the two states. The toggle button
// always lives in its own fixed top-left row (separate from the title
// label and from props.children), so its position never shifts between
// the collapsed and open states -- only the label/content next to it are
// conditionally shown. Mobile keeps its own fixed-overlay markup, since
// it isn't part of that width animation.
export default function SideBar(props) {
  return (
    <Show
      when={isDesktop()}
      fallback={
        <Show when={sidebarOpen()}>
          {/* Backdrop: dims the page behind the overlay and closes the
              sidebar when tapped. Fixed, so it never affects the page's
              own layout. */}
          <div
            class="fixed inset-0 z-40 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Fixed overlay panel, stacked above the page via z-index
              instead of pushing it aside like the desktop <aside> does.
              When collapsed (sidebarOpen() === false), this whole <Show>
              renders nothing -- no toggle-button rail on mobile, since
              the sidebar is opened via NavBar's Sidebar button instead. */}
          <div class="fixed top-0 left-0 z-50 flex h-screen w-80 flex-col gap-4 bg-[var(--color-bg)] p-6">
            <div class="flex shrink-0 items-center justify-between">
              <h2 class="text-2xl">{props.title}</h2>
              <ToggleButton onClick={() => setSidebarOpen(false)} />
            </div>
            {/* Scrolls independently of the header above, so the toggle
                button stays fixed in place instead of scrolling out of
                view along with the list. */}
            <div class="min-h-0 flex-1 overflow-y-auto">{props.children}</div>
          </div>
        </Show>
      }
    >
      {/* sticky + top-0 pins the sidebar to the viewport while the page
          (AppShell's min-h-screen wrapper) scrolls with the gallery
          content, instead of scrolling away along with it. */}
      <aside
        classList={{
          "sticky top-0 flex h-screen shrink-0 flex-col overflow-hidden border-r border-[var(--color-border-soft)] bg-[var(--color-bg)] transition-[width] duration-300 ease-in-out": true,
          "w-80": sidebarOpen(),
          "w-12": !sidebarOpen(),
        }}
      >
        {/* Header row: the brand logo appears only once open, left-aligned;
            the toggle button is pushed to the right edge via ml-auto, so it
            slides along with the growing/shrinking width instead of staying
            fixed on the left. The title label moves to its own row below,
            once open. */}
        <div class="flex h-12 items-center gap-2 p-2">
          <Show when={sidebarOpen()}>
            <h2 class="truncate px-4">{props.title}</h2>
          </Show>
          <ToggleButton
            onClick={() => setSidebarOpen(!sidebarOpen())}
            class="ml-auto"
          />
        </div>
        <Show when={sidebarOpen()}>
          <div class="flex w-80 flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6">
            {props.children}
          </div>
        </Show>
      </aside>
    </Show>
  );
}
