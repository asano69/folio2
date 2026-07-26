import { createSignal, Show } from "solid-js";
import { Button } from "@kobalte/core/button";
import { Progress } from "@kobalte/core/progress";
import pb from "../../lib/pb";
import { showError } from "../../lib/toast";

// Admin section of the Settings page: a link to the PocketBase admin
// dashboard, plus a button that kicks off the background import-folders
// job and follows its progress via PocketBase realtime.
export default function Admin() {
  const [job, setJob] = createSignal(null);

  // Applies a jobs record (from realtime or a plain fetch) to local state,
  // and stops listening once the job has reached a terminal status.
  const applyJob = (record) => {
    setJob({
      status: record.status,
      message: record.message,
      processed: record.processed,
      total: record.total,
    });
    if (record.status === "completed" || record.status === "failed") {
      pb.collection("jobs").unsubscribe(record.id);
    }
  };

  const startImport = async () => {
    try {
      const { id } = await pb.send("/api/admin/jobs/import-folders", {
        method: "POST",
      });
      setJob({ status: "queued", message: "", processed: 0, total: 0 });

      // Subscribe first, then fetch the current record once the
      // subscription is active. The import can finish (even fully
      // complete) between job creation and this point, so without this
      // catch-up fetch a fast job's progress/completion would never
      // reach the UI and the progress bar would be stuck on "queued".
      await pb.collection("jobs").subscribe(id, (e) => applyJob(e.record));
      applyJob(await pb.collection("jobs").getOne(id));
    } catch (err) {
      showError(err?.message || "Failed to start import.");
    }
  };

  return (
    <div class="flex flex-col items-center justify-center gap-4 py-6">
      <a
        href="/_/"
        target="_blank"
        rel="noopener noreferrer"
        class="btn-link"
      >
        PocketBase↗
      </a>

      <Button onClick={startImport}>Import Folders</Button>

      <Show when={job()}>
        <Progress
          value={job().processed}
          minValue={0}
          maxValue={job().total || 1}
          indeterminate={!job().total}
          class="flex w-full max-w-sm flex-col gap-1"
        >
          <div class="flex justify-between text-sm">
            <Progress.Label>{job().status}</Progress.Label>
            <Progress.ValueLabel>
              {job().processed}/{job().total}
            </Progress.ValueLabel>
          </div>
          <Progress.Track class="h-2 w-full rounded-full border">
            <Progress.Fill class="h-full rounded-full" />
          </Progress.Track>
          <p class="text-sm">{job().message}</p>
        </Progress>
      </Show>
    </div>
  );
}
