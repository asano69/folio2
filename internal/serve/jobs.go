package serve

import (
	"log/slog"

	"github.com/asano69/folio2/internal/config"
	"github.com/asano69/folio2/internal/importer"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/tools/types"
)

// runImportJob runs the import in the background and writes its progress
// and outcome onto the jobs record, so anyone subscribed to that record
// over PocketBase realtime sees updates as they happen.
func runImportJob(app *pocketbase.PocketBase, cfg *config.Config, jobID string) {
	job, err := app.FindRecordById("jobs", jobID)
	if err != nil {
		slog.Error("import job: reload record", "error", err)
		return
	}

	job.Set("status", "running")
	if err := app.Save(job); err != nil {
		slog.Error("import job: save running status", "error", err)
		return
	}

	result, err := importer.Run(app, cfg.Data.ImportDir, func(p importer.Progress) {
		job.Set("total", p.Total)
		job.Set("processed", p.Processed)
		job.Set("message", p.Message)
		if err := app.Save(job); err != nil {
			slog.Error("import job: save progress", "error", err)
		}
	})

	job.Set("finished", types.NowDateTime())
	if err != nil {
		job.Set("status", "failed")
		job.Set("message", err.Error())
	} else {
		job.Set("status", "completed")
		job.Set("result", result)
	}

	if err := app.Save(job); err != nil {
		slog.Error("import job: save final status", "error", err)
	}
}
