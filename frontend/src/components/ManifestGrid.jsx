import { For } from "solid-js";
import { A } from "@solidjs/router";
import { Image } from "@kobalte/core/image";
import BookOpen from "lucide-solid/icons/book-open";
import pb from "../lib/pb";

// Fixed thumbnail size so every cover lines up in a neat grid regardless
// of each source image's own aspect ratio.
const THUMB_WIDTH = 200;
const THUMB_HEIGHT = 250;

// Shared grid of manifest covers, each linking into its viewer. Used by
// both the top-level Catalog and CollectionViewer, since both derive a
// manifest's cover the same way (first page at position 0) before
// passing it in here.
export default function ManifestGrid(props) {
  // props.manifests: [{ id, label, coverImage }]
  return (
    <div class="flex w-full flex-wrap justify-center gap-4 sm:justify-start">
      <For each={props.manifests}>
        {(manifest) => (
          <A
            href={`/manifests/${manifest.id}`}
            class="flex flex-col gap-2"
            style={{ width: `${THUMB_WIDTH}px` }}
          >
            <Image
              class="overflow-hidden rounded border"
              style={{ width: `${THUMB_WIDTH}px`, height: `${THUMB_HEIGHT}px` }}
            >
              <Image.Img
                class="h-full w-full object-cover"
                src={
                  manifest.coverImage
                    ? pb.files.getURL(
                        manifest.coverImage,
                        manifest.coverImage.image,
                        {
                          thumb: `${THUMB_WIDTH}x${THUMB_HEIGHT}`,
                        },
                      )
                    : undefined
                }
                alt=""
              />
              <Image.Fallback class="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-300 dark:bg-neutral-800 dark:text-neutral-600">
                <BookOpen size={48} strokeWidth={1.5} />
              </Image.Fallback>
            </Image>
            <span class="truncate text-sm">{manifest.label}</span>
          </A>
        )}
      </For>
    </div>
  );
}
