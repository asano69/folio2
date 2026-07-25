// frontend/src/components/PageGallery.jsx
import { For } from "solid-js";
import pb from "../lib/pb";

// Renders a thumbnail grid and opens a PhotoSwipe lightbox on click.
// PhotoSwipe's core class is instantiated directly against a dataSource
// array instead of using the DOM-scanning Lightbox helper, since Solid
// renders declaratively rather than leaving static <a> tags to scan.
export default function PageGallery(props) {
  // props.images: images records (id, image, width, height), already
  // sorted by manifest_pages.position.

  const openViewer = async (index) => {
    const { default: PhotoSwipe } = await import("photoswipe");
    await import("photoswipe/style.css");

    const dataSource = props.images.map((img) => ({
      src: pb.files.getURL(img, img.image),
      width: img.width,
      height: img.height,
    }));

    const pswp = new PhotoSwipe({ dataSource, index });
    pswp.init();
  };

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
