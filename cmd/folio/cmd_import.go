package main

import (
	"fmt"

	"github.com/pocketbase/pocketbase"
	"github.com/spf13/cobra"

	"github.com/asano69/folio/internal/importer"
)

// importCmd defines the "folio import <path>..." cobra command. Unlike
// "serve", which scans FOLIO_IMPORT_DIR for book folders, this command
// imports the given paths directly and never moves the source files
// afterward.
func importCmd(app *pocketbase.PocketBase) *cobra.Command {
	return &cobra.Command{
		Use:   "import <path>...",
		Short: "Import book folders from the given paths",
		Args:  cobra.MinimumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			result, err := importer.ImportPaths(app, args, func(p importer.Progress) {
				fmt.Printf("[%d/%d] %s\n", p.Processed, p.Total, p.Message)
			})
			if err != nil {
				return fmt.Errorf("import: %w", err)
			}
			fmt.Printf(
				"manifests created: %d, manifests skipped: %d, images created: %d, images reused: %d\n",
				result.ManifestsCreated, result.ManifestsSkipped, result.ImagesCreated, result.ImagesReused,
			)
			return nil
		},
	}
}
