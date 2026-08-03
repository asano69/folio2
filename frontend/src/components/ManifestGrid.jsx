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
    // Below lg: (this app's own mobile/desktop threshold, matching
    // isDesktop() -- see lib/viewport.js and docs/d02_responsive-ui.md),
    // the grid is always exactly 2 columns, the same fixed layout
    // Collections/Libraries use, so a manifest card is never squeezed
    // down to just 1 per row on a narrow phone. At lg: and up, this is
    // unchanged from before: auto-fill/minmax lets the browser fit as
    // many columns as the viewport allows, sized between 128px and
    // THUMB_WIDTH (188px, kept in sync with the constant above).
    <div class="grid w-full grid-cols-2 justify-center gap-4 lg:grid-cols-[repeat(auto-fill,minmax(128px,188px))]">
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
              // aspect-[188/250] keeps the 3:4 portrait ratio no matter
              // how wide the grid track ends up being (see the
              // grid-template-columns style above).
              class={`relative block aspect-[188/250] overflow-hidden rounded border${draggable.touchClass}`}
              style={{
                opacity: draggable.isDragging() ? 0.5 : 1,
              }}
            >
              <Image class="h-full w-full">
                <Image.Img
                  class="h-full w-full object-cover cover-image"
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
