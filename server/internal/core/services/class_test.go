package services_test

import (
	"testing"

	"vvs-server/internal/core/auth"
	"vvs-server/internal/core/domain"
	"vvs-server/internal/core/services"
	"vvs-server/internal/core/store"
)

func TestAddClassAndListClasses(t *testing.T) {
	st := store.NewMemoryStore()
	ctx := testCtx()
	snap := sampleSnapshot()
	if err := services.SaveProject(ctx, st, "multi", snap); err != nil {
		t.Fatalf("SaveProject: %v", err)
	}

	cls, err := services.AddClass(ctx, st, "multi", "Helper")
	if err != nil {
		t.Fatalf("AddClass: %v", err)
	}
	if cls.Name != "Helper" || cls.Kind != "class" {
		t.Fatalf("unexpected class: %+v", cls)
	}

	classes, activeID, err := services.ListClasses(ctx, st, "multi")
	if err != nil {
		t.Fatalf("ListClasses: %v", err)
	}
	if len(classes) != 2 {
		t.Fatalf("expected 2 classes, got %d", len(classes))
	}
	if activeID != cls.ID {
		t.Fatalf("expected active class %s, got %s", cls.ID, activeID)
	}
}

func TestSetActiveClass(t *testing.T) {
	st := store.NewMemoryStore()
	ctx := testCtx()
	snap := sampleSnapshot()
	if err := services.SaveProject(ctx, st, "proj", snap); err != nil {
		t.Fatalf("SaveProject: %v", err)
	}

	cls, err := services.AddClass(ctx, st, "proj", "Worker")
	if err != nil {
		t.Fatalf("AddClass: %v", err)
	}

	if err := services.SetActiveClass(ctx, st, "proj", domain.MainClassID); err != nil {
		t.Fatalf("SetActiveClass main: %v", err)
	}
	loaded, err := services.LoadProject(ctx, st, "proj")
	if err != nil {
		t.Fatalf("LoadProject: %v", err)
	}
	if loaded.ActiveClassId != domain.MainClassID {
		t.Fatalf("expected main-class active, got %s", loaded.ActiveClassId)
	}

	if err := services.SetActiveClass(ctx, st, "proj", cls.ID); err != nil {
		t.Fatalf("SetActiveClass worker: %v", err)
	}
	loaded, err = services.LoadProject(ctx, st, "proj")
	if err != nil {
		t.Fatalf("LoadProject: %v", err)
	}
	if loaded.ActiveClassId != cls.ID || loaded.ActiveGraphTab != cls.GraphTabID {
		t.Fatalf("expected worker active on tab %s, got class=%s tab=%s", cls.GraphTabID, loaded.ActiveClassId, loaded.ActiveGraphTab)
	}
}

func TestClassScopedGraphOperations(t *testing.T) {
	st := store.NewMemoryStore()
	ctx := testCtx()
	snap := sampleSnapshot()
	if err := services.SaveProject(ctx, st, "scoped", snap); err != nil {
		t.Fatalf("SaveProject: %v", err)
	}

	clsB, err := services.AddClass(ctx, st, "scoped", "ClassB")
	if err != nil {
		t.Fatalf("AddClass: %v", err)
	}

	node, err := services.AddNode(ctx, st, "scoped", "", clsB.ID, "action_print", 100, 50)
	if err != nil {
		t.Fatalf("AddNode on class B: %v", err)
	}

	docMain, tabMain, err := services.GetGraphDocument(ctx, st, "scoped", "", domain.MainClassID)
	if err != nil {
		t.Fatalf("GetGraphDocument main: %v", err)
	}
	if tabMain != "main" {
		t.Fatalf("expected main tab, got %s", tabMain)
	}
	if len(docMain.Nodes) != 0 {
		t.Fatalf("main graph should be empty, got %d nodes", len(docMain.Nodes))
	}

	docB, tabB, err := services.GetGraphDocument(ctx, st, "scoped", "", clsB.ID)
	if err != nil {
		t.Fatalf("GetGraphDocument class B: %v", err)
	}
	if tabB != clsB.GraphTabID {
		t.Fatalf("expected tab %s, got %s", clsB.GraphTabID, tabB)
	}
	if len(docB.Nodes) != 1 || docB.Nodes[0].ID != node.ID {
		t.Fatalf("expected one print node on class B graph, got %+v", docB.Nodes)
	}
}

func TestLoadProjectNormalizesV2(t *testing.T) {
	st := store.NewMemoryStore()
	ctx := testCtx()
	v2 := domain.ProjectSnapshot{
		Version: 2,
		SavedAt: "2026-01-01T00:00:00Z",
		ProjectDetails: domain.ProjectDetails{
			ModuleName: "Legacy",
		},
		OpenTabs:       []domain.GraphTab{{ID: "main", Type: "main", Name: "Main graph"}},
		ActiveGraphTab: "main",
		TargetLanguage: "python",
		Documents: map[string]domain.GraphDocument{
			"main": {Nodes: []domain.Node{}, Edges: []domain.Edge{}},
		},
	}
	if err := st.Save(ctx, auth.DevUserID, "legacy", v2); err != nil {
		t.Fatalf("store save: %v", err)
	}

	loaded, err := services.LoadProject(ctx, st, "legacy")
	if err != nil {
		t.Fatalf("LoadProject: %v", err)
	}
	if loaded.Version != 3 {
		t.Fatalf("expected v3 after load, got %d", loaded.Version)
	}
	if len(loaded.Classes) != 1 || loaded.Classes[0].ID != domain.MainClassID {
		t.Fatalf("expected synthetic main-class, got %+v", loaded.Classes)
	}
}
