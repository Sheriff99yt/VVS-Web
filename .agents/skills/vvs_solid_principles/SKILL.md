---
name: VVS SOLID Principles
description: Applies SOLID design principles to the VVS monorepo (apps/web, server, packages/transpiler). Triggers when refactoring, reviewing architecture, adding modules, splitting responsibilities, or when the user mentions SOLID, separation of concerns, or maintainable design.
---

# VVS SOLID Principles

Apply SOLID **in VVS terms** — mapped to our monorepo boundaries, naming, and delivery loop. Full examples: [reference.md](reference.md).

Companion rules: `docs/naming_and_product_direction.md` · `docs/ui_api_delivery_loop.md` · `.agents/AGENTS.md`

---

## Quick map (VVS)

| Principle | VVS rule of thumb |
|-----------|-------------------|
| **S** Single Responsibility | One reason to change per module: UI renders, hooks hold graph state, `VvsApi` talks to backend, transpiler stages stay separate |
| **O** Open/Closed | New **language** = registry + emitter; new **node kind** = registry + lowering with **visible** text — never hidden transforms (no macro expand, no fold) |
| **L** Liskov Substitution | Mock and HTTP transports implement the same `VvsApi` contract; any `GraphRepository` impl must honor port semantics |
| **I** Interface Segregation | Small ports (`GraphRepository`, `LibraryRepository`) — no god-interface on the frontend context |
| **D** Dependency Inversion | UI → `VvsApi` → transport; Go handlers → services → ports; transpiler → IR interfaces, not React |

---

## S — Single Responsibility

**One module, one job.**

| Layer | Owns | Must not own |
|-------|------|--------------|
| `components/graph/*` | Render nodes, wires, menus | HTTP, transpile, persistence |
| `hooks/useGraphState` | Nodes/edges state, undo snapshots | API calls, code generation |
| `contexts/ProjectContext` | Selection, tabs, compile flags | Fetching projects from server |
| `lib/api/*` | Transport + facade | React UI |
| `packages/transpiler` | Graph → IR → code string | React, DOM, fetch |
| `server/.../transport/http` | Parse request, write response | SQL, business rules |
| `server/.../services` | Pure domain logic | `http.ResponseWriter`, MCP JSON-RPC |

**Smell in VVS:** `TopNav` calling `fetch` directly; `CodePreviewPanel` embedding transpiler DAG logic; Go `main.go` growing business rules.

**Fix:** Extract to `VvsApi`, transpiler package, or `internal/core/services`.

---

## O — Open/Closed

**Extend behavior without modifying stable core.**

**Aligned patterns:**
- **Languages:** JSONB syntax rows + emitter **strategy** per language — add Python without changing DAG sort
- **API transport:** New `VvsApi` backend (e.g. WebSocket sync) behind same facade methods
- **Node types:** Data in `nodeCatalog` / registry — context menu reads catalog, not hardcoded switch in `GraphCanvas`
- **MCP tools:** New tool = new thin handler calling existing service function

**Violation:** `if (targetLanguage === 'python') { ... } else if ...` scattered across UI components instead of one generator entry point.

---

## L — Liskov Substitution

**Implementations must be interchangeable without breaking callers.**

| Abstraction | Implementations must… |
|-------------|------------------------|
| `VvsApi` (mock / http) | Same return types, same errors for missing project |
| `GraphRepository` (memory / Supabase) | `GetGraph` / `SaveGraph` honor same invariants |
| Transpiler emitter | Same IR in → valid code out; no emitter that skips validation others enforce |

**Smell:** Mock save succeeds but HTTP save returns a different JSON shape — UI breaks when toggling `NEXT_PUBLIC_API_MODE`.

---

## I — Interface Segregation

**Depend only on methods you use.**

**Go:** Keep `server/internal/core/ports` split — do not merge `GraphRepository`, `LibraryRepository`, `WebSocketHub`, `MCPServer` into one mega-interface.

**Frontend:** Avoid a single `useApp()` god hook exporting 40 fields. Prefer `useProject()` for project scope; graph hooks for canvas.

**Transpiler:** Stage interfaces stay narrow — analyzer does not expose emitter APIs.

**Smell:** Component imports all of `ProjectContext` only to read `targetLanguage`.

---

## D — Dependency Inversion

**High-level policy depends on abstractions, not details.**

```text
UI components  →  VvsApi (abstraction)
                      ↓
              mock.ts | client.ts (details)

HTTP handlers  →  GraphService (abstraction)
                      ↓
              GraphRepository (port)
                      ↓
              postgres | memory (details)

Transpiler       →  Emitter interface
                      ↓
              PythonEmitter | JavaScriptEmitter
```

**Rules:**
- No `import { MockApi }` in components — use `VvsApi` only (`docs/ui_api_delivery_loop.md`)
- Go MCP tools call `services.*`, never SQL inline
- Transpiler never imports `@xyflow/react` or `next/*`

---

## Pre-commit checklist

Before merging structural changes:

- [ ] **S:** Can I name this file's single job in one sentence?
- [ ] **O:** Would a new language/node/API need to *edit* this file, or only *add* alongside it?
- [ ] **L:** Can mock and real impl swap without UI changes?
- [ ] **I:** Is this interface/client surface minimal for callers?
- [ ] **D:** Does UI/server/transpiler depend on abstractions, not Postgres/React/fetch details?
- [ ] Naming: no engine jargon per `docs/naming_and_product_direction.md`
- [ ] Boundaries: no cross-package imports violating `.agents/AGENTS.md`

---

## When reviewing a PR

Report SOLID issues as:

- **SRP:** "Move X out of Y — Y should only …"
- **OCP:** "Add strategy/registry instead of extending switch in …"
- **LSP:** "Mock and HTTP disagree on …"
- **ISP:** "Split interface — caller only needs …"
- **DIP:** "Depend on port/facade, not concrete …"

---

## Additional resources

- Per-layer examples and anti-patterns: [reference.md](reference.md)
