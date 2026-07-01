---
name: VVS Backend Development
description: Triggers when writing Go code, API handlers, or MCP tools in the server directory.
---

# Current State

The Go backend is a **skeleton only**. See `docs/current_state.md`.

- `internal/core/domain/` — graph domain models
- `internal/core/ports/` — repository/service/MCP port interfaces (hexagonal)
- `cmd/vvs-server/main.go` — minimal HTTP stub (health check)

**Not implemented:** graph REST API, MCP server, WebSockets, Supabase adapters.

Do not add mock “demo” REST endpoints (e.g. roadmap/integrations feeds) — the frontend uses local mock data in `apps/web/src/lib/api-mock.ts` until real APIs exist.

# MCP Tool Pure Functions

- MCP tools in the Go backend MUST be thin wrappers around pure functions. The business logic must be independently testable without the MCP protocol layer.

# Modular & Maintainable Implementation (Backend)

- Follow Clean/Hexagonal Architecture: Isolate API transport (HTTP handlers/WebSockets) from core business logic (pure functions) and data access (Supabase/DB).
- The MCP Server tools must be thin wrappers that simply call the decoupled business logic, ensuring the logic remains testable outside the context of an AI tool call.
