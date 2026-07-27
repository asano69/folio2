import { createSignal } from "solid-js";

// Single source of truth for the desktop/mobile breakpoint. Kept in sync
// with Tailwind's `lg` utility (1024px) so CSS and JS layout branching
// never disagree about where "desktop" starts.
const DESKTOP_QUERY = "(min-width: 1024px)";

// This file is only ever loaded once (client-side entry point), so a
// single module-level signal is enough -- no need for a hook that every
// component re-subscribes to.
const mql = window.matchMedia(DESKTOP_QUERY);
const [isDesktop, setIsDesktop] = createSignal(mql.matches);
mql.addEventListener("change", (e) => setIsDesktop(e.matches));

// Reactive accessor: true when the viewport is desktop-sized. Call this
// directly (`isDesktop()`) anywhere a component needs to branch between a
// desktop and a mobile layout -- not just hide/show markup with CSS, but
// render a genuinely different UI (e.g. a sidebar panel instead of
// navigating to a page).
export { isDesktop };
