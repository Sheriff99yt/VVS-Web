package registry

import (
	_ "embed"
	"encoding/json"
)

//go:embed syntaxpacks/catalog.json
var syntaxPacksCatalogJSON []byte

type SyntaxPackCatalogEntry struct {
	ID           string   `json:"id"`
	Version      string   `json:"version"`
	Family       string   `json:"family"`
	Capabilities []string `json:"capabilities"`
	Extends      *string  `json:"extends"`
	Description  string   `json:"description"`
}

// ListSyntaxPacks returns syntax pack catalog metadata (MCP list_syntax_packs pure function).
func ListSyntaxPacks() ([]SyntaxPackCatalogEntry, error) {
	var out []SyntaxPackCatalogEntry
	if err := json.Unmarshal(syntaxPacksCatalogJSON, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// SyntaxPacksRaw returns catalog JSON for GET /registry/syntax-packs.
func SyntaxPacksRaw() (json.RawMessage, error) {
	return json.RawMessage(syntaxPacksCatalogJSON), nil
}
