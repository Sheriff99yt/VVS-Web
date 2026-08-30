# VVS Web — Current Implementation State

This document is the **canonical snapshot** of what exists in the repo today versus what is still planned. Update this file whenever the UI shell or integration boundaries change. Start is a VS Code-like activity rail + collapsible sidebar (Start includes recent; Examples); Library/Roadmap/Docs stay routes. Start main is hero + recent (actions stay in the sidebar unless it is collapsed). First visit to `/` opens a welcome overlay (Close hides this visit; Don't show again persists `startWelcomeDontShowAgain`). Separate from in-project canvas help.

**Public repository:** Vision, roadmap, origin story, and contribution guide — [history.md](history.md), [vision.md](vision.md), [roadmap.md](roadmap.md), [../CONTRIBUTING.md](../CONTRIBUTING.md).

Last aligned with codebase: **25 August 2026** (fourth honesty pass). Interactive live docs: **partial** (`/docs` catalog + node/feature pages from `CORE_NODE_REGISTRY`; `docsUrl()` / `docsPath()` with home hashes; same `StandaloneTopBar` as Library/Roadmap; `DocsInfoIcon` hover from registry on node headers, Details options, and modifier chips; click opens `/docs/nodes/{kindId}` or `#opt-{key}`). Overlay prose and playground are not shipped. Public Pages URL is `https://sheriff99yt.github.io/VVS-Web/docs` (`basePath` `/VVS-Web`; `/docs` on github.io without that prefix 404s). Custom domain (vvscodes.com on this same Pages project) is prepared via `VVS_CUSTOM_DOMAIN` (empty basePath + `SITE_ORIGIN`); **not flipped** until DNS is verified. App chrome uses the original vvscodes.com mark (`public/brand/VVS_White2.png`) in the Start and editor top bars, plus app icon / Open Graph. User-facing docs rewrite `3e1a2b2`. Bind leftover `eventName` hidden in Details (`f864100`). High-priority Research cards: `vscode-native-plugin`, `ue6-native-plugin` (`ccab00d`). Product law unchanged: client-first; eight generate targets (JavaScript is one target); Simple / Complex / Advanced home-preview goldens (U65); Rosetta = pack fixtures; `COA_SHIPPED` false; U93 research; Bind honest on csharp / javascript / gdscript only; Verse GetInput = Print + `(x)` + empty string; Library auth/upload frozen; no PWA; no VSIX this pile; UE6 not released as of 22 August 2026 (Epic public EA end of 2027 on the Research card).

Example completeness: Simple + Complex emit with zero leftover `(x)` on all 8 languages; Advanced runs on most (Verse GetInput leftover only). Complex covers branch / for / while / enum switch; Advanced covers Machine/Sensor Diagnose override + GetInput + Wait.
Symbol delete / deleteClass now remove function Define (`function_implement`) with Declare (`function_define`).

Shipped (August 2026): C++/call-site overload emit, language profile JSON packs, off-thread transpile worker, rust + Go console env (`env.rust.console-app`, `env.go.console-app`) + optional `devcontainer` ref (no Docker runtime), Library client token search + language chips (not embeddings; active chip stays at count 0; empty copy names search + chip). First-party templates **Done** (17 built-in env packs; Library lists all). Community catalog still Phase 3 (`library-backend`). Implements list + Class form shipped for csharp/rust (`form` + `implementsTypes`; python does not print Implements; Super stays first Extends parent). Added `env.csharp.data-script` and `env.go.http-service`. Backstage `template.yaml`/skeleton import + Nunjucks `{moduleName}` normalize; environment template refresh (`applied` / `merged` / `kept-yours` / `already-current`; line-based 3-way merge; no merge IDE); host skip/emit + custom path + `appliedTemplate` + in-editor `contents` (Generate emit uses edited text; skip stays skip; no merge IDE). In-app roadmap: `graph-doc-split` shipped (in-memory per-tab documents; folder save one `.graph.json` per container/function; localStorage still full snapshot); `mobile` partial (Agent/Bot/StatusBar chip hidden at max-width 768px; coarse pin snap 40px vs mouse 20px; larger TopNav hit targets on coarse/mobile; gestures and radial menus still planned). `extends-list-mi-locked-visual`, `yield-statement-later`, `switch-match-cl017`, `env-typespec-emitter` shipped (python/cpp multi-base emit; `yield_stmt` py/gd; Switch native match; TypeSpec CLI → apiSurface).

**Product direction:** [visual_to_text_fidelity.md](visual_to_text_fidelity.md) — every behavioral node maps to honest generated text; no Blueprint VM semantics.

**Vocabulary alignment:** Phased implementation plan — [design/terms_refactor_plan.md](design/terms_refactor_plan.md) (glossary: [design/language_neutral_vocabulary.md](design/language_neutral_vocabulary.md)).

---

## Contents

- [Development Approach](#development-approach)
- [Repository Layout (Actual)](#repository-layout-actual)
- [Frontend (`apps/web`) — Implemented](#frontend-appsweb--implemented)
- [Graph system architecture (isolated domains)](#graph-system-architecture-isolated-domains)
- [Transpiler & syntax packs (shipped)](#transpiler--syntax-packs-shipped)
- [Backend (`server/`) — API, registry, optional local MCP sidecar](#backend-server--api-registry-optional-local-mcp-sidecar)
- [Documentation Map](#documentation-map)
- [UI Revision Decisions (Locked)](#ui-revision-decisions-locked)

## Development Approach

**UI-first** with **shared analysis packages** and **text-shaped codegen fidelity** ([visual_to_text_fidelity.md](visual_to_text_fidelity.md)).

- Mock persistence: `apps/web/src/lib/api/mock.ts` (localStorage / fixtures).
- Status chrome must be **honest**: show offline/disconnected, not fake “connected” states.

---

## Repository Layout (Actual)

```text
VVS Web/
├── apps/web/              # Next.js 16 + React 19 editor
├── packages/
│   ├── graph-types/       # ProjectSnapshot v3 (v1/v2 loader), ClassSymbol, analyzeProject, CodegenTarget
│   ├── syntax-registry/   # core-pack.json, list/resolve/expandProjectSymbols
│   ├── language-profiles/ # per-target portability matrix + capabilities + analyzePortability
│   ├── syntax-packs/      # versioned print templates, Rosetta fixtures, fidelity linter
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

On `/`, `/library`, `/roadmap`, and `/docs` the left activity rail is the view switch (Start / Examples / Library / Roadmap / Docs). `StandaloneTopBar` is brand + Contribute (no page-switch cluster). In a loaded project the cluster (Project / References / Library / Roadmap / Packs / **Docs**) still lives in `TopNav`. File / Edit / View menus, Save, and Generate stay in-project only.

| View | Purpose |
|------|---------|
| **Canvas** | Primary graph editor (default) |
| **References** | UE5-style reference viewer — focus center, referencers left, dependencies right; huge-project breadth + persisted prefs |
| **Library** | Client-first templates / git import; auth / upload frozen |
| **Roadmap** | In-app development roadmap -- Open / Done / Research |
| **Packs** | In-project pack versions / host skip-emit. With no project loaded, the tab returns home |

**Removed from product UI** (do not re-add as duplicate surfaces):

- ~~Integrations~~ / ~~Connect AI~~ (hosted agent is the in-page TS **Agent** panel; optional Go sidecar paste lives in a collapsed section)

### Canvas layout mode

When **Canvas** is active, the full editor chrome is visible:

```text
┌──────────────────────────────────────────────────────────────┐
│ TopNav: File · Edit · View · [Auto save|Save] [Auto generate|Generate] … │
├──────────┬───────────────────────────────┬───────────────────┤
│ Project  │ GraphTabBar                   │ Code output       │
│ explorer │ GraphCanvas (React Flow)      │ Code preview      │
│ Structure│ + floating details (top-right)│ (@vvs/transpiler) │
│ Symbols  │ + floating compiler log (br)  │                   │
│ API tabs │                               │                   │
├──────────┴───────────────────────────────┴───────────────────┤
│ StatusBar: Local (client-first) · Agent ready/error · Log · compile     │
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

- **Templates** — 17 first-party environment packs (console / web / data / api / game) & OpenAPI/AsyncAPI spec imports; language chips filter by default/supported target (token search, not embeddings). Active language chip stays visible at count 0; empty copy names search + chip. Community catalog is Phase 3.
- **Git Imports** — repo / pack import
- **Installed** — installed extensions
- Auth / upload remain frozen (client-first; no accounts as product)

Local spawnable nodes are **not** listed in Library. They come from `nodeCatalog.ts` via the canvas **spawn catalog** (empty-pane right-click, keyboard spawn, dangling wire, or Node Actions → Add node…).

---

## Graph system architecture (isolated domains)

Edit canvas and reference viewer **must not share one React Flow store**. Implementation:

```text
ProjectProvider
└── GraphWorkspaceProvider          ← document bridge API
    └── GraphWorkspaceHost          ← ALWAYS mounted; no React Flow
        ├── useGraphState           ← live nodes/edges for active edit tab
        ├── useGraphTabSync         ← Map<tabId, GraphDocument>; function bodies retained when tab closes
        ├── registerWorkspace()     ← getDocuments, subscribeMetadata, …
        └── GraphEditContext        ← consumed by GraphCanvas when mounted

Canvas view (mounted only when active):
  ReactFlowProvider (edit)
  └── CanvasWorkspace → GraphCanvas, CodePreviewPanel

References view (mounted only when active):
  ReactFlowProvider (reference)
  └── ReferenceGraphCanvas (read-only layout)
```

**Tab vs document:** Closing a function tab removes it from `openTabs` only. Function/overload body documents stay until the function symbol is deleted. Tree **double-click** / open icon = **Edit function body**; **Define** badge places/focuses the host-graph definition node.
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
- `GraphExplorer` / `ProjectTree` uses `mode: 'canvas' | 'references'`; **Symbols | Output** (cycle toggle) + optional API; single-click selects, double-click opens; filter always visible; **Ctrl+Space** / `/` focus filter.
- `useGraphTabSync` debounces metadata notify on edits; prunes closed tabs from `documentsRef`.

Orphan: `components/layout/ReferenceViewer.tsx` — superseded by `ReferencesView`; do not re-add to left panel.

### Editor selection coordination (tree → canvas → code preview)

Single pipeline for project-tree symbol focus, canvas tab changes, and CodeMirror highlights:

| Layer | File | Role |
|-------|------|------|
| Focus API | `hooks/useEditorFocus.ts` | Tree/canvas entry: opens tabs + `navigate(canvasFocusFrame(...))` with explicit `selection` |
| Pure helpers | `lib/editorFocus.ts` | `resolveClassHomeGraphTarget` (dynamic: searches all docs for `class_define`), `canvasFocusFrame`, `resolveVariableFocusFrame` |
| Selection invariants | `lib/projectSelection.ts` | `isTreeSymbolSelection`, `clearCanvasSelectionKeepTreeSymbol` |
| Code preview link | `lib/symbolCodegenLink.ts` | Maps `selection` → `tabId` + `highlightNodeIds` via `collectSymbolUsages` |
| Live validation sync | `hooks/useLiveProjectValidation.ts` in `GraphWorkspaceHost` | Memoized `runProjectAnalysis`; syncs validation to ProjectContext when signature changes (StatusBar + code panel even when output collapsed) |
| Canvas sync | `hooks/useSyncProjectSelection.ts` | Mirrors React Flow selection; preserves tree symbols on deselect/tab change |
| History | `contexts/EditorNavigationContext.tsx` | Versioned frames in `history.state`; `ensureGraphTabOpen` opens container + function tabs |

**Flow:** ProjectTree / compiler log / graph_ref double-click → `useEditorFocus` → `EditorNavigationContext.navigate` → `ProjectContext.selection` + `activeGraphTab` → `CodePreviewPanel` resolves `symbolCodegenLink` (preview tab may differ from active canvas tab on project map) → `displayResultForView.sourceMap` highlight ranges (aligned with pinned **Files** tab paths).

**Class/graph decoupling (July 2026):** Classes are no longer coupled to a fixed "home graph" tab. `class_define` and member define nodes can be placed on **any** graph. The transpiler (`analyzeClassMembers`) discovers class members dynamically across all documents. `insertDefineNode*` resolves the target graph via: (1) existing `class_define` node location, (2) active graph tab, (3) legacy home graph fallback. Double-clicking a class in the ProjectTree spawns a `class_define` on the active graph if one doesn't already exist. Project Tree action badges use absolute overlay positioning to avoid layout shifts.

**Invariants:** Tree symbol selection is never cleared by tab switches or React Flow deselect (`GraphCanvas` + `useSyncProjectSelection`). Tab bar / breadcrumb navigation sets `selection: { type: 'graph', ... }` intentionally. Browser back/forward restores all selection types including `event` / `function` / `class`. Highlight navigation uses the same `sourceMap` as the file list being shown — avoids path oscillation between graph-only and project-wide emit paths.

---

### TopNav actions (Canvas only)

| Control | Location | Notes |
|---------|----------|-------|
| **Auto Generate** toggle | TopNav | When on, debounced validate & transpile on graph dirty; when off, use **Generate** or Ctrl+G |
| **Auto Save** toggle | TopNav | When on, debounced persist **ProjectSnapshot v3** (local; cloud only when hosted features + signed in); when off, use **Save** or Ctrl+S |
| **Save** / **Generate** | TopNav (action segment) | Manual save project / manual generate — same as File → Save project and Edit → Generate |
| Sync code preview | Edit menu (Ctrl+Shift+S) | Refresh code preview from graph without full validation pipeline |
| Validate & compile | — | Same as **Generate** (Ctrl+G) — `runProjectAnalysis()` then transpile when no errors |
| Save project | File menu (Ctrl+S) | Persist **ProjectSnapshot v3** JSON (folder, localStorage, or cloud); v1/v2 load via normalizer |
| **Agent** | TopNav Bot button (tooltip **Agent**) | In-page TypeScript agent. `EditorLayout` mounts `AgentHost` (Worker starts with the editor). `AgentPanel`: prompt, optional local LLM key/base/model in `localStorage` `vvs:agent-llm` (default `https://api.openai.com/v1` + `gpt-4o-mini`). `/tool name json` works without a key. Writes gated by `agentAllowWrites` (default **false**). `window.vvs.agent` / `window.vvs.tools`: `listTools()`, `callTool(name, args)`. StatusBar **Agent ready** / **Agent error** / **Agent…** from `agentStatusStore` (not fake MCP Ready). Collapsed sidecar pastes optional local Go MCP config — not the hosted path. |
| **Docs** | Sixth icon after Packs; Start Explore; `/docs` | Catalog from `CORE_NODE_REGISTRY`. Hover on the info icon shows registry title / kindId / ports / options (no invented prose). Click opens the kind page. Option icons in Details Settings and modifier chips open `#opt-{key}`. Overlay essays and playground are not shipped. |
| **Contribute** | TopNav / `StandaloneTopBar` right cluster | GitHub icon. Opens `CONTRIBUTING.md` on Sheriff99yt/VVS-Web in a new tab. Same control on home, library, roadmap, and in-project. |
| Settings | TopNav gear + **Help** menu | Sidebar modal — **Project** · **Editor** · **Shortcuts** (rebind) · **Audio** · **About**. Search catalogs every section (honest Editor blurb, Project grouping includes environment / host skip-emit / host contents / Refresh 3-way merge / export, Audio cards). Replaces flat Project/App tabs |
| Action history (U108 / U114–U117) | Edit menu · floating panel | Shared undo: graph + symbol/class CRUD; survives tab switch; lean canvas snapshots |
| Extract to function | View menu (Ctrl+Shift+E) | Selected nodes → new function graph + Call node; keeps extracted body + Declare |
| Chain select / layout (U75) | Canvas shortcuts | **S** = forward exec + data attrs; **A** = full undirected chain; **S S** = layout (`lane-topo-v1`). Attribute direction in Settings (above / below / below-extended). Head-anchored; multi-chain Y-separate; works inside locked comments |
| Node search (U84/U85) | Canvas overlay + shortcuts | **Ctrl+F** = find in this graph; **Ctrl+Shift+F** = find in all graphs (Layers forced on; prefill from tree symbol). **F** with a tree symbol selected = find in this graph only; otherwise frame selection. Space / Ctrl+K open search respecting Layers. Symbol context menu: Find in this graph / Find in all graphs. Outside click / canvas drag clears tree-symbol focus |
| Tooltips (U94) | Editor chrome | App-default `Tooltip` (`components/ui/Tooltip.tsx`) — portal tips with Esc dismiss + viewport clamp; native `title=` replaced on left panel, TopNav, status, toolbars, panels, nodes, start screen (section/popover heading `title` props remain) |
| Selection / modifiers chrome | Hover + select | **Quick Actions** strip above selection (disconnect / duplicate / comment / delete + ⋯ More). Full **Node Actions** on node right-click (S / S S / A, wires, clipboard, extract, Add node…). Spawn catalog on empty-pane right-click. Modifier chips on hover overlay. U102: Open Graph removed from symbol tree/Details |
| Mouse Back / Forward | Editor navigation | Restores tab / view / selection / **camera viewport** (dwell ~2s after pan/zoom; coalesced unless a graph edit or node-options change intervened). **Not** graph undo — that is Ctrl+Z and Log → History |

### In-page agent (hosted path)

Hosted app (GitHub Pages / editor) uses an **in-page TypeScript agent**. Live canvas is the source of truth. No Cursor, Go, or extra install. `EditorLayout` mounts `AgentHost` — the Worker starts with the editor. Spec: [design/mcp_autonomy_audit.md](design/mcp_autonomy_audit.md).

| Piece | Location | Notes |
|-------|----------|-------|
| **Agent** (Bot button) | TopNav | Tooltip **Agent** opens `AgentPanel` |
| LLM settings | `localStorage` `vvs:agent-llm` | Optional key / base / model; default `https://api.openai.com/v1` + `gpt-4o-mini` |
| `/tool name json` | Agent panel | Runs a named tool without an LLM key |
| Write gate | `uiPreferences.agentAllowWrites` | Default **false**. Gates `add_class`, `add_node`, `remove_node`, `connect_pins` |
| Bridge | `window.vvs.agent` / `window.vvs.tools` | `listTools()`, `callTool(name, args)` |
| Status | StatusBar | **Agent ready** / **Agent error** / **Agent…** from `agentStatusStore` — not fake **MCP Ready** |
| Tools (safe) | `lib/agent/toolDefs.ts` | `list_available_nodes`, `list_syntax_packs`, `list_classes`, `get_graph`, `generate_code` |
| Tools (write) | same | `add_class`, `add_node`, `remove_node`, `connect_pins`. `add_node` refuses leftover kinds (`SPAWN_EXCLUDED_KINDS`) |
| Sidecar (optional) | Agent panel collapsed section | Localhost Go MCP paste-config for Cursor / VS Code / Claude Desktop. **Not** the hosted path. `mcpAllowDangerousTools` does **not** reach Go (`VVS_MCP_ALLOW_WRITE` does) |

**Deferred (do not implement as if shipped):** MCP wrapper for other apps over the same TS package; `save_project` / rosetta / `validate_generated_parse` / `propose_syntax_delta` in the TS runtime; streamable HTTP; live-tab control without the editor open; Chrome DevTools bridge; in-page chat on StartScreen; product accounts.

**Floating panels** (canvas overlay, shared `FloatingPanelShell`):

| Panel | Corner | Compact | Expanded |
|-------|--------|---------|----------|
| Details | top-right | One-line summary | Full property forms |
| Compiler log | bottom-right | Last 3 log lines | Full log with sources |

StatusBar **Output** cycles the floating Output panel (` · Log → History → Activity → off).

**Removed:** mock Play/Pause simulation controls. **Locked:** VVS does **not** execute code (no interpreter, runner, or run-from-editor path). In-app work is edit + Generate + **logical checks / warnings**; execution is third-party after export. `GraphToolbar` and bottom-docked output console also removed.

### Properties inspector (floating)

Context-aware (`ProjectContext.selection`), shown on graph canvas when something is selected. **Expanded/collapsed state persists** across selection changes. Non-codegen fields (description, node id, comments) are excluded — focus is **pins and codegen parameters**. Graph module settings open from breadcrumb **settings** icon (modal).

| Selection | Panel |
|-----------|-------|
| Variable | `VariablePropertiesPanel` — name, type, binding (instance/static), readonly, default |
| Event | `EventPropertiesPanel` — handler name, parameters (`SymbolParameterEditor`) |
| Function | `FunctionPropertiesPanel` — name, binding, visibility, overloads, return parameters, flags (`isGenerator` persist-only; no `function*`) |
| Node | `PropertySchemaPanel` (when kind defines `propertySchema`) + `NodePinsPanel` — pins, inline values, linked graph; event define/dispatch binding plugin |

Graph-level and project settings → TopNav **Settings** (gear, right of Agent) / View → **Project settings** (`GraphSettingsModal` Project tab: active-graph codegen, properties, project defaults, syntax packs, environment / host skip-emit / host contents / export paths; `isProjectMapTab` gates class form / implements / extends rename). **App settings** (same modal App tab): browser UI prefs — dim unsupported, panel defaults, reset floating layouts.

**Codegen model:** `documents[tabId].metadata.targetLanguage` and `targetFileExtension` override project-level `targetLanguage` / `targetFileExtensions` for that graph. Unset fields inherit project defaults at emit time (`resolveGraphCodegenSettings` in `@vvs/graph-types`). New graphs seed metadata from project defaults when first opened (`useGraphTabSync`).

Target languages in UI: **Python, JavaScript, C++, Verse, GDScript, Rust, C#, Go, Graph JSON**. Codegen runs in **`@vvs/transpiler`** (facade: `apps/web/src/lib/codegen.ts`). Portability warnings per target: **`docs/language_profiles.md`**. **Function Declare/Define:** all eight targets share the same canvas table — C++ prototypes + out-of-line Define; others U66 `(x) Declare` + in-class Define (never silent omit). Spec: [visual_to_text_fidelity.md](visual_to_text_fidelity.md) § Function Declare / Define per language.

### Graph editor features

Shell and core interactions are in place. **UI backlog:** [`.agents/memory/incomplete-ui.md`](../.agents/memory/incomplete-ui.md) — **U84–U92, U94–U99, U101–U102, U104–U119 shipped** (August 2026); Function constructor/destructor role + leftover-role locks + settings search audit shipped. Remaining: CL-014 honest (x), U93 long-term, U90/library Phase 3. U100 remains cut; Event Bind is **partial** (C# `+=` / JS `.on` / GDScript `.connect` printers+spawn; Details picker + rename write-through shipped; other langs unspawned or `(x)` Bind). **U103 locked** as Class (field or Extends; no Component node) — not remaining work. **Extends list UI shipped** (python/cpp print every Extends row; js/gd/verse/cs first parent only; go/rust hidden). **Implements list + Class form shipped** (cs/rs UI + emit; python does not print Implements; Super stays first Extends parent). `lambda_define`, `flow_try`, `yield_stmt`, and Switch match (CL-017) shipped.

| Feature | Status |
|---------|--------|
| React Flow canvas, custom nodes/edges | Done |
| Context menu node spawn (`nodeCatalog.ts` → registry) | Done |
| Unified node registry (`@vvs/syntax-registry`) | Done — `core-pack.json`, `list`/`resolve`/`expandProjectSymbols`, `propertySchema` |
| Get User Input node (`action_get_input`) | Done — registry kind, schema-driven Settings; Python/JS/C++ emit. Verse stays honest `(x)` + prompt (CL-014 open — no invented player API) |
| Conversion nodes (`convert_to_string`, `convert_to_number`) | Done — explicit per-language calls, source-map highlights, no implicit casts |
| Pin type validation on wires | Done — `PIN_TYPE_MISMATCH` in `@vvs/graph-types` analyze; shared with editor wiring |
| Usability example tests (Simple, Complex, Advanced) | Done — `simpleUsabilityTest.ts`, `complexUsabilityTest.ts`, `advancedUsabilityTest.ts`; Async Fetcher / Dual Class Lab / calculators stay retired |
| Usability test integrity | Done — analyze + wiring + multi-language codegen; drives UI gap discovery per `language_capability_catalog.md` |
| Call Function nodes (`vvs.project.call_function` + `graphBinding`) | Done |
| Dispatch event nodes (`event_dispatch` + `graphBinding.kind: dispatch_event`) | Done — per-event spawn in context menu / tree drag; canvas-first **New event here…** on class graph; emits direct handler call (`self.on_<name>(…)`) |
| Event bind nodes (`event_bind`) | **Partial** — Details picker + rename write-through shipped (same path as Dispatch). C# `+=` / JS `.on` / GDScript `.connect` printers+spawn; other langs unspawned or `(x)` Bind |
| Event emit/subscribe nodes (`event_emit`, `event_subscribe`) | **Blocked** — excluded from spawn catalog; `HIDDEN_EVENT_RUNTIME_UNSUPPORTED` blocks Generate; no `_emit` / `_subscribe` injection in transpiler |
| Program entry (`events[]` `role: 'entry'`) | Done — `event_member_define` + `event_define` on class graph; `on_start` only from canvas; legacy `event_on_start` deprecated; new class/project bootstraps entry via `createClassHomeBootstrap` |
| Function symbols + overloads (`FunctionSymbol`, snapshot v3) | Done — tree, inspector, pin sync; symbols carry optional `classId` |
| Extends list (MI visual) | **Done** — list UI on Declare Class (`extendsTypes`, `[0]===extendsType`); python/cpp print every Extends row; js/gd/verse/cs first parent only (C# Extends extras are not auto-migrated to Implements); go/rust list hidden; Super still first Extends parent |
| Implements list + Class form | **Done** — `form` (`class`/`interface`/`trait`) + `implementsTypes` on Class / `class_define`. UI + emit for csharp/rust only. C# `class Child : Base, IFoo` or `interface IFoo`. Rust `pub trait` + `impl Trait for Type` when Implements has names. Python does not print Implements. Super stays first Extends parent. No `implements_define`. |
| Lambda expression (`lambda_define`) | Done — spawn py/js/cs/rs/gd; capture option; 5-lang pack templates |
| Try / catch (`flow_try`) | Done — spawn py/js/cpp/cs/gd; empty finally omitted; hidden go/rust |
| Yield (`yield_stmt`) | Done — spawn python/gdscript; hidden elsewhere; Python `yield` / bare `yield`; typed value pin via `resolvePinValueExpr`. `isGenerator` persist-only — no `function*` |
| Switch match (CL-017) | Done — Python `match` / Rust `match`; C#/JS/C++ keep `switch`; GDScript/Go/Verse keep if-cascade. Add Case uses `case_*` indices |
| Multi-class projects | Done — `ClassSymbol`, `classes[]`, `activeClassId`, `graphContainers[]` (each container is a real canvas at `documents[container.id]`; default **Project map** at `main-graph`), v2→v3 loader, **Folders** section in ProjectTree **Structure** tab (click folder/class to select; double-click to open graph), class-scoped symbol lists on **Symbols** tab, drag Get/Set/Call/Declare on class graphs only, `graph_ref` on project-map graphs. **Class declare fidelity:** `class_define` required when class has symbols or any member define on home graph; `DEFINE_NODE_MISSING` / `ORPHAN_DEFINE_NODE` for class; panel `addClassWithDefine` + tree Declare badge + restore; deleting `class_define` blocks Generate but preview still shows member body in chain order (no phantom `class Name:` shell). In-page agent + optional Go sidecar: `list_classes`/`add_class`, `class_id` on graph tools. Design: [design/multi_class_symbols.md](design/multi_class_symbols.md) |
| Pin type validation on connect | Done |
| Wire / cross-graph cycle prevention | Done — `graphCycles.ts`, `graphRelations.ts` |
| Linear flow chains (break on middle rewire) | Done — `graphWiring.ts` + editor warning |
| Extract selection to function | Done — `extractToFunction.ts`, Ctrl+Shift+E; keeps body + Declare |
| Variable/function/event lists in explorer | Done — **Symbols** tab: **Functions** (base row + override rows only) → **Event dispatchers** (drag row to dispatch) → **Variables** |
| Generated files browser | Done — **Structure** tab **Output** toggle merges graph folders and project files in one tree: `.vvs/` metadata, emit paths with graph+file icons on the same row, workspace/host stubs; drag classes between folders to set emit path; click generated file opens code preview |
| Searchable dropdowns | Done — `SearchableSelect` replaces native `<select>` in codegen, property panels, import pickers, environment import |
| Import graph / class / module pickers | Done — `ImportGraphTargetPanel` + `projectGraphCatalog.ts`; searchable list of all project graphs |
| Reference viewer (top-level view) | Done — `ReferencesView`, UE5 focus graph + tree |
| Project breadcrumb | Done — compact path + Edit/Refs at start of `StatusBar` (`GraphBreadcrumb`) |
| Graph tabs (main / function / container) | Done — per-tab documents + `GraphTabMetadata` (module fields + optional `targetLanguage` / `targetFileExtension`); Project map (`main-graph`) pinned; legacy macro tabs migrate on load |
| Undo/redo | Done |
| Comment nodes + grouping | Done — color, ungroup, inspector label |
| Drag variable → spawn Get/Set | Done |
| Drag event → spawn Dispatch | Done — tree → canvas drop |
| Reroute pins | Done — `vvs_reroute_node` |
| Copy/paste / Cut / Duplicate | Done — in-app + system clipboard (`graphClipboard.ts`) |
| Simulation / live execution | **Out of scope** — mock Play removed; logical checks + warnings only; third parties execute |
| Pin geometry (distinct shapes) | Done — incl. `data_array`; inline pin widgets |
| Mock project save/load | Done — `ProjectSnapshot` v3 persist; v1/v2 normalizer upgrades to implicit `main-class` |
| Shared analysis pipeline | Done — `analyzeProject` + `analyzePortability` → compiler log / status / code badge |
| Generate / validation pipeline | Done — `projectAnalysis.ts` + `@vvs/transpiler`; errors block compile |
| Code preview | Done — CodeMirror 6; graph language + `.{ext}`; Format JSON; **hover → yellow node/tab outline**; **double-click line → canvas node**; selection highlight via `sourceMap`; live analysis. Full UX: [code_panel.md](code_panel.md) |
| Graph History | Done — **Output panel → History / Activity**; `` ` `` cycles tabs; undo/redo restores edits **and** jumps to that location (not mouse nav); mouse Back/Forward = navigation history only; edit while newer exist → in-app confirm |
| Editor focus | Done — `useEditorFocus` + `editorFocus.ts` + `projectSelection.ts` + `symbolCodegenLink.ts`; tree opens pass explicit `selection` through `navigate()`; compiler log variable jumps open class home graph; function overload preview respects active tab |
| Error navigation | Done — validator log / status bar → canvas node |
| Library install flow | Done — install, detail panel, open in project |
| In-page agent | Done — `AgentHost` + `lib/agent/` Worker; tools against the live canvas; writes via `agentAllowWrites` (default false); leftover kinds refused on `add_node` |
| Health chrome (optional HTTP / sidecar) | Done — `useApiHealth`; `VvsApi.probeMcp` only for the optional Go sidecar, not the hosted path |
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
| Advanced usability example (two classes / one graph) | `apps/web/src/lib/usabilityExampleTests/advancedUsabilityTest.ts` |
| Simple usability example | `apps/web/src/lib/usabilityExampleTests/simpleUsabilityTest.ts` |
| Complex usability example | `apps/web/src/lib/usabilityExampleTests/complexUsabilityTest.ts` |
| Code panel Test Project extract | `apps/web/scripts/extract_test_project_outputs.ts` → `apps/web/test_project_outputs/` |
| Project transpile (Code panel) | `apps/web/src/hooks/useProjectTranspileResult.ts` |
| Codegen | `packages/transpiler` + `@vvs/syntax-packs` — web facade: `apps/web/src/lib/codegen.ts` |
| Rosetta fixtures | `packages/syntax-packs/rosetta/` — print, branch, assign, call, convert, dispatch, wait, for, while, switch, sequence, import_module, await_wait, call_native (+ `.golden.txt` per family) |
| Syntax pack lock | `.vvs/project.json` → optional `syntaxPackLock` on `VvsProjectManifest` |
| Project analysis | `packages/graph-types` (`analyzeProject`) + `packages/language-profiles` |
| Web analysis wrapper | `apps/web/src/lib/projectAnalysis.ts` |
| Live validation hook | `apps/web/src/hooks/useLiveProjectValidation.ts` — memoized analysis → ProjectContext |
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
bun test packages/syntax-packs packages/transpiler packages/graph-types
cd apps/web && bun test src/lib
cd server && go test ./...
```

CI (`.github/workflows/ci.yml`): **packages** job runs syntax-packs / transpiler / graph-types / language-profiles / syntax-registry suites + `validate:parse --strict`; **web** job runs lint / build + `src/lib` tests; **server** job runs `go build` + `go test`. **Release cycle:** Pages + floating `pre-release` on each green `main` (`.github/workflows/pages.yml`); SemVer zips on `v*` tags (`.github/workflows/release.yml`). Local Pages gate: `bun run pages:verify` (see [setup.md](setup.md) § Release channels).

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
| Print registry | `packages/transpiler/src/print/` | Done — **eight pack-driven families** (python, javascript, cpp, verse, gdscript, rust, csharp, go) pack-first |
| Print adapter | `packages/transpiler/src/print/template.ts` | Done — `printFromTemplate`, pack `layout` helpers (`bodyIndent`, `blockPlaceholder`, `emptyHandlerBody`, …) |
| Unified block emit | `packages/transpiler/src/print/blocks.ts` | Done — `buildIfBranch` / `buildForLoop` / … for string print path (`stmt.ts`) |
| Block close helpers | `packages/transpiler/src/print/blockHelpers.ts` | Done — `condSpanOffset`, `blockCloseLine`, `ifElseLine` shared with `emit/sinkStatements.ts` (span-aware nested emit) |
| Nested emit sink | `packages/transpiler/src/emit/sinkStatements.ts` | Done — writes IR to `CodeSink` with `sourceMap`; headers/closes via `blockHelpers` + pack templates; **Switch** case bodies via nested `appendIrStatements` (U71a — not string-join leaf) |
| Pack render engine | `packages/syntax-packs/src/render.ts` | Done — `renderQuasi`, `renderLego`, `renderTemplate`; pack `layout` (indent, placeholders, comment prefix) |
| Module emit | `packages/transpiler/src/emit/classModule.ts` | Done — unified class module + function tab emitter; **pack shell templates** for class open/close, handlers, function headers |
| Module shell renderer | `packages/transpiler/src/emit/shell.ts` | Done — `ClassModuleOpen`, `EventHandlerOpen`, `FunctionDefOpen`, etc. from pack JSON |
| Empty body layout | `packages/transpiler/src/emit/layout.ts` | Done — `emptyHandlerBody` / `emptyFunctionBody` from pack `layout` (no hardcoded `pass` / `// empty` in emit) |
| Pack migration CI gate | `packages/transpiler/src/print/packMigrationGate.test.ts` | Done — bans legacy emitters in `stmt.ts` / `expr.ts`; per-language `emit/*.ts` removed; `classModule` + `sinkStatements` use pack helpers |
| Base syntax packs | `packages/syntax-packs/src/packs/*.base.json` | Done — full Rosetta + shell + layout for all eight families |
| Capability overlay | `javascript.es2022.json` | Done — proof of inherit-only version deltas |
| Rosetta fixtures (pack goldens; not home-preview) | `packages/syntax-packs/rosetta/` | Done — **14 fixtures × 8 families** (112 golden pairs); regen via `scripts/update-{family}-goldens.ts` |
| Pack coverage gate | `packages/syntax-packs/src/packCoverage.test.ts` | Done — required Rosetta + **shell** template keys + layout profile per base pack |
| Fidelity linter | `packages/syntax-packs/src/fidelity.ts` | Done — CI via `rosetta.test.ts` |
| CodegenTarget | `packages/graph-types/src/codegenTarget.ts` | Done — family + capabilities + syntaxPackLock |
| Graph codegen settings | `packages/graph-types/src/graphCodegen.ts` | Done — `resolveGraphCodegenSettings`, `codegenMetadataSeed` for new graphs |
| Tree-sitter parse CI | `packages/syntax-packs/src/parseValidation.ts` | Done — python/javascript on Linux CI (`validate:parse --strict`); skips gracefully on dev machines without native prebuild |
| Syntax pack MCP tools | `server/internal/transport/mcp/` | Optional Go sidecar only — `list_syntax_packs`, `propose_syntax_delta`, `run_rosetta_suite`, `validate_generated_parse`. Not in the in-page TS runtime (deferred) |

### Codegen fidelity (strict)

**Product promise:** The canvas is the source of truth for generated code — [visual_to_text_fidelity.md](visual_to_text_fidelity.md) § Canvas is the source of truth.

| Rule | Implementation |
|------|----------------|
| **Emit path** | `appendIrMembersInOrder` / `ir.members` from member chain only — **no** sidebar preamble (`appendLegacyPreamble` removed); class shell only on `ClassDecl` |
| **Symbol tables** | `variables[]`, `functions[]`, `events[]` are indexes; panel creates **dual-write** define nodes via `defineNodeSync` / `useSymbolLifecycle` |
| **Define nodes** | `class_define`, `var_define`, `function_define`, `event_member_define` on `classHomeGraphId` exec chain |
| **Class declare** | `class_define` required when home graph has any member define chain (`classRequiresClassDefine`); blank class with no defines passes analysis; symbols-only off-canvas → `DECLARATION_NOT_ON_CANVAS` (not duplicate class `DEFINE_NODE_MISSING`); deleting class Declare omits `class Name:` shell in preview but **blocks Generate** |
| **Program entry** | `events[]` with `role: 'entry'` — same `event_member_define` + `event_define` pattern as custom events; codegen `on_start` **only** when user wired entry on canvas; legacy `event_on_start` → `LIFECYCLE_NODE_DEPRECATED`; **no** transpiler-injected empty `on_start()` |
| **Compile gate** | `analyzeProject` errors block Generate in TopNav when `!analysis.ok`; code preview syncs live analysis via `useLiveProjectValidation` (signature-guarded, no render loops) |
| **Event model** | **Dispatch** supported (direct call); **Bind** prints one registration line on C# / JS / GDScript; Details picker + rename write-through shipped; **Emit** / **Subscribe** blocked — no hidden `_emit` / `_subscribe` runtime; duplicate On without a Bind → `MULTICAST_REQUIRES_SUBSCRIBE` |
| **Strict diagnostics** | `DEFINE_NODE_MISSING`, `DECLARATION_NOT_ON_CANVAS`, `ORPHAN_DEFINE_NODE`, `PROGRAM_ENTRY_MISSING`, `PROGRAM_ENTRY_NOT_ON_CANVAS`, `LIFECYCLE_NODE_DEPRECATED`, `HIDDEN_EVENT_RUNTIME_UNSUPPORTED`, `MULTICAST_REQUIRES_SUBSCRIBE` |
| **sourceMap** | Every emitted declaration and statement maps to a canvas `nodeId` for code-panel highlight. Nested control-flow bodies (If/For/While/Sequence/**Switch**) tag each statement via `appendIrStatements` — no per-`kindId` highlight UI |
| **Imports** | Shared Import Module once at file top on first class chain; flow Import Module for conditional imports; `targetLanguages` gate; optional `ownerClassId` |
| **Event peer order** | Event defines order by canvas **Y** (event→event exec does not force sequence) |

**Open leftovers (August 2026):** ctor/dtor Function role + leftover-construct catalog locks + settings search audit + emit/OOP + **in-page TypeScript agent** + **U89 / U92** + consume-path completeness shipped. U91 dual-consent / MCP Ready are **not** product chrome (`agentAllowWrites` is the real in-page write gate). Open: CL-014 honest `(x)`, U93 long-term, U90/library Phase 3 (`vvs-library` repo + web UI). **U103 locked** as Class (field or Extends; no Component node). Client-first: **no dedicated server**, **no live code execution**. See [roadmap.md](roadmap.md) · [code_panel.md](code_panel.md) · [design/mcp_autonomy_audit.md](design/mcp_autonomy_audit.md).


Simple, Complex, and Advanced pass strict analysis. Environment templates and library import must spawn define nodes or fail analysis.

---

| System | Planned location | Status |
|--------|------------------|--------|
| Macro tabs + `use_macro` | Removed — **Function + Call** only; migration on load ([visual_to_text_fidelity.md](visual_to_text_fidelity.md)) |
| Full IR pipeline (lower/emit split) | **Done** — structured IR v2 + `print/` + `emit/`; see [syntax_pack_architecture.md](syntax_pack_architecture.md) |
| Label-free legacy migration | apps/web + graph-types load | **Done** — `kindId` backfill on load; binding-first `normalizeNodeData` |
| Ambiguous overload resolver UI | Call node details | **Done** — overload dropdown in floating details |
| Syntax pack MCP tools | `server/` Go | **Optional sidecar** — same tools via thin MCP wrappers. Hosted path is the in-page TS agent (no rosetta / validate_parse / propose_syntax_delta there yet) |
| Tree-sitter parse validation | CI | **Done (Python/JS)** — validator-only check on Rosetta outputs; unsupported local runtimes skip gracefully |
| GDScript language profile | `packages/language-profiles/src/profiles.ts` | Done — native static func, extends; overload unsupported |
| Godot environment template | `env.gdscript.godot-game` | Done — Node extends, `_ready` / `_process`, `project.godot` stub |
| `language-profiles/src/packs/*.profile.json` | packages | **Done** — JSON packs load into `LANGUAGE_PROFILES` at init; types + warning copy stay in TypeScript |
| Supabase auth / persistence | Go + self-hosted Supabase (`pgx`) | **In repo / not product** — foundation exists for local experiments; **no dedicated server hosting** as product direction ([roadmap.md](roadmap.md)) |
| MCP server transport | `server/` Go | **Optional local sidecar** — SSE at `/mcp`. No remote hosted MCP URL. Streamable HTTP deferred. Later: thin MCP wrapper over the same TS package for other apps |
| HTTP project REST | `server/` Go | **Done** — `GET/PUT /api/projects`, `POST …/compile`; memory or Postgres via `DATABASE_URL` |
| WebSocket collaboration | `server/` Go | Not started — Go WS (not Supabase Realtime) |
| PWA / offline sync | — | **Out of scope** — prefer folder / `.vvs/` + git; no VVS sync server |
| Community library backend | Separate library git repo | Client Library shipped (templates / git import / token+chips). Auth / upload **frozen**. Git catalog is Research |
| **UE6 editor plugin (Verse)** | `plugins/` (planned) | **Open / Research** `ue6-native-plugin` — after a real UE6 release. Not Alpha. [roadmap.md](roadmap.md) |
| **Native VS Code plugin** | Research tab | **Open / Research** `vscode-native-plugin` — no VSIX this pile; iframe Pages reject |

---

## Backend (`server/`) — API, registry, optional local MCP sidecar

**Phase 2 (redirected):** Client-first local / folder / `.vvs/` is the product path. Self-hosted Postgres + GoTrue code remains in `server/` for reference — **not** an open VPS deploy track. See [roadmap.md](roadmap.md) § No dedicated server · [deployment.md](deployment.md) (legacy banner).

- `internal/core/domain/graph.go` — nodes, `GraphBinding`, `FunctionSymbol`
- `internal/core/domain/snapshot.go` — `ProjectSnapshot` v3 mirror (`classes[]`, `activeClassId`, symbol `classId`)
- `internal/core/domain/migrate_v3.go` — v2→v3 normalize on load/save (synthetic `main-class`)
- `internal/core/registry/` — embedded `core-pack.json`, environments, syntax-packs
- `internal/core/store/` — `ProjectStore` interface; `MemoryStore` (default) + `PostgresStore` (`DATABASE_URL`); migration `001_projects.sql`
- `internal/core/auth/` — JWT middleware (`AUTH_REQUIRED`, `SUPABASE_JWT_SECRET`); dev user when auth off
- `internal/core/services/` — project, graph_edit, compile, **class** (pure functions; user-scoped via `context`)
- `internal/transport/http/` — projects, compile, CORS (`Authorization` header)
- `internal/transport/mcp/` — MCP tools (thin wrappers; pass `ctx` to services); session-scoped user auth via SSE hooks
- `cmd/vvs-server/main.go` — `OpenFromEnv`, auth middleware, health shows `store` + `auth` mode
- `migrations/` — embedded SQL for Postgres bootstrap

**Local dev defaults:** no `DATABASE_URL` → memory store; `AUTH_REQUIRED=false` → `DevUserID`.  
**Frontend:** `NEXT_PUBLIC_API_MODE=http` + `apps/web/src/lib/api/client.ts` sends Bearer token on project APIs; `session.ts` holds access token; `AuthButton` (TopNav) signs in via Supabase GoTrue when env set; `cloudPersistence.ts` prefers Go API save/load when authenticated; **Auto save** toggle debounces full snapshot persist (local + cloud).

---

## Documentation Map

| Document | Use when |
|----------|----------|
| **`docs/history.md`** | Origin story — VVS 1 graduation project → VVS Web |
| **`docs/node_system.md`** | Node registry, ports, pin types, symbols, portability (§13), transpile contract |
| **`docs/syntax_pack_architecture.md`** | Syntax packs, IR v2, Rosetta, agent workflow, Tree-sitter validator-only |
| **`docs/language_profiles.md`** | Per-target native/emulated/unsupported features + warning semantics |
| **`docs/vision.md`** | Product philosophy, UE6/Verse direction, logic/syntax model |
| **`docs/roadmap.md`** | Public roadmap — Active / Next / Recently completed (mirrors in-app Open · Done) |
| **`docs/code_panel.md`** | Code panel navigation, highlight, hover, Files pin |
| **`docs/deployment.md`** | Legacy self-host notes — **not** product direction (client-first; no dedicated server) |
| **`docs/current_state.md`** | What exists today; avoid re-introducing removed UI |
| **`docs/design/interactive_docs_architecture.md`** | Live `/docs` catalog (partial). Overlay + playground still planned |
| **`docs/ui_api_delivery_loop.md`** | Wiring UI to APIs — one slice per iteration |
| `docs/naming_and_product_direction.md` | Vocabulary, product principles, terms to avoid |
| `docs/project_requirements.md` | Full requirements + phased roadmap (planning) |
| `docs/vvs_2_0_tech_stack.md` | Locked technology choices |
| `docs/environment_templates.md` | First-party env packs |
| `docs/visual_to_text_fidelity.md` | Text-shaped graphs |
| `docs/README.md` | Documentation index |
| `.agents/AGENTS.md` | Architecture rules for agents |
| `.agents/skills/vvs_ui_development/SKILL.md` | UI shell layout + design rules |
| `.agents/skills/vvs_progressive_disclosure/SKILL.md` | Show data when needed — collapse, reveal, idle inspector |
| `.agents/skills/vvs_solid_principles/SKILL.md` | SOLID principles for this monorepo |
| `.agents/memory/` | Agentic memory — decisions, loop progress, **incomplete UI backlog** |
| `.agents/skills/vvs_agentic_memory/SKILL.md` | When to read/update agent memory |

**Do not** duplicate `docs/roadmap.md` phase tables elsewhere in the app — the Roadmap view shows Open tracks vs Done only.

---

## UI Revision Decisions (Locked)

These were intentionally removed or relocated during the July 2026 UI revision:

1. **Integrations tab** / **Connect AI** → in-page **Agent** panel (hosted path); optional Go sidecar paste in a collapsed section
2. **Library local node browser** → context menu + `nodeCatalog.ts`
3. **GraphToolbar** → compile/simulation in TopNav; save in File menu
4. **Fake connected status** → honest offline/disconnected chrome
5. **Target language in code panel** → **LanguageExtensionMenu** in code top bar (hover → extension submenu; language-only click → first extension). Secondary emit options (`//`, `(x)`, sync) live in floating **details** when selection type is `code`.
6. **Library view with side panels visible** → full-width Library mode
7. **References in left project panel** → top-level **References** view; tree drives focus via `focusReference()`
8. **Shared React Flow provider for edit + reference** → separate providers; `GraphWorkspaceHost` always mounted for documents
9. **Explorer Symbols/Output tabs** → compact cycle toggle + always-on filter bar; **Ctrl+Space** focuses project filter; class scope row removed (status bar / class list)
10. **Canvas virtualization (U83)** → `onlyRenderVisibleElements` on edit + reference canvases; see `lib/graphVirtualization.ts`
