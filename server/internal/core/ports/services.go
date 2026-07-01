package ports

import (
	"context"
	"vvs-server/internal/core/domain"
)

// GraphRepository handles database storage for graphs
type GraphRepository interface {
	GetGraph(ctx context.Context, id string) (*domain.Graph, error)
	SaveGraph(ctx context.Context, graph *domain.Graph) error
	DeleteGraph(ctx context.Context, id string) error
}

// LibraryRepository handles searching the community scripts
type LibraryRepository interface {
	SearchScripts(ctx context.Context, query string, tags []string) ([]domain.LibraryScript, error)
	PublishScript(ctx context.Context, script domain.LibraryScript) error
}

// GraphService orchestrates graph changes and real-time validation
type GraphService interface {
	AddNode(ctx context.Context, graphID string, node domain.Node) error
	RemoveNode(ctx context.Context, graphID, nodeID string) error
	ConnectPins(ctx context.Context, graphID string, edge domain.Edge) error
	
	ValidateConnection(sourcePin domain.PinDefinition, targetPin domain.PinDefinition) bool
}

// WebSocketHub handles real-time broadcasting to active users
type WebSocketHub interface {
	BroadcastToGraph(graphID string, op domain.GraphOperation)
	RegisterClient(client ClientConnection, graphID string)
	UnregisterClient(client ClientConnection)
}

type ClientConnection interface {
	Send(op domain.GraphOperation)
}

// MCPServer defines the contract for external AI
type MCPServer interface {
	HandleRequest(ctx context.Context, method string, params map[string]interface{}) (interface{}, error)
}
