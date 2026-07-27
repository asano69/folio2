## CLI Reference

### Synopsis
```
folio <subcommand> [arguments]
```

Configuration is read exclusively from environment variables


### Subcommands

#### `folio server`

Start the HTTP server.

Reads `FOLIO_SERVER_HOST` and `FOLIO_SERVER_PORT` for the bind address.