package registry

import "testing"

func TestListEnvironments(t *testing.T) {
	entries, err := ListEnvironments()
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) < 2 {
		t.Fatalf("expected at least 2 environments, got %d", len(entries))
	}
	foundPython := false
	for _, e := range entries {
		if e.ID == "env.python.console-app" {
			foundPython = true
			if e.DisplayName == "" {
				t.Fatal("expected display name")
			}
			if len(e.Manifest) == 0 {
				t.Fatal("expected embedded manifest")
			}
		}
	}
	if !foundPython {
		t.Fatal("expected env.python.console-app in catalog")
	}
}
