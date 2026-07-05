# VVS 2.0 — Current Implementation State

This document is the **canonical snapshot** of what exists in the repo today versus what is still planned. Update this file whenever the UI shell or integration boundaries change.

**Public repository:** Vision, roadmap, origin story, and contribution guide — [history.md](history.md), [vision.md](vision.md), [roadmap.md](roadmap.md), [../CONTRIBUTING.md](../CONTRIBUTING.md).

Last aligned with codebase: **July 2026** (cross-language UI redesign — shared packages, function symbols, portability).

---

## Development Approach

**UI-first** with **shared analysis packages** (`@vvs/graph-types`, `@vvs/syntax-registry`, `@vvs/language-profiles`, `@vvs/transpiler`) consumed by the Next.js editor. Go server exposes registry JSON; full graph API / MCP transport still pending.

- Mock persistence: `apps/web/src/lib/api-mock.ts` (localStorage).
- Status chrome must be **honest**: show offline/disconnected, not fake “connected” states.

---

## Repository Layout (Actual)

```text
VVS Web/
├── apps/web/              # Next.js 16 + React 19 editor
├── packages/
│   ├── graph-types/       # ProjectSnapshot v2, symbols, analyzeProject, Diagnostic
│   ├── syntax-registry/   # core-pack.json, list/resolve/expandProjectSymbols
│   ├── language-profiles/ # per-target portability matrix + analyzePortability
│   └── transpiler/        # codegen pipeline (analyze → lower → emit scaffold)
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

**Removed from product UI** (dev/meta content — do not re-add as in-app tabs):

- ~~Roadmap~~ (internal phases belong in `docs/`, not the editor)
- ~~Integrations~~ (MCP connection is via **Connect AI** modal in TopNav)

### Canvas layout mode

When **Canvas** is active, the full editor chrome is visible:

```text
┌──────────────────────────────────────────────────────────────┐
│ TopNav: File · Edit · View · Auto Generate|Save · Generate … │
├──────────┬───────────────────────────────┬───────────────────┤
│ Project  │ GraphTabBar                   │ Code preview      │
│ tree     │ GraphCanvas (React Flow)      │ (mock codegen)    │
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
| Node | `NodePinsPanel` — execution/data pins, inline values, linked graph target; event define/dispatch binding |

Graph-level settings (module name, target language) → breadcrumb **settings** modal (`GraphSettingsModal`).

Target languages in UI: **Python, JavaScript, C++, Verse, Graph JSON**. Codegen runs in **`@vvs/transpiler`** (facade: `apps/web/src/lib/mockCodegen.ts`). Portability warnings per target: **`docs/language_profiles.md`**.

### Graph editor features

Shell and core interactions are in place. **UI backlog:** [`.agents/memory/incomplete-ui.md`](../.agents/memory/incomplete-ui.md) — **48/48 done** (July 2026).

| Feature | Status |
|---------|--------|
| React Flow canvas, custom nodes/edges | Done |
| Context menu node spawn (`nodeCatalog.ts` → registry) | Done |
| Unified node registry (`@vvs/syntax-registry`) | Done — `core-pack.json`, `list`/`resolve`/`expandProjectSymbols` |
| Call Function nodes (`vvs.project.call_function` + `graphBinding`) | Done |
| Function symbols + overloads (`FunctionSymbol`, snapshot v2) | Done — tree, inspector, pin sync |
| Pin type validation on connect | Done |
| Wire / cross-graph cycle prevention | Done — `graphCycles.ts`, `graphRelations.ts` |
| Linear flow chains (break on middle rewire) | Done — `graphWiring.ts` + editor warning |
| Extract selection to function | Done — `extractToFunction.ts`, Ctrl+Shift+E |
| Variable/function/event lists in explorer | Done — **ProjectTree** (overload rows, macro labels) |
| Generated export folder (left panel) | Done — `Generated` section lists per-graph output files |
| Reference viewer (top-level view) | Done — `ReferencesView`, UE5 focus graph + tree |
| Project breadcrumb | Done — `GraphBreadcrumb` above tab bar |
| Graph tabs (main / function / macro) | Done — per-tab documents + `GraphTabMetadata` |
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
| Connect AI / health chrome | Done — `useApiHealth`, `VvsApi.probeMcp`, honest offline MCP |
| File New / Import JSON | Done |
| `VvsApi` facade | Done — `lib/api/` |
| Graph domain isolation | Done — `GraphWorkspaceHost`, split `ReactFlowProvider`s |
| Shared monorepo packages | Done — `graph-types`, `syntax-registry`, `language-profiles`, `transpiler` |

### Mock data sources

| Data | File / package |
|------|----------------|
| Core node pack | `packages/syntax-registry/core-pack.json` |
| Spawn catalog (web) | `apps/web/src/lib/nodeCatalog.ts` → `buildCoreCategories()` |
| Project call palette | `apps/web/src/lib/projectNodeCatalog.ts` → `expandProjectSymbols()` |
| Complex example (multi-graph) | `apps/web/src/lib/examples/complexExample.ts` |
| Codegen | `packages/transpiler` — web facade: `apps/web/src/lib/mockCodegen.ts` |
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

## Not Implemented Yet

| System | Planned location | Status |
|--------|------------------|--------|
| Full IR pipeline (lower/emit split) | `packages/transpiler` | **Partial** — `generate.ts` monolith; `analyze/` scaffolded; per-language emit modules TBD |
| Label-free legacy migration | apps/web hot paths | **Partial** — registry + `kindId` on spawn; label adapters remain for old saves |
| Ambiguous overload resolver UI | Call node details | **Partial** — binding/sync done; overload dropdown when wired TBD |
| `language-profiles/profiles/*.json` | packages | Profiles in TypeScript today; JSON packs optional |
| Supabase auth / persistence | Go + Supabase | Not started |
| MCP server transport | `server/` Go | **Partial** — `ListAvailableNodes` pure fn + HTTP `/registry/*`; no MCP wire protocol |
| WebSocket collaboration | `server/` Go | Not started |
| PWA / offline sync | — | Not started |
| Community library backend | Supabase + pgvector | UI skeleton only |
| **UE6 editor plugin (Verse)** | `plugins/` (planned) | Roadmap — [roadmap.md](roadmap.md#phase-5--unreal-engine-6-editor-plugin-strategic) |

---

## Backend (`server/`) — Skeleton + registry

- `internal/core/domain/graph.go` — nodes, `GraphBinding`, `FunctionSymbol`
- `internal/core/domain/snapshot.go` — `ProjectSnapshot` v2 mirror
- `internal/core/registry/` — embedded `core-pack.json`, `ListAvailableNodes()` + tests
- `internal/core/ports/services.go` — hexagonal port interfaces
- `cmd/vvs-server/main.go` — `GET /health`, `GET /registry/nodes`, `GET /registry/core-pack`

No REST graph API, MCP wire protocol, or WebSocket endpoints are live yet.

---

## Documentation Map

| Document | Use when |
|----------|----------|
| **`docs/history.md`** | Origin story — VVS 1 graduation project → VVS Web |
| **`docs/node_system.md`** | Node registry, ports, pin types, symbols, portability (§13), transpile contract |
| **`docs/language_profiles.md`** | Per-target native/emulated/unsupported features + warning semantics |
| **`docs/vision.md`** | Product philosophy, UE6/Verse direction, logic/syntax model |
| **`docs/roadmap.md`** | Public phased roadmap (including UE6 plugin) |
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

**Do not** surface `project_requirements.md` Phase tables as in-app UI (no Roadmap tab).

---

## UI Revision Decisions (Locked)

These were intentionally removed or relocated during the July 2026 UI revision:

1. **Roadmap tab** → docs only
2. **Integrations tab** → Connect AI modal only
3. **Library local node browser** → context menu + `nodeCatalog.ts`
4. **GraphToolbar** → compile/simulation in TopNav; save in File menu
5. **Fake connected status** → honest offline/disconnected chrome
6. **Target language in code panel** → moved to Graph Properties
7. **Library view with side panels visible** → full-width Library mode
8. **References in left project panel** → top-level **References** view; tree drives focus via `focusReference()`
9. **Shared React Flow provider for edit + reference** → separate providers; `GraphWorkspaceHost` always mounted for documents
