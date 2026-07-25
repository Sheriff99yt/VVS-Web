package router

import (
	"net/http"

	"vvs-server/internal/handler"
	"vvs-server/internal/service"
)

type LibraryRoutes struct {
	handler *handler.LibraryHandler
}

func NewLibraryRoutes(libraryService *service.LibraryService) *LibraryRoutes {
	return &LibraryRoutes{
		handler: handler.NewLibraryHandler(libraryService),
	}
}

// RegisterRoutes registers all library-related routes
func (lr *LibraryRoutes) RegisterRoutes(mux *http.ServeMux) {
	// Public endpoints (no auth required)
	mux.HandleFunc("GET /library/search", lr.handler.SearchLibrary)
	mux.HandleFunc("GET /library/scripts/{id}", lr.handler.GetLibraryItem)
	mux.HandleFunc("GET /library/statistics", lr.handler.GetStatistics)

	// Protected endpoints (auth required)
	mux.HandleFunc("POST /library/scripts", lr.handler.UploadScript)
}
