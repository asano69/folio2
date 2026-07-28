// Drag-and-drop payload types shared between drag sources (ManifestGrid,
// Collections/LibraryViewer cards) and drop targets (CollectionSidebar /
// LibrarySidebar rows, via SidebarList), so both sides agree on the same
// vocabulary. Used as the `type` field of each @dnd-kit/solid draggable's
// and droppable's `data`, so lib/classification.js can dispatch on it
// without depending on the id format.
export const DRAG_TYPE_MANIFEST_ID = "application/x-folio-manifest-id";
export const DRAG_TYPE_COLLECTION_ID = "application/x-folio-collection-id";

export const DROP_TARGET_COLLECTION = "collection";
export const DROP_TARGET_LIBRARY = "library";
