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
  // count grew, overwhelming the server. The filter is further restricted
  // to just the manifests passed in (instead of every position=0 row in
  // the database), since callers now only ever pass one page's worth of
  // manifests at a time -- fetching every cover row stopped scaling once
  // the library held hundreds of manifests.
  const idFilter = manifests
    .map((m) => pb.filter("manifest = {:id}", { id: m.id }))
    .join(" || ");
  const covers = await pb.collection("manifest_pages").getFullList({
    filter: `position = 0 && (${idFilter})`,
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

// Number of manifests fetched per page on the /manifests route (see
// fetchManifestsPage / routes/Manifests.jsx's infinite scroll).
const MANIFESTS_PAGE_SIZE = 40;

// Fetches one page of manifests, regardless of collection membership.
// Unlike Catalog's fetchManifests (Home's "unclassified inbox"), this
// covers the complete list, used by the /manifests page. When query is
// given, only manifests whose label contains it are returned (substring
// match via PocketBase's "~" operator; no fuzzy matching).
//
// `page` is 1-based, matching PocketBase's getList. Returns `hasMore` so
// the caller (an IntersectionObserver-driven infinite scroll) knows
// whether to keep requesting further pages.
export async function fetchManifestsPage(query, page) {
  const filter = query ? pb.filter("label ~ {:query}", { query }) : "";
  const result = await pb
    .collection("manifests")
    .getList(page, MANIFESTS_PAGE_SIZE, { sort: "-created", filter });
  return {
    items: await attachCovers(result.items),
    hasMore: page < result.totalPages,
  };
}
