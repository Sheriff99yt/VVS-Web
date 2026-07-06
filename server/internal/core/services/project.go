package services

import (
	"context"
	"errors"
	"time"

	"vvs-server/internal/core/domain"
	"vvs-server/internal/core/store"
)

var ErrProjectNotFound = errors.New("project not found")

// LoadProject returns a stored snapshot by project id for the request user.
func LoadProject(ctx context.Context, st store.ProjectStore, id string) (*domain.ProjectSnapshot, error) {
	snap, err := st.Get(ctx, userIDFrom(ctx), id)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return nil, ErrProjectNotFound
		}
		return nil, err
	}
	domain.NormalizeSnapshot(&snap)
	return &snap, nil
}

// SaveProject persists a snapshot under the given project id for the request user.
func SaveProject(ctx context.Context, st store.ProjectStore, id string, snap domain.ProjectSnapshot) error {
	domain.NormalizeSnapshot(&snap)
	if snap.Version == 0 {
		snap.Version = 3
	}
	if snap.SavedAt == "" {
		snap.SavedAt = time.Now().UTC().Format(time.RFC3339)
	}
	if snap.Documents == nil {
		snap.Documents = map[string]domain.GraphDocument{}
	}
	if _, ok := snap.Documents["main"]; !ok {
		snap.Documents["main"] = domain.GraphDocument{Nodes: []domain.Node{}, Edges: []domain.Edge{}}
	}
	return st.Save(ctx, userIDFrom(ctx), id, snap)
}

// ListProjects returns summaries for all projects owned by the request user.
func ListProjects(ctx context.Context, st store.ProjectStore) ([]domain.ProjectSummary, error) {
	return st.List(ctx, userIDFrom(ctx))
}
