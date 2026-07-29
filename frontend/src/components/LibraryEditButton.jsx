import EditEntityButton from "./EditEntityButton";
import { updateLibrary } from "../lib/libraries";

// Icon-only edit button shown next to a library's label in
// LibraryViewer. Opens a dialog to rename the library and/or upload a
// new cover image. Mirrors CollectionEditButton exactly, just pointed at
// the "libraries" collection instead of "collections".
//
// Thin wrapper around EditEntityButton (shared with CollectionEditButton
// and EditManifestButton): this library's specific bit is patching the
// sidebar's shared libraries list on save, since it's loaded once on
// mount and otherwise never learns about edits made from this dialog.
export default function LibraryEditButton(props) {
  // props.libraryId: id of the libraries record being edited
  // props.label: current label, used to prefill the text field
  // props.onClose(): called once the dialog closes, regardless of
  //   whether a save happened

  return (
    <EditEntityButton
      collectionName="libraries"
      entityId={props.libraryId}
      entityLabel="Library"
      label={props.label}
      onSaved={(updated) => updateLibrary(props.libraryId, updated)}
      onClose={props.onClose}
    />
  );
}
