package mcptransport

import (
	"context"
	"errors"
	"os"

	"github.com/mark3labs/mcp-go/mcp"
)

var ErrWriteAccessDisabled = errors.New("write access is disabled for this MCP server instance (VVS_MCP_ALLOW_WRITE=1 required)")

// EnsureWritePermission checks if write tools are permitted on this MCP server.
func EnsureWritePermission(_ context.Context) (*mcp.CallToolResult, error) {
	val := os.Getenv("VVS_MCP_ALLOW_WRITE")
	if val == "1" || val == "true" || val == "TRUE" || val == "yes" {
		return nil, nil
	}
	return mcp.NewToolResultError(ErrWriteAccessDisabled.Error()), nil
}
