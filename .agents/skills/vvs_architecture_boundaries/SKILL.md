---
name: VVS Architecture Boundaries
description: Triggers when creating new modules, adding dependencies, or establishing communication between different packages in the monorepo.
---

# Strict Monorepo Boundaries

- The transpiler (`packages/transpiler`) MUST be pure TypeScript with zero React dependencies.
- The Next.js frontend (`apps/web`) handles UI and React Flow.
- The Go backend (`server/`) handles REST API, WebSocket collaboration (Phase 4), and MCP server. See [`docs/current_state.md`](../../../docs/current_state.md).

# Shared packages (implemented)

| Package | Role |
|---------|------|
| `@vvs/graph-types` | `ProjectSnapshot` v2, symbols, `analyzeProject`, `pinCompatibility`, diagnostics |
| `@vvs/syntax-registry` | `core-pack.json`, `list`/`resolve`/`expandProjectSymbols`, `propertySchema` |
| `@vvs/language-profiles` | Portability matrix per target language |
| `@vvs/syntax-packs` | Versioned print templates, Rosetta goldens, fidelity linter |
| `@vvs/environment-templates` | OpenAPI/AsyncAPI import, environment manifests |
| `@vvs/transpiler` | analyze → lower (IR v2) → print → emit; web facade: `mockCodegen.ts` |

Web re-exports types from `@vvs/graph-types` — do not duplicate graph shapes in `apps/web`.

# Phase 2 persistence (locked)

Canonical: [`docs/deployment.md`](../../../docs/deployment.md)

```text
Next.js  →  VvsApi (Bearer JWT)  →  Go REST/MCP
Go       →  pgx pool             →  self-hosted Supabase Postgres (JSONB)
Auth     →  GoTrue (client login) + Go JWT middleware (API scope)
```

| Use | Do not use (app paths) |
|-----|------------------------|
| Go `ProjectStore` + `pgx` | PostgREST for project CRUD |
| GoTrue JWT on HTTP/MCP | `supabase-js` `.from('projects')` for save/load |
| Self-hosted Supabase Docker on VPS | Supabase Cloud as locked direction |
| Browser `@vvs/transpiler` for preview | Server round-trip for live codegen |

PostgREST may run in the Supabase stack but **VVS app code never calls it** for projects/graphs/compile.

# Interface-First System Boundaries

- The interface between Graph and Code Generation stays decoupled. Language/node definitions are **data-driven** (`core-pack.json` / syntax registry / syntax packs), not hardcoded in React.
- New node kinds = registry row + transpiler lowering — not canvas special cases.
- **`propertySchema`** defines inspector settings; **`properties`** on instances stores values; transpiler reads `properties` + pins only.

# Visual ↔ code fidelity

- **Text-shaped graphs (locked):** `docs/visual_to_text_fidelity.md` — canonical product direction
- **No implicit type coercion in transpiler** — use **Conversion** nodes on the graph
- **No Blueprint VM semantics** — no macro expand, latent delay without text, proprietary-runtime-only behavior
- **Third-party integration** — export must embed in any stack without VVS runtime
- Pin compatibility rules live in **`@vvs/graph-types`** (`pinCompatibility.ts`); editor and `analyzeProject` share them

# Graph UI isolation (frontend)

- **`GraphWorkspaceHost`** always mounted — document bridge; no React Flow
- **Separate `ReactFlowProvider`** per Canvas vs References view
- **`CodePreviewPanel`** uses `useGraphDocuments`, not shared RF store

See `docs/current_state.md` § Graph system architecture.

# Zero Cross-Pollination

- Domains communicate via typed interfaces (`graph-types`, OpenAPI, `VvsApi`). Never hardcode cross-domain assumptions.
- MCP tools in Go: thin wrappers over pure functions in `internal/core/services/` — pass `context` for `user_id`
- Transpiler never imports React, Next.js, or Go types
