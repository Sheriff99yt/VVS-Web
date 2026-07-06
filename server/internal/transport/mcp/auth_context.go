package mcptransport

import (
	"context"
	"net/http"
	"sync"

	mcpserver "github.com/mark3labs/mcp-go/server"

	"vvs-server/internal/core/auth"
)

// SessionAuth binds authenticated user ids to MCP SSE sessions so tool calls
// remain user-scoped when message POSTs omit Authorization (common MCP clients).
type SessionAuth struct {
	mu   sync.RWMutex
	byID map[string]string
}

func NewSessionAuth() *SessionAuth {
	return &SessionAuth{byID: make(map[string]string)}
}

func (s *SessionAuth) Set(sessionID, userID string) {
	if sessionID == "" || userID == "" {
		return
	}
	s.mu.Lock()
	s.byID[sessionID] = userID
	s.mu.Unlock()
}

func (s *SessionAuth) Get(sessionID string) string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.byID[sessionID]
}

func (s *SessionAuth) Delete(sessionID string) {
	s.mu.Lock()
	delete(s.byID, sessionID)
	s.mu.Unlock()
}

// NewSessionAuthHooks returns MCP hooks plus an SSE context func that injects
// the authenticated user id into tool handler context.
func NewSessionAuthHooks(sessions *SessionAuth) (*mcpserver.Hooks, mcpserver.SSEContextFunc) {
	hooks := &mcpserver.Hooks{}
	hooks.AddOnRegisterSession(func(ctx context.Context, session mcpserver.ClientSession) {
		if id := auth.UserIDFromContext(ctx); id != "" {
			sessions.Set(session.SessionID(), id)
		}
	})
	hooks.AddOnUnregisterSession(func(_ context.Context, session mcpserver.ClientSession) {
		sessions.Delete(session.SessionID())
	})

	contextFn := func(ctx context.Context, r *http.Request) context.Context {
		if id := auth.UserIDFromContext(r.Context()); id != "" {
			return auth.WithUserID(ctx, id)
		}
		if id := auth.UserIDFromContext(ctx); id != "" {
			return ctx
		}
		sessionID := r.URL.Query().Get("sessionId")
		if sessionID == "" {
			return ctx
		}
		if id := sessions.Get(sessionID); id != "" {
			return auth.WithUserID(ctx, id)
		}
		return ctx
	}

	return hooks, contextFn
}
