package mcptransport

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/mark3labs/mcp-go/mcp"
	mcpserver "github.com/mark3labs/mcp-go/server"

	"vvs-server/internal/core/domain"
	"vvs-server/internal/core/registry"
	"vvs-server/internal/core/services"
	"vvs-server/internal/core/store"
)

// Deps holds shared dependencies for MCP tool handlers.
type Deps struct {
	Store  *store.MemoryStore
	Runner services.TranspilerRunner
}

// RegisterTools wires thin MCP tools over core services and registry pure functions.
func RegisterTools(s *mcpserver.MCPServer, deps Deps) {
	registerListAvailableNodes(s)
	registerListSyntaxPacks(s)
	registerGetGraph(s, deps)
	registerAddNode(s, deps)
	registerRemoveNode(s, deps)
	registerConnectPins(s, deps)
	registerGenerateCode(s, deps)
	registerSaveProject(s, deps)
}

func registerListAvailableNodes(s *mcpserver.MCPServer) {
	tool := mcp.NewTool("list_available_nodes",
		mcp.WithDescription("List spawnable node kinds from the core syntax registry pack"),
	)
	s.AddTool(tool, func(_ context.Context, _ mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		nodes, err := registry.ListAvailableNodes()
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		return jsonToolResult(map[string]interface{}{"nodes": nodes})
	})
}

func registerListSyntaxPacks(s *mcpserver.MCPServer) {
	tool := mcp.NewTool("list_syntax_packs",
		mcp.WithDescription("List syntax pack catalog metadata"),
	)
	s.AddTool(tool, func(_ context.Context, _ mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		packs, err := registry.ListSyntaxPacks()
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		return jsonToolResult(map[string]interface{}{"packs": packs})
	})
}

func registerGetGraph(s *mcpserver.MCPServer, deps Deps) {
	tool := mcp.NewTool("get_graph",
		mcp.WithDescription("Load the active or specified graph tab document from a project"),
		mcp.WithString("project_id", mcp.Required(), mcp.Description("Project id")),
		mcp.WithString("tab_id", mcp.Description("Graph tab id (defaults to activeGraphTab)")),
	)
	s.AddTool(tool, func(_ context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		projectID, err := req.RequireString("project_id")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		tabID := req.GetString("tab_id", "")

		snap, err := services.LoadProject(deps.Store, projectID)
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		doc, resolvedTab, err := services.GetGraphDocument(deps.Store, projectID, tabID)
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		return jsonToolResult(map[string]interface{}{
			"projectId":        projectID,
			"activeGraphTab":   snap.ActiveGraphTab,
			"tabId":            resolvedTab,
			"targetLanguage":   snap.TargetLanguage,
			"moduleName":       snap.ProjectDetails.ModuleName,
			"nodes":            doc.Nodes,
			"edges":            doc.Edges,
		})
	})
}

func registerAddNode(s *mcpserver.MCPServer, deps Deps) {
	tool := mcp.NewTool("add_node",
		mcp.WithDescription("Spawn a registry node kind into a project graph tab"),
		mcp.WithString("project_id", mcp.Required()),
		mcp.WithString("kind_id", mcp.Required(), mcp.Description("Core pack kindId e.g. action_print")),
		mcp.WithNumber("x", mcp.Description("Canvas X position")),
		mcp.WithNumber("y", mcp.Description("Canvas Y position")),
		mcp.WithString("tab_id", mcp.Description("Graph tab id (defaults to activeGraphTab)")),
	)
	s.AddTool(tool, func(_ context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		projectID, err := req.RequireString("project_id")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		kindID, err := req.RequireString("kind_id")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		x := req.GetFloat("x", 0)
		y := req.GetFloat("y", 0)
		tabID := req.GetString("tab_id", "")

		node, err := services.AddNode(deps.Store, projectID, tabID, kindID, x, y)
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		return jsonToolResult(map[string]interface{}{"node": node})
	})
}

func registerRemoveNode(s *mcpserver.MCPServer, deps Deps) {
	tool := mcp.NewTool("remove_node",
		mcp.WithDescription("Remove a node and its connected edges from a graph tab"),
		mcp.WithString("project_id", mcp.Required()),
		mcp.WithString("node_id", mcp.Required()),
		mcp.WithString("tab_id", mcp.Description("Graph tab id (defaults to activeGraphTab)")),
	)
	s.AddTool(tool, func(_ context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		projectID, err := req.RequireString("project_id")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		nodeID, err := req.RequireString("node_id")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		tabID := req.GetString("tab_id", "")

		if err := services.RemoveNode(deps.Store, projectID, tabID, nodeID); err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		return jsonToolResult(map[string]interface{}{"ok": true})
	})
}

func registerConnectPins(s *mcpserver.MCPServer, deps Deps) {
	tool := mcp.NewTool("connect_pins",
		mcp.WithDescription("Connect an output pin to an input pin with minimal type validation"),
		mcp.WithString("project_id", mcp.Required()),
		mcp.WithString("source", mcp.Required(), mcp.Description("Source node id")),
		mcp.WithString("target", mcp.Required(), mcp.Description("Target node id")),
		mcp.WithString("source_handle", mcp.Required()),
		mcp.WithString("target_handle", mcp.Required()),
		mcp.WithString("tab_id", mcp.Description("Graph tab id (defaults to activeGraphTab)")),
	)
	s.AddTool(tool, func(_ context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		projectID, err := req.RequireString("project_id")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		source, err := req.RequireString("source")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		target, err := req.RequireString("target")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		sourceHandle, err := req.RequireString("source_handle")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		targetHandle, err := req.RequireString("target_handle")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		tabID := req.GetString("tab_id", "")

		edge := domain.Edge{
			Source:       source,
			Target:       target,
			SourceHandle: sourceHandle,
			TargetHandle: targetHandle,
		}
		created, err := services.ConnectPins(deps.Store, projectID, tabID, edge)
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		return jsonToolResult(map[string]interface{}{"edge": created})
	})
}

func registerGenerateCode(s *mcpserver.MCPServer, deps Deps) {
	tool := mcp.NewTool("generate_code",
		mcp.WithDescription("Compile the stored project snapshot via the transpiler CLI"),
		mcp.WithString("project_id", mcp.Required()),
	)
	s.AddTool(tool, func(_ context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		projectID, err := req.RequireString("project_id")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		result, err := services.CompileProject(deps.Store, projectID, deps.Runner)
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		return jsonToolResult(result)
	})
}

func registerSaveProject(s *mcpserver.MCPServer, deps Deps) {
	tool := mcp.NewTool("save_project",
		mcp.WithDescription("Persist a full ProjectSnapshot v2 document"),
		mcp.WithString("project_id", mcp.Required()),
		mcp.WithObject("snapshot", mcp.Required(), mcp.Description("ProjectSnapshot v2 JSON object")),
	)
	s.AddTool(tool, func(_ context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		projectID, err := req.RequireString("project_id")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		raw, ok := req.GetArguments()["snapshot"]
		if !ok {
			return mcp.NewToolResultError("snapshot is required"), nil
		}
		payload, err := json.Marshal(raw)
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		var snap domain.ProjectSnapshot
		if err := json.Unmarshal(payload, &snap); err != nil {
			return mcp.NewToolResultError("invalid snapshot: " + err.Error()), nil
		}
		if err := services.SaveProject(deps.Store, projectID, snap); err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		return jsonToolResult(map[string]interface{}{"ok": true})
	})
}

func jsonToolResult(value interface{}) (*mcp.CallToolResult, error) {
	data, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("marshal tool result: %w", err)
	}
	return mcp.NewToolResultText(string(data)), nil
}
