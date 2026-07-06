package domain_test

import (
	"encoding/json"
	"testing"

	"vvs-server/internal/core/domain"
)

func TestNormalizeSnapshotUpgradesV2(t *testing.T) {
	raw := `{
		"version": 2,
		"savedAt": "2026-01-01T00:00:00Z",
		"projectDetails": { "moduleName": "Calculator", "extendsType": "Base", "description": "demo" },
		"variables": [{ "kind": "variable", "id": "v1", "name": "A", "type": "data_number", "binding": "instance", "visibility": "public" }],
		"events": [{ "id": "e1", "name": "calculate", "parameters": [] }],
		"functions": [{ "kind": "function", "id": "f1", "name": "Add", "binding": "instance", "visibility": "public", "overloads": [{ "id": "o1", "parameters": [], "returnType": "void", "graphTabId": "f1" }] }],
		"openTabs": [{ "id": "main", "type": "main", "name": "Main graph" }],
		"activeGraphTab": "main",
		"targetLanguage": "python",
		"autoCompile": true,
		"autoSave": false,
		"documents": { "main": { "nodes": [], "edges": [] } },
		"installedLibrary": []
	}`

	var snap domain.ProjectSnapshot
	if err := json.Unmarshal([]byte(raw), &snap); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	domain.NormalizeSnapshot(&snap)

	if snap.Version != 3 {
		t.Fatalf("expected version 3, got %d", snap.Version)
	}
	if len(snap.Classes) != 1 {
		t.Fatalf("expected 1 class, got %d", len(snap.Classes))
	}
	cls := snap.Classes[0]
	if cls.ID != domain.MainClassID || cls.Name != "Calculator" || cls.GraphTabID != "main" {
		t.Fatalf("unexpected main class: %+v", cls)
	}
	if snap.ActiveClassId != domain.MainClassID {
		t.Fatalf("expected activeClassId %s, got %s", domain.MainClassID, snap.ActiveClassId)
	}
	if snap.Variables[0].ClassID != domain.MainClassID {
		t.Fatalf("expected variable classId stamped")
	}
	if snap.Functions[0].ClassID != domain.MainClassID {
		t.Fatalf("expected function classId stamped")
	}
	if snap.Events[0].ClassID != domain.MainClassID {
		t.Fatalf("expected event classId stamped")
	}
}

func TestNormalizeSnapshotPreservesV3Classes(t *testing.T) {
	snap := domain.ProjectSnapshot{
		Version: 3,
		ProjectDetails: domain.ProjectDetails{ModuleName: "App"},
		Classes: []domain.ClassSymbol{
			{Kind: "class", ID: "cls-a", Name: "Alpha", GraphTabID: "cls-a"},
			{Kind: "class", ID: "cls-b", Name: "Beta", GraphTabID: "cls-b"},
		},
		ActiveClassId:  "cls-b",
		ActiveGraphTab: "cls-b",
		OpenTabs: []domain.GraphTab{
			{ID: "main", Type: "main", Name: "Main"},
			{ID: "cls-a", Type: "class", Name: "Alpha"},
			{ID: "cls-b", Type: "class", Name: "Beta"},
		},
		Documents: map[string]domain.GraphDocument{
			"main":  {Nodes: []domain.Node{}, Edges: []domain.Edge{}},
			"cls-a": {Nodes: []domain.Node{}, Edges: []domain.Edge{}},
			"cls-b": {Nodes: []domain.Node{}, Edges: []domain.Edge{}},
		},
	}

	domain.NormalizeSnapshot(&snap)

	if len(snap.Classes) != 2 {
		t.Fatalf("expected 2 classes, got %d", len(snap.Classes))
	}
	if snap.ActiveClassId != "cls-b" {
		t.Fatalf("expected active cls-b, got %s", snap.ActiveClassId)
	}
}
