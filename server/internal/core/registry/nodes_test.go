package registry

import "testing"

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
