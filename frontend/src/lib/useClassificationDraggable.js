import { useDraggable } from "@dnd-kit/solid";
import { isDesktop } from "./viewport";

// Wraps dnd-kit's useDraggable so drag-to-classify (dragging a manifest
// card onto a collection, or a collection card onto a library -- see
// lib/classification.js) is desktop-only. touch-none, needed so dnd-kit's
// drag gesture doesn't fight the browser's own touch scrolling, also
// blocks ordinary flick-scrolling whenever a finger starts on a card,
// which made scrolling unreliable on mobile. The sidebar drop target
// isn't visible on mobile anyway (it's an overlay opened from NavBar,
// not a persistent rail), so dragging is skipped there entirely: no ref
// (dnd-kit never grabs the pointer) and no touch-none (native scrolling
// stays in control).
//
// Shared by ManifestGrid, Collections, and LibraryViewer, the three
// places that render a draggable card.
export function useClassificationDraggable(id, data) {
  const draggable = useDraggable({ id, data });
  const desktop = isDesktop();
  return {
    ref: desktop ? draggable.ref : undefined,
    touchClass: desktop ? " touch-none" : "",
    isDragging: draggable.isDragging,
  };
}
