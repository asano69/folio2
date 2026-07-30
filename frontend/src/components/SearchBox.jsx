import { createSignal } from "solid-js";
import { TextField } from "@kobalte/core/text-field";
import { Button } from "@kobalte/core/button";

// Generic "type and submit" search box, shared by any list page that
// needs a search-on-submit input (Manifests, Catalog's unclassified
// inbox, and potentially Collections/Libraries later). Only searches on
// submit (Enter or the button), not on every keystroke -- the caller
// decides what "submit" means by handling props.onSearch.
//
// props.onSearch receives a plain trimmed string today. This is the
// intended extension point for a future advanced search (combining
// multiple condition expressions, e.g. label + tag + status): a caller
// could swap this component for a richer one that calls onSearch with a
// structured object instead, without changing how the receiving route
// wires the result into its own `query` signal and fetchXPage() call.
export default function SearchBox(props) {
  // props.placeholder: input placeholder text
  // props.onSearch(query): called with the trimmed search string on submit

  const [input, setInput] = createSignal("");

  const handleSubmit = (e) => {
    e.preventDefault();
    props.onSearch(input().trim());
  };

  return (
    <form onSubmit={handleSubmit} class="flex w-full gap-2">
      <TextField value={input()} onChange={setInput} class="flex-1">
        <TextField.Input
          type="search"
          placeholder={props.placeholder ?? "Search"}
          class="w-full rounded-md border px-3 py-2"
        />
      </TextField>
      <Button type="submit">Search</Button>
    </form>
  );
}
