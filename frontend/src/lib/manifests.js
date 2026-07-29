import pb from "./pb";

// Attaches each manifest's cover image, borrowed from its first page
// (manifest_pages.position === 0). Manifests without a first page get
// coverImage: null, and ManifestGrid falls back to a placeholder icon
// for those. Shared by Catalog.jsx, CollectionViewer.jsx, and this
// module's own fetchAllManifests, since all three need the same cover
// lookup.
export async function attachCovers(manifests) {
  if (manifests.length === 0) return manifests;

  // Single request for every manifest's cover (position 0 page), instead
  // of one request per manifest. The old per-manifest approach turned a
  // Home load into hundreds of individual round-trips once the manifest
  // count grew, overwhelming the server.
  const covers = await pb.collection("manifest_pages").getFullList({
    filter: "position = 0",
    expand: "manifest,page.image",
  });

  const coverByManifestId = new Map(
    covers.map((c) => [c.manifest, c.expand?.page?.expand?.image ?? null]),
  );

  return manifests.map((manifest) => ({
    ...manifest,
    coverImage: coverByManifestId.get(manifest.id) ?? null,
  }));
}

// Fetches every manifest, regardless of collection membership. Unlike
// Catalog's fetchManifests (Home's "unclassified inbox"), this is the
// complete list, used by the /manifests page. When query is given, only
// manifests whose label contains it are returned (substring match via
// PocketBase's "~" operator; no fuzzy matching).
export async function fetchAllManifests(query) {
  const filter = query ? pb.filter("label ~ {:query}", { query }) : "";
  const manifests = await pb
    .collection("manifests")
    .getFullList({ sort: "-created", filter });
  return attachCovers(manifests);
}
