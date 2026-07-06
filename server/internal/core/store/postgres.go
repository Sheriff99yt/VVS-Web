package store

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"vvs-server/internal/core/domain"
)

// PostgresStore persists projects in PostgreSQL (self-hosted Supabase DB).
type PostgresStore struct {
	pool *pgxpool.Pool
}

func NewPostgresStore(ctx context.Context, databaseURL string) (*PostgresStore, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("pgxpool: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("postgres ping: %w", err)
	}
	if err := RunMigrations(ctx, pool); err != nil {
		pool.Close()
		return nil, err
	}
	return &PostgresStore{pool: pool}, nil
}

func (s *PostgresStore) Mode() Mode {
	return ModePostgres
}

func (s *PostgresStore) Close() {
	s.pool.Close()
}

func (s *PostgresStore) Get(ctx context.Context, userID, projectID string) (domain.ProjectSnapshot, error) {
	var raw []byte
	err := s.pool.QueryRow(ctx, `
		SELECT snapshot FROM projects
		WHERE id = $1 AND user_id = $2::uuid
	`, projectID, userID).Scan(&raw)
	if err != nil {
		if err == pgx.ErrNoRows {
			return domain.ProjectSnapshot{}, ErrNotFound
		}
		return domain.ProjectSnapshot{}, err
	}
	var snap domain.ProjectSnapshot
	if err := json.Unmarshal(raw, &snap); err != nil {
		return domain.ProjectSnapshot{}, fmt.Errorf("decode snapshot: %w", err)
	}
	return snap, nil
}

func (s *PostgresStore) Save(ctx context.Context, userID, projectID string, snap domain.ProjectSnapshot) error {
	raw, err := json.Marshal(snap)
	if err != nil {
		return fmt.Errorf("encode snapshot: %w", err)
	}
	moduleName := snap.ProjectDetails.ModuleName
	if moduleName == "" {
		moduleName = "Untitled"
	}
	savedAt := snap.SavedAt
	if savedAt == "" {
		savedAt = time.Now().UTC().Format(time.RFC3339)
	}
	_, err = s.pool.Exec(ctx, `
		INSERT INTO projects (id, user_id, module_name, saved_at, snapshot, updated_at)
		VALUES ($1, $2::uuid, $3, $4::timestamptz, $5::jsonb, NOW())
		ON CONFLICT (id) DO UPDATE SET
			user_id = EXCLUDED.user_id,
			module_name = EXCLUDED.module_name,
			saved_at = EXCLUDED.saved_at,
			snapshot = EXCLUDED.snapshot,
			updated_at = NOW()
		WHERE projects.user_id = EXCLUDED.user_id
	`, projectID, userID, moduleName, savedAt, raw)
	return err
}

func (s *PostgresStore) Delete(ctx context.Context, userID, projectID string) error {
	tag, err := s.pool.Exec(ctx, `
		DELETE FROM projects WHERE id = $1 AND user_id = $2::uuid
	`, projectID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *PostgresStore) List(ctx context.Context, userID string) ([]domain.ProjectSummary, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, module_name, saved_at
		FROM projects
		WHERE user_id = $1::uuid
		ORDER BY updated_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]domain.ProjectSummary, 0)
	for rows.Next() {
		var summary domain.ProjectSummary
		var savedAt time.Time
		if err := rows.Scan(&summary.ID, &summary.ModuleName, &savedAt); err != nil {
			return nil, err
		}
		summary.SavedAt = savedAt.UTC().Format(time.RFC3339)
		out = append(out, summary)
	}
	return out, rows.Err()
}
