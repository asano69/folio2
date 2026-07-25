import PocketBase from "pocketbase";

// Single shared PocketBase client, used to call myapp' custom API routes
// (e.g. POST /api/admin/jobs/rescan) from the frontend.
const pb = new PocketBase("/");

// In dev, log the full response body for failed requests (validation
// errors, auth failures, etc.) so a bare status code in the UI doesn't
// leave you guessing what actually went wrong. Stripped out of prod
// builds since it's gated behind Vite's import.meta.env.DEV.
if (import.meta.env.DEV) {
  pb.afterSend = function (response, data) {
    if (!response.ok) {
      console.error(`[pb] ${response.status} ${response.url}`, data);
    }
    return data;
  };
}

export default pb;
