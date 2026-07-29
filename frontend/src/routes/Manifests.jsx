import { Show, createSignal, createResource } from "solid-js";
import { TextField } from "@kobalte/core/text-field";
import { Button } from "@kobalte/core/button";
import ManifestGrid from "../components/ManifestGrid";
import Loading from "../components/Loading";
import { fetchAllManifests } from "../lib/manifests";

// Complete list of every manifest, regardless of collection membership --
// unlike Home/Catalog, which only shows manifests not yet added to a
// collection. Cards are draggable onto a CollectionSidebar row the same
// way as on Home; ManifestGrid already wires that up, so no extra work
// is needed here.
//
// The search box only searches on submit (Enter or the button), not on
// every keystroke, so `query` (what was actually searched for) is kept
// separate from `input` (the field's current text).
export default function Manifests() {
  const [input, setInput] = createSignal("");
  const [query, setQuery] = createSignal("");
  const [manifests] = createResource(
    () => ({ query: query() }),
    ({ query }) => fetchAllManifests(query),
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(input());
  };

  return (
    <div class="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center gap-8 px-6 py-12">
      <form onSubmit={handleSearch} class="flex w-full gap-2">
        <TextField value={input()} onChange={setInput} class="flex-1">
          <TextField.Input
            type="search"
            placeholder="Search by label"
            class="w-full rounded-md border px-3 py-2"
          />
        </TextField>
        <Button type="submit">Search</Button>
      </form>
      <Show when={manifests()} fallback={<Loading />}>
        <ManifestGrid manifests={manifests()} />
      </Show>
    </div>
  );
}
