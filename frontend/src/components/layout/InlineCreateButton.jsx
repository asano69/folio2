
import { Show, createSignal } from "solid-js";
import { TextField } from "@kobalte/core/text-field";
import Plus from "lucide-solid/icons/plus";
import pb from "../../lib/pb";
import { showError } from "../../lib/toast";

// Inline "create a record with just a label" control for the sidebar
// footer (see AppShell.jsx, which wires this into SideBar's `footer`
// prop for both CollectionSidebar and LibrarySidebar). Unlike
// CreateEntityButton (used on the full /collections and /libraries
// pages), this has no dialog and no separate Save/Cancel buttons:
// clicking the button swaps it for a text input in place, and
// Enter/Escape drive submit/cancel directly.
export default function InlineCreateButton(props) {
  // props.collection: PocketBase collection name to create the record in
  //   (e.g. "collections")
  // props.label: button text shown before editing starts, and the
  //   input's placeholder while editing (e.g. "New Collection")
  // props.onCreated(record): called with the newly created record

  const [editing, setEditing] = createSignal(false);
  const [value, setValue] = createSignal("");
  const [creating, setCreating] = createSignal(false);

  const stopEditing = () => {
    setEditing(false);
    setValue("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (creating()) return;

    const label = value().trim();
    if (!label) return stopEditing();

    setCreating(true);
    try {
      const record = await pb.collection(props.collection).create({ label });
      props.onCreated?.(record);
      stopEditing();
    } catch (err) {
      showError(err?.message || `Failed to create ${props.label.toLowerCase()}.`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Show
      when={editing()}
      fallback={
        <button
          type="button"
          onClick={() => setEditing(true)}
          class="flex w-full items-center gap-2 rounded-md p-2 text-sm text-[var(--color-text)] transition-colors duration-150 hover:bg-[var(--color-hover-bg)]"
        >
          <Plus size={18} />
          {props.label}
        </button>
      }
    >
      {/* No Save/Cancel buttons: Enter submits via the form below,
          Escape cancels via onKeyDown, and clicking away (onBlur)
          cancels too so this never gets stuck open. */}
      <form onSubmit={handleSubmit}>
        <TextField value={value()} onChange={setValue}>
          <TextField.Input
            placeholder={props.label}
            autofocus
            onKeyDown={(e) => e.key === "Escape" && stopEditing()}
            onBlur={stopEditing}
            class="w-full rounded-md border px-3 py-1.5 text-sm"
          />
        </TextField>
      </form>
    </Show>
  );
}

