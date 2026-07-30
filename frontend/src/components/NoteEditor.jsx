import { createSignal } from "solid-js";
import { Dialog } from "@kobalte/core/dialog";
import { Button } from "@kobalte/core/button";
import { TextField } from "@kobalte/core/text-field";
import pb from "../lib/pb";
import { showError } from "../lib/toast";

// Overlay panel for editing a page's note, stored directly in
// pages.description (also used as the PhotoSwipe caption -- see
// PageGallery.jsx). Mounted via Portal so it lives outside PhotoSwipe's
// DOM and can be shown on top of it while the image stays visible
// underneath. There is no autosave, only the explicit Save button, so
// accidentally opening the panel never overwrites anything.
export default function NoteEditor(props) {
  // props.pageId: id of the pages record being annotated
  // props.description: current description text (may be empty)
  // props.onClose(): dismiss the panel without saving
  // props.onSaved(description): called with the saved description text

  const [text, setText] = createSignal(props.description || "");
  const [saving, setSaving] = createSignal(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await pb
        .collection("pages")
        .update(props.pageId, { description: text() });
      props.onSaved(text());
    } catch (err) {
      showError(err?.message || "Failed to save note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog defaultOpen onOpenChange={(open) => !open && props.onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-[100001] bg-black/50" />
        <div class="fixed inset-0 z-[100001] flex items-center justify-center p-6">
          <Dialog.Content class="flex w-full max-w-xl flex-col gap-4 rounded-md border border-[#999999] bg-white p-6 text-black shadow-lg dark:bg-neutral-900 dark:text-white">
            <TextField value={text()} onChange={setText}>
              <TextField.TextArea class="min-h-[200px] max-h-[50vh] w-full resize-y rounded border bg-white p-2 text-black dark:bg-neutral-800 dark:text-white" />
            </TextField>
            <div class="flex justify-end gap-2">
              <Button onClick={props.onClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving()}>
                {saving() ? "Saving…" : "Save"}
              </Button>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  );
}
