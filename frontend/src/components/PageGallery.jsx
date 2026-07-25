// frontend/src/components/PageGallery.jsx
import { For, onMount } from "solid-js";
import pb from "../lib/pb";

// Renders a thumbnail grid and opens a PhotoSwipe lightbox on click.
// PhotoSwipe's core class is instantiated directly against a dataSource
// array instead of using the DOM-scanning Lightbox helper, since Solid
// renders declaratively rather than leaving static <a> tags to scan.
export default function PageGallery(props) {
  // props.images: images records (id, image, width, height), already
  // sorted by manifest_pages.position.
  // props.page: 1-indexed page number from the `p` search param, used to
  // deep-link directly into a page when the component mounts.
  // props.onPageChange(p): called with the current 1-indexed page while
  // browsing, and with undefined when the lightbox is closed.

  const openViewer = async (index) => {
    const { default: PhotoSwipe } = await import("photoswipe");
    await import("photoswipe/style.css");

    const dataSource = props.images.map((img) => ({
      src: pb.files.getURL(img, img.image),
      width: img.width,
      height: img.height,
    }));

    const pswp = new PhotoSwipe({ dataSource, index });

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

  return (
    <div class="grid grid-cols-4 gap-2">
      <For each={props.images}>
        {(img, i) => (
          <img
            src={pb.files.getURL(img, img.image, { thumb: "300x0" })}
            alt=""
            class="cursor-pointer rounded border border-[var(--color-border-soft)]"
            onClick={() => openViewer(i())}
          />
        )}
      </For>
    </div>
  );
}
