// frontend/src/components/PageGallery.jsx
import { For, onMount, createSignal, Show } from "solid-js";
import { Image } from "@kobalte/core/image";
import ImageIcon from "lucide-solid/icons/image";
import pb from "../lib/pb";
import NoteEditor from "./NoteEditor";
import { isDesktop } from "../lib/viewport";
import { showError } from "../lib/toast";

// Inlined lucide "arrow-big-left"/"arrow-big-right" icons, used by the
// reading-direction toggle button below. PhotoSwipe's registerElement
// expects a raw HTML string (see the note button further down), so the
// icon markup is inlined the same way instead of importing the
// lucide-solid component.
const ARROW_BIG_LEFT_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15h-6v4l-7-7 7-7v4h6v6z"/></svg>';
const ARROW_BIG_RIGHT_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9h6V5l7 7-7 7v-4H6V9z"/></svg>';

// Maps an index between "reading order" (props.images, always sorted by
// manifest_pages.position) and PhotoSwipe's own display order, which is
// reversed while direction is "rl" (right-to-left reading, e.g. manga).
// The mapping is its own inverse, so the same helper works both ways.
function mirrorIndex(index, dir, length) {
  return dir === "rl" ? length - 1 - index : index;
}

// Renders a thumbnail grid and opens a PhotoSwipe lightbox on click.
// PhotoSwipe's core class is instantiated directly against a dataSource
// array instead of using the DOM-scanning Lightbox helper, since Solid
// renders declaratively rather than leaving static <a> tags to scan.
export default function PageGallery(props) {
  // props.images: [{ manifestPageId, pageId, image, description, position }],
  // already sorted by manifest_pages.position. `description` is the
  // note/caption text stored on the pages record.
  // props.position: manifest_pages.position from the `i` search param, used
  // to deep-link directly into a page when the component mounts.
  // props.onPositionChange(position): called with the current page's
  // position while browsing, and with undefined when the lightbox is closed.
  // props.manifestId: id of the manifests record, used to persist the
  // reading direction toggled from within the viewer.
  // props.direction: the manifest's current reading direction ("lr" or
  // "rl"), used as this signal's initial value.

  // Holds { pageId, description } while the note editor overlay is open,
  // null otherwise. The overlay is portalled out of PhotoSwipe's DOM (see
  // NoteEditor), so it can stay open on top of the lightbox.
  const [notePanel, setNotePanel] = createSignal(null);
  // Which way swiping/arrow keys move to the next page. Toggled from a
  // button inside the PhotoSwipe UI (see the "direction-button" element
  // below) and persisted on the manifest.
  const [direction, setDirection] = createSignal(props.direction || "lr");
  let pswp;
  // Guards against a second PhotoSwipe instance being created while one is
  // already open or still loading. Opening is async (photoswipe is a
  // dynamically imported chunk), so on mobile a slow first tap leaves a
  // window where extra taps on a thumbnail would otherwise each start
  // their own PhotoSwipe instance. Also drives the edge loader below, so
  // on mobile a tap gets an immediate visual response instead of looking
  // like a mistap while the chunk loads.
  const [isOpening, setIsOpening] = createSignal(false);

  // Tracks whether the "close" handler below was reached because of a
  // back-button press (via handlePopState) rather than the user closing
  // the viewer some other way (X button, swipe-down, Escape).
  let closedByBackButton = false;

  // Set just before pswp.close() when the close is only a side effect of
  // toggling the reading direction (see the "direction-button" element
  // below), so the "close" handler can reopen at the same page instead of
  // treating it like the user actually leaving the viewer.
  let pendingReopenIndex = null;

  // On mobile (PWA), the back button would otherwise navigate the
  // underlying page while PhotoSwipe stays open on top of it. Closing
  // the viewer here instead makes the back button do what the user
  // expects: just close the viewer, without leaving the app.
  const handlePopState = () => {
    closedByBackButton = true;
    pswp?.close();
  };

  // Persists a toggled reading direction on the manifest. Best-effort: the
  // in-memory `direction` signal already reflects the change, so a failed
  // save only means it won't survive a reload.
  const saveDirection = async (next) => {
    try {
      await pb.collection("manifests").update(props.manifestId, {
        direction: next,
      });
    } catch (err) {
      showError(err?.message || "Failed to save reading direction.");
    }
  };

  const openViewer = async (index, options = {}) => {
    if (isOpening()) return;
    setIsOpening(true);

    // Push a history entry so the back button triggers handlePopState
    // above instead of navigating away underneath the open viewer.
    // Reopening after a reading-direction toggle (options.replaceHistory)
    // replaces that entry instead of adding a new one, since it isn't
    // really a new "page".
    closedByBackButton = false;
    if (options.replaceHistory) {
      window.history.replaceState({ photoswipe: true }, "");
    } else {
      window.history.pushState({ photoswipe: true }, "");
    }
    window.addEventListener("popstate", handlePopState);

    const { default: PhotoSwipe } = await import("photoswipe");
    await import("photoswipe/style.css");
    const { default: PhotoSwipeDynamicCaption } =
      await import("photoswipe-dynamic-caption-plugin");
    await import("photoswipe-dynamic-caption-plugin/photoswipe-dynamic-caption-plugin.css");

    // Captured once per PhotoSwipe instance: toggling direction closes and
    // reopens a fresh instance (see the direction button below), so this
    // never changes while `pswp` itself is alive.
    const dir = direction();
    const orderedImages =
      dir === "rl" ? [...props.images].reverse() : props.images;
    const dataSource = orderedImages.map((item) => ({
      src: pb.files.getURL(item.image, item.image.image),
      width: item.image.width,
      height: item.image.height,
      description: item.description,
    }));

    // trapFocus disabled: PhotoSwipe otherwise forces focus back into its
    // own container whenever focus moves elsewhere (e.g. into the
    // portalled NoteEditor), which silently swallows every keystroke
    // typed into the note editor.
    pswp = new PhotoSwipe({
      dataSource,
      index: mirrorIndex(index, dir, props.images.length),
      trapFocus: false,
      // The built-in counter always counts up from 1 in PhotoSwipe's own
      // (already direction-mirrored) dataSource order, so it still shows
      // 1/200 -> 200/200 while reading "rl". Replaced with a custom
      // element below so it counts down (200/200 -> 1/200) to match the
      // manifest's original page order instead.
      counter: false,
      // On mobile the viewport is narrower than it is tall, so the default
      // "fit" zoom (contain) leaves empty space above/below a page whenever
      // its aspect ratio doesn't exactly match the screen, forcing a manual
      // pinch-zoom on every page turn. vFill instead scales the page to
      // fill the viewport's height, cropping the sides (pannable) if
      // needed, so a page always opens already zoomed to the top/bottom
      // edges. Desktop keeps the default "fit" behavior, since width isn't
      // the constraint there.
      ...(!isDesktop() && {
        initialZoomLevel: (zoomLevel) => zoomLevel.vFill,
      }),
    });

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
    // that opens the note editor for whichever page is currently shown,
    // plus a reading-direction toggle just left of that (order: 8).
    pswp.on("uiRegister", () => {
      // Toggles which way swiping/arrow keys move to the next page and
      // persists the choice on the manifest. Shows the *current*
      // direction: a left-pointing arrow while reading right-to-left
      // (manga-style), a right-pointing arrow for the default
      // left-to-right order. Toggling closes and reopens the viewer at
      // the same page, since PhotoSwipe's own dataSource order needs to
      // change along with it (see openViewer above).
      pswp.ui.registerElement({
        name: "direction-button",
        ariaLabel: "Toggle reading direction",
        order: 8,
        isButton: true,
        html: dir === "rl" ? ARROW_BIG_LEFT_SVG : ARROW_BIG_RIGHT_SVG,
        onClick: () => {
          const nextDir = dir === "rl" ? "lr" : "rl";
          pendingReopenIndex = mirrorIndex(
            pswp.currIndex,
            dir,
            props.images.length,
          );
          setDirection(nextDir);
          saveDirection(nextDir);
          pswp.close();
        },
      });

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
          const originalIndex = mirrorIndex(
            pswp.currIndex,
            dir,
            props.images.length,
          );
          const item = props.images[originalIndex];
          setNotePanel({
            pageId: item.pageId,
            description: item.description,
          });
        },
      });

      // Replaces the disabled built-in counter (see the "counter: false"
      // option above). While reading "rl", currIndex still counts up
      // through PhotoSwipe's mirrored dataSource, so the numerator is
      // flipped here to count down instead, matching the manifest's
      // original page order.
      pswp.ui.registerElement({
        name: "counter-indicator",
        order: 5,
        // Reuses PhotoSwipe's own "pswp__counter" class instead of
        // writing custom CSS, so this custom element inherits the same
        // white-on-dark styling as the built-in counter it replaces.
        className: "pswp__counter",
        onInit: (el, pswpInstance) => {
          const updateCounter = () => {
            const total = pswpInstance.getNumItems();
            const current =
              dir === "rl" ? total - pswpInstance.currIndex : pswpInstance.currIndex + 1;
            el.innerText = current + pswpInstance.options.indexIndicatorSep + total;
          };
          pswpInstance.on("change", updateCounter);
          updateCounter();
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
      const originalIndex = mirrorIndex(
        pswp.currIndex,
        dir,
        props.images.length,
      );
      props.onPositionChange?.(String(props.images[originalIndex].position));
    });
    // eslint-disable-next-line solid/reactivity
    pswp.on("close", () => {
      props.onPositionChange?.(undefined);
      setIsOpening(false);
      window.removeEventListener("popstate", handlePopState);
      if (pendingReopenIndex !== null) {
        // Closed only to rebuild PhotoSwipe with the new direction's
        // dataSource order; reopen at the same page instead of treating
        // this like the user leaving the viewer.
        const reopenIndex = pendingReopenIndex;
        pendingReopenIndex = null;
        openViewer(reopenIndex, { replaceHistory: true });
      } else if (!closedByBackButton) {
        // If the viewer was closed some other way than the back button,
        // pop the history entry pushed above ourselves, so it doesn't sit
        // there as an extra step the next real back-button press has to
        // get through first.
        window.history.back();
      }
    });

    pswp.init();
    // The lightbox shell is mounted synchronously by init(), so the
    // loader is no longer needed once this returns.
    setIsOpening(false);
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

  // Store the saved description back onto the in-memory images array so
  // reopening the note button later reflects what was just saved, without
  // needing to refetch the whole manifest.
  //
  // The dynamic caption plugin renders each slide's caption once, when the
  // slide is created (see captionContent in openViewer), so an edit made
  // afterward has to be applied by hand: to the slide's own data (so a
  // future re-render, e.g. on resize, doesn't revert to the old text) and
  // to the already-rendered DOM element (so the currently open lightbox
  // reflects the change immediately, without closing/reopening it).
  const handleNoteSaved = (description) => {
    const panel = notePanel();
    if (!panel) return;
    const item = props.images.find((i) => i.pageId === panel.pageId);
    if (item) item.description = description;

    const slide = pswp?.currSlide;
    if (slide) {
      slide.data.description = description;
      if (slide.dynamicCaption?.element) {
        slide.dynamicCaption.element.innerHTML = description;
      }
    }

    setNotePanel(null);
  };

  return (
    <>
      {/* Mobile-only: PhotoSwipe's dynamic import + init takes a
          noticeable moment on a slow connection, so without this a tap
          looks identical to a mistap until the viewer actually appears. */}
      <Show when={!isDesktop() && isOpening()}>
        <div class="fixed top-4 right-4 z-[100000] h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-500 dark:border-neutral-700 dark:border-t-neutral-300" />
      </Show>
      <div class="flex flex-wrap gap-2">
        <For each={props.images}>
          {(item, i) => (
            <Image
              class="h-[150px] w-[200px] cursor-pointer overflow-hidden rounded border"
              onClick={() => openViewer(i())}
            >
              <Image.Img
                loading="lazy"
                decoding="async"
                class="h-full w-full object-cover page-image"
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
          pageId={notePanel().pageId}
          description={notePanel().description}
          onClose={() => setNotePanel(null)}
          onSaved={handleNoteSaved}
        />
      </Show>
    </>
  );
}
