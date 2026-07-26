import { createSignal, Show } from "solid-js";
import { Button } from "@kobalte/core/button";
import pb from "../../lib/pb";

// Admin section of the Settings page: a link to the PocketBase admin
// dashboard, plus a button that kicks off the background import-folders
// job and follows its progress via PocketBase realtime.
export default function Admin() {
  const [job, setJob] = createSignal(null);
  const [error, setError] = createSignal("");

  const startImport = async () => {
    setError("");
    try {
      const { id } = await pb.send("/api/admin/jobs/import-folders", {
        method: "POST",
      });
      setJob({ status: "queued", message: "", processed: 0, total: 0 });

      pb.collection("jobs").subscribe(id, (e) => {
        const record = e.record;
        setJob({
          status: record.status,
          message: record.message,
          processed: record.processed,
          total: record.total,
        });
        if (record.status === "completed" || record.status === "failed") {
          pb.collection("jobs").unsubscribe(id);
        }
      });
    } catch (err) {
      setError(err?.message || "Failed to start import.");
    }
  };

  return (
    <div class="flex flex-col items-center justify-center gap-4 py-6">
      <a
        href="/_/"
        target="_blank"
        rel="noopener noreferrer"
        class="rounded-md border px-5 py-3 text-lg font-semibold"
      >
        PocketBase↗
      </a>

      <Button onClick={startImport}>Import Folders</Button>

      <Show when={job()}>
        <p class="text-sm">
          {job().status}: {job().processed}/{job().total} {job().message}
        </p>
      </Show>
      <Show when={error()}>
        <p class="text-sm">{error()}</p>
      </Show>
    </div>
  );
}
