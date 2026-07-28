import { For, Show } from "solid-js";
import { useDroppable } from "@dnd-kit/solid";
import Loading from "../Loading";
import SidebarRow from "./SidebarRow";

// Generic "fetch a list, show a loading state, render one thumbnail row
// per item" sidebar panel, shared by CollectionSidebar and
// LibrarySidebar. What each row looks like (link vs. plain, icon, label,
// image) is entirely up to the caller via the getter props below, so
// this component only owns the loading/list scaffolding and can be
// reused as-is for any similarly-shaped sidebar in another project.
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
  return (
    <Show when={props.items} fallback={<Loading />}>
      <ul class="flex flex-col my-2">
        <For each={props.items}>
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
