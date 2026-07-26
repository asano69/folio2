import { For, Show, createResource } from "solid-js";
import { A } from "@solidjs/router";
import { Image } from "@kobalte/core/image";
import pb from "../lib/pb";

// Fetches all manifests so Home can link into /manifests/:id; this is
// currently the only entry point into a manifest's viewer.
async function fetchManifests() {
  return pb.collection("manifests").getFullList({ sort: "-created" });
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
                    manifest.cover
                      ? pb.files.getURL(manifest, manifest.cover, { thumb: "300x0" })
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
