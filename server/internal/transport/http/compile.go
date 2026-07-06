package httptransport

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"vvs-server/internal/core/services"
	"vvs-server/internal/core/store"
)

type CompileHandler struct {
	Store  store.ProjectStore
	Runner services.TranspilerRunner
}

func NewCompileHandler(st store.ProjectStore, runner services.TranspilerRunner) *CompileHandler {
	return &CompileHandler{Store: st, Runner: runner}
}

func (h *CompileHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/projects/")
	path = strings.TrimSuffix(path, "/compile")
	id := strings.Trim(path, "/")
	if id == "" {
		http.Error(w, "project id required", http.StatusBadRequest)
		return
	}

	result, err := services.CompileProject(r.Context(), h.Store, id, h.Runner)
	if err != nil {
		if errors.Is(err, services.ErrProjectNotFound) {
			http.Error(w, "project not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}
