// Package config loads the configuration for folio2 serve from
// environment variables.
package config

import (
	"fmt"
	"os"
	"strconv"
)

// ServerConfig holds HTTP server settings.
type ServerConfig struct {
	Host string
	Port int
}

// DataConfig holds data storage settings.
type DataConfig struct {
	// ImportDir is the folder scanned by the importer for book folders
	// to register as manifests (see internal/importer).
	ImportDir string
}

type Config struct {
	Server ServerConfig
	Data   DataConfig
}

// Load reads configuration from environment variables, applying defaults
// for any variable that is unset.
//
// Recognised variables:
//
//	FOLIO_SERVER_HOST         default "0.0.0.0"
//	FOLIO_SERVER_PORT         default 3000
//	FOLIO_IMPORT_DIR    default ""

func Load() (*Config, error) {
	cfg := &Config{
		Server: ServerConfig{
			Host: envString("FOLIO_SERVER_HOST", "0.0.0.0"),
			Port: 3000,
		},
		Data: DataConfig{
			ImportDir: envString("FOLIO_IMPORT_DIR", ""),
		},
	}

	port, err := envInt("FOLIO_SERVER_PORT", cfg.Server.Port)
	if err != nil {
		return nil, err
	}
	cfg.Server.Port = port

	return cfg, nil
}

// envString returns the value of the environment variable key, or fallback
// if it is unset or empty.
func envString(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

// envInt returns the integer value of the environment variable key, or
// fallback if it is unset.
func envInt(key string, fallback int) (int, error) {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		return fallback, nil
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return 0, fmt.Errorf("invalid %s: %w", key, err)
	}
	return n, nil
}
