package mcptransport

import (
	"context"
	"os"
	"testing"
)

func TestEnsureWritePermission(t *testing.T) {
	// Default should block write
	os.Unsetenv("VVS_MCP_ALLOW_WRITE")
	res, err := EnsureWritePermission(context.Background())
	if res == nil && err == nil {
		t.Fatalf("expected write permission error when VVS_MCP_ALLOW_WRITE is unset")
	}

	// Explicitly enabled
	os.Setenv("VVS_MCP_ALLOW_WRITE", "1")
	defer os.Unsetenv("VVS_MCP_ALLOW_WRITE")

	res, err = EnsureWritePermission(context.Background())
	if res != nil || err != nil {
		t.Fatalf("expected write permission allowed when VVS_MCP_ALLOW_WRITE=1, got res=%v, err=%v", res, err)
	}
}
