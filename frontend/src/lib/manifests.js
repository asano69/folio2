import pb from "./pb";

// Attaches each manifest's cover image, borrowed from its first page
// (manifest_pages.position === 0). Manifests without a first page get
// coverImage: null, and ManifestGrid falls back to a placeholder icon
// for those. Shared by Catalog.jsx, CollectionViewer.jsx, and this
// module's own fetchAllManifests, since all three need the same cover
// lookup.
export async function attachCovers(manifests) {
  const covers = await Promise.all(
    manifests.map((manifest) =>
      pb
        .collection("manifest_pages")
        .getFirstListItem(
          pb.filter("manifest = {:id} && position = 0", { id: manifest.id }),
          { expand: "page.image" },
        )
        .catch(() => null),
    ),
  );

  return manifests.map((manifest, i) => ({
    ...manifest,
    coverImage: covers[i]?.expand?.page?.expand?.image ?? null,
  }));
}

// Fetches every manifest, regardless of collection membership. Unlike
// Catalog's fetchManifests (Home's "unclassified inbox"), this is the
// complete list, used by the /manifests page.
export async function fetchAllManifests() {
  const manifests = await pb
    .collection("manifests")
    .getFullList({ sort: "-created" });
  return attachCovers(manifests);
}
