# Deployment & Persistence Architecture

> **Product direction (July 2026):** VVS is **client-first** — **no dedicated server hosting** as the official product. Prefer local / folder / `.vvs/` / git and static Pages. This document describes a **legacy / experimental** self-host stack that remains in the repo for reference; do **not** treat VPS deploy as open roadmap work. See [roadmap.md](roadmap.md) § Client-first · `.agents/memory/decisions.md` § No dedicated server hosting.

**Status (historical):** Architecture notes below were locked for an optional self-host path — superseded as **product** direction by client-first (not deleted from the repo).

This document defines how a self-hosted stack *could* work (Go API, Postgres, GoTrue). See also [roadmap.md](roadmap.md), [vvs_2_0_tech_stack.md](vvs_2_0_tech_stack.md), and `.agents/memory/decisions.md`.

---

## Principles

1. **Keep the monorepo boundaries** — Next.js UI, TypeScript transpiler in browser, Go for API/MCP/WebSockets.
2. **Go is the only product API** — editor and MCP call `server/`; business logic stays in testable Go services.
3. **Self-hosted Supabase for Auth + Postgres** — not Supabase Cloud; not PostgREST for app CRUD.
4. **Direct `pgx` from Go** — connection pool to Postgres; no PostgREST hop for projects/graphs/compile.
5. **Client transpiler stays in the browser** — fast preview; Go compile path is for MCP, agents, and CI.
6. **`.vvs/` folder projects remain first-class** — cloud sync is additive, not a replacement for git-friendly exports.

---

## Runtime topology

```text
┌─────────────────────────────────────────────────────────────┐
│  Next.js (apps/web)                                         │
│  - Editor UI, browser @vvs/transpiler                       │
│  - Login via Supabase Auth client (GoTrue) → JWT            │
│  - VvsApi → Go REST (never PostgREST for project data)      │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS + Authorization: Bearer
┌───────────────────────────▼─────────────────────────────────┐
│  Go server (server/)                                          │
│  - REST: /api/projects, /compile, /registry/*               │
│  - MCP SSE: /mcp                                              │
│  - WebSockets (Phase 4 collab)                                │
│  - JWT middleware (Supabase JWKS) → user_id scope             │
│  - Services → pgx pool → Postgres                           │
└───────────────────────────┬─────────────────────────────────┘
                            │ localhost or private network
┌───────────────────────────▼─────────────────────────────────┐
│  Self-hosted Supabase (Docker on VPS)                       │
│  - PostgreSQL + JSONB (+ pgvector in Phase 3)               │
│  - GoTrue (Auth): GitHub OAuth + email for v1               │
│  - Studio (dev/admin, IP-restricted)                        │
│  - PostgREST: runs in stack but unused by VVS app paths     │
└─────────────────────────────────────────────────────────────┘
```

---

## Environments

| Environment | Web | API + MCP + DB |
|-------------|-----|----------------|
| **Local dev** | `tools/start_app.ps1` → Next.js + Go in-memory (Phase 1) | Optional local Supabase Docker |
| **Dev** | Shared hosting for static/marketing only, **or** same VPS | Small VPS — Docker Compose: Supabase + Go + Caddy |
| **Live** | Static/edge (Vercel or VPS) | VPS — sized for Postgres RAM; backups, TLS, rate limits |

**Note:** Classic shared hosting (cPanel, no Docker) cannot run self-hosted Supabase. Use it for lightweight front-end assets only.

### Suggested VPS layout (dev and live)

```text
your-domain
├── app.*     → Next.js (static export or Node)
├── api.*     → Go :8080 (REST + MCP + WS)
├── auth.*    → Supabase Kong / Auth URL (or unified Supabase URL)
└── studio.*  → Supabase Studio (dev only, firewall / IP allowlist)
```

Reverse proxy: **Caddy** or **Nginx** with automatic TLS.

---

## Data model (Phase 2)

Relational shell + JSONB documents — matches existing `ProjectSnapshot v2`.

```text
projects
  id            UUID PK
  user_id       UUID FK → auth.users
  module_name   TEXT
  saved_at      TIMESTAMPTZ
  snapshot      JSONB     -- full ProjectSnapshot v2
  updated_at    TIMESTAMPTZ
```

**Indexes:** `(user_id)`, `(user_id, updated_at DESC)`.

**Evolution (Phase 4+, not a rewrite):** split `graph_documents(project_id, tab_id, document JSONB, revision)` when graphs grow large or collab needs partial updates.

**Go store:** `PostgresStore` implements the same port as `MemoryStore` today — handlers and MCP tools unchanged.

---

## Auth

| Concern | Owner |
|---------|--------|
| Login, OAuth, magic links | **GoTrue** (Supabase Auth) |
| Session JWT | Issued by GoTrue |
| API + MCP authorization | **Go middleware** — verify JWT via JWKS, extract `sub` → `user_id` |
| Row ownership | SQL `WHERE user_id = $1` in Go repositories |

**v1 providers:** GitHub OAuth + email.

**MCP (production):** `Authorization: Bearer <supabase_jwt>` on `/mcp`; tools scoped to authenticated user's projects.

**Do not:** route editor save/load through `supabase-js` `.from('projects')` / PostgREST — bypasses Go services and MCP rules.

---

## Performance (final architecture)

| Choice | Effect |
|--------|--------|
| Go + pgx (no PostgREST for app) | **Faster** — one hop, pooled connections, tailored queries |
| Postgres + JSONB snapshots | **Fast** open/save for typical graphs; debounce cloud autosave |
| Browser transpiler | **Fast** live preview — no server round-trip |
| Go compile / MCP `generate_code` | Acceptable for agents; optional long-lived worker later |
| No Redis (initially) | Fine for single VPS or few Go replicas; add when horizontally scaling |
| Collocated Go + Postgres on VPS | **Lowest latency** — use localhost DB socket |

**Avoid:** saving full snapshot on every canvas mutation; undersized VPS (< 4 GB RAM for full Supabase stack).

---

## What we use from Supabase vs what we skip

| Component | Use? | Why |
|-----------|------|-----|
| PostgreSQL | **Yes** | Projects, library metadata, pgvector later |
| GoTrue (Auth) | **Yes** | Accounts, JWT |
| Studio | **Yes** | Dev/admin DB UI |
| PostgREST | **No** (app paths) | Go already is the API |
| Realtime | **No** (v1) | Phase 4 collab via **Go WebSockets** |
| Storage | **Later** | Library assets, exports |

---

## Phase 2 implementation order

1. Docker Compose for self-hosted Supabase (dev VPS)
2. SQL migrations + `PostgresStore` replacing `MemoryStore`
3. JWT middleware on Go HTTP + MCP
4. Web login flow; `VvsApi` sends Bearer token; cloud save/load as source of truth when authenticated
5. Backups (`pg_dump` or volume snapshots), prod VPS, MCP URL + auth in Connect AI modal

Phase 3 adds **pgvector** on the same Postgres. Phase 4 adds **Go WebSocket** collab with an operation log on top of document storage.

---

## Local development (unchanged)

```powershell
.\tools\start_app.ps1
```

- Sets `NEXT_PUBLIC_API_MODE=http`
- Starts Go (in-memory store until `PostgresStore` ships) + Next.js
- MCP: `http://localhost:8080/mcp` (no auth in local Phase 1)

Optional: run Supabase Docker locally and point Go at `DATABASE_URL` when testing persistence.

### Cursor MCP

Copy `tools/mcp.cursor.example.json` → `.cursor/mcp.json` or merge into `%USERPROFILE%\.cursor\mcp.json`. See [setup.md](setup.md).

---

## Operations checklist (live VPS)

- [ ] Pin Supabase Docker image versions
- [ ] Separate secrets for dev vs prod
- [ ] Daily Postgres backups
- [ ] Health checks: Go `/health`, Postgres, disk
- [ ] Rate limits on MCP tool calls
- [ ] TLS on all public endpoints

---

## Related docs

| Doc | Topic |
|-----|--------|
| [roadmap.md](roadmap.md) | Phase timelines |
| [current_state.md](current_state.md) | What is implemented today |
| [ui_api_delivery_loop.md](ui_api_delivery_loop.md) | Wiring UI to Go API |
| [setup.md](setup.md) | Local toolchain |
| [syntax_pack_architecture.md](syntax_pack_architecture.md) | Transpiler / packs (unchanged by deploy) |
