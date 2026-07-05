package domain

// ProjectSnapshot v2 aligns with @vvs/graph-types ProjectSnapshot.
type ProjectSnapshot struct {
	Version         int                        `json:"version"`
	SavedAt         string                     `json:"savedAt"`
	ProjectDetails  ProjectDetails             `json:"projectDetails"`
	Variables       []GraphVariable            `json:"variables"`
	Events          []ProjectEventDefinition   `json:"events"`
	Functions       []FunctionSymbol           `json:"functions"`
	OpenTabs        []GraphTab                 `json:"openTabs"`
	ActiveGraphTab  string                     `json:"activeGraphTab"`
	TargetLanguage  string                     `json:"targetLanguage"`
	AutoCompile     bool                       `json:"autoCompile"`
	AutoSave        bool                       `json:"autoSave"`
	Documents       map[string]GraphDocument   `json:"documents"`
	InstalledLibrary []string                  `json:"installedLibrary"`
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
