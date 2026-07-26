import { createSignal, onMount } from "solid-js";
import { Portal } from "solid-js/web";
import pb from "../lib/pb";

// Overlay panel for editing the note attached to a single manifest_pages
// record. Mounted via Portal so it lives outside PhotoSwipe's DOM and can
// be shown on top of it while the image stays visible underneath.
//
// Only one note per manifest_pages record: if props.note is null, saving
// creates a new notes record and links it back from manifest_pages.note;
// otherwise saving updates the existing note in place. There is no
// autosave, only the explicit Save button, so accidentally opening the
// panel never creates an empty note.
export default function NoteEditor(props) {
  // props.manifestPageId: id of the manifest_pages record being annotated
  // props.note: existing notes record ({id, content}) or null
  // props.onClose(): dismiss the panel without saving
  // props.onSaved(note): called with the created/updated notes record

  let editorRef;
  let quill;
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal("");

  // Quill is loaded on demand (like PhotoSwipe in PageGallery) so it isn't
  // part of the main bundle for people who never open a note.
  onMount(async () => {
    const { default: Quill } = await import("quill");
    await import("quill/dist/quill.snow.css");
    quill = new Quill(editorRef, { theme: "snow" });
    if (props.note?.content) {
      quill.setContents(props.note.content);
    }
  });

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      // Quill Delta is stored as-is in notes.content (json field).
      const content = quill.getContents();
      let note;
      if (props.note) {
        note = await pb.collection("notes").update(props.note.id, { content });
      } else {
        note = await pb.collection("notes").create({ content });
        await pb
          .collection("manifest_pages")
          .update(props.manifestPageId, { note: note.id });
      }
      props.onSaved(note);
    } catch (err) {
      setError(err?.message || "Failed to save note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <div class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-6">
        <div class="flex w-full max-w-xl flex-col gap-4 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] p-6 shadow-[0_1px_3px_0_var(--color-shadow)]">
          {/* Quill's snow theme assumes a light background, so this
              container stays light regardless of the app's dark mode. */}
          <div ref={editorRef} class="min-h-[200px] bg-white text-black" />
          {error() && <p class="text-sm text-[#dc3545]">{error()}</p>}
          <div class="flex justify-end gap-2">
            <button type="button" class="btn" onClick={props.onClose}>
              Close
            </button>
            <button
              type="button"
              class="btn"
              onClick={handleSave}
              disabled={saving()}
            >
              {saving() ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
