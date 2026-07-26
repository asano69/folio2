import { For, Show, createResource } from "solid-js";
import { A } from "@solidjs/router";
import { Image } from "@kobalte/core/image";
import { BookOpen } from "lucide-solid";
import pb from "../lib/pb";

// Fixed thumbnail size so every cover lines up in a neat grid regardless
// of each source image's own aspect ratio.
const THUMB_WIDTH = 200;
const THUMB_HEIGHT = 250;

// Fetches all manifests so Home can link into /manifests/:id; this is
// currently the only entry point into a manifest's viewer.
//
// manifests has no cover field of its own, so the thumbnail shown here is
// borrowed from each manifest's first page (manifest_pages.position === 0).
// Manifests without a first page simply fall back to the placeholder icon.
async function fetchManifests() {
  const manifests = await pb.collection("manifests").getFullList({ sort: "-created" });

  const covers = await Promise.all(
    manifests.map((manifest) =>
      pb
        .collection("manifest_pages")
        .getFirstListItem(
          pb.filter("manifest = {:id} && position = 0", { id: manifest.id }),
          { expand: "page.image" },
        )
        .catch(() => null),
    ),
  );

  return manifests.map((manifest, i) => ({
    ...manifest,
    coverImage: covers[i]?.expand?.page?.expand?.image ?? null,
  }));
}

export default function Catalog() {
  const [manifests] = createResource(fetchManifests);

  return (
    <Show when={manifests()} fallback={<p>Loading…</p>}>
      <div class="flex w-full flex-wrap justify-center gap-4 sm:justify-start">
        <For each={manifests()}>
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
                      ? pb.files.getURL(manifest.coverImage, manifest.coverImage.image, {
                          thumb: `${THUMB_WIDTH}x${THUMB_HEIGHT}`,
                        })
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
    </Show>
  );
}
