package registry

import "testing"

func TestLookupKind(t *testing.T) {
	kind, err := LookupKind("event_on_start")
	if err != nil {
		t.Fatalf("LookupKind: %v", err)
	}
	if kind.KindID != "event_on_start" || len(kind.Outputs) != 1 {
		t.Fatalf("unexpected kind: %+v", kind)
	}
	if _, err := LookupKind("missing_kind"); err == nil {
		t.Fatal("expected error for missing kind")
	}
}

func TestListAvailableNodes(t *testing.T) {
	nodes, err := ListAvailableNodes()
	if err != nil {
		t.Fatalf("ListAvailableNodes: %v", err)
	}
	if len(nodes) == 0 {
		t.Fatal("expected core pack kinds")
	}
	found := false
	for _, n := range nodes {
		if n.KindID == "event_on_start" {
			found = true
			break
		}
	}
	if !found {
		t.Fatal("expected event_on_start in registry")
	}
}
