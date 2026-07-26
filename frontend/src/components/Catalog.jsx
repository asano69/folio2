import { For, Show, createResource } from "solid-js";
import { A } from "@solidjs/router";
import { Image } from "@kobalte/core/image";
import pb from "../lib/pb";

// Fetches all manifests so Home can link into /manifests/:id; this is
// currently the only entry point into a manifest's viewer.
//
// manifests has no cover field of its own, so the thumbnail shown here is
// borrowed from each manifest's first page (manifest_pages.position === 1).
// Manifests without a first page simply fall back to the placeholder icon.
async function fetchManifests() {
  const manifests = await pb.collection("manifests").getFullList({ sort: "-created" });

  const covers = await Promise.all(
    manifests.map((manifest) =>
      pb
        .collection("manifest_pages")
        .getFirstListItem(
          pb.filter("manifest = {:id} && position = 1", { id: manifest.id }),
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
      <div class="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        <For each={manifests()}>
          {(manifest) => (
            <A href={`/manifests/${manifest.id}`} class="flex flex-col gap-2">
              <Image class="aspect-3/4 w-full rounded border">
                <Image.Img
                  src={
                    manifest.coverImage
                      ? pb.files.getURL(manifest.coverImage, manifest.coverImage.image, {
                          thumb: "300x0",
                        })
                      : undefined
                  }
                  alt=""
                />
                <Image.Fallback>📖</Image.Fallback>
              </Image>
              <span class="truncate text-sm">{manifest.label}</span>
            </A>
          )}
        </For>
      </div>
    </Show>
  );
}
