package httptransport

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"vvs-server/internal/core/domain"
	"vvs-server/internal/core/services"
	"vvs-server/internal/core/store"
)

type ProjectsHandler struct {
	Store *store.MemoryStore
}

func NewProjectsHandler(st *store.MemoryStore) *ProjectsHandler {
	return &ProjectsHandler{Store: st}
}

func (h *ProjectsHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/projects")
	path = strings.Trim(path, "/")

	if path == "" {
		switch r.Method {
		case http.MethodGet:
			h.handleList(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
		return
	}

	switch r.Method {
	case http.MethodGet:
		h.handleGet(w, r, path)
	case http.MethodPut:
		h.handlePut(w, r, path)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *ProjectsHandler) handleList(w http.ResponseWriter, _ *http.Request) {
	summaries := services.ListProjects(h.Store)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"projects": summaries,
	})
}

func (h *ProjectsHandler) handleGet(w http.ResponseWriter, _ *http.Request, id string) {
	snap, err := services.LoadProject(h.Store, id)
	if err != nil {
		if errors.Is(err, services.ErrProjectNotFound) {
			http.Error(w, "project not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(snap)
}

func (h *ProjectsHandler) handlePut(w http.ResponseWriter, r *http.Request, id string) {
	var snap domain.ProjectSnapshot
	if err := json.NewDecoder(r.Body).Decode(&snap); err != nil {
		http.Error(w, "invalid JSON body", http.StatusBadRequest)
		return
	}
	if err := services.SaveProject(h.Store, id, snap); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"ok": true})
}
