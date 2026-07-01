---
name: VVS UI API Loop
description: Triggers when wiring frontend UI to APIs, creating api client layers, Go handlers, or replacing mock data with HTTP.
---

# VVS UI + API Delivery Loop

Read **`docs/ui_api_delivery_loop.md`** before every iteration. Canonical state: **`docs/current_state.md`**.

## Hard rules

1. **One backlog slice per session** — finish it end-to-end or report blocked.
2. **UI calls `VvsApi` only** — never `MockApi`, never raw `fetch` in components.
3. **Same types** for mock and HTTP transports (`apps/web/src/types/api/`).
4. **Go**: handlers thin → `internal/core/services/` pure functions.
5. **Verify**: `bun run build` in `apps/web`; `go build ./...` in `server` when Go changes.
6. **Update** `docs/current_state.md` when a slice completes.

## Iteration steps (always in order)

1. Pick first incomplete row from backlog in `ui_api_delivery_loop.md`
2. Define contract types + `VvsApi` method
3. Implement mock transport
4. Wire UI (loading/error states)
5. Implement Go handler + service (if slice includes backend)
6. Smoke test + build
7. Update docs

## Backlog quick reference

| Phase | Slices |
|-------|--------|
| A | API facade, connection status |
| B | Save/load/list project, graph autosave, variables, tabs |
| C | Library search, install, installed list |
| D | Compile endpoint, MCP (later) |

## Do not

- Add Roadmap/Integrations UI tabs
- Add unrelated demo REST routes
- Put transpiler logic in `CodePreviewPanel` templates
- Show fake MCP/sync connected state without a successful health check
