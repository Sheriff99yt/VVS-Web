package store

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"vvs-server/migrations"
)

// RunMigrations applies embedded SQL migrations.
func RunMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	if _, err := pool.Exec(ctx, migrations.Projects001); err != nil {
		return fmt.Errorf("migration 001_projects: %w", err)
	}
	return nil
}
