package services_test

import (
	"encoding/json"
	"testing"

	"vvs-server/internal/core/domain"
	"vvs-server/internal/core/services"
	"vvs-server/internal/core/store"
)

func sampleSnapshot() domain.ProjectSnapshot {
	return domain.ProjectSnapshot{
		Version: 2,
		SavedAt: "2026-01-01T00:00:00Z",
		ProjectDetails: domain.ProjectDetails{
			ModuleName: "TestModule",
		},
		OpenTabs:       []domain.GraphTab{{ID: "main", Type: "main", Name: "Main graph"}},
		ActiveGraphTab: "main",
		TargetLanguage: "python",
		Documents: map[string]domain.GraphDocument{
			"main": {Nodes: []domain.Node{}, Edges: []domain.Edge{}},
		},
	}
}

func TestSaveLoadListProject(t *testing.T) {
	st := store.NewMemoryStore()
	snap := sampleSnapshot()

	if err := services.SaveProject(st, "proj-1", snap); err != nil {
		t.Fatalf("SaveProject: %v", err)
	}

	loaded, err := services.LoadProject(st, "proj-1")
	if err != nil {
		t.Fatalf("LoadProject: %v", err)
	}
	if loaded.ProjectDetails.ModuleName != "TestModule" {
		t.Fatalf("expected TestModule, got %s", loaded.ProjectDetails.ModuleName)
	}

	list := services.ListProjects(st)
	if len(list) != 1 || list[0].ID != "proj-1" {
		t.Fatalf("unexpected list: %+v", list)
	}

	if _, err := services.LoadProject(st, "missing"); err == nil {
		t.Fatal("expected not found error")
	}
}

func TestGraphEditAddConnectRemove(t *testing.T) {
	st := store.NewMemoryStore()
	snap := sampleSnapshot()
	if err := services.SaveProject(st, "default", snap); err != nil {
		t.Fatalf("SaveProject: %v", err)
	}

	start, err := services.AddNode(st, "default", "main", "event_on_start", 10, 20)
	if err != nil {
		t.Fatalf("AddNode start: %v", err)
	}
	printNode, err := services.AddNode(st, "default", "main", "action_print", 200, 20)
	if err != nil {
		t.Fatalf("AddNode print: %v", err)
	}

	edge := domain.Edge{
		Source:       start.ID,
		Target:       printNode.ID,
		SourceHandle: "exec_out",
		TargetHandle: "exec_in",
	}
	created, err := services.ConnectPins(st, "default", "main", edge)
	if err != nil {
		t.Fatalf("ConnectPins: %v", err)
	}
	if created.Data.PinType != "execution" {
		t.Fatalf("expected execution pin type, got %s", created.Data.PinType)
	}

	doc, tabID, err := services.GetGraphDocument(st, "default", "")
	if err != nil {
		t.Fatalf("GetGraphDocument: %v", err)
	}
	if tabID != "main" {
		t.Fatalf("expected main tab, got %s", tabID)
	}
	if len(doc.Nodes) != 2 || len(doc.Edges) != 1 {
		t.Fatalf("unexpected graph state: %+v", doc)
	}

	if err := services.RemoveNode(st, "default", "main", printNode.ID); err != nil {
		t.Fatalf("RemoveNode: %v", err)
	}
	doc, _, err = services.GetGraphDocument(st, "default", "main")
	if err != nil {
		t.Fatalf("GetGraphDocument after remove: %v", err)
	}
	if len(doc.Nodes) != 1 || len(doc.Edges) != 0 {
		t.Fatalf("expected node and edges removed: %+v", doc)
	}
}

func TestValidateConnection(t *testing.T) {
	execOut := domain.PinDefinition{Type: "execution"}
	execIn := domain.PinDefinition{Type: "execution"}
	strOut := domain.PinDefinition{Type: "data_string"}
	strIn := domain.PinDefinition{Type: "data_string"}
	numIn := domain.PinDefinition{Type: "data_number"}

	if !services.ValidateConnection(execOut, execIn) {
		t.Fatal("execution pins should connect")
	}
	if services.ValidateConnection(execOut, strIn) {
		t.Fatal("execution to data should fail")
	}
	if !services.ValidateConnection(strOut, strIn) {
		t.Fatal("matching data types should connect")
	}
	if !services.ValidateConnection(strOut, domain.PinDefinition{Type: "data_any"}) {
		t.Fatal("data_any wildcard should connect")
	}
	if services.ValidateConnection(strOut, numIn) {
		t.Fatal("mismatched data types should fail")
	}
}

type fakeRunner struct {
	output []byte
}

func (f fakeRunner) Compile(_ []byte) ([]byte, error) {
	return f.output, nil
}

func TestCompileProject(t *testing.T) {
	st := store.NewMemoryStore()
	snap := sampleSnapshot()
	if err := services.SaveProject(st, "default", snap); err != nil {
		t.Fatalf("SaveProject: %v", err)
	}

	expected := domain.TranspileResult{
		Language: "python",
		Files:    []domain.GeneratedFile{{Path: "test.py", Content: "print('hi')"}},
		SourceMap: map[string][]domain.SourceRange{},
	}
	payload, _ := json.Marshal(expected)
	result, err := services.CompileProject(st, "default", fakeRunner{output: payload})
	if err != nil {
		t.Fatalf("CompileProject: %v", err)
	}
	if len(result.Files) != 1 || result.Files[0].Content != "print('hi')" {
		t.Fatalf("unexpected compile result: %+v", result)
	}
}
