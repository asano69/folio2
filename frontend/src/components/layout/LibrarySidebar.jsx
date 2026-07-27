import { For, Show, createResource } from "solid-js";
import { Image } from "@kobalte/core/image";
import LibraryIcon from "lucide-solid/icons/landmark";
import pb from "../../lib/pb";
import { fetchLibraries } from "../../lib/libraries";
import Loading from "../Loading";

// Sidebar list of libraries, shown as an overlay panel by AppShell when
// SidebarViewSelect is set to "libraries" (see SidebarViewSelect.jsx /
// AppShell.jsx). Mirrors CollectionSidebar, but items aren't links: there
// is no per-library detail route yet (routes/Libraries.jsx itself just
// renders cards with no link either).
const THUMB_SIZE = 48;

export default function LibrarySidebar() {
  const [libraries] = createResource(fetchLibraries);

  return (
    <Show when={libraries()} fallback={<Loading />}>
      <ul class="flex flex-col gap-1">
        <For each={libraries()}>
          {(library) => (
            <li class="flex items-center gap-3 rounded-md p-2">
              <Image class="h-12 w-12 shrink-0 overflow-hidden rounded border">
                <Image.Img
                  class="h-full w-full object-cover"
                  src={
                    library.cover
                      ? pb.files.getURL(library, library.cover, {
                          thumb: `${THUMB_SIZE}x${THUMB_SIZE}`,
                        })
                      : undefined
                  }
                  alt=""
                />
                <Image.Fallback class="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-300 dark:bg-neutral-800 dark:text-neutral-600">
                  <LibraryIcon size={20} strokeWidth={1.5} />
                </Image.Fallback>
              </Image>
              <span class="truncate text-sm">{library.label}</span>
            </li>
          )}
        </For>
      </ul>
    </Show>
  );
}
