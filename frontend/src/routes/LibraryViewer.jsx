import { For, createResource } from "solid-js";
import { A, useParams } from "@solidjs/router";
import { Image } from "@kobalte/core/image";
import LibraryIcon from "lucide-solid/icons/library";
import { useDraggable } from "@dnd-kit/solid";
import ViewerPage from "../components/ViewerPage";
import LibraryEditButton from "../components/LibraryEditButton";
import pb from "../lib/pb";
import { useClassificationDraggable } from "../lib/useClassificationDraggable";
import { DRAG_TYPE_COLLECTION_ID } from "../lib/dragTypes";

// Fixed thumbnail size for every collection card, matching Collections.jsx.
const THUMB_WIDTH = 250;
const THUMB_HEIGHT = 200;

// Loads one library plus the collections that reference it. Unlike
// CollectionViewer (manifests linked via the collection_manifests join
// collection), collections point at their libraries directly through a
// multi-select "library" relation field, so no join collection is
// involved here. Collections also already carry their own cover file, so
// there's no need to borrow a cover from a first page the way
// Catalog/CollectionViewer do for manifests.
async function fetchLibraryCollections(libraryId) {
  const library = await pb.collection("libraries").getOne(libraryId);

  const collections = await pb.collection("collections").getFullList({
    filter: pb.filter("library ~ {:id}", { id: libraryId }),
    sort: "-created",
  });

  return { label: library.label, collections };
}

export default function LibraryViewer() {
  const params = useParams();
  const [data, { refetch }] = createResource(
    () => params.id,
    fetchLibraryCollections,
  );

  return (
    <ViewerPage resource={data}>
      <div class="flex items-center gap-2">
        <h1 class="text-4xl">{data().label}</h1>
        {/* Refetches this page's data once the edit dialog closes, so a
            renamed label or new cover shows up immediately. */}
        <LibraryEditButton
          libraryId={params.id}
          label={data().label}
          onClose={refetch}
        />
      </div>
      <div class="flex w-full flex-wrap justify-center gap-4 sm:justify-start">
        <For each={data().collections}>
          {(collection) => {
            const draggable = useClassificationDraggable(
              `collection-${collection.id}`,
              { type: DRAG_TYPE_COLLECTION_ID, collectionId: collection.id },
            );
            return (
              <A
                ref={draggable.ref}
                href={`/collections/${collection.id}`}
                // Two cards per row on mobile (calc-based width), fixed
                // THUMB_WIDTH from sm: up, so more columns fit in as the
                // screen widens.
                class={`flex w-[calc(50%-0.5rem)] flex-col gap-2 sm:w-[250px]${draggable.touchClass}`}
                style={{
                  opacity: draggable.isDragging() ? 0.5 : 1,
                }}
              >
                <Image class="aspect-[5/4] w-full overflow-hidden rounded border">
                  <Image.Img
                    class="h-full w-full object-cover cover-image"
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
    </ViewerPage>
  );
}
