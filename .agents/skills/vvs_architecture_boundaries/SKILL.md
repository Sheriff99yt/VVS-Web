---
name: VVS Architecture Boundaries
description: Triggers when creating new modules, adding dependencies, or establishing communication between different packages in the monorepo.
---

# Strict Monorepo Boundaries

- The transpiler (`packages/transpiler`) MUST be pure TypeScript with zero React dependencies.
- The Next.js frontend (`apps/web`) handles UI and React Flow.
- The Go backend (`server/`) handles REST API, WebSocket collaboration, and MCP server (registry HTTP shipped; full API TBD). See `docs/current_state.md`.

# Shared packages (implemented)

| Package | Role |
|---------|------|
| `@vvs/graph-types` | `ProjectSnapshot` v2, symbols, `analyzeProject`, `pinCompatibility`, diagnostics |
| `@vvs/syntax-registry` | `core-pack.json`, `list`/`resolve`, `propertySchema` helpers |
| `@vvs/language-profiles` | Portability matrix per target language |
| `@vvs/transpiler` | Codegen; consumed by web via `mockCodegen.ts` facade |

Web re-exports types from `@vvs/graph-types` — do not duplicate graph shapes in `apps/web`.

# Interface-First System Boundaries

- The interface between Graph and Code Generation stays decoupled. Language/node definitions are **data-driven** (`core-pack.json` / syntax registry), not hardcoded in React.
- New node kinds = registry row + transpiler lowering — not canvas special cases.
- **`propertySchema`** defines inspector settings; **`properties`** on instances stores values; transpiler reads `properties` + pins only.

# Visual ↔ code fidelity

- **Text-shaped graphs (locked):** `docs/visual_to_text_fidelity.md` — canonical product direction
- **No implicit type coercion in transpiler** — use **Conversion** nodes on the graph
- **No Blueprint VM semantics** — no macro expand, latent delay without text, proprietary-runtime-only behavior
- **Third-party integration** — export must embed in any stack without VVS runtime
- Pin compatibility rules live in **`@vvs/graph-types`** (`pinCompatibility.ts`); editor and `analyzeProject` share them

# Zero Cross-Pollination

- Domains communicate via typed interfaces (`graph-types`, OpenAPI, `VvsApi`). Never hardcode cross-domain assumptions.
- MCP tools in Go: thin wrappers over pure functions in `internal/core/`.
