package registry

import "testing"

func TestListSyntaxPacks(t *testing.T) {
	packs, err := ListSyntaxPacks()
	if err != nil {
		t.Fatalf("ListSyntaxPacks: %v", err)
	}
	if len(packs) < 4 {
		t.Fatalf("expected at least 4 base packs, got %d", len(packs))
	}
	foundPython := false
	for _, p := range packs {
		if p.ID == "python.base" && p.Family == "python" {
			foundPython = true
		}
	}
	if !foundPython {
		t.Fatal("expected python.base in syntax pack catalog")
	}
}
