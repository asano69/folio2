import { createSignal } from "solid-js";
import { Dialog } from "@kobalte/core/dialog";
import { Button } from "@kobalte/core/button";
import { TextField } from "@kobalte/core/text-field";
import Ellipsis from "lucide-solid/icons/ellipsis";
import pb from "../lib/pb";
import { showError } from "../lib/toast";
import { updateLibrary } from "../lib/libraries";

// Icon-only edit button shown next to a library's label in
// LibraryViewer. Opens a dialog to rename the library and/or upload a
// new cover image. Mirrors CollectionEditButton exactly, just pointed at
// the "libraries" collection instead of "collections".
//
// The dialog does not track its own "was anything saved" state -- per
// spec, closing the dialog for any reason (Save or Cancel) triggers
// props.onClose, which the caller uses to refetch and reflect whatever
// is currently persisted.
export default function LibraryEditButton(props) {
  // props.libraryId: id of the libraries record being edited
  // props.label: current label, used to prefill the text field
  // props.onClose(): called once the dialog closes, regardless of
  //   whether a save happened

  const [open, setOpen] = createSignal(false);
  const [label, setLabel] = createSignal(props.label);
  const [cover, setCover] = createSignal(null);
  const [saving, setSaving] = createSignal(false);

  const handleOpenChange = (value) => {
    setOpen(value);
    if (value) {
      // Reset to the current label and clear any pending file each time
      // the dialog opens, so a previous unsaved edit doesn't linger.
      setLabel(props.label);
      setCover(null);
    } else {
      props.onClose?.();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { label: label() };
      // Only include cover when a new file was actually picked -- the
      // PocketBase SDK switches to multipart/form-data automatically
      // whenever a File/Blob value is present.
      if (cover()) data.cover = cover();
      const updated = await pb
        .collection("libraries")
        .update(props.libraryId, data);
      // Patch the sidebar's shared libraries list immediately -- it's
      // loaded once on mount and otherwise never learns about edits made
      // from this dialog.
      updateLibrary(props.libraryId, updated);
      // Go through handleOpenChange (not setOpen directly) so
      // props.onClose() actually fires: Kobalte only calls onOpenChange
      // in response to its own close triggers, not when the `open`
      // signal is set imperatively from outside.
      handleOpenChange(false);
    } catch (err) {
      showError(err?.message || "Failed to update library.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Edit library"
        class="icon-btn cursor-pointer rounded-md p-1.5 text-[var(--color-text)] transition-colors duration-150 hover:bg-[var(--color-hover-bg)]"
      >
        <Ellipsis size={20} />
      </button>
      <Dialog open={open()} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 z-[100001] bg-black/50" />
          <div class="fixed inset-0 z-[100001] flex items-center justify-center p-6">
            <Dialog.Content class="flex w-full max-w-sm flex-col gap-4 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] p-6 text-[var(--color-text)] shadow-lg">
              <Dialog.Title class="text-xl">Edit Library</Dialog.Title>
              <TextField value={label()} onChange={setLabel}>
                <TextField.Input
                  placeholder="Label"
                  autofocus
                  class="w-full rounded-md border px-3 py-2"
                />
              </TextField>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCover(e.currentTarget.files?.[0] ?? null)}
              />
              <div class="flex justify-end gap-2">
                <Dialog.CloseButton as={Button}>Cancel</Dialog.CloseButton>
                <Button onClick={handleSave} disabled={saving()}>
                  {saving() ? "Saving…" : "Save"}
                </Button>
              </div>
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}
