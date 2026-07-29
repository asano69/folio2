import { For, Show, createSignal, createMemo } from "solid-js";
import { useDroppable } from "@dnd-kit/solid";
import { TextField } from "@kobalte/core/text-field";
import Loading from "../Loading";
import SidebarRow from "./SidebarRow";

// Generic "fetch a list, show a loading state, render one thumbnail row
// per item" sidebar panel, shared by CollectionSidebar and
// LibrarySidebar. What each row looks like (link vs. plain, icon, label,
// image) is entirely up to the caller via the getter props below, so
// this component only owns the loading/list scaffolding and can be
// reused as-is for any similarly-shaped sidebar in another project.
//
// An incremental search box filtering by label is built in here too,
// since it's the same for every list-shaped sidebar -- Collections and
// Libraries both get it for free without duplicating the filter logic.
export default function SidebarList(props) {
  // props.items: array of resource data, or undefined while loading
  // props.icon: fallback icon component (e.g. a lucide-solid icon)
  // props.getHref(item): link target, or undefined/null for a
  //   non-navigating row
  // props.getImageUrl(item): thumbnail URL, or undefined/null to show
  //   the fallback icon
  // props.getLabel(item): display label
  // props.itemProps(item): extra props to spread onto each row --
  //   onClick today.
  // props.getDropId(item) / props.getDropData(item): when given, each row
  //   becomes a drop target (useDroppable) with that id/data, so items
  //   can be dropped onto it (see CollectionSidebar/LibrarySidebar and
  //   lib/classification.js). Omitted entirely for sidebars that don't
  //   need drag-and-drop.

  const [query, setQuery] = createSignal("");

  // Plain case-insensitive substring match against getLabel(item),
  // recomputed as the user types. Returns props.items unfiltered once
  // the query is empty, so an empty search box never hides anything.
  const filteredItems = createMemo(() => {
    const q = query().trim().toLowerCase();
    if (!q) return props.items;
    return props.items.filter((item) =>
      props.getLabel(item)?.toLowerCase().includes(q),
    );
  });

  return (
    <Show when={props.items} fallback={<Loading />}>
      <TextField value={query()} onChange={setQuery}>
        <TextField.Input
          type="search"
          placeholder="Search…"
          class="my-3 w-full rounded-md border px-3 py-1.5 text-sm"
        />
      </TextField>
      <ul class="flex flex-col">
        <For each={filteredItems()}>
          {(item) => {
            const droppable = props.getDropId
              ? useDroppable({
                  id: props.getDropId(item),
                  data: props.getDropData?.(item),
                })
              : null;
            return (
              <li
                ref={droppable?.ref}
                classList={{
                  "rounded-md outline-2 outline-[var(--color-hover-border)]":
                    !!droppable?.isDropTarget(),
                }}
              >
                <SidebarRow
                  href={props.getHref?.(item)}
                  imageUrl={props.getImageUrl(item)}
                  icon={props.icon}
                  label={props.getLabel(item)}
                  {...props.itemProps?.(item)}
                />
              </li>
            );
          }}
        </For>
      </ul>
    </Show>
  );
}
