import { createSignal } from "solid-js";
import { Dialog } from "@kobalte/core/dialog";
import { Button } from "@kobalte/core/button";
import { TextField } from "@kobalte/core/text-field";
import Ellipsis from "lucide-solid/icons/ellipsis";
import pb from "../lib/pb";
import { showError } from "../lib/toast";

// Shared "rename + replace cover" dialog, used by CollectionEditButton,
// LibraryEditButton, and EditManifestButton. What differs between those
// three is isolated behind props:
//
// - props.collectionName: PocketBase collection the label is updated on
//   ("collections" | "libraries" | "manifests").
// - props.saveCover(file): if given, called with the picked file instead
//   of sending `cover` in the label update. Needed for manifests, whose
//   cover lives on a page record rather than a direct field (see
//   lib/manifestCover.js). Omitted for collections/libraries, which just
//   send `cover` directly in the same update call.
// - props.onSaved(updatedRecord): called after a plain label/cover
//   update, so callers with a shared list signal (collections,
//   libraries) can patch it immediately. Omitted for manifests, which
//   have no such shared list.
//
// The dialog does not track its own "was anything saved" state -- per
// spec, closing the dialog for any reason (Save or Cancel) triggers
// props.onClose, which the caller uses to refetch and reflect whatever
// is currently persisted.
export default function EditEntityButton(props) {
  // props.entityId: id of the record being edited
  // props.entityLabel: display name used in the title/aria-label/errors
  //   (e.g. "Collection", "Library", "Manifest")
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

  const handleSave = async (e) => {
    // e is undefined when called directly, and a submit event when
    // called via the form's onSubmit (Enter key inside the text field).
    // preventDefault only applies in the latter case, so the page never
    // actually navigates/reloads.
    e?.preventDefault();
    setSaving(true);
    try {
      if (props.saveCover) {
        await pb.collection(props.collectionName).update(props.entityId, {
          label: label(),
        });
        if (cover()) await props.saveCover(cover());
      } else {
        const data = { label: label() };
        // Only include cover when a new file was actually picked -- the
        // PocketBase SDK switches to multipart/form-data automatically
        // whenever a File/Blob value is present.
        if (cover()) data.cover = cover();
        const updated = await pb
          .collection(props.collectionName)
          .update(props.entityId, data);
        props.onSaved?.(updated);
      }
      // Go through handleOpenChange (not setOpen directly) so
      // props.onClose() actually fires: Kobalte only calls onOpenChange
      // in response to its own close triggers, not when the `open`
      // signal is set imperatively from outside.
      handleOpenChange(false);
    } catch (err) {
      showError(
        err?.message || `Failed to update ${props.entityLabel.toLowerCase()}.`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Edit ${props.entityLabel.toLowerCase()}`}
        class="icon-btn cursor-pointer rounded-md p-1.5 text-[var(--color-text)] transition-colors duration-150 hover:bg-[var(--color-hover-bg)]"
      >
        <Ellipsis size={20} />
      </button>
      <Dialog open={open()} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 z-[100001] bg-black/50" />
          <div class="fixed inset-0 z-[100001] flex items-center justify-center p-6">
            <Dialog.Content class="flex w-full max-w-sm flex-col gap-4 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] p-6 text-[var(--color-text)] shadow-lg">
              <Dialog.Title class="text-xl">
                Edit {props.entityLabel}
              </Dialog.Title>
              {/* Wrapped in a form so pressing Enter inside the text
                  field submits (== Save), matching CreateEntityButton's
                  behavior. */}
              <form onSubmit={handleSave} class="flex flex-col gap-4">
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
                  <Button type="submit" disabled={saving()}>
                    {saving() ? "Saving…" : "Save"}
                  </Button>
                </div>
              </form>
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}
