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
	ids := map[string]struct{}{}
	for _, n := range nodes {
		ids[n.KindID] = struct{}{}
	}
	if _, ok := ids["event_define"]; !ok {
		t.Fatal("expected event_define in spawn catalog")
	}
	for _, leftover := range []string{
		"event_on_start",
		"event_on_update",
		"event_emit",
		"event_subscribe",
		"flow_sequence",
		"action_await_wait",
		"graph_ref",
	} {
		if _, ok := ids[leftover]; ok {
			t.Fatalf("leftover kind %s must not be in spawn catalog", leftover)
		}
	}
}
