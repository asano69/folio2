// main.go
package main

import (
	"os"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	pbcmd "github.com/pocketbase/pocketbase/cmd"

	_ "github.com/asano69/folio/migrations"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
)

// dbConnect mirrors PocketBase's core.DefaultDBConnect, but raises
// busy_timeout well above the 10s default. "folio serve" and "folio
// import" can run as separate OS processes against the same SQLite
// files (see docs/d01_book-import.md); each process only serializes
// writes within itself, so across processes, lock contention is
// resolved purely by SQLite's own busy_timeout retry. With the 10s
// default, one process could get a "database is locked" error and exit
// (e.g. the CLI import command) whenever the other process held the
// write lock for longer than that.
func dbConnect(dbPath string) (*dbx.DB, error) {
	pragmas := "?_pragma=busy_timeout(60000)&_pragma=journal_mode(WAL)&_pragma=journal_size_limit(200000000)&_pragma=synchronous(NORMAL)&_pragma=foreign_keys(ON)&_pragma=temp_store(MEMORY)&_pragma=cache_size(-32000)"
	return dbx.Open("sqlite", "file:"+dbPath+pragmas)
}

func main() {
	app := pocketbase.NewWithConfig(pocketbase.Config{
		HideStartBanner: true,
		DBConnect:       dbConnect,
	})

	// Registers "folio migrate up/down/create/collections/history-sync"
	// for manual or CI-driven schema management. Automigrate is off because
	// the schema is defined purely in Go migration files (internal/migrations),
	// not edited through the PocketBase dashboard.
	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		Automigrate: false,
	})

	root := app.RootCmd
	root.Use = "folio"
	root.Short = "folio"
	root.SilenceUsage = true
	root.Version = "0.0.1"

	root.AddCommand(
		serveCmd(app),
		importCmd(app),
		pbcmd.NewSuperuserCommand(app),
	)

	if err := app.Execute(); err != nil {
		os.Exit(1)
	}
}
