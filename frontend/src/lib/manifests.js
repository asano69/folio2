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

// Number of manifests fetched per page, shared by the /manifests route
// and Home's Catalog (see lib/useInfiniteList.js's infinite scroll).
const MANIFESTS_PAGE_SIZE = 40;

// Fetches one page of manifests, sorted newest first. `page` is 1-based,
// matching PocketBase's getList. Returns `hasMore` so the caller (an
// IntersectionObserver-driven infinite scroll, see useInfiniteList) knows
// whether to keep requesting further pages.
//
// `query`, if given, restricts results to manifests whose label contains
// it (substring match via PocketBase's "~" operator; no fuzzy matching).
//
// `options.unclassifiedOnly` restricts results to manifests with no
// collection_manifests link at all -- Home's "unclassified inbox" (see
// components/Catalog.jsx). This is computed via a PocketBase
// back-relation filter (collection_manifests_via_manifest), so it can be
// paginated server-side instead of fetching every manifest plus every
// collection_manifests link and filtering client-side.
export async function fetchManifestsPage(query, page, options = {}) {
  const filters = [];
  if (query) filters.push(pb.filter("label ~ {:query}", { query }));
  if (options.unclassifiedOnly) {
    filters.push("collection_manifests_via_manifest.id = ''");
  }

  const result = await pb
    .collection("manifests")
    .getList(page, MANIFESTS_PAGE_SIZE, {
      sort: "-created",
      filter: filters.join(" && "),
    });
  return {
    items: await attachCovers(result.items),
    hasMore: page < result.totalPages,
  };
}
