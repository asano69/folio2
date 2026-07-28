import { Show, splitProps } from "solid-js";
import { A } from "@solidjs/router";
import { Image } from "@kobalte/core/image";

// Thumbnail + fallback icon, shared by both branches below.
function Thumb(props) {
  return (
    <Image class="h-12 w-12  shrink-0 overflow-hidden rounded border">
      <Image.Img
        class="h-full w-full object-cover"
        src={props.imageUrl || undefined}
        alt=""
      />
      <Image.Fallback class="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-300 dark:bg-neutral-800 dark:text-neutral-600">
        <props.icon size={20} strokeWidth={1.5} />
      </Image.Fallback>
    </Image>
  );
}

// One row in a sidebar list: a thumbnail (with a fallback icon while no
// image is set) plus a label. Renders as a link when `href` is given
// (e.g. CollectionSidebar, which navigates to the collection's page), or
// as a plain, non-navigating row otherwise (e.g. LibrarySidebar, which
// has no detail route yet). Deliberately free of any app-specific
// dependency (PocketBase, etc.), so it can be reused as-is for a similar
// sidebar in another project.
//
// Any extra props -- onClick today, and later drag-and-drop handlers
// like draggable/onDragOver/onDrop for adding an item to a collection or
// library by dropping it here -- are spread onto whichever element is
// rendered, so callers can add behavior without this component needing
// to know about it.
export default function SidebarRow(props) {
  const [local, rest] = splitProps(props, [
    "href",
    "imageUrl",
    "icon",
    "label",
  ]);

  return (
    <Show
      when={local.href}
      fallback={
        <div class="flex items-center gap-3 rounded-md p-2" {...rest}>
          <Thumb imageUrl={local.imageUrl} icon={local.icon} />
          <span class="truncate text-sm">{local.label}</span>
        </div>
      }
    >
      <A
        href={local.href}
        class="flex items-center gap-3 rounded-md p-2 hover:bg-[var(--color-hover-bg)]"
        {...rest}
      >
        <Thumb imageUrl={local.imageUrl} icon={local.icon} />
        <span class="truncate text-sm">{local.label}</span>
      </A>
    </Show>
  );
}
