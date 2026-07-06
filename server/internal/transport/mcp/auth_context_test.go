package mcptransport

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"vvs-server/internal/core/auth"
)

func TestWireSessionAuthPropagatesUserFromSSESession(t *testing.T) {
	sessions := NewSessionAuth()
	_, contextFn := NewSessionAuthHooks(sessions)

	const sessionID = "sess-test-1"
	const userID = "11111111-1111-1111-1111-111111111111"
	sessions.Set(sessionID, userID)

	req := httptest.NewRequest(http.MethodPost, "/mcp/message?sessionId="+sessionID, nil)
	baseCtx := context.Background()
	ctx := contextFn(baseCtx, req)

	got := auth.UserIDFromContext(ctx)
	if got != userID {
		t.Fatalf("expected user %q in tool context, got %q", userID, got)
	}
}

func TestWireSessionAuthPrefersRequestBearerContext(t *testing.T) {
	sessions := NewSessionAuth()
	_, contextFn := NewSessionAuthHooks(sessions)

	const sessionID = "sess-test-2"
	sessions.Set(sessionID, "00000000-0000-0000-0000-000000000001")

	req := httptest.NewRequest(http.MethodPost, "/mcp/message?sessionId="+sessionID, nil)
	reqCtx := auth.WithUserID(req.Context(), "22222222-2222-2222-2222-222222222222")
	req = req.WithContext(reqCtx)

	ctx := contextFn(req.Context(), req)
	got := auth.UserIDFromContext(ctx)
	if got != "22222222-2222-2222-2222-222222222222" {
		t.Fatalf("expected request-scoped user in context, got %q", got)
	}
}
