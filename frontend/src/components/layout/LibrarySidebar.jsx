import { createResource } from "solid-js";
import LibraryIcon from "lucide-solid/icons/landmark";
import pb from "../../lib/pb";
import { fetchLibraries } from "../../lib/libraries";
import SidebarList from "./SidebarList";
import { setSidebarOpen } from "./uiState";

const THUMB_SIZE = 48;

// Sidebar list of libraries, shown as an overlay panel by AppShell when
// SidebarViewSelect is set to "libraries" (see SidebarViewSelect.jsx /
// AppShell.jsx). Mirrors CollectionSidebar: rows link into the library's
// detail route (LibraryViewer), which lists the collections belonging
// to it, and clicking one closes the sidebar the same way
// CollectionSidebar does.
//
// itemProps is also where a future drop target -- e.g. dragging a
// manifest or collection card onto a library row to add it there --
// would attach onDragOver/onDrop (see lib/dragTypes.js for the shared
// drag data format).
export default function LibrarySidebar() {
  const [libraries] = createResource(fetchLibraries);

  return (
    <SidebarList
      items={libraries()}
      icon={LibraryIcon}
      getHref={(library) => `/libraries/${library.id}`}
      getImageUrl={(library) =>
        library.cover
          ? pb.files.getURL(library, library.cover, {
              thumb: `${THUMB_SIZE}x${THUMB_SIZE}`,
            })
          : null
      }
      getLabel={(library) => library.label}
      itemProps={() => ({ onClick: () => setSidebarOpen(false) })}
    />
  );
}
