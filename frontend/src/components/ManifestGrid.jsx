import { For } from "solid-js";
import { A } from "@solidjs/router";
import { Image } from "@kobalte/core/image";
import BookOpen from "lucide-solid/icons/book-open";
import pb from "../lib/pb";
import { useClassificationDraggable } from "../lib/useClassificationDraggable";
import { DRAG_TYPE_MANIFEST_ID } from "../lib/dragTypes";

// Fixed thumbnail size so every cover lines up in a neat grid regardless
// of each source image's own aspect ratio. Roughly a 3:4 portrait ratio.
const THUMB_WIDTH = 188;
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
        {(manifest) => {
          // Draggable onto a CollectionSidebar row (see lib/classification.js)
          // to add this manifest to that collection. dnd-kit's default
          // activation distance keeps a plain tap/click still working as
          // navigation.
          const draggable = useClassificationDraggable(
            `manifest-${manifest.id}`,
            { type: DRAG_TYPE_MANIFEST_ID, manifestId: manifest.id },
          );
          return (
            <A
              ref={draggable.ref}
              href={`/manifests/${manifest.id}`}
              class={`relative block overflow-hidden rounded border${draggable.touchClass}`}
              style={{
                width: `${THUMB_WIDTH}px`,
                height: `${THUMB_HEIGHT}px`,
                opacity: draggable.isDragging() ? 0.5 : 1,
              }}
            >
              <Image class="h-full w-full">
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
              {/* Label overlay: min-height reserves 2 lines regardless of
                  label length, so every card lines up evenly. Sits on top
                  of the thumbnail (not below it), with a gradient behind
                  the text to keep it legible over a bright cover. */}
              <span class="absolute inset-x-0 bottom-0 line-clamp-2 min-h-10 bg-gradient-to-t from-black/70 to-transparent px-2 pt-6 pb-1.5 text-sm text-white">
                {manifest.label}
              </span>
            </A>
          );
        }}
      </For>
    </div>
  );
}
