package main

import (
	"fmt"

	"github.com/pocketbase/pocketbase"
	"github.com/spf13/cobra"

	"github.com/asano69/folio/internal/gc"
)

// gcCmd defines the "folio gc" cobra command: deletes pages and images
// that are no longer referenced from anywhere in the database (see
// internal/gc for what "no longer referenced" means).
func gcCmd(app *pocketbase.PocketBase) *cobra.Command {
	var dryRun bool

	cmd := &cobra.Command{
		Use:   "gc",
		Short: "Delete pages and images no longer referenced from anywhere",
		Args:  cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			plan, err := gc.Run(app, dryRun)
			if err != nil {
				return fmt.Errorf("gc: %w", err)
			}

			for _, p := range plan.OrphanPages {
				fmt.Printf("page  %s\n", p.ID)
			}
			for _, img := range plan.OrphanImages {
				fmt.Printf("image %s (hash=%s, size=%d bytes)\n", img.ID, img.Hash, img.Size)
			}

			if plan.Empty() {
				fmt.Println("nothing to clean up")
				return nil
			}

			if dryRun {
				fmt.Printf("\n[dry-run] would delete %d page(s), %d image(s)\n", len(plan.OrphanPages), len(plan.OrphanImages))
			} else {
				fmt.Printf("\ndeleted %d page(s), %d image(s)\n", len(plan.OrphanPages), len(plan.OrphanImages))
			}
			return nil
		},
	}

	cmd.Flags().BoolVar(&dryRun, "dry-run", false, "list orphaned pages/images without deleting them")
	return cmd
}
