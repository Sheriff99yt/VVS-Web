package registry

import (
	_ "embed"
	"encoding/json"
)

//go:embed environments/env.python.console-app.json
var envPythonConsoleAppJSON []byte

//go:embed environments/env.javascript.browser-app.json
var envJavascriptBrowserAppJSON []byte

type EnvironmentCatalogEntry struct {
	ID              string          `json:"id"`
	Version         string          `json:"version"`
	DisplayName     string          `json:"displayName"`
	Description     string          `json:"description"`
	DefaultTarget   string          `json:"defaultTarget"`
	SupportedTargets []string       `json:"supportedTargets"`
	Manifest        json.RawMessage `json:"manifest"`
}

// ListEnvironments returns built-in environment manifests for tooling parity with @vvs/environment-templates.
func ListEnvironments() ([]EnvironmentCatalogEntry, error) {
	rawManifests := [][]byte{envPythonConsoleAppJSON, envJavascriptBrowserAppJSON}
	out := make([]EnvironmentCatalogEntry, 0, len(rawManifests))
	for _, raw := range rawManifests {
		var meta struct {
			ID              string   `json:"id"`
			Version         string   `json:"version"`
			DisplayName     string   `json:"displayName"`
			Description     string   `json:"description"`
			DefaultTarget   string   `json:"defaultTarget"`
			SupportedTargets []string `json:"supportedTargets"`
		}
		if err := json.Unmarshal(raw, &meta); err != nil {
			return nil, err
		}
		out = append(out, EnvironmentCatalogEntry{
			ID:              meta.ID,
			Version:         meta.Version,
			DisplayName:     meta.DisplayName,
			Description:     meta.Description,
			DefaultTarget:   meta.DefaultTarget,
			SupportedTargets: meta.SupportedTargets,
			Manifest:        json.RawMessage(raw),
		})
	}
	return out, nil
}

// EnvironmentsRaw returns the catalog JSON array for GET /registry/environments.
func EnvironmentsRaw() (json.RawMessage, error) {
	entries, err := ListEnvironments()
	if err != nil {
		return nil, err
	}
	return json.Marshal(entries)
}
