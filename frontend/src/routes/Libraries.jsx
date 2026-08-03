import { For, Show, onMount } from "solid-js";
import { A } from "@solidjs/router";
import { Image } from "@kobalte/core/image";
import LibraryIcon from "lucide-solid/icons/landmark";
import pb from "../lib/pb";
import { libraries, loadLibraries, addLibrary } from "../lib/libraries";
import Loading from "../components/Loading";
import CreateEntityButton from "../components/CreateEntityButton";

// Fixed thumbnail size for every library card, matching Collections.jsx.
const THUMB_WIDTH = 250;
const THUMB_HEIGHT = 200;

export default function Libraries() {
  onMount(loadLibraries);

  return (
    <div class="mx-auto flex min-h-screen w-full flex-col items-center gap-8 px-6 py-12 lg:px-24">
      <div class="flex w-full justify-end">
        <CreateEntityButton
          collection="libraries"
          triggerLabel="New Library"
          onCreated={addLibrary}
        />
      </div>
      <Show when={libraries()} fallback={<Loading />}>
        <div class="flex w-full flex-wrap justify-center gap-4 sm:justify-start">
          <For each={libraries()}>
            {(library) => (
              <A
                href={`/libraries/${library.id}`}
                // Two cards per row on mobile (calc-based width), fixed
                // THUMB_WIDTH from sm: up, so more columns fit in as the
                // screen widens.
                class="flex w-[calc(50%-0.5rem)] flex-col gap-2 sm:w-[250px]"
              >
                <Image class="aspect-[5/4] w-full overflow-hidden rounded border">
                  <Image.Img
                    class="h-full w-full object-cover cover-image"
                    src={
                      library.cover
                        ? pb.files.getURL(library, library.cover, {
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
                <span class="truncate text-sm">{library.label}</span>
              </A>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
