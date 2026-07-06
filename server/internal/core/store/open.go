package store

import (
	"context"
	"os"
	"strings"
)

// Backend exposes store mode and optional cleanup for Postgres.
type Backend struct {
	Store ProjectStore
	Mode  Mode
	close func()
}

// OpenFromEnv selects MemoryStore or PostgresStore based on DATABASE_URL.
func OpenFromEnv(ctx context.Context) (*Backend, error) {
	url := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if url == "" {
		return &Backend{
			Store: NewMemoryStore(),
			Mode:  ModeMemory,
		}, nil
	}
	pg, err := NewPostgresStore(ctx, url)
	if err != nil {
		return nil, err
	}
	return &Backend{
		Store: pg,
		Mode:  ModePostgres,
		close: pg.Close,
	}, nil
}

func (b *Backend) Close() {
	if b != nil && b.close != nil {
		b.close()
	}
}
