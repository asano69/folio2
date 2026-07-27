import { For, Show, createResource } from "solid-js";
import { A, useParams } from "@solidjs/router";
import { Image } from "@kobalte/core/image";
import LibraryIcon from "lucide-solid/icons/library";
import Loading from "../components/Loading";
import pb from "../lib/pb";

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
  const [data] = createResource(() => params.id, fetchLibraryCollections);

  return (
    <div class="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <Show when={data()} fallback={<Loading />}>
        <h1 class="text-4xl">{data().label}</h1>
        <div class="flex w-full flex-wrap justify-center gap-4 sm:justify-start">
          <For each={data().collections}>
            {(collection) => (
              <A
                href={`/collections/${collection.id}`}
                class="flex flex-col gap-2"
                style={{ width: `${THUMB_WIDTH}px` }}
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
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
