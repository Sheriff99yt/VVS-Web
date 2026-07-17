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

# Canvas source of truth (locked)

**Canonical:** `docs/visual_to_text_fidelity.md` § Canvas is the source of truth · Trigger skill: `vvs_visual_code_fidelity/SKILL.md`

- **`@vvs/graph-types` `analyzeProject`** owns fidelity diagnostics — transpiler consumes `ir.members` only
- Do not move declaration emit into UI or symbol-table iteration — boundary is define chain → `buildIrMembers` → `appendIrMembers`
- Cross-package: panel dual-write lives in `apps/web`; analyzer codes live in `graph-types`; emit in `transpiler`

# Phase 2 persistence (locked)

# Persistence & hosting (client-first)

**Product:** local / folder / `.vvs/` / git + static Pages. **No dedicated server** as product ([roadmap.md](../../../docs/roadmap.md) · [decisions.md](../../memory/decisions.md)).

Legacy `server/` + Postgres/Auth may remain for experiments. If touching that path:

| Legacy experiment | Do not |
|-------------------|--------|
| Go `ProjectStore` + `pgx` (local only) | Treat VPS / Supabase Docker as open product work |
| GoTrue JWT on experimental HTTP/MCP | Require accounts for the default editor |
| Browser `@vvs/transpiler` for preview | Server round-trip for live codegen |

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
