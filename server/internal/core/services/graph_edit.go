package services

import (
	"context"
	"errors"
	"fmt"
	"sync/atomic"
	"time"

	"vvs-server/internal/core/domain"
	"vvs-server/internal/core/registry"
	"vvs-server/internal/core/store"
)

var (
	ErrGraphTabNotFound   = errors.New("graph tab not found")
	ErrNodeNotFound       = errors.New("node not found")
	ErrKindNotFound       = errors.New("node kind not found")
	ErrPinNotFound        = errors.New("pin not found")
	ErrIncompatiblePins   = errors.New("incompatible pin types")
	ErrDuplicateEdge      = errors.New("edge already exists")
)

// ValidateConnection applies minimal pin compatibility rules (mirrors graph-types pinCompatibility).
func ValidateConnection(sourcePin, targetPin domain.PinDefinition) bool {
	sourceType := sourcePin.Type
	targetType := targetPin.Type
	if sourceType == "execution" {
		return targetType == "execution"
	}
	if targetType == "execution" {
		return false
	}
	if sourceType == "data_any" || targetType == "data_any" {
		return true
	}
	return sourceType == targetType
}

func resolveTabID(snap *domain.ProjectSnapshot, tabID string) string {
	if tabID != "" {
		return tabID
	}
	return snap.ActiveGraphTab
}

func documentForTab(snap *domain.ProjectSnapshot, tabID string) (*domain.GraphDocument, error) {
	id := resolveTabID(snap, tabID)
	doc, ok := snap.Documents[id]
	if !ok {
		return nil, ErrGraphTabNotFound
	}
	return &doc, nil
}

func findNode(doc *domain.GraphDocument, nodeID string) (*domain.Node, int) {
	for i, n := range doc.Nodes {
		if n.ID == nodeID {
			return &doc.Nodes[i], i
		}
	}
	return nil, -1
}

func findOutputPin(node domain.Node, handleID string) *domain.PinDefinition {
	for i := range node.Data.Outputs {
		if node.Data.Outputs[i].ID == handleID {
			return &node.Data.Outputs[i]
		}
	}
	return nil
}

func findInputPin(node domain.Node, handleID string) *domain.PinDefinition {
	for i := range node.Data.Inputs {
		if node.Data.Inputs[i].ID == handleID {
			return &node.Data.Inputs[i]
		}
	}
	return nil
}

// AddNode spawns a registry kind into the target graph tab.
func AddNode(ctx context.Context, st store.ProjectStore, projectID, tabID, kindID string, x, y float64) (*domain.Node, error) {
	snap, err := LoadProject(ctx, st, projectID)
	if err != nil {
		return nil, err
	}

	kind, err := registry.LookupKind(kindID)
	if err != nil {
		return nil, err
	}

	doc, err := documentForTab(snap, tabID)
	if err != nil {
		return nil, err
	}

	nodeID := nextNodeID()
	node := domain.Node{
		ID:   nodeID,
		Type: "vvs_standard_node",
		Position: domain.Position{X: x, Y: y},
		Data: domain.NodeData{
			Label:        kind.Title,
			Category:     kind.Category,
			KindID:       kind.KindID,
			KindVersion:  kind.KindVersion,
			Inputs:       clonePins(kind.Inputs),
			Outputs:      clonePins(kind.Outputs),
			InlineValues: map[string]interface{}{},
		},
	}

	doc.Nodes = append(doc.Nodes, node)
	snap.Documents[resolveTabID(snap, tabID)] = *doc
	if err := SaveProject(ctx, st, projectID, *snap); err != nil {
		return nil, err
	}
	return &node, nil
}

// RemoveNode deletes a node and any connected edges from the target graph tab.
func RemoveNode(ctx context.Context, st store.ProjectStore, projectID, tabID, nodeID string) error {
	snap, err := LoadProject(ctx, st, projectID)
	if err != nil {
		return err
	}
	doc, err := documentForTab(snap, tabID)
	if err != nil {
		return err
	}
	if _, idx := findNode(doc, nodeID); idx < 0 {
		return ErrNodeNotFound
	}

	filteredNodes := make([]domain.Node, 0, len(doc.Nodes)-1)
	for _, n := range doc.Nodes {
		if n.ID != nodeID {
			filteredNodes = append(filteredNodes, n)
		}
	}
	filteredEdges := make([]domain.Edge, 0, len(doc.Edges))
	for _, e := range doc.Edges {
		if e.Source != nodeID && e.Target != nodeID {
			filteredEdges = append(filteredEdges, e)
		}
	}

	doc.Nodes = filteredNodes
	doc.Edges = filteredEdges
	snap.Documents[resolveTabID(snap, tabID)] = *doc
	return SaveProject(ctx, st, projectID, *snap)
}

// ConnectPins validates and adds an edge between two nodes.
func ConnectPins(ctx context.Context, st store.ProjectStore, projectID, tabID string, edge domain.Edge) (*domain.Edge, error) {
	snap, err := LoadProject(ctx, st, projectID)
	if err != nil {
		return nil, err
	}
	doc, err := documentForTab(snap, tabID)
	if err != nil {
		return nil, err
	}

	sourceNode, _ := findNode(doc, edge.Source)
	if sourceNode == nil {
		return nil, ErrNodeNotFound
	}
	targetNode, _ := findNode(doc, edge.Target)
	if targetNode == nil {
		return nil, ErrNodeNotFound
	}

	sourcePin := findOutputPin(*sourceNode, edge.SourceHandle)
	if sourcePin == nil {
		return nil, ErrPinNotFound
	}
	targetPin := findInputPin(*targetNode, edge.TargetHandle)
	if targetPin == nil {
		return nil, ErrPinNotFound
	}
	if !ValidateConnection(*sourcePin, *targetPin) {
		return nil, ErrIncompatiblePins
	}

	for _, existing := range doc.Edges {
		if existing.Source == edge.Source &&
			existing.Target == edge.Target &&
			existing.SourceHandle == edge.SourceHandle &&
			existing.TargetHandle == edge.TargetHandle {
			return nil, ErrDuplicateEdge
		}
	}

	if edge.ID == "" {
		edge.ID = nextEdgeID()
	}
	edge.Data.PinType = sourcePin.Type

	doc.Edges = append(doc.Edges, edge)
	snap.Documents[resolveTabID(snap, tabID)] = *doc
	if err := SaveProject(ctx, st, projectID, *snap); err != nil {
		return nil, err
	}
	return &edge, nil
}

// GetGraphDocument returns the active or specified graph tab document.
func GetGraphDocument(ctx context.Context, st store.ProjectStore, projectID, tabID string) (*domain.GraphDocument, string, error) {
	snap, err := LoadProject(ctx, st, projectID)
	if err != nil {
		return nil, "", err
	}
	resolved := resolveTabID(snap, tabID)
	doc, err := documentForTab(snap, resolved)
	if err != nil {
		return nil, "", err
	}
	return doc, resolved, nil
}

var nodeIDCounter uint64

func nextNodeID() string {
	n := atomic.AddUint64(&nodeIDCounter, 1)
	return fmt.Sprintf("node-%d-%d", time.Now().UnixNano(), n)
}

func nextEdgeID() string {
	n := atomic.AddUint64(&nodeIDCounter, 1)
	return fmt.Sprintf("edge-%d-%d", time.Now().UnixNano(), n)
}

func clonePins(pins []registry.PinDefinition) []domain.PinDefinition {
	out := make([]domain.PinDefinition, len(pins))
	for i, p := range pins {
		out[i] = domain.PinDefinition{ID: p.ID, Label: p.Label, Type: p.Type}
	}
	return out
}
