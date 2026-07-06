package domain

import "time"

// --- Graph Core ---

type Graph struct {
	ID        string    `json:"id"`
	OwnerID   string    `json:"ownerId"`
	Title     string    `json:"title"`
	Nodes     []Node    `json:"nodes"`
	Edges     []Edge    `json:"edges"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Node struct {
	ID       string                 `json:"id"`
	Type     string                 `json:"type"`
	Position Position               `json:"position"`
	Data     NodeData               `json:"data"`
}

type Position struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type NodeData struct {
	Label        string                 `json:"label"`
	Category     string                 `json:"category"`
	KindID       string                 `json:"kindId,omitempty"`
	KindVersion  int                    `json:"kindVersion,omitempty"`
	Properties   map[string]interface{} `json:"properties,omitempty"`
	GraphBinding *GraphBinding          `json:"graphBinding,omitempty"`
	Inputs       []PinDefinition        `json:"inputs"`
	Outputs      []PinDefinition        `json:"outputs"`
	InlineValues map[string]interface{} `json:"inlineValues"`
}

// GraphBinding links a node instance to a project symbol (function, macro, import).
// Aligns with @vvs/graph-types GraphBinding and ProjectSnapshot v2.
type GraphBinding struct {
	Kind       string `json:"kind"` // call_function | import_module (use_macro deprecated → call_function)
	SymbolID   string `json:"symbolId"`
	OverloadID string `json:"overloadId,omitempty"`
}

// FunctionSymbol is the server-side mirror of packages/graph-types FunctionSymbol.
type FunctionSymbol struct {
	Kind       string             `json:"kind"`
	ID         string             `json:"id"`
	Name       string             `json:"name"`
	Binding    string             `json:"binding"`
	Visibility string             `json:"visibility"`
	Overloads  []FunctionOverload `json:"overloads"`
	ClassID    string             `json:"classId,omitempty"`
}

type FunctionOverload struct {
	ID         string            `json:"id"`
	Parameters []SymbolParameter `json:"parameters"`
	ReturnType string            `json:"returnType"`
	GraphTabID string            `json:"graphTabId,omitempty"`
}

type SymbolParameter struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Type  string `json:"type"`
}

type PinDefinition struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Type  string `json:"type"` // "execution", "data_string", "data_number", etc.
}

type Edge struct {
	ID           string   `json:"id"`
	Source       string   `json:"source"`
	Target       string   `json:"target"`
	SourceHandle string   `json:"sourceHandle"`
	TargetHandle string   `json:"targetHandle"`
	Data         EdgeData `json:"data"`
}

type EdgeData struct {
	PinType string `json:"pinType"`
}

// --- Community Library & Meta ---

type LibraryScript struct {
	ID          string    `json:"id"`
	GraphID     string    `json:"graphId"`
	Author      string    `json:"author"`
	Description string    `json:"description"`
	Tags        []string  `json:"tags"`
	Downloads   int       `json:"downloads"`
	CreatedAt   time.Time `json:"createdAt"`
}

// --- WebSocket & Real-time Collaboration ---

type GraphOperation struct {
	OpType  string      `json:"opType"` // e.g., "ADD_NODE", "REMOVE_NODE", "CONNECT_EDGE"
	Payload interface{} `json:"payload"`
}
