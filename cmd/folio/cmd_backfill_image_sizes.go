package main

import (
	"fmt"

	"github.com/pocketbase/pocketbase"
	"github.com/spf13/cobra"
)

// backfillImageSizesCmd is a one-off command to populate the "size" field
// for images records created before that field existed.
// Run it once against production data, then delete this file and its
// registration in main.go -- it is not meant to stay in the codebase.
func backfillImageSizesCmd(app *pocketbase.PocketBase) *cobra.Command {
	return &cobra.Command{
		Use:   "backfill-image-sizes",
		Short: "One-off: fill in images.size for existing records",
		Args:  cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			records, err := app.FindAllRecords("images")
			if err != nil {
				return fmt.Errorf("list images: %w", err)
			}

			fs, err := app.NewFilesystem()
			if err != nil {
				return fmt.Errorf("open filesystem: %w", err)
			}
			defer fs.Close()

			updated := 0
			for _, record := range records {
				filename := record.GetString("image")
				if filename == "" {
					continue
				}
				key := record.BaseFilesPath() + "/" + filename

				attrs, err := fs.Attributes(key)
				if err != nil {
					fmt.Printf("skip %s: %v\n", record.Id, err)
					continue
				}

				record.Set("size", attrs.Size)
				if err := app.Save(record); err != nil {
					return fmt.Errorf("save %s: %w", record.Id, err)
				}
				updated++
			}

			fmt.Printf("updated %d images records\n", updated)
			return nil
		},
	}
}
