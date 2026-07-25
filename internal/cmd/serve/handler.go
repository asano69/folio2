package serve

import (
	"fmt"
	"net/http"

	"github.com/asano69/folio2/internal/config"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"
)

// importFoldersHandler starts a background import-folders job and returns
// its record id immediately, without waiting for the import to finish.
func importFoldersHandler(app *pocketbase.PocketBase, cfg *config.Config) func(re *core.RequestEvent) error {
	return func(re *core.RequestEvent) error {
		if existing, err := app.FindFirstRecordByFilter("jobs", "status = 'queued' || status = 'running'"); err == nil && existing != nil {
			return apis.NewBadRequestError("an import job is already running", nil)
		}

		collection, err := app.FindCollectionByNameOrId("jobs")
		if err != nil {
			return fmt.Errorf("find jobs collection: %w", err)
		}

		job := core.NewRecord(collection)
		job.Set("type", "import_folders")
		job.Set("status", "queued")
		job.Set("started", types.NowDateTime())

		if err := app.Save(job); err != nil {
			return fmt.Errorf("save job record: %w", err)
		}

		jobID := job.Id
		go runImportJob(app, cfg, jobID)

		return re.JSON(http.StatusAccepted, map[string]string{"id": jobID})
	}
}
