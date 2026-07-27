// frontend/src/components/PageGallery.jsx
import { For, onMount, createSignal, Show } from "solid-js";
import { Image } from "@kobalte/core/image";
import ImageIcon from "lucide-solid/icons/image";
import pb from "../lib/pb";
import NoteEditor from "./NoteEditor";

// Renders a thumbnail grid and opens a PhotoSwipe lightbox on click.
// PhotoSwipe's core class is instantiated directly against a dataSource
// array instead of using the DOM-scanning Lightbox helper, since Solid
// renders declaratively rather than leaving static <a> tags to scan.
export default function PageGallery(props) {
  // props.images: [{ manifestPageId, image, note, position }], already
  // sorted by manifest_pages.position. `note` is the linked notes record or
  // null.
  // props.position: manifest_pages.position from the `i` search param, used
  // to deep-link directly into a page when the component mounts.
  // props.onPositionChange(position): called with the current page's
  // position while browsing, and with undefined when the lightbox is closed.

  // Holds { manifestPageId, note } while the note editor overlay is open,
  // null otherwise. The overlay is portalled out of PhotoSwipe's DOM (see
  // NoteEditor), so it can stay open on top of the lightbox.
  const [notePanel, setNotePanel] = createSignal(null);
  let pswp;

  const openViewer = async (index) => {
    const { default: PhotoSwipe } = await import("photoswipe");
    await import("photoswipe/style.css");
    const { default: PhotoSwipeDynamicCaption } = await import(
      "photoswipe-dynamic-caption-plugin"
    );
    await import(
      "photoswipe-dynamic-caption-plugin/photoswipe-dynamic-caption-plugin.css"
    );

    const dataSource = props.images.map((item) => ({
      src: pb.files.getURL(item.image, item.image.image),
      width: item.image.width,
      height: item.image.height,
      description: item.description,
    }));

    // trapFocus disabled: PhotoSwipe otherwise forces focus back into its
    // own container whenever focus moves elsewhere (e.g. into the
    // portalled NoteEditor), which silently swallows every keystroke
    // typed into the note editor.
    pswp = new PhotoSwipe({ dataSource, index, trapFocus: false });

    // photoswipe-dynamic-caption-plugin expects a PhotoSwipeLightbox
    // instance, whose real PhotoSwipe instance lives at `lightbox.pswp`.
    // We use PhotoSwipe's core class directly instead of the Lightbox
    // wrapper, so a minimal stand-in object is passed instead: forwarding
    // `on()` straight to `pswp` (do NOT set `pswp.pswp = pswp` -- PhotoSwipe's
    // own `on()` delegates to `this.pswp` when present, which turns that
    // into infinite self-recursion).
    const captionHost = { on: (name, fn) => pswp.on(name, fn), pswp };

    // Must be constructed before pswp.init(), since the plugin registers
    // itself on the "init" event just like the note button below does on
    // "uiRegister".
    // Shows pages.description (if any) as a below/aside caption.
    new PhotoSwipeDynamicCaption(captionHost, {
      type: "auto",
      captionContent: (slide) => slide.data.description || "",
    });

    // Adds a note button just left of the built-in zoom button (order: 10)
    // that opens the note editor for whichever page is currently shown.
    pswp.on("uiRegister", () => {
      pswp.ui.registerElement({
        name: "note-button",
        ariaLabel: "Note",
        order: 9,
        isButton: true,
        // PhotoSwipe's registerElement expects a raw HTML string, not a
        // Solid component, so lucide-solid's "sticky-note" icon markup is
        // inlined directly instead of importing the component.
        html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h11l5-5V5a2 2 0 0 0-2-2z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/></svg>',
        onClick: () => {
          const item = props.images[pswp.currIndex];
          setNotePanel({
            manifestPageId: item.manifestPageId,
            note: item.note,
          });
        },
      });
    });

    // Keep the `i` search param in sync with whichever page is on screen,
    // so the URL always points at a specific page while browsing.
    // These run inside PhotoSwipe's own event callbacks, not a Solid
    // tracked scope, so eslint-plugin-solid's reactivity check doesn't
    // apply here (same as a plain DOM event handler).
    // eslint-disable-next-line solid/reactivity
    pswp.on("change", () => {
      props.onPositionChange?.(String(props.images[pswp.currIndex].position));
    });
    // eslint-disable-next-line solid/reactivity
    pswp.on("close", () => {
      props.onPositionChange?.(undefined);
    });

    pswp.init();
  };

  // Deep-link support: if the URL already has ?i=N when this gallery
  // mounts, jump straight into PhotoSwipe at the page whose
  // manifest_pages.position matches N.
  onMount(() => {
    const position = Number(props.position);
    if (Number.isInteger(position)) {
      const index = props.images.findIndex((img) => img.position === position);
      if (index !== -1) openViewer(index);
    }
  });

  // Store the saved note back onto the in-memory images array so reopening
  // the note button later reflects what was just saved, without needing to
  // refetch the whole manifest.
  const handleNoteSaved = (note) => {
    const panel = notePanel();
    if (!panel) return;
    const item = props.images.find(
      (i) => i.manifestPageId === panel.manifestPageId,
    );
    if (item) item.note = note;
    setNotePanel(null);
  };

  return (
    <>
      <div class="flex flex-wrap gap-2">
        <For each={props.images}>
          {(item, i) => (
            <Image
              class="h-[150px] w-[200px] cursor-pointer overflow-hidden rounded border"
              onClick={() => openViewer(i())}
            >
              <Image.Img
                class="h-full w-full object-cover"
                src={pb.files.getURL(item.image, item.image.image, {
                  thumb: "200x150",
                })}
                alt=""
              />
              <Image.Fallback class="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-300 dark:bg-neutral-800 dark:text-neutral-600">
                <ImageIcon size={36} strokeWidth={1.5} />
              </Image.Fallback>
            </Image>
          )}
        </For>
      </div>
      <Show when={notePanel()}>
        <NoteEditor
          manifestPageId={notePanel().manifestPageId}
          note={notePanel().note}
          onClose={() => setNotePanel(null)}
          onSaved={handleNoteSaved}
        />
      </Show>
    </>
  );
}
