import { For, Show, createResource } from "solid-js";
import { A } from "@solidjs/router";
import { Image } from "@kobalte/core/image";
import LibraryIcon from "lucide-solid/icons/landmark";
import pb from "../lib/pb";
import { fetchLibraries } from "../lib/libraries";
import Loading from "../components/Loading";

// Fixed thumbnail size for every library card, matching Collections.jsx.
const THUMB_WIDTH = 250;
const THUMB_HEIGHT = 200;

export default function Libraries() {
  const [libraries] = createResource(fetchLibraries);

  return (
    <div class="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center gap-8 px-6 py-12">
      <Show when={libraries()} fallback={<Loading />}>
        <div class="flex w-full flex-wrap justify-center gap-4 sm:justify-start">
          <For each={libraries()}>
            {(library) => (
              <A
                href={`/libraries/${library.id}`}
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
