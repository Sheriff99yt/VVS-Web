package httptransport_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"vvs-server/internal/core/auth"
	"vvs-server/internal/core/domain"
	"vvs-server/internal/core/services"
	"vvs-server/internal/core/store"
	httptransport "vvs-server/internal/transport/http"
)

func withDevUser(req *http.Request) *http.Request {
	return req.WithContext(auth.WithUserID(req.Context(), auth.DevUserID))
}

func TestProjectsHandlerCRUD(t *testing.T) {
	st := store.NewMemoryStore()
	handler := httptransport.NewProjectsHandler(st)

	snap := domain.ProjectSnapshot{
		Version: 2,
		SavedAt: "2026-01-01T00:00:00Z",
		ProjectDetails: domain.ProjectDetails{ModuleName: "HTTPTest"},
		OpenTabs:       []domain.GraphTab{{ID: "main", Type: "main", Name: "Main"}},
		ActiveGraphTab: "main",
		TargetLanguage: "python",
		Documents: map[string]domain.GraphDocument{
			"main": {Nodes: []domain.Node{}, Edges: []domain.Edge{}},
		},
	}
	body, _ := json.Marshal(snap)

	putReq := withDevUser(httptest.NewRequest(http.MethodPut, "/api/projects/demo", bytes.NewReader(body)))
	putReq.Header.Set("Content-Type", "application/json")
	putRec := httptest.NewRecorder()
	handler.ServeHTTP(putRec, putReq)
	if putRec.Code != http.StatusOK {
		t.Fatalf("PUT status %d: %s", putRec.Code, putRec.Body.String())
	}

	getReq := withDevUser(httptest.NewRequest(http.MethodGet, "/api/projects/demo", nil))
	getRec := httptest.NewRecorder()
	handler.ServeHTTP(getRec, getReq)
	if getRec.Code != http.StatusOK {
		t.Fatalf("GET status %d", getRec.Code)
	}
	var loaded domain.ProjectSnapshot
	if err := json.Unmarshal(getRec.Body.Bytes(), &loaded); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if loaded.ProjectDetails.ModuleName != "HTTPTest" {
		t.Fatalf("expected HTTPTest, got %s", loaded.ProjectDetails.ModuleName)
	}

	listReq := withDevUser(httptest.NewRequest(http.MethodGet, "/api/projects", nil))
	listRec := httptest.NewRecorder()
	handler.ServeHTTP(listRec, listReq)
	if listRec.Code != http.StatusOK {
		t.Fatalf("LIST status %d", listRec.Code)
	}
}

type stubRunner struct{}

func (stubRunner) Compile(snapshotJSON []byte) ([]byte, error) {
	return json.Marshal(domain.TranspileResult{
		Language:  "python",
		Files:     []domain.GeneratedFile{{Path: "out.py", Content: "# ok"}},
		SourceMap: map[string][]domain.SourceRange{},
	})
}

func TestCompileHandler(t *testing.T) {
	st := store.NewMemoryStore()
	ctx := auth.WithUserID(context.Background(), auth.DevUserID)
	_ = services.SaveProject(ctx, st, "demo", domain.ProjectSnapshot{
		Version:        2,
		ActiveGraphTab: "main",
		TargetLanguage: "python",
		Documents:      map[string]domain.GraphDocument{"main": {}},
	})

	handler := httptransport.NewCompileHandler(st, stubRunner{})
	req := withDevUser(httptest.NewRequest(http.MethodPost, "/api/projects/demo/compile", nil))
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("compile status %d: %s", rec.Code, rec.Body.String())
	}
}
