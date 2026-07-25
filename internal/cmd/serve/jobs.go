package serve

import (
	"github.com/asano69/folio2/internal/config"
	"github.com/asano69/folio2/internal/importer"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/tools/types"

	"github.com/sirupsen/logrus"
)

// runImportJob runs the import in the background and writes its progress
// and outcome onto the jobs record, so anyone subscribed to that record
// over PocketBase realtime sees updates as they happen.
func runImportJob(app *pocketbase.PocketBase, cfg *config.Config, jobID string) {
	job, err := app.FindRecordById("jobs", jobID)
	if err != nil {
		logrus.WithError(err).Error("import job: reload record")
		return
	}

	job.Set("status", "running")
	if err := app.Save(job); err != nil {
		logrus.WithError(err).Error("import job: save running status")
		return
	}

	result, err := importer.Run(app, cfg.Data.ImportDir, func(p importer.Progress) {
		job.Set("total", p.Total)
		job.Set("processed", p.Processed)
		job.Set("message", p.Message)
		if err := app.Save(job); err != nil {
			logrus.WithError(err).Error("import job: save progress")
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
		logrus.WithError(err).Error("import job: save final status")
	}
}
