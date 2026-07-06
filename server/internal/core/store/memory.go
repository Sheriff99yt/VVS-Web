package store

import (
	"context"
	"sync"

	"vvs-server/internal/core/domain"
)

type memoryEntry struct {
	userID string
	snap   domain.ProjectSnapshot
}

// MemoryStore is an in-memory ProjectStore for local dev without Postgres.
type MemoryStore struct {
	mu       sync.RWMutex
	projects map[string]memoryEntry
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		projects: make(map[string]memoryEntry),
	}
}

func (s *MemoryStore) Mode() Mode {
	return ModeMemory
}

func (s *MemoryStore) Get(_ context.Context, userID, id string) (domain.ProjectSnapshot, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	entry, ok := s.projects[id]
	if !ok || entry.userID != userID {
		return domain.ProjectSnapshot{}, ErrNotFound
	}
	return entry.snap, nil
}

func (s *MemoryStore) Save(_ context.Context, userID, id string, snap domain.ProjectSnapshot) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.projects[id] = memoryEntry{userID: userID, snap: snap}
	return nil
}

func (s *MemoryStore) Delete(_ context.Context, userID, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	entry, ok := s.projects[id]
	if !ok || entry.userID != userID {
		return ErrNotFound
	}
	delete(s.projects, id)
	return nil
}

func (s *MemoryStore) List(_ context.Context, userID string) ([]domain.ProjectSummary, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]domain.ProjectSummary, 0)
	for id, entry := range s.projects {
		if entry.userID != userID {
			continue
		}
		out = append(out, domain.ProjectSummary{
			ID:         id,
			ModuleName: entry.snap.ProjectDetails.ModuleName,
			SavedAt:    entry.snap.SavedAt,
		})
	}
	return out, nil
}
