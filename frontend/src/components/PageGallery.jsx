// frontend/src/components/PageGallery.jsx
import { For, onMount, createSignal, Show } from "solid-js";
import pb from "../lib/pb";
import NoteEditor from "./NoteEditor";

// Renders a thumbnail grid and opens a PhotoSwipe lightbox on click.
// PhotoSwipe's core class is instantiated directly against a dataSource
// array instead of using the DOM-scanning Lightbox helper, since Solid
// renders declaratively rather than leaving static <a> tags to scan.
export default function PageGallery(props) {
  // props.images: [{ manifestPageId, image, note }], already sorted by
  // manifest_pages.position. `note` is the linked notes record or null.
  // props.page: 1-indexed page number from the `p` search param, used to
  // deep-link directly into a page when the component mounts.
  // props.onPageChange(p): called with the current 1-indexed page while
  // browsing, and with undefined when the lightbox is closed.

  // Holds { manifestPageId, note } while the note editor overlay is open,
  // null otherwise. The overlay is portalled out of PhotoSwipe's DOM (see
  // NoteEditor), so it can stay open on top of the lightbox.
  const [notePanel, setNotePanel] = createSignal(null);
  let pswp;

  const openViewer = async (index) => {
    const { default: PhotoSwipe } = await import("photoswipe");
    await import("photoswipe/style.css");

    const dataSource = props.images.map((item) => ({
      src: pb.files.getURL(item.image, item.image.image),
      width: item.image.width,
      height: item.image.height,
    }));

    // trapFocus disabled: PhotoSwipe otherwise forces focus back into its
    // own container whenever focus moves elsewhere (e.g. into the
    // portalled NoteEditor), which silently swallows every keystroke
    // typed into the note editor.
    pswp = new PhotoSwipe({ dataSource, index, trapFocus: false });

    // Adds a note button just left of the built-in zoom button (order: 10)
    // that opens the note editor for whichever page is currently shown.
    pswp.on("uiRegister", () => {
      pswp.ui.registerElement({
        name: "note-button",
        ariaLabel: "Note",
        order: 9,
        isButton: true,
        html: "📝",
        onClick: () => {
          const item = props.images[pswp.currIndex];
          setNotePanel({
            manifestPageId: item.manifestPageId,
            note: item.note,
          });
        },
      });
    });

    // Keep the `p` search param in sync with whichever page is on screen,
    // so the URL always points at a specific page while browsing.
    pswp.on("change", () => {
      props.onPageChange?.(String(pswp.currIndex + 1));
    });
    pswp.on("close", () => {
      props.onPageChange?.(undefined);
    });

    pswp.init();
  };

  // Deep-link support: if the URL already has ?p=N when this gallery
  // mounts, jump straight into PhotoSwipe at that page.
  onMount(() => {
    const page = Number(props.page);
    if (Number.isInteger(page) && page >= 1 && page <= props.images.length) {
      openViewer(page - 1);
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
      <div class="grid grid-cols-4 gap-2">
        <For each={props.images}>
          {(item, i) => (
            <img
              src={pb.files.getURL(item.image, item.image.image, {
                thumb: "300x0",
              })}
              alt=""
              class="cursor-pointer rounded border"
              onClick={() => openViewer(i())}
            />
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
