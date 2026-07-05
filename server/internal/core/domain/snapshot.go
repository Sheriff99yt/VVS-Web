package domain

// InstalledLibraryEntry mirrors @vvs/graph-types InstalledLibraryEntry.
type InstalledLibraryEntry struct {
	AssetID            string `json:"assetId"`
	InstalledAt        string `json:"installedAt"`
	LinkedGraphID      string `json:"linkedGraphId,omitempty"`
	EnvironmentVersion string `json:"environmentVersion,omitempty"`
}

// ProjectIntegrationConfig mirrors persisted .vvs/integration.json fields used by codegen.
type ProjectIntegrationConfig struct {
	OutputRoot string `json:"outputRoot,omitempty"`
}

// ProjectSnapshot v2 aligns with @vvs/graph-types ProjectSnapshot.
type ProjectSnapshot struct {
	Version            int                        `json:"version"`
	ProjectID          string                     `json:"projectId,omitempty"`
	SavedAt            string                     `json:"savedAt"`
	ProjectDetails     ProjectDetails             `json:"projectDetails"`
	Variables          []GraphVariable            `json:"variables"`
	Events             []ProjectEventDefinition   `json:"events"`
	Functions          []FunctionSymbol           `json:"functions"`
	OpenTabs           []GraphTab                 `json:"openTabs"`
	ActiveGraphTab     string                     `json:"activeGraphTab"`
	TargetLanguage     string                     `json:"targetLanguage"`
	AutoCompile        bool                       `json:"autoCompile"`
	AutoSave           bool                       `json:"autoSave"`
	Documents          map[string]GraphDocument   `json:"documents"`
	InstalledLibrary   []InstalledLibraryEntry    `json:"installedLibrary"`
	EnvironmentID      string                     `json:"environmentId,omitempty"`
	EnvironmentVersion string                     `json:"environmentVersion,omitempty"`
	Integration        *ProjectIntegrationConfig  `json:"integration,omitempty"`
}

// TranspileResult mirrors @vvs/graph-types TranspileResult.
type TranspileResult struct {
	Language  string          `json:"language"`
	Files     []GeneratedFile `json:"files"`
	SourceMap map[string][]SourceRange `json:"sourceMap"`
	Fragments map[string]string `json:"fragments,omitempty"`
}

type GeneratedFile struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}

type SourceRange struct {
	FilePath  string `json:"filePath"`
	StartLine int    `json:"startLine"`
	StartCol  int    `json:"startCol"`
	EndLine   int    `json:"endLine"`
	EndCol    int    `json:"endCol"`
}

// ProjectSummary is returned by GET /api/projects.
type ProjectSummary struct {
	ID         string `json:"id"`
	ModuleName string `json:"moduleName"`
	SavedAt    string `json:"savedAt"`
}

type ProjectDetails struct {
	ModuleName  string `json:"moduleName"`
	ExtendsType string `json:"extendsType"`
	Description string `json:"description"`
}

type GraphTab struct {
	ID   string `json:"id"`
	Type string `json:"type"`
	Name string `json:"name"`
}

type GraphDocument struct {
	Nodes    []Node           `json:"nodes"`
	Edges    []Edge           `json:"edges"`
	Metadata *GraphTabMetadata `json:"metadata,omitempty"`
}

type GraphTabMetadata struct {
	ModuleName  string `json:"moduleName"`
	ExtendsType string `json:"extendsType"`
	Description string `json:"description"`
}

type GraphVariable struct {
	ID           string      `json:"id"`
	Name         string      `json:"name"`
	Type         string      `json:"type"`
	DefaultValue interface{} `json:"defaultValue,omitempty"`
	Binding      string      `json:"binding,omitempty"`
	Readonly     bool        `json:"readonly,omitempty"`
}

type ProjectEventDefinition struct {
	ID         string            `json:"id"`
	Name       string            `json:"name"`
	Parameters []SymbolParameter `json:"parameters"`
}
