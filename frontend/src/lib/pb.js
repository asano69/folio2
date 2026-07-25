import PocketBase from "pocketbase";

// Single shared PocketBase client, used to call folio2' custom API routes
// (e.g. POST /api/admin/jobs/import-folders) from the frontend.
const pb = new PocketBase("/");

export default pb;
