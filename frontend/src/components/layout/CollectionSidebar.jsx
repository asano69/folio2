import { createMemo, onMount } from "solid-js";
import Library from "lucide-solid/icons/library";
import pb from "../../lib/pb";
import { collections, loadCollections } from "../../lib/collections";
import { loadLibraries } from "../../lib/libraries";
import { isDesktop } from "../../lib/viewport";
import SidebarList from "./SidebarList";
import CollectionLibraryFilter from "./CollectionLibraryFilter";
import {
  collectionLibraryFilter,
  loadCollectionLibraryFilter,
  FILTER_ALL,
  FILTER_UNCLASSIFIED,
} from "./collectionLibraryFilter";
import { setSidebarOpen } from "./uiState";
import { DROP_TARGET_COLLECTION } from "../../lib/dragTypes";

const THUMB_SIZE = 48;

// Desktop-only sidebar list of collections, shown as a left-side overlay
// panel by AppShell (see uiState.js / AppShell.jsx). Row rendering itself
// lives in SidebarList/SidebarRow (shared with LibrarySidebar); this
// file only supplies what's specific to collections: the link target,
// and closing the sidebar on navigation. The list itself is the shared
// signal from lib/collections.js, so a collection created elsewhere
// (see CreateEntityButton) shows up here immediately.
//
// itemProps is also where a future drop target -- e.g. dragging a
// manifest card onto a collection row to add it to that collection --
// would attach onDragOver/onDrop (see lib/dragTypes.js for the shared
// drag data format).
export default function CollectionSidebar() {
  onMount(() => {
    loadCollections();
    loadLibraries();
    loadCollectionLibraryFilter();
  });

  // Narrows the shared collections list down to the currently selected
  // library (see CollectionLibraryFilter.jsx), leaving it untouched
  // (including null while still loading) when no filter is active.
  const filteredCollections = createMemo(() => {
    const filter = collectionLibraryFilter();
    const items = collections();
    if (!items || filter === FILTER_ALL) return items;
    if (filter === FILTER_UNCLASSIFIED) {
      return items.filter((c) => !c.library?.length);
    }
    return items.filter((c) => c.library?.includes(filter));
  });

  return (
    <>
      <CollectionLibraryFilter />
      <SidebarList
      items={filteredCollections()}
      icon={Library}
      getHref={(collection) => `/collections/${collection.id}`}
      getImageUrl={(collection) =>
        collection.cover
          ? pb.files.getURL(collection, collection.cover, {
              thumb: `${THUMB_SIZE}x${THUMB_SIZE}`,
            })
          : null
      }
      getLabel={(collection) => collection.label}
      getDropId={(collection) => `collection-${collection.id}`}
      getDropData={(collection) => ({
        type: DROP_TARGET_COLLECTION,
        collectionId: collection.id,
        label: collection.label,
      })}
      // Only close the mobile overlay on navigation. On desktop the
      // sidebar is a persistent rail, so it should stay open.
      itemProps={() => ({
        onClick: () => {
          if (!isDesktop()) setSidebarOpen(false);
        },
      })}
      />
    </>
  );
}
