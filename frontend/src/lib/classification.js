// Drag-and-drop classification: adding a manifest to a collection, or a
// collection to a library, by dropping one onto the other. See
// components/layout/AppShell.jsx for where the DragDropProvider that
// drives this lives, and lib/dragTypes.js for the payload vocabulary.
import pb from "./pb";
import { showError, showSuccess } from "./toast";
import {
  DRAG_TYPE_MANIFEST_ID,
  DRAG_TYPE_COLLECTION_ID,
  DROP_TARGET_COLLECTION,
  DROP_TARGET_LIBRARY,
} from "./dragTypes";

// Links manifestId into collectionId via a new collection_manifests
// record, placed at the end of the collection's current order. Returns
// false without creating anything if the link already exists.
async function addManifestToCollection(manifestId, collectionId) {
  const existing = await pb
    .collection("collection_manifests")
    .getFirstListItem(
      pb.filter("collection = {:c} && manifest = {:m}", {
        c: collectionId,
        m: manifestId,
      }),
    )
    .catch(() => null);
  if (existing) return false;

  const links = await pb.collection("collection_manifests").getFullList({
    filter: pb.filter("collection = {:c}", { c: collectionId }),
  });

  await pb.collection("collection_manifests").create({
    collection: collectionId,
    manifest: manifestId,
    position: links.length,
    status: "NOT_STARTED",
  });
  return true;
}

// Adds libraryId to collectionId's `library` relation field (a direct
// multi-select field on collections, not a join collection -- see
// migrations/1785116501_collections_snapshot.go). Returns false without
// updating anything if the collection is already linked to that library.
async function addCollectionToLibrary(collectionId, libraryId) {
  const collection = await pb.collection("collections").getOne(collectionId);
  const current = collection.library || [];
  if (current.includes(libraryId)) return false;

  await pb.collection("collections").update(collectionId, {
    library: [...current, libraryId],
  });
  return true;
}

// Shared onDragEnd handler for the app-wide DragDropProvider. Dispatches
// on the dragged item's type and the drop target's type (see
// lib/dragTypes.js), silently ignoring any combination it doesn't
// recognise (e.g. dropping a manifest onto a library row).
export async function handleClassificationDrop(event) {
  if (event.canceled) return;

  const target = event.operation.target;
  if (!target) return;

  const source = event.operation.source.data;
  const dest = target.data;

  try {
    if (
      source.type === DRAG_TYPE_MANIFEST_ID &&
      dest.type === DROP_TARGET_COLLECTION
    ) {
      const added = await addManifestToCollection(
        source.manifestId,
        dest.collectionId,
      );
      if (added) showSuccess(`Added to "${dest.label}".`);
    } else if (
      source.type === DRAG_TYPE_COLLECTION_ID &&
      dest.type === DROP_TARGET_LIBRARY
    ) {
      const added = await addCollectionToLibrary(
        source.collectionId,
        dest.libraryId,
      );
      if (added) showSuccess(`Added to "${dest.label}".`);
    }
  } catch (err) {
    showError(err?.message || "Failed to classify item.");
  }
}
