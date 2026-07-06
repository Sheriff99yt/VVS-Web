package store

import (
	"context"
	"errors"

	"vvs-server/internal/core/domain"
)

var ErrNotFound = errors.New("project not found")

// ProjectStore persists ProjectSnapshot v2 documents scoped by user.
type ProjectStore interface {
	Get(ctx context.Context, userID, projectID string) (domain.ProjectSnapshot, error)
	Save(ctx context.Context, userID, projectID string, snap domain.ProjectSnapshot) error
	Delete(ctx context.Context, userID, projectID string) error
	List(ctx context.Context, userID string) ([]domain.ProjectSummary, error)
}

// Mode describes the active persistence backend.
type Mode string

const (
	ModeMemory   Mode = "memory"
	ModePostgres Mode = "postgres"
)
