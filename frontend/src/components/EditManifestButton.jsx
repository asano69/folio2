import EditEntityButton from "./EditEntityButton";
import { setManifestCover } from "../lib/manifestCover";

// Icon-only edit button shown next to a manifest's label in
// ManifestViewer. Opens a dialog to rename the manifest and/or replace
// its cover. Mirrors CollectionEditButton/LibraryEditButton, except the
// "cover" here isn't a direct file field on the manifest itself -- it's
// borrowed from the page at manifest_pages.position === 0, so replacing
// it means updating (or creating) that page instead (see
// lib/manifestCover.js). That difference is passed to EditEntityButton
// as `saveCover`, which is called with the picked file instead of the
// button sending `cover` directly in the label update.
export default function EditManifestButton(props) {
  // props.manifestId: id of the manifests record being edited
  // props.label: current label, used to prefill the text field
  // props.onClose(): called once the dialog closes, regardless of
  //   whether a save happened

  return (
    <EditEntityButton
      collectionName="manifests"
      entityId={props.manifestId}
      entityLabel="Manifest"
      label={props.label}
      saveCover={(file) => setManifestCover(props.manifestId, file)}
      onClose={props.onClose}
    />
  );
}
