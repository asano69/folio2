import { createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Dialog } from "@kobalte/core/dialog";
import { Button } from "@kobalte/core/button";
import { TextField } from "@kobalte/core/text-field";
import pb from "../lib/pb";
import { showError } from "../lib/toast";

// Generic "create a record with just a label, then jump to its detail
// page" flow. Shared by any top-level list page that only needs a single
// text field to create an entity -- Collections today, Libraries later
// (see Collections.jsx for how it's wired up).
export default function CreateEntityButton(props) {
  // props.collection: PocketBase collection name to create the record in
  //   (e.g. "collections")
  // props.basePath: detail route prefix the new record is navigated to
  //   after creation (e.g. "/collections" -> "/collections/<id>")
  // props.triggerLabel: text shown on the button that opens the dialog,
  //   reused as the dialog title (e.g. "New Collection")

  const navigate = useNavigate();
  const [open, setOpen] = createSignal(false);
  const [label, setLabel] = createSignal("");
  const [creating, setCreating] = createSignal(false);

  // Clears the input whenever the dialog closes (Cancel, Create, or
  // clicking outside), so the next open never shows stale text.
  const handleOpenChange = (value) => {
    setOpen(value);
    if (!value) setLabel("");
  };

  const handleCreate = async () => {
    const value = label().trim();
    if (!value) return;

    setCreating(true);
    try {
      const record = await pb
        .collection(props.collection)
        .create({ label: value });
      setOpen(false);
      navigate(`${props.basePath}/${record.id}`);
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
              <TextField value={label()} onChange={setLabel}>
                <TextField.Input
                  placeholder="Title"
                  autofocus
                  class="w-full rounded-md border px-3 py-2"
                />
              </TextField>
              <div class="flex justify-end gap-2">
                <Dialog.CloseButton as={Button}>Cancel</Dialog.CloseButton>
                <Button onClick={handleCreate} disabled={creating()}>
                  {creating() ? "Creating…" : "Create"}
                </Button>
              </div>
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}
