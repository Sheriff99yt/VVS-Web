---
name: VVS Backend Development
description: Triggers when writing Go code, API handlers, or MCP tools in the server directory.
---

# Current State

**Phase 2 (partial, July 2026):** REST project API, registry HTTP, local MCP SSE, optional Postgres persistence, JWT auth middleware. Canonical snapshot: [`docs/current_state.md`](../../../docs/current_state.md). Deploy topology: [`docs/deployment.md`](../../../docs/deployment.md).

**Shipped:**

| Area | Location |
|------|----------|
| Domain v2 | `internal/core/domain/` — `ProjectSnapshot`, `GraphBinding`, `FunctionSymbol` |
| Registry | `internal/core/registry/` — embedded `core-pack.json`, environments, syntax-packs |
| Store port | `internal/core/store/store.go` — `ProjectStore` interface |
| Memory store | `internal/core/store/memory.go` — default when no `DATABASE_URL` |
| Postgres store | `internal/core/store/postgres.go` — `pgx` pool, JSONB snapshots, user-scoped SQL |
| Store bootstrap | `internal/core/store/open.go` — `OpenFromEnv(ctx)` selects memory vs postgres |
| Migrations | `migrations/001_projects.sql` — embedded via `RunMigrations` on Postgres open |
| Auth | `internal/core/auth/auth.go` — JWT middleware, `UserIDFromContext`, dev user fallback |
| Services | `internal/core/services/` — `project`, `graph_edit`, `compile` (pure; user from `ctx`) |
| HTTP transport | `internal/transport/http/` — projects CRUD, compile, CORS (`Authorization` header) |
| MCP transport | `internal/transport/mcp/` — thin tool wrappers; pass `ctx` to services |
| Entry | `cmd/vvs-server/main.go` — `OpenFromEnv`, auth middleware on all routes, health JSON |

**Not started:** WebSocket collaboration, production VPS deploy, JWKS (HS256 via `SUPABASE_JWT_SECRET` today).

# Local dev defaults

```text
DATABASE_URL unset     → MemoryStore (Phase 1)
AUTH_REQUIRED=false    → DevUserID on requests without Bearer token
PORT=:8080             → REST + /mcp SSE
```

With Postgres: set `DATABASE_URL`, optional `AUTH_REQUIRED=true` + `SUPABASE_JWT_SECRET`.

Health response fields: `status`, `service`, `store` (`memory`|`postgres`), `auth` (`dev`|`required`), `userId`.

# ProjectStore port

```go
// internal/core/store/store.go
type ProjectStore interface {
    Get(ctx context.Context, userID, projectID string) (domain.ProjectSnapshot, error)
    Save(ctx context.Context, userID, projectID string, snap domain.ProjectSnapshot) error
    Delete(ctx context.Context, userID, projectID string) error
    List(ctx context.Context, userID string) ([]domain.ProjectSummary, error)
}
```

Handlers and MCP tools depend on **`ProjectStore`**, not concrete stores. Services receive `userID` from `auth.UserIDFromContext(ctx)`.

# Auth middleware

- `auth.LoadConfigFromEnv()` — `AUTH_REQUIRED`, `SUPABASE_JWT_SECRET`, optional `DEV_USER_ID`
- `auth.Middleware(cfg, next)` — Bearer JWT → `sub` claim; dev mode uses `DevUserID` when no token
- Wrap all routes via `withCORSAndAuth` in `main.go` (including `/health`, `/mcp`)

**Do not:** route project CRUD through PostgREST or `supabase-js` `.from('projects')` — Go is the only product API ([`deployment.md`](../../../docs/deployment.md)).

# MCP Tool Pure Functions

- MCP tools MUST be thin wrappers around pure functions in `internal/core/services/`
- Business logic must be independently testable without the MCP protocol layer
- Tools receive the same `ProjectStore` and `context.Context` as HTTP handlers

# Modular & Maintainable Implementation (Backend)

- **Clean/Hexagonal:** transport (HTTP/MCP) → services (pure) → `ProjectStore` (memory/postgres)
- Handlers: parse request, call service, write JSON — **no SQL or domain rules in handlers**
- `main.go` wires deps only — no growing business logic in `main`

# Anti-patterns

- Demo REST endpoints (roadmap/integrations feeds) — frontend uses local mocks until real contracts exist
- PostgREST or Supabase client for project persistence — use `pgx` via `PostgresStore`
- Skipping `user_id` scope in SQL — every query must filter by authenticated user
- Inline transpiler logic in handlers — use `services.NewCLITranspiler` / compile service

# Verify

```powershell
cd server; go test ./...
cd server; go build ./...
```
