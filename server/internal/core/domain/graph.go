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
	Inputs       []PinDefinition        `json:"inputs"`
	Outputs      []PinDefinition        `json:"outputs"`
	InlineValues map[string]interface{} `json:"inlineValues"`
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
