import EditEntityButton from "./EditEntityButton";
import { updateCollection } from "../lib/collections";

// Icon-only edit button shown next to a collection's label in
// CollectionViewer. Opens a dialog to rename the collection and/or
// upload a new cover image. There is no cover-removal option: only
// uploading a replacement is supported.
//
// Thin wrapper around EditEntityButton (shared with LibraryEditButton
// and EditManifestButton): this collection's specific bit is patching
// the sidebar's shared collections list on save, since it's loaded once
// on mount and otherwise never learns about edits made from this dialog.
export default function CollectionEditButton(props) {
  // props.collectionId: id of the collections record being edited
  // props.label: current label, used to prefill the text field
  // props.onClose(): called once the dialog closes, regardless of
  //   whether a save happened

  return (
    <EditEntityButton
      collectionName="collections"
      entityId={props.collectionId}
      entityLabel="Collection"
      label={props.label}
      onSaved={(updated) => updateCollection(props.collectionId, updated)}
      onClose={props.onClose}
    />
  );
}
