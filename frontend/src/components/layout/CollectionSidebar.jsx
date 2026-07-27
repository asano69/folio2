import { createResource } from "solid-js";
import Library from "lucide-solid/icons/library";
import pb from "../../lib/pb";
import { fetchCollections } from "../../lib/collections";
import SidebarList from "./SidebarList";
import { setSidebarOpen } from "./uiState";

const THUMB_SIZE = 48;

// Desktop-only sidebar list of collections, shown as a left-side overlay
// panel by AppShell (see uiState.js / AppShell.jsx). Row rendering itself
// lives in SidebarList/SidebarRow (shared with LibrarySidebar); this
// file only supplies what's specific to collections: the fetch, the link
// target, and closing the sidebar on navigation.
//
// itemProps is also where a future drop target -- e.g. dragging a
// manifest card onto a collection row to add it to that collection --
// would attach onDragOver/onDrop (see lib/dragTypes.js for the shared
// drag data format).
export default function CollectionSidebar() {
  const [collections] = createResource(fetchCollections);

  return (
    <SidebarList
      items={collections()}
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
      itemProps={() => ({ onClick: () => setSidebarOpen(false) })}
    />
  );
}
