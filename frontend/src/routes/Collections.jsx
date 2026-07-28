import { For, Show, createResource } from "solid-js";
import { A } from "@solidjs/router";
import { Image } from "@kobalte/core/image";
import LibraryIcon from "lucide-solid/icons/library";
import { useDraggable } from "@dnd-kit/solid";
import pb from "../lib/pb";
import { fetchCollections } from "../lib/collections";
import Loading from "../components/Loading";
import CreateEntityButton from "../components/CreateEntityButton";
import { DRAG_TYPE_COLLECTION_ID } from "../lib/dragTypes";

// Fixed thumbnail size for every collection card.
const THUMB_WIDTH = 250;
const THUMB_HEIGHT = 200;

export default function Collections() {
  const [collections] = createResource(fetchCollections);

  return (
    <div class="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center gap-8 px-6 py-12">
      <div class="flex w-full justify-end">
        <CreateEntityButton
          collection="collections"
          basePath="/collections"
          triggerLabel="New Collection"
        />
      </div>
      <Show when={collections()} fallback={<Loading />}>
        <div class="flex w-full flex-wrap justify-center gap-4 sm:justify-start">
          <For each={collections()}>
            {(collection) => {
              // Draggable onto a LibrarySidebar row to add this collection
              // to that library (see lib/classification.js).
              const draggable = useDraggable({
                id: `collection-${collection.id}`,
                data: { type: DRAG_TYPE_COLLECTION_ID, collectionId: collection.id },
              });
              // touch-none prevents the browser from treating a drag
              // gesture as a scroll on touch devices, which otherwise
              // fights with dnd-kit's own drag handling.
              return (
              <A
                ref={draggable.ref}
                href={`/collections/${collection.id}`}
                class="flex flex-col gap-2 touch-none"
                style={{
                  width: `${THUMB_WIDTH}px`,
                  opacity: draggable.isDragging() ? 0.5 : 1,
                }}
              >
                <Image
                  class="overflow-hidden rounded border"
                  style={{
                    width: `${THUMB_WIDTH}px`,
                    height: `${THUMB_HEIGHT}px`,
                  }}
                >
                  <Image.Img
                    class="h-full w-full object-cover"
                    src={
                      collection.cover
                        ? pb.files.getURL(collection, collection.cover, {
                            thumb: `${THUMB_WIDTH}x${THUMB_HEIGHT}`,
                          })
                        : undefined
                    }
                    alt=""
                  />
                  <Image.Fallback class="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-300 dark:bg-neutral-800 dark:text-neutral-600">
                    <LibraryIcon size={48} strokeWidth={1.5} />
                  </Image.Fallback>
                </Image>
                <span class="truncate text-sm">{collection.label}</span>
              </A>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
}
