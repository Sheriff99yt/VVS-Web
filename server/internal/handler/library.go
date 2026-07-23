package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"

	"vvs-server/internal/models"
	"vvs-server/internal/service"
)

type LibraryHandler struct {
	service *service.LibraryService
}

func NewLibraryHandler(svc *service.LibraryService) *LibraryHandler {
	return &LibraryHandler{service: svc}
}

// SearchLibrary handles GET /library/search
func (h *LibraryHandler) SearchLibrary(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	req := models.LibrarySearchRequest{
		Query:    r.URL.Query().Get("q"),
		Type:     r.URL.Query().Get("type"),
		SortBy:   r.URL.Query().Get("sortBy"),
		PageSize: 30,
	}

	// Parse pagination
	if p := r.URL.Query().Get("page"); p != "" {
		if page, err := strconv.Atoi(p); err == nil {
			req.Page = page
		}
	}
	if ps := r.URL.Query().Get("pageSize"); ps != "" {
		if pageSize, err := strconv.Atoi(ps); err == nil && pageSize > 0 && pageSize <= 100 {
			req.PageSize = pageSize
		}
	}

	// Parse array parameters
	if langStr := r.URL.Query().Get("languages"); langStr != "" {
		req.Languages = strings.Split(langStr, ",")
	}
	if tagStr := r.URL.Query().Get("tags"); tagStr != "" {
		req.Tags = strings.Split(tagStr, ",")
	}

	req.SemanticSearch = r.URL.Query().Get("semantic") == "true"

	response, err := h.service.SearchLibrary(r.Context(), req)
	if err != nil {
		log.Printf("Error searching library: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetLibraryItem handles GET /library/scripts/{id}
func (h *LibraryHandler) GetLibraryItem(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "missing id", http.StatusBadRequest)
		return
	}

	item, err := h.service.GetLibraryItem(r.Context(), id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, err.Error(), http.StatusNotFound)
		} else {
			log.Printf("Error fetching library item: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	// Increment download count asynchronously
	go h.service.IncrementDownloadCount(r.Context(), id)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(item)
}

// UploadScript handles POST /library/scripts (requires auth)
func (h *LibraryHandler) UploadScript(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract user from auth context (assumes middleware has set it)
	userID, ok := r.Context().Value("userID").(string)
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req models.UploadScriptRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Title == "" || req.Graph == nil {
		http.Error(w, "title and graph are required", http.StatusBadRequest)
		return
	}

	item, err := h.service.UploadScript(r.Context(), userID, req)
	if err != nil {
		log.Printf("Error uploading script: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(item)
}

// GetStatistics handles GET /library/statistics
func (h *LibraryHandler) GetStatistics(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	stats, err := h.service.GetStatistics(r.Context())
	if err != nil {
		log.Printf("Error fetching statistics: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}
