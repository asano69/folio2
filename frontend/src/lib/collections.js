import pb from "./pb";

// Fetches all collections, shared by Collections (the mobile /collections
// page) and CollectionSidebar (the desktop overlay panel) so both stay in
// sync without duplicating the PocketBase query itself.
export async function fetchCollections() {
  return pb.collection("collections").getFullList({ sort: "-created" });
}
