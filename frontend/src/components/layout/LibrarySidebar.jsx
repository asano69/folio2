import { createResource } from "solid-js";
import LibraryIcon from "lucide-solid/icons/landmark";
import pb from "../../lib/pb";
import { fetchLibraries } from "../../lib/libraries";
import SidebarList from "./SidebarList";

const THUMB_SIZE = 48;

// Sidebar list of libraries, shown as an overlay panel by AppShell when
// SidebarViewSelect is set to "libraries" (see SidebarViewSelect.jsx /
// AppShell.jsx). Mirrors CollectionSidebar via the shared SidebarList,
// but has no getHref: there is no per-library detail route yet (routes/
// Libraries.jsx itself just renders cards with no link either), so rows
// render as plain, non-navigating items.
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
      getImageUrl={(library) =>
        library.cover
          ? pb.files.getURL(library, library.cover, {
              thumb: `${THUMB_SIZE}x${THUMB_SIZE}`,
            })
          : null
      }
      getLabel={(library) => library.label}
    />
  );
}
