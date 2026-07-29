import pb from "./pb";

// Replaces (or creates) a manifest's cover -- the page linked at
// manifest_pages.position === 0 -- with a newly uploaded file. The
// "images" record itself is compressed server-side by a PocketBase hook
// (see internal/serve/image_hooks.go), the same way internal/importer
// compresses pages during a folder import, so this call only needs to
// upload the raw file.
export async function setManifestCover(manifestId, file) {
  const image = await pb.collection("images").create({ image: file });

  const existing = await pb
    .collection("manifest_pages")
    .getFirstListItem(
      pb.filter("manifest = {:id} && position = 0", { id: manifestId }),
      { expand: "page" },
    )
    .catch(() => null);

  if (existing) {
    // Manifest already has a cover page: just repoint it at the new image.
    await pb.collection("pages").update(existing.expand.page.id, {
      image: image.id,
    });
    return;
  }

  // No pages at all yet (empty manifest): create the cover page and its
  // position=0 link from scratch.
  const page = await pb.collection("pages").create({ image: image.id });
  await pb.collection("manifest_pages").create({
    manifest: manifestId,
    page: page.id,
    position: 0,
    status: "NOT_STARTED",
  });
}
