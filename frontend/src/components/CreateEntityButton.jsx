import { createSignal } from "solid-js";
import { Dialog } from "@kobalte/core/dialog";
import { Button } from "@kobalte/core/button";
import { TextField } from "@kobalte/core/text-field";
import pb from "../lib/pb";
import { showError } from "../lib/toast";

// Generic "create a record with just a label" flow. Shared by any
// top-level list page that only needs a single text field to create an
// entity -- Collections and Libraries. Stays on the current page after
// creation; the caller is responsible for reflecting the new record
// wherever it's shown (see props.onCreated).
export default function CreateEntityButton(props) {
  // props.collection: PocketBase collection name to create the record in
  //   (e.g. "collections")
  // props.triggerLabel: text shown on the button that opens the dialog,
  //   reused as the dialog title (e.g. "New Collection")
  // props.onCreated(record): called with the newly created record, so
  //   the caller can add it to whatever list is currently shown (e.g.
  //   the sidebar) without waiting for a refetch.

  const [open, setOpen] = createSignal(false);
  const [label, setLabel] = createSignal("");
  const [creating, setCreating] = createSignal(false);

  // Clears the input whenever the dialog closes (Cancel, Create, or
  // clicking outside), so the next open never shows stale text.
  const handleOpenChange = (value) => {
    setOpen(value);
    if (!value) setLabel("");
  };

  const handleCreate = async (e) => {
    // e is undefined when called directly from the Create button's
    // onClick, and a submit event when called via the form's onSubmit
    // (Enter key inside the text field). preventDefault only applies in
    // the latter case, so the page never actually navigates/reloads.
    e?.preventDefault();

    const value = label().trim();
    if (!value) return;

    setCreating(true);
    try {
      const record = await pb
        .collection(props.collection)
        .create({ label: value });
      handleOpenChange(false);
      props.onCreated?.(record);
    } catch (err) {
      showError(err?.message || `Failed to create ${props.triggerLabel}.`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>{props.triggerLabel}</Button>
      <Dialog open={open()} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 z-[100001] bg-black/50" />
          <div class="fixed inset-0 z-[100001] flex items-center justify-center p-6">
            <Dialog.Content class="flex w-full max-w-sm flex-col gap-4 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] p-6 text-[var(--color-text)] shadow-lg">
              <Dialog.Title class="text-xl">{props.triggerLabel}</Dialog.Title>
              {/* Wrapped in a form so pressing Enter inside the text
                  field submits (== Create), matching the Escape-to-cancel
                  behavior Kobalte's Dialog already provides out of the
                  box. */}
              <form onSubmit={handleCreate} class="flex flex-col gap-4">
                <TextField value={label()} onChange={setLabel}>
                  <TextField.Input
                    placeholder="Title"
                    autofocus
                    class="w-full rounded-md border px-3 py-2"
                  />
                </TextField>
                <div class="flex justify-end gap-2">
                  <Dialog.CloseButton as={Button}>Cancel</Dialog.CloseButton>
                  <Button type="submit" disabled={creating()}>
                    {creating() ? "Creating…" : "Create"}
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
