---
name: VVS UI API Loop
description: Triggers when wiring frontend UI to APIs, creating api client layers, Go handlers, or replacing mock data with HTTP.
---

# VVS UI + API Delivery Loop

Read **`docs/ui_api_delivery_loop.md`** before every iteration. Canonical state: **`docs/current_state.md`**. Phase 2 auth/persistence: **`docs/deployment.md`**.

## Hard rules

1. **One backlog slice per session** — finish it end-to-end or report blocked.
2. **UI calls `VvsApi` only** — never `MockApi`, never raw `fetch` in components.
3. **Same types** for mock and HTTP transports (`HealthResponse`, `ProjectListEntry`, etc. in `lib/api/mock.ts`).
4. **Go**: handlers thin → `internal/core/services/` pure functions → `ProjectStore`.
5. **Bearer auth**: HTTP client sends `Authorization` via `lib/auth/session.ts` → `client.ts` `apiHeaders()`.
6. **Verify**: `bun run build` in `apps/web`; `go test ./...` in `server` when Go changes.
7. **Update** `docs/current_state.md` when a slice completes.

## Canvas source of truth (locked)

**Canonical:** `docs/visual_to_text_fidelity.md` § Canvas is the source of truth · Trigger skill: `vvs_visual_code_fidelity/SKILL.md`

- Save/load and compile API paths must preserve define nodes on `classHomeGraphId` — no symbol-only snapshots
- Compile gate respects `analyzeProject` fidelity errors (`DEFINE_NODE_MISSING`, `DECLARATION_NOT_ON_CANVAS`, `ORPHAN_DEFINE_NODE`) — block Generate when `!analysis.ok`
- MCP/HTTP compile must not strip define nodes or reintroduce sidebar preamble emit

## VvsApi facade (shipped)

```text
apps/web/src/lib/api/
├── index.ts      # VvsApi — switches mock | http via NEXT_PUBLIC_API_MODE
├── client.ts     # fetch + authHeaders(); project REST, health, MCP probe
├── mock.ts       # localStorage / fixtures; same signatures as client
└── errors.ts     # ApiError
```

**Methods:** `getHealth`, `saveProject`, `loadProject`, `listProjects`, `compileProject`, `probeMcp`, `listEnvironments`, `importEnvironment`.

**Mode:** `NEXT_PUBLIC_API_MODE=http` (set by `tools/start_app.ps1`) + `NEXT_PUBLIC_API_URL` (default `http://localhost:8080`).

## Auth + cloud persistence (Phase 2 partial)

When Supabase env is set (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`):

- `hooks/useAuthSession.ts` — GoTrue sign-in/up/out; syncs JWT to `sessionStorage` via `setAccessToken`
- `components/auth/AuthButton.tsx` — TopNav + StartScreen login UI
- `lib/auth/session.ts` — `authHeaders()` adds `Bearer` on project API calls
- Go middleware validates JWT; `PostgresStore` scopes rows by `user_id`

**Save/load path:** `TopNav.persistSnapshot` → local/folder store **and** `VvsApi.saveProject(snapshot, projectId)` when HTTP mode. Cloud is source of truth when authenticated + Postgres backend; local `.vvs/` folders remain first-class.

**HealthResponse** (mock + Go `/health`): `status`, `service`, `store?` (`memory`|`postgres`), `auth?` (`dev`|`required`), `userId?`.

## Iteration steps (always in order)

1. Pick first incomplete row from backlog in `ui_api_delivery_loop.md`
2. Define contract types + `VvsApi` method
3. Implement mock transport (`mock.ts`)
4. Implement HTTP transport (`client.ts`) with `apiHeaders()`
5. Wire UI (loading/error states; respect auth when required)
6. Implement Go handler + service (if slice includes backend)
7. Smoke test + build
8. Update docs

## Backlog quick reference (July 2026)

| Phase | Status | Remaining |
|-------|--------|-----------|
| A — Facade, health, MCP probe | **Done** | Production MCP JWT + HTTPS |
| B — Save/load/list/compile | **Done** | Cloud autosave debounce polish; list UI for multi-project |
| C — Library backend | Open | UI skeleton only; no real search/install API |
| D — WebSocket collab | Not started | Phase 4 — Go WS, not Supabase Realtime |
| E — VPS deploy | Partial | `PostgresStore` local; Docker Compose + prod checklist TBD |

Pick the **first open row** in `docs/ui_api_delivery_loop.md` — do not re-implement shipped slices.

## Do not

- Add Roadmap/Integrations **tabs** (in-app Roadmap **view** for shipped-vs-planned is OK per `current_state.md`)
- Add unrelated demo REST routes
- Put transpiler logic in `CodePreviewPanel` templates
- Show fake MCP/sync connected state without a successful `VvsApi.probeMcp` or health check
- Call PostgREST / `supabase.from('projects')` for project data — use `VvsApi` → Go REST only
