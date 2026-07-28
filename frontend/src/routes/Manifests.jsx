import { Show, createResource } from "solid-js";
import ManifestGrid from "../components/ManifestGrid";
import Loading from "../components/Loading";
import { fetchAllManifests } from "../lib/manifests";

// Complete list of every manifest, regardless of collection membership --
// unlike Home/Catalog, which only shows manifests not yet added to a
// collection. Cards are draggable onto a CollectionSidebar row the same
// way as on Home; ManifestGrid already wires that up, so no extra work
// is needed here.
export default function Manifests() {
  const [manifests] = createResource(fetchAllManifests);

  return (
    <div class="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center gap-8 px-6 py-12">
      <Show when={manifests()} fallback={<Loading />}>
        <ManifestGrid manifests={manifests()} />
      </Show>
    </div>
  );
}
