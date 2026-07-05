package store

import (
	"sync"

	"vvs-server/internal/core/domain"
)

// MemoryStore is an in-memory ProjectSnapshot store for Phase 1 HTTP/MCP APIs.
type MemoryStore struct {
	mu       sync.RWMutex
	projects map[string]domain.ProjectSnapshot
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		projects: make(map[string]domain.ProjectSnapshot),
	}
}

func (s *MemoryStore) Get(id string) (domain.ProjectSnapshot, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	snap, ok := s.projects[id]
	return snap, ok
}

func (s *MemoryStore) Save(id string, snap domain.ProjectSnapshot) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.projects[id] = snap
}

func (s *MemoryStore) Delete(id string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.projects, id)
}

func (s *MemoryStore) List() []string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	ids := make([]string, 0, len(s.projects))
	for id := range s.projects {
		ids = append(ids, id)
	}
	return ids
}
