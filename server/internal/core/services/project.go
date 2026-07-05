package services

import (
	"errors"
	"time"

	"vvs-server/internal/core/domain"
	"vvs-server/internal/core/store"
)

var ErrProjectNotFound = errors.New("project not found")

// LoadProject returns a stored snapshot by project id.
func LoadProject(st *store.MemoryStore, id string) (*domain.ProjectSnapshot, error) {
	snap, ok := st.Get(id)
	if !ok {
		return nil, ErrProjectNotFound
	}
	return &snap, nil
}

// SaveProject persists a snapshot under the given project id.
func SaveProject(st *store.MemoryStore, id string, snap domain.ProjectSnapshot) error {
	if snap.Version == 0 {
		snap.Version = 2
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
	st.Save(id, snap)
	return nil
}

// ListProjects returns summaries for all stored projects.
func ListProjects(st *store.MemoryStore) []domain.ProjectSummary {
	ids := st.List()
	out := make([]domain.ProjectSummary, 0, len(ids))
	for _, id := range ids {
		snap, ok := st.Get(id)
		if !ok {
			continue
		}
		out = append(out, domain.ProjectSummary{
			ID:         id,
			ModuleName: snap.ProjectDetails.ModuleName,
			SavedAt:    snap.SavedAt,
		})
	}
	return out
}
