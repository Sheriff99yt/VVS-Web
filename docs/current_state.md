# VVS 2.0 — Current Implementation State

This document is the **canonical snapshot** of what exists in the repo today versus what is still planned. Update this file whenever the UI shell or integration boundaries change.

**Public repository:** Vision, roadmap, origin story, and contribution guide — [history.md](history.md), [vision.md](vision.md), [roadmap.md](roadmap.md), [../CONTRIBUTING.md](../CONTRIBUTING.md).

Last aligned with codebase: **July 2026** (text-shaped graphs direction locked; syntax pack architecture shipped).

**Product direction:** [visual_to_text_fidelity.md](visual_to_text_fidelity.md) — every behavioral node maps to honest generated text; no Blueprint VM semantics.

---

## Development Approach

**UI-first** with **shared analysis packages** and **text-shaped codegen fidelity** ([visual_to_text_fidelity.md](visual_to_text_fidelity.md)).

- Mock persistence: `apps/web/src/lib/api-mock.ts` (localStorage).
- Status chrome must be **honest**: show offline/disconnected, not fake “connected” states.

---

## Repository Layout (Actual)

```text
VVS Web/
├── apps/web/              # Next.js 16 + React 19 editor
├── packages/
│   ├── graph-types/       # ProjectSnapshot v2, symbols, analyzeProject, CodegenTarget, Diagnostic
│   ├── syntax-registry/   # core-pack.json, list/resolve/expandProjectSymbols
│   ├── language-profiles/ # per-target portability matrix + capabilities + analyzePortability
│   ├── syntax-packs/      # versioned print templates, Rosetta goldens, fidelity linter
│   └── transpiler/        # analyze → lower (structured IR v2) → print → emit
├── server/                # Go — domain v2 types, registry HTTP, tests
├── docs/                  # Architecture, language_profiles.md, this file
├── tools/                 # start_app.ps1, setup_env.ps1
└── .agents/               # Agent skills + AGENTS.md
```

Web types re-export from `@vvs/graph-types` (`apps/web/src/types/graph.ts`, `projectSnapshot.ts`).

---

## Frontend (`apps/web`) — Implemented

### App views (TopNav)

| View | Purpose |
|------|---------|
| **Canvas** | Primary graph editor (default) |
| **References** | UE5-style reference viewer — focus center, referencers left, dependencies right |
| **Library** | Community marketplace UI (Phase 3 feature — mock data only) |
| **Roadmap** | In-app development roadmap — shipped features vs coming soon |

**Removed from product UI** (do not re-add as duplicate surfaces):

- ~~Integrations~~ (MCP connection is via **Connect AI** modal in TopNav)

### Canvas layout mode

When **Canvas** is active, the full editor chrome is visible:

```text
┌──────────────────────────────────────────────────────────────┐
│ TopNav: File · Edit · View · Auto Generate|Save · Generate … │
├──────────┬───────────────────────────────┬───────────────────┤
│ Project  │ GraphTabBar                   │ Code preview      │
│ tree     │ GraphCanvas (React Flow)      │ (@vvs/transpiler) │
│ (canvas  │ + floating details (top-right)│                   │
│  mode)   │ + floating compiler log (br)  │                   │
├──────────┴───────────────────────────────┴───────────────────┤
│ StatusBar: offline · Log toggle · target language · compile  │
└──────────────────────────────────────────────────────────────┘
```

### References layout mode

When **References** is active, Canvas chrome is **unmounted** (no edit React Flow instance). A dedicated layout shows:

```text
┌──────────────────────────────────────────────────────────────┐
│ TopNav                                                       │
├──────────┬───────────────────────────────┬───────────────────┤
│ Project  │ Reference graph (read-only    │ Reference tree    │
│ tree     │ React Flow — own provider)    │ (hierarchy)       │
│ (ref     │ UE5 focus + depth/type filters│                   │
│  mode)   │                               │                   │
└──────────┴───────────────────────────────┴───────────────────┘
```

- Single-click in left tree **focuses** the reference graph (does not switch views).
- Double-click **opens** the graph in Canvas.

### Library layout mode

When **Library** is active, only TopNav + full-width `LibraryView` + StatusBar are shown. Side panels and output console are **hidden**.

Library sections:

- **Discover** — browse/install community scripts (mock cards)
- **Installed** — empty state placeholder

Local spawnable nodes are **not** listed in Library. They come from `nodeCatalog.ts` via the canvas **context menu** only.

---

## Graph system architecture (isolated domains)

Edit canvas and reference viewer **must not share one React Flow store**. Implementation:

```text
ProjectProvider
└── GraphWorkspaceProvider          ← document bridge API
    └── GraphWorkspaceHost          ← ALWAYS mounted; no React Flow
        ├── useGraphState           ← live nodes/edges for active edit tab
        ├── useGraphTabSync         ← Map<tabId, GraphDocument>
        ├── registerWorkspace()     ← getDocuments, subscribeMetadata, …
        └── GraphEditContext        ← consumed by GraphCanvas when mounted

Canvas view (mounted only when active):
  ReactFlowProvider (edit)
  └── CanvasWorkspace → GraphCanvas, CodePreviewPanel

References view (mounted only when active):
  ReactFlowProvider (reference)
  └── ReferenceGraphCanvas (read-only layout)
```

| Layer | File | Role |
|-------|------|------|
| Document host | `components/graph/GraphWorkspaceHost.tsx` | Tab documents, undo, compile dirty, workspace registration |
| Edit state context | `contexts/GraphEditContext.tsx` | Nodes/edges API for `GraphCanvas` |
| Workspace bridge | `contexts/GraphWorkspaceContext.tsx` | `getDocuments()` for References without owning RF |
| Active view | `contexts/EditorViewContext.tsx` | `canvas` / `references` / `library` |
| Document snapshots | `hooks/useGraphDocuments.ts` | Subscribes to workspace metadata revisions |
| Reference layout | `lib/referenceGraphLayout.ts` | UE5 horizontal layout (referencers ← focus → dependencies) |
| Cycle guards | `lib/graphCycles.ts`, `lib/graphRelations.ts` | Wire + cross-graph dependency cycle prevention |

**Agent rules:**

- Do **not** wrap edit + reference canvases in one top-level `ReactFlowProvider`.
- `CodePreviewPanel` reads documents via `useGraphDocuments`, not React Flow `useStore`.
- `referenceRootGraphId` updates via `focusReference()` only — not from `activeGraphTab`.
- `GraphExplorer` / `ProjectTree` uses `mode: 'canvas' | 'references'` for single-click behavior.
- `useGraphTabSync` debounces metadata notify on edits; prunes closed tabs from `documentsRef`.

Orphan: `components/layout/ReferenceViewer.tsx` — superseded by `ReferencesView`; do not re-add to left panel.

---

### TopNav actions (Canvas only)

| Control | Location | Notes |
|---------|----------|-------|
| **Auto Generate** toggle | TopNav | When on, debounced compile on graph dirty; when off, use **Generate** or Ctrl+G |
| **Auto Save** toggle | TopNav | When on, code preview stays synced with the graph; when off, use **Save** or Ctrl+Shift+S |
| **Save** | TopNav | Sync code preview with current graph (not project JSON) |
| Validate & compile | Edit menu (Ctrl+G) | `runProjectAnalysis()` — structural + semantic + portability; transpile only if no errors |
| Save project | File menu (Ctrl+S) | Persist **ProjectSnapshot v2** JSON |
| Connect AI | TopNav modal | MCP URL copy + **Test connection**; MCP stays disconnected in mock mode |
| Extract to function | View menu (Ctrl+Shift+E) | Selected nodes → new function graph + Call node |

**Floating panels** (canvas overlay, shared `FloatingPanelShell`):

| Panel | Corner | Compact | Expanded |
|-------|--------|---------|----------|
| Details | top-right | One-line summary | Full property forms |
| Compiler log | bottom-right | Last 3 log lines | Full log with sources |

StatusBar **Log** toggles the floating compiler log (auto-opens on compile/validation errors).

**Removed:** mock Play/Pause simulation controls (no real runtime yet). `GraphToolbar` and bottom-docked output console also removed.

### Properties inspector (floating)

Context-aware (`ProjectContext.selection`), shown on graph canvas when something is selected. **Expanded/collapsed state persists** across selection changes. Non-codegen fields (description, node id, comments) are excluded — focus is **pins and codegen parameters**. Graph module settings open from breadcrumb **settings** icon (modal).

| Selection | Panel |
|-----------|-------|
| Variable | `VariablePropertiesPanel` — name, type, binding (instance/static), readonly, default |
| Event | `EventPropertiesPanel` — handler name, parameters (`SymbolParameterEditor`) |
| Function | `FunctionPropertiesPanel` — name, binding, visibility, overloads, return type, flags |
| Node | `PropertySchemaPanel` (when kind defines `propertySchema`) + `NodePinsPanel` — pins, inline values, linked graph; event define/dispatch binding plugin |

Graph-level settings (module name, target language) → breadcrumb **settings** modal (`GraphSettingsModal`).

Target languages in UI: **Python, JavaScript, C++, Verse, Graph JSON**. Codegen runs in **`@vvs/transpiler`** (facade: `apps/web/src/lib/mockCodegen.ts`). Portability warnings per target: **`docs/language_profiles.md`**.

### Graph editor features

Shell and core interactions are in place. **UI backlog:** [`.agents/memory/incomplete-ui.md`](../.agents/memory/incomplete-ui.md) — **48/48 done** (July 2026).

| Feature | Status |
|---------|--------|
| React Flow canvas, custom nodes/edges | Done |
| Context menu node spawn (`nodeCatalog.ts` → registry) | Done |
| Unified node registry (`@vvs/syntax-registry`) | Done — `core-pack.json`, `list`/`resolve`/`expandProjectSymbols`, `propertySchema` |
| Get User Input node (`action_get_input`) | Done — registry kind, schema-driven Settings, Python/JS/C++/Verse emit |
| Conversion nodes (`convert_to_string`, `convert_to_number`) | Done — explicit per-language calls, source-map highlights, no implicit casts |
| Pin type validation on wires | Done — `PIN_TYPE_MISMATCH` in `@vvs/graph-types` analyze; shared with editor wiring |
| Example templates (Hello World, Calculator) | Done — `simpleExample.ts`, `complexExample.ts`, integrity tests |
| Example template integrity tests | Done — `complexExample.test.ts` (analyze + wiring + 4-language codegen) |
| Call Function nodes (`vvs.project.call_function` + `graphBinding`) | Done |
| Function symbols + overloads (`FunctionSymbol`, snapshot v2) | Done — tree, inspector, pin sync |
| Pin type validation on connect | Done |
| Wire / cross-graph cycle prevention | Done — `graphCycles.ts`, `graphRelations.ts` |
| Linear flow chains (break on middle rewire) | Done — `graphWiring.ts` + editor warning |
| Extract selection to function | Done — `extractToFunction.ts`, Ctrl+Shift+E |
| Variable/function/event lists in explorer | Done — **ProjectTree** (overload rows, subscriber counts) |
| Generated export folder (left panel) | Done — `Generated` section lists per-graph output files |
| Reference viewer (top-level view) | Done — `ReferencesView`, UE5 focus graph + tree |
| Project breadcrumb | Done — `GraphBreadcrumb` above tab bar |
| Graph tabs (main / function) | Done — per-tab documents + `GraphTabMetadata`; legacy macro tabs migrate on load |
| Undo/redo | Done |
| Comment nodes + grouping | Done — color, ungroup, inspector label |
| Drag variable → spawn Get/Set | Done |
| Reroute pins | Done — `vvs_reroute_node` |
| Copy/paste / Cut / Duplicate | Done — in-app + system clipboard (`graphClipboard.ts`) |
| Simulation stepping | Done — mock highlight, pause, single-step |
| Pin geometry (distinct shapes) | Done — incl. `data_array`; inline pin widgets |
| Mock project save/load | Done — `ProjectSnapshot` v2 + v1 normalizer |
| Shared analysis pipeline | Done — `analyzeProject` + `analyzePortability` → compiler log / status / code badge |
| Generate / validation pipeline | Done — `projectAnalysis.ts` + `@vvs/transpiler`; errors block compile |
| Code preview | Done — CodeMirror 6; `sourceMap` selection highlight; portability warning badge |
| Error navigation | Done — validator log / status bar → canvas node |
| Library install flow | Done — install, detail panel, open in project |
| Connect AI / health chrome | Done — `useApiHealth`, `VvsApi.probeMcp` (HTTP `/mcp` + health fallback), Phase 1 local MCP copy |
| Call overload picker | Done — `CallNodeOverloadPanel` in floating details when `func.overloads.length > 1` |
| Syntax pack lock UI | Done — `SyntaxPackLockPanel` in graph settings → `.vvs/project.json` |
| OpenAPI / AsyncAPI import UI | Done — `EnvironmentImportModal` (Library + graph settings); `VvsApi.importEnvironment` |
| HTTP project API (frontend) | Done — `VvsApi.listProjects`, `compileProject`, save/load when `NEXT_PUBLIC_API_MODE=http` |
| Stable folder reopen key | Done — `folderKeyFromHandleName()` dedupes recents by folder name hash |
| File New / Import JSON | Done |
| `VvsApi` facade | Done — `lib/api/` |
| Graph domain isolation | Done — `GraphWorkspaceHost`, split `ReactFlowProvider`s |
| Shared monorepo packages | Done — `graph-types`, `syntax-registry`, `language-profiles`, `syntax-packs`, `transpiler` |
| Syntax packs + Rosetta suite | Done — `@vvs/syntax-packs` base JSON packs, capability overlays, golden tests, fidelity linter — [syntax_pack_architecture.md](syntax_pack_architecture.md) |
| Structured IR v2 + print layer | Done — language-neutral `lower/graphToIr.ts`, `print/` registry, hybrid JSON + TS emit |

### Mock data sources

| Data | File / package |
|------|----------------|
| Core node pack | `packages/syntax-registry/core-pack.json` |
| Spawn catalog (web) | `apps/web/src/lib/nodeCatalog.ts` → `buildCoreCategories()` |
| Project call palette | `apps/web/src/lib/projectNodeCatalog.ts` → `expandProjectSymbols()` |
| Complex example (multi-graph) | `apps/web/src/lib/examples/complexExample.ts` |
| Codegen | `packages/transpiler` + `@vvs/syntax-packs` — web facade: `apps/web/src/lib/mockCodegen.ts` |
| Rosetta fixtures | `packages/syntax-packs/rosetta/` — print, branch, assign, call, convert, dispatch, wait (+ `.golden.txt` per family) |
| Syntax pack lock | `.vvs/project.json` → optional `syntaxPackLock` on `VvsProjectManifest` |
| Project analysis | `packages/graph-types` (`analyzeProject`) + `packages/language-profiles` |
| Web analysis wrapper | `apps/web/src/lib/projectAnalysis.ts` |
| Reference layout | `apps/web/src/lib/referenceGraphLayout.ts`, `referenceTree.ts` |
| Cross-graph index | `apps/web/src/lib/graphRelations.ts` |
| Cycle detection | `apps/web/src/lib/graphCycles.ts` |
| Wire validation / apply | `apps/web/src/lib/graphWiring.ts` |
| Function pin sync | `apps/web/src/lib/functionHelpers.ts` |
| Extract to function | `apps/web/src/lib/extractToFunction.ts` |
| Community library cards | `lib/libraryCatalog.ts`, `LibraryView.tsx` |
| Save/load | `apps/web/src/lib/api/` (`VvsApi` mock → `localStorage`) |

### Running tests

From repository root (Bun workspaces):

```bash
bun install
bun test packages
cd apps/web && bun test src/lib
cd server && go test ./...
```

---

## Transpiler & syntax packs (shipped)

Three-stage pipeline with a **decoupled print layer** — see [syntax_pack_architecture.md](syntax_pack_architecture.md).

```text
Graph → analyze/ → lower/graphToIr (structured IR v2, IR_VERSION=2)
                 → print/ (PrinterRegistry + @vvs/syntax-packs templates)
                 → emit/ (module layout, events, hoisting, multi-file)
```

| Component | Location | Status |
|-----------|----------|--------|
| Structured IR | `packages/transpiler/src/ir/types.ts` | Done — `IrExpr` tree, structured stmts; wave-1 `IrEmittedStmt` deprecated |
| Language-neutral lowering | `packages/transpiler/src/lower/graphToIr.ts` | Done — no target-language strings in lower/ |
| Print registry | `packages/transpiler/src/print/` | Done — resolves syntax packs before TS printer fallback |
| Base syntax packs | `packages/syntax-packs/src/packs/*.base.json` | Done — python, javascript, cpp, verse |
| Capability overlay | `javascript.es2022.json` | Done — proof of inherit-only version deltas |
| Rosetta goldens | `packages/syntax-packs/rosetta/` | Done — 7 constructs × 4 families; `bun run generate:rosetta` |
| Fidelity linter | `packages/syntax-packs/src/fidelity.ts` | Done — CI via `rosetta.test.ts` |
| CodegenTarget | `packages/graph-types/src/codegenTarget.ts` | Done — family + capabilities; UI still uses flat `TargetLanguage` |
| Tree-sitter parse CI | — | **Deferred** — validator-only role documented |

**Not started:** Go MCP tools for syntax pack maintenance (`list_syntax_packs`, `propose_syntax_delta`, etc.) — names documented in `packages/syntax-packs/README.md`.

---

| System | Planned location | Status |
|--------|------------------|--------|
| Macro tabs + `use_macro` | Removed — **Function + Call** only; migration on load ([visual_to_text_fidelity.md](visual_to_text_fidelity.md)) |
| Full IR pipeline (lower/emit split) | **Done** — structured IR v2 + `print/` + `emit/`; see [syntax_pack_architecture.md](syntax_pack_architecture.md) |
| Label-free legacy migration | apps/web + graph-types load | **Partial** — `kindId` backfill on load; binding-first `normalizeNodeData` |
| Ambiguous overload resolver UI | Call node details | **Done** — overload dropdown in floating details |
| Syntax pack MCP tools | `server/` Go | **Partial** — `GET /registry/syntax-packs` + catalog; full MCP wire + propose/run_rosetta TBD |
| Tree-sitter parse validation | CI | **Deferred** — optional validator, not syntax author |
| `language-profiles/profiles/*.json` | packages | Profiles in TypeScript today; JSON packs optional |
| Supabase auth / persistence | Go + **self-hosted Supabase** (`pgx`) | **Planned Phase 2** — [deployment.md](deployment.md); in-memory store today |
| MCP server transport | `server/` Go | **Done (local)** — SSE at `/mcp`; production JWT + VPS deploy Phase 2 |
| HTTP project REST | `server/` Go | **Done (local)** — in-memory `GET/PUT /api/projects`, `POST …/compile`; **PostgresStore** Phase 2 |
| WebSocket collaboration | `server/` Go | Not started — Go WS (not Supabase Realtime) |
| PWA / offline sync | — | Not started |
| Community library backend | Supabase + pgvector | UI skeleton only |
| **UE6 editor plugin (Verse)** | `plugins/` (planned) | Roadmap — [roadmap.md](roadmap.md#phase-5--unreal-engine-6-editor-plugin-strategic) |

---

## Backend (`server/`) — API, registry, local MCP

**Phase 2 target:** Self-hosted Supabase Postgres + GoTrue; Go persists via **`pgx`** — see [deployment.md](deployment.md).

- `internal/core/domain/graph.go` — nodes, `GraphBinding`, `FunctionSymbol`
- `internal/core/domain/snapshot.go` — `ProjectSnapshot` v2 mirror
- `internal/core/registry/` — embedded `core-pack.json`, environments, syntax-packs
- `internal/core/store/memory.go` — in-memory projects (Phase 1); **`PostgresStore` TBD**
- `internal/core/services/` — project, graph_edit, compile (pure functions)
- `internal/transport/http/` — projects, compile, CORS
- `internal/transport/mcp/` — MCP tools (thin wrappers)
- `cmd/vvs-server/main.go` — health, registry, `/api/projects`, `/mcp`

Frontend `NEXT_PUBLIC_API_MODE=http` calls project save/load/list/compile against Go. MCP URL: `http://localhost:8080/mcp` (local dev).

---

## Documentation Map

| Document | Use when |
|----------|----------|
| **`docs/history.md`** | Origin story — VVS 1 graduation project → VVS Web |
| **`docs/node_system.md`** | Node registry, ports, pin types, symbols, portability (§13), transpile contract |
| **`docs/syntax_pack_architecture.md`** | Syntax packs, IR v2, Rosetta, agent workflow, Tree-sitter validator-only |
| **`docs/language_profiles.md`** | Per-target native/emulated/unsupported features + warning semantics |
| **`docs/vision.md`** | Product philosophy, UE6/Verse direction, logic/syntax model |
| **`docs/roadmap.md`** | Public phased roadmap (including UE6 plugin) |
| **`docs/deployment.md`** | Self-hosted Supabase + Go VPS architecture (locked) |
| **`docs/current_state.md`** | What exists today; avoid re-introducing removed UI |
| **`docs/ui_api_delivery_loop.md`** | Wiring UI to APIs — one slice per iteration |
| `docs/naming_and_product_direction.md` | Vocabulary, product principles, terms to avoid |
| `docs/project_requirements.md` | Full requirements + phased roadmap (planning) |
| `docs/vvs_2_0_tech_stack.md` | Locked technology choices |
| `.agents/AGENTS.md` | Architecture rules for agents |
| `.agents/skills/vvs_ui_development/SKILL.md` | UI shell layout + design rules |
| `.agents/skills/vvs_progressive_disclosure/SKILL.md` | Show data when needed — collapse, reveal, idle inspector |
| `.agents/skills/vvs_solid_principles/SKILL.md` | SOLID principles for this monorepo |
| `.agents/memory/` | Agentic memory — decisions, loop progress, **incomplete UI backlog** |
| `.agents/skills/vvs_agentic_memory/SKILL.md` | When to read/update agent memory |

**Do not** duplicate `docs/roadmap.md` phase tables elsewhere in the app — the Roadmap view summarizes shipped vs planned features only.

---

## UI Revision Decisions (Locked)

These were intentionally removed or relocated during the July 2026 UI revision:

1. **Integrations tab** → Connect AI modal only
2. **Library local node browser** → context menu + `nodeCatalog.ts`
3. **GraphToolbar** → compile/simulation in TopNav; save in File menu
4. **Fake connected status** → honest offline/disconnected chrome
5. **Target language in code panel** → moved to Graph Properties
6. **Library view with side panels visible** → full-width Library mode
7. **References in left project panel** → top-level **References** view; tree drives focus via `focusReference()`
8. **Shared React Flow provider for edit + reference** → separate providers; `GraphWorkspaceHost` always mounted for documents
