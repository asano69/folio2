// Custom drag-and-drop data types, shared between whatever eventually
// becomes a drag source (e.g. a manifest or collection card) and a drop
// target (e.g. a CollectionSidebar/LibrarySidebar row), so both sides
// agree on the same format. Nothing sets or reads these yet -- this only
// reserves the vocabulary so wiring up drag-and-drop later (dropping a
// manifest onto a collection, or a collection onto a library) doesn't
// require inventing a new format at the same time.
export const DRAG_TYPE_MANIFEST_ID = "application/x-folio-manifest-id";
export const DRAG_TYPE_COLLECTION_ID = "application/x-folio-collection-id";
