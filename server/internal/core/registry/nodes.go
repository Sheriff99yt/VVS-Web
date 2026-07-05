package registry

import (
	_ "embed"
	"encoding/json"
)

//go:embed core-pack.json
var corePackJSON []byte

type PinDefinition struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Type  string `json:"type"`
}

type NodeKindDefinition struct {
	KindID      string          `json:"kindId"`
	KindVersion int             `json:"kindVersion"`
	Category    string          `json:"category"`
	Title       string          `json:"title"`
	Semantics   string          `json:"semantics"`
	Inputs      []PinDefinition `json:"inputs"`
	Outputs     []PinDefinition `json:"outputs"`
	Dynamic     bool            `json:"dynamic,omitempty"`
}

type CorePack struct {
	Kinds []NodeKindDefinition `json:"kinds"`
}

type AvailableNode struct {
	KindID      string          `json:"kindId"`
	KindVersion int             `json:"kindVersion"`
	Category    string          `json:"category"`
	Title       string          `json:"title"`
	Semantics   string          `json:"semantics"`
	Inputs      []PinDefinition `json:"inputs"`
	Outputs     []PinDefinition `json:"outputs"`
}

// ListAvailableNodes returns static core-pack kinds (MCP ListAvailableNodes pure function).
func ListAvailableNodes() ([]AvailableNode, error) {
	var pack CorePack
	if err := json.Unmarshal(corePackJSON, &pack); err != nil {
		return nil, err
	}
	out := make([]AvailableNode, 0, len(pack.Kinds))
	for _, kind := range pack.Kinds {
		if kind.Dynamic {
			continue
		}
		out = append(out, AvailableNode{
			KindID:      kind.KindID,
			KindVersion: kind.KindVersion,
			Category:    kind.Category,
			Title:       kind.Title,
			Semantics:   kind.Semantics,
			Inputs:      kind.Inputs,
			Outputs:     kind.Outputs,
		})
	}
	return out, nil
}

// CorePackRaw returns the exported registry JSON for tooling parity with @vvs/syntax-registry.
func CorePackRaw() json.RawMessage {
	return json.RawMessage(corePackJSON)
}
