import { For, Show, createResource } from "solid-js";
import { A } from "@solidjs/router";
import { Image } from "@kobalte/core/image";
import Library from "lucide-solid/icons/library";
import pb from "../../lib/pb";
import { fetchCollections } from "../../lib/collections";
import Loading from "../Loading";
import { setCollectionsSidebarOpen } from "./uiState";

// Desktop-only sidebar list of collections, shown as a left-side overlay
// panel by AppShell (see uiState.js / AppShell.jsx). Kept as its own
// component instead of reusing CollectionList: the two have different
// layout needs (a narrow vertical list here vs. a wrapping thumbnail
// grid on the /collections page), and are expected to diverge further
// (e.g. drag-and-drop drop targets, which only make sense here since the
// sidebar and the manifest grid behind it are visible at the same time).
const THUMB_SIZE = 48;

export default function CollectionSidebar() {
  const [collections] = createResource(fetchCollections);

  return (
    <Show when={collections()} fallback={<Loading />}>
      <ul class="flex flex-col gap-1">
        <For each={collections()}>
          {(collection) => (
            <li>
              <A
                href={`/collections/${collection.id}`}
                onClick={() => setCollectionsSidebarOpen(false)}
                class="flex items-center gap-3 rounded-md p-2 hover:bg-[var(--color-hover-bg)]"
              >
                <Image class="h-12 w-12 shrink-0 overflow-hidden rounded border">
                  <Image.Img
                    class="h-full w-full object-cover"
                    src={
                      collection.cover
                        ? pb.files.getURL(collection, collection.cover, {
                            thumb: `${THUMB_SIZE}x${THUMB_SIZE}`,
                          })
                        : undefined
                    }
                    alt=""
                  />
                  <Image.Fallback class="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-300 dark:bg-neutral-800 dark:text-neutral-600">
                    <Library size={20} strokeWidth={1.5} />
                  </Image.Fallback>
                </Image>
                <span class="truncate text-sm">{collection.label}</span>
              </A>
            </li>
          )}
        </For>
      </ul>
    </Show>
  );
}
