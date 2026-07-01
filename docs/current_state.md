# VVS 2.0 — Current Implementation State

This document is the **canonical snapshot** of what exists in the repo today versus what is still planned. Update this file whenever the UI shell or integration boundaries change.

**Public repository:** Vision, roadmap, origin story, and contribution guide — [history.md](history.md), [vision.md](vision.md), [roadmap.md](roadmap.md), [../CONTRIBUTING.md](../CONTRIBUTING.md).

Last aligned with codebase: **July 2026** (graph system isolation + References view + centralized wiring).

---

## Development Approach

**UI-first skeleton** with **mock/temp data** and **no real backend integration** yet.

- Build structurally correct editor UX before wiring transpiler, persistence, or MCP.
- Mock APIs live in `apps/web/src/lib/api-mock.ts` (save/load to `localStorage` only).
- Status chrome must be **honest**: show offline/disconnected, not fake “connected” states.

---

## Repository Layout (Actual)

```text
VVS Web/
├── apps/web/              # Next.js 16 + React 19 — ONLY implemented app package
├── packages/              # Placeholder directories (empty) — NOT implemented yet
│   ├── transpiler/
│   ├── graph-types/
│   └── syntax-registry/
├── server/                # Go skeleton — domain types + ports only; no MCP/WS yet
├── docs/                  # Architecture, requirements, this file
├── tools/                 # start_app.ps1, setup_env.ps1
└── .agents/               # Agent skills + AGENTS.md
```

Types for the graph currently live in `apps/web/src/types/` until `packages/graph-types` is created.

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
│ TopNav: File · Edit · View · Canvas|References|Library · …   │
├──────────┬───────────────────────────────┬───────────────────┤
│ Project  │ GraphTabBar                   │ Properties        │
│ tree     │ GraphCanvas (React Flow)      ├───────────────────┤
│ (canvas  ├───────────────────────────────┤ Code preview      │
│  mode)   │ Output / compiler log         │ (mock codegen)    │
├──────────┴───────────────────────────────┴───────────────────┤
│ StatusBar: offline · target language · compile state         │
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
  └── CanvasWorkspace → GraphCanvas, RightSidebar, CodePreviewPanel

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
| Compile | TopNav | States: dirty → compiling → success/error |
| Play / Pause / Stop / Step | TopNav | `simulationState`; pause clears highlight; single-step when paused |
| Save / Load / Export / Import / New | File menu | Full `ProjectSnapshot` via `VvsApi` (mock `localStorage` by default) |
| Connect AI | TopNav modal | MCP URL copy; shows **disconnected** until backend exists |

**Removed:** `GraphToolbar` (compile/save were duplicated; toolbar removed).

### Right panel — Properties inspector

Context-aware (`ProjectContext.selection`):

| Selection | Panel |
|-----------|-------|
| Nothing / graph | `GraphPropertiesPanel` — module name, extends, description, **target language**, auto-generate |
| Variable | `VariablePropertiesPanel` |
| Node | `NodePropertiesPanel` |

Target languages in UI: **Python, JavaScript, C++, Verse, Graph JSON** (mock string templates in `CodePreviewPanel` — not real transpiler output yet).

### Graph editor features

Shell and core interactions are in place. **Remaining UI gaps:** [`.agents/memory/incomplete-ui.md`](../.agents/memory/incomplete-ui.md) — **41/47 done**; next Section 7 (status chrome / A2).

| Feature | Status |
|---------|--------|
| React Flow canvas, custom nodes/edges | Done |
| Context menu node spawn (`nodeCatalog.ts`) | Done |
| Call Function nodes (Project palette) | Done — `projectNodeCatalog.ts`, `linkedGraphId` on nodes |
| Pin type validation on connect | Done |
| Wire / cross-graph cycle prevention | Done — `graphCycles.ts`, `graphRelations.ts` |
| Variable/function lists in explorer | Done — **ProjectTree** (UE-style categories), dual navigation modes |
| Generated export folder (left panel) | Done — `Generated` section lists per-graph output files |
| Reference viewer (top-level view) | Done — `ReferencesView`, UE5 focus graph + tree |
| Project breadcrumb | Done — `GraphBreadcrumb` above tab bar |
| Graph tabs (main / function / macro) | Done — per-tab documents + `GraphTabMetadata` |
| Undo/redo | Done |
| Comment nodes + grouping | Done — color, ungroup, inspector label |
| Drag variable → spawn Get/Set | Done |
| Reroute pins | Done — `vvs_reroute_node` |
| Copy/paste / Cut / Duplicate | Partial — in-app only (U12 open) |
| Simulation stepping | Done — mock highlight, pause, single-step |
| Pin geometry (distinct shapes) | Done — incl. `data_array` |
| Mock project save/load | Done — `ProjectSnapshot` |
| Generate / validation pipeline | Partial — `graphValidator.ts` + `mockCodegen.ts`; real transpiler TBD |
| Code preview | Done — reads active tab document snapshot; mock codegen |
| Error navigation | Done — validator log / status bar → canvas node |
| Library install flow | Done — install, detail panel, open in project (U25–U28) |
| Connect AI / health chrome | Open — U29–U31 |
| File New / Import JSON | Done — U16, U17 |
| `VvsApi` facade | Done — `lib/api/` (U20 / A1) |
| Graph domain isolation | Done — `GraphWorkspaceHost`, split `ReactFlowProvider`s |

### Mock data sources

| Data | File |
|------|------|
| Node spawn catalog | `apps/web/src/lib/nodeCatalog.ts` |
| Call Function palette | `apps/web/src/lib/projectNodeCatalog.ts` |
| Complex example (multi-graph) | `apps/web/src/lib/examples/complexExample.ts` |
| Mock codegen | `apps/web/src/lib/mockCodegen.ts` |
| Reference layout | `apps/web/src/lib/referenceGraphLayout.ts`, `referenceTree.ts` |
| Cross-graph index | `apps/web/src/lib/graphRelations.ts` |
| Cycle detection | `apps/web/src/lib/graphCycles.ts` |
| Wire validation / apply | `apps/web/src/lib/graphWiring.ts` |
| Demo graph | `apps/web/src/app/page.tsx` |
| Community library cards | `lib/libraryCatalog.ts`, `LibraryView.tsx` |
| Save/load | `apps/web/src/lib/api/` (`VvsApi` mock → `localStorage`; HTTP when `NEXT_PUBLIC_API_MODE=http`) |

---

## Not Implemented Yet

| System | Planned location | Status |
|--------|------------------|--------|
| Client-side transpiler (3-stage pipeline) | `packages/transpiler` | Empty package dir |
| Shared graph types package | `packages/graph-types` | Empty; types in `apps/web` |
| Syntax registry + IndexedDB cache | `packages/syntax-registry` | Empty |
| Real code generation | Transpiler → `CodePreviewPanel` | Mock templates only |
| Supabase auth / persistence | Go + Supabase | Not started |
| MCP server | `server/` Go | Port interfaces only |
| WebSocket collaboration | `server/` Go | Not started |
| PWA / offline sync | — | Not started |
| Community library backend | Supabase + pgvector | UI skeleton only |
| **UE6 editor plugin (Verse)** | `plugins/` (planned) | Roadmap — [roadmap.md](roadmap.md#phase-5--unreal-engine-6-editor-plugin-strategic) |

---

## Backend (`server/`) — Skeleton

- `internal/core/domain/graph.go` — domain models
- `internal/core/ports/services.go` — hexagonal port interfaces
- `cmd/vvs-server/main.go` — minimal HTTP stub (`GET /health` only)

No REST graph API, MCP, or WebSocket endpoints are live yet.

---

## Documentation Map

| Document | Use when |
|----------|----------|
| **`docs/history.md`** | Origin story — VVS 1 graduation project → VVS Web |
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
