import pb from "./pb";

// Fetches all libraries, shared by Libraries (the mobile /libraries page)
// and LibrarySidebar (the sidebar overlay panel) so both stay in sync
// without duplicating the PocketBase query itself. Libraries have an
// explicit "position" field for manual ordering (unlike collections,
// which use -created).
export async function fetchLibraries() {
  return pb.collection("libraries").getFullList({ sort: "position" });
}
