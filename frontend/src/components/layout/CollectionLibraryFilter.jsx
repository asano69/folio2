import { createMemo } from "solid-js";
import { Select } from "@kobalte/core/select";
import { libraries } from "../../lib/libraries";
import {
  collectionLibraryFilter,
  setCollectionLibraryFilter,
  FILTER_ALL,
  FILTER_UNCLASSIFIED,
} from "./collectionLibraryFilter";

// "All" always leads (it's the default/cleared state); "Unclassified"
// always trails, after every real library -- see options() below.
const ALL_OPTION = { id: FILTER_ALL, label: "All" };
const UNCLASSIFIED_OPTION = { id: FILTER_UNCLASSIFIED, label: "Unclassified" };

// Select shown above CollectionSidebar's search box, narrowing the
// collection list down to a single Library (or "Unclassified"/"All").
// Mirrors SidebarViewSelect.jsx's Select usage, but styled to look like
// a plain field (matching SidebarList's search box) rather than a
// button -- see the Trigger's class below, which overrides the global
// `button:not(.icon-btn)` rule from style.css the same way
// SidebarViewSelect's title-style trigger already does.
export default function CollectionLibraryFilter() {
  const options = createMemo(() => [
    ALL_OPTION,
    ...(libraries() ?? []).map((l) => ({ id: l.id, label: l.label })),
    UNCLASSIFIED_OPTION,
  ]);

  const selectedOption = () =>
    options().find((o) => o.id === collectionLibraryFilter()) ?? ALL_OPTION;

  return (
    // mt-2: breathing room from the header row above (the sidebar's
    // outer flex container has no gap before its first child).
    // -mb-3: cancels out the search box's own top margin (my-3, see
    // SidebarList.jsx) so it doesn't stack on top of the outer
    // container's gap-4, which otherwise doubled the visible space
    // between this filter and the search box below it.
    <div class="mt-2 -mb-3">
      <Select
        options={options()}
        optionValue="id"
        optionTextValue="label"
        value={selectedOption()}
        onChange={(option) => option && setCollectionLibraryFilter(option.id)}
        itemComponent={(props) => (
          <Select.Item
            item={props.item}
            class="cursor-pointer rounded px-3 py-1.5 data-[highlighted]:bg-[var(--color-hover-bg)]"
          >
            <Select.ItemLabel>{props.item.rawValue.label}</Select.ItemLabel>
          </Select.Item>
        )}
      >
        <Select.Trigger
          aria-label="Filter by library"
          class="w-full justify-between rounded-md border border-[var(--color-border-soft)] bg-transparent px-3 py-1.5 text-sm font-normal shadow-none hover:border-[var(--color-border-soft)] hover:bg-transparent active:border-[var(--color-border-soft)] active:bg-transparent active:shadow-none"
        >
          <Select.Value>{(state) => state.selectedOption()?.label}</Select.Value>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content class="z-60 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-bg)] p-1 shadow-md">
            <Select.Listbox />
          </Select.Content>
        </Select.Portal>
      </Select>
    </div>
  );
}
