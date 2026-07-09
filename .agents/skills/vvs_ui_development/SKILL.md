---
name: VVS UI Development
description: Triggers when building user-facing features, Next.js components, or React Flow UI in apps/web.
---

# UI-First Strategy

- When building user-facing features, prioritize designing the User Interface (Next.js components) first to establish the visual flow.
- **Crucially:** This does NOT override the Interface-First workflow. While building the UI, define the abstract data structures and interfaces the UI will need. Do not implement complex backend or transpiler logic until the interfaces and UI requirements are fully aligned and approved.
- **Text-shaped graphs:** UI must not imply behavior that generated text cannot show — see `docs/visual_to_text_fidelity.md`.
- Always build exactly as planned in `docs/project_requirements.md`, ensuring strict separation of concerns between UI, Transpiler, and Server.
- **Canonical shell reference:** `docs/current_state.md` — update it when the layout changes.
- **Naming:** `docs/naming_and_product_direction.md` — no Blueprint/BeginPlay/BP_ in user-facing copy.

# Canvas source of truth (locked)

**Canonical:** `docs/visual_to_text_fidelity.md` § Canvas is the source of truth · Trigger skill: `vvs_visual_code_fidelity/SKILL.md`

- Project tree / panel rows are **indexes** — they do not imply a line exists in generated code unless a define node exists on canvas
- Drag **Call** / **Declare** must create usage or define nodes; panel `+` uses `add*WithDefine` / `defineNodeSync`
- UI copy: **Declare** on graph emits declarations; panel adds symbols that dual-write define nodes — not "add to code" from sidebar alone
- Code panel highlight is the trust contract — if selection cannot map via `sourceMap`, fidelity is broken

# App Shell (Locked Layout)

### Top-level views (TopNav)

| View | Mode |
|------|------|
| **Canvas** | Full editor chrome (explorer, canvas, floating panels, code preview) |
| **References** | UE5-style reference viewer — own layout; edit canvas **unmounted** |
| **Library** | Full-width community UI only — hide editor side panels |
| **Roadmap** | In-app shipped vs coming-soon summary (not a duplicate of `docs/roadmap.md`) |

**Do not add:** Integrations tab, or duplicate node catalogs in Library.

### Graph domain isolation

Edit and reference canvases **must not share one React Flow store**. See `docs/current_state.md` § Graph system architecture.

```text
GraphWorkspaceHost (always mounted, no React Flow)
├── useGraphState + useGraphTabSync
└── GraphEditContext → GraphCanvas (Canvas view only)

Canvas:     ReactFlowProvider (edit) → GraphCanvas + GraphSelectionToolbar
References: ReactFlowProvider (ref)  → ReferenceGraphCanvas (read-only)
```

- `CodePreviewPanel` reads documents via `useGraphDocuments`, not React Flow `useStore`
- `referenceRootGraphId` updates via `focusReference()` only — not from `activeGraphTab`
- Orphan: `ReferenceViewer.tsx` — superseded by `ReferencesView`; do not re-add to left panel

### TopNav (Canvas only)

- **File:** New, Save project, Load, Export JSON; folder save when FS Access available
- **Edit:** Undo, Redo, Validate & compile (Ctrl+G), Extract to function
- **View:** Zoom to Fit, panel toggles
- **Auto Generate** / **Auto Save** toggles — debounced compile / code sync when on; manual **Generate** / **Save** when off
- **Connect AI** modal — MCP URL + **Test connection** via `VvsApi.probeMcp`
- **AuthButton** — sign-in when `NEXT_PUBLIC_SUPABASE_*` configured

**Removed:** Play/Pause/Stop simulation toolbar (mock stepping exists elsewhere). **Do not re-add** `GraphToolbar`.

### StartScreen (`components/start/StartScreen.tsx`)

- **Start:** New blank, Open file, folder picker buttons (gated by `useFolderPickerSupported`)
- **Usability tests:** `USABILITY_EXAMPLE_TESTS` from `lib/usabilityExampleProjects.ts` — regression fixtures (Hello World, Calculator); see `docs/design/language_capability_catalog.md`
- **Explore:** shortcuts to Library and Roadmap views in editor
- **Recent:** via `useRecentProjects()` — deferred localStorage hydration (see below)
- **AuthButton** when Supabase configured

### Canvas selection toolbar

`GraphSelectionToolbar.tsx` — floating actions above selected node(s) via `ViewportPortal`:

- Duplicate, group/ungroup comment, delete
- Driven by `useGraphNodeSelection`; actions via `dispatchGraphAction`

### Mock / offline chrome

- Status bar: honest **offline/disconnected** — no fake CPU/sync metrics
- `useApiHealth` + `VvsApi.getHealth` — show `store`/`auth` when HTTP mode
- **Code output:** open by default in Canvas — **Code | Files** tabs (`CodeOutputPanel`); per-graph language/extension; project defaults for new graphs
- Compiler log: collapsed by default; expands on compile/error (StatusBar **Log** toggle)
- No `animate-pulse` on connection dots; no heavy `backdrop-filter` on modals

### Hydration patterns (mandatory for browser-only APIs)

- **`useFolderPickerSupported`** — returns `false` during SSR and first paint; `useEffect` sets true after mount when FS Access API exists
- **`recentProjectsSubscribe.ts`** — stable empty SSR snapshot; `useSyncExternalStore` refreshes from localStorage only after client subscribe
- **Never** read `localStorage` / `sessionStorage` / `window.showDirectoryPicker` during render on server

### Node spawning

- Spawnable nodes: `@vvs/syntax-registry` via `lib/nodeCatalog.ts` → canvas context menu
- **Conversion** nodes — wire between Get and Print; never skip for numeric print
- **Reuse:** Function + Call Function; macro tabs are **legacy**
- Library view: community scripts only — not a second local node browser

# Modular & Maintainable Implementation (Frontend)

- Strictly divide Server Components (data fetching) from Client Components (interactive UI/React Flow).
- Isolate complex state (Xyflow, tab sync, selection) into custom hooks. Keep React UI components "dumb" where possible.
- TopNav → canvas actions use `graphActions` custom events, not synthetic `KeyboardEvent`.

# Design & Styling Rules (OVERRIDE GLOBAL AESTHETICS)

- **Mandatory Minimalist UI**: Disregard any global instructions to use "glassmorphism", "rich effects", or "dynamic animations".
- **Light CSS & Animations**: Keep CSS extremely lightweight. Avoid heavy `box-shadow`, `backdrop-filter`, or complex gradients. Use only "lite" CSS transitions (`0.15s ease`) for visual feedback, and only trigger them when needed (e.g., user hover or selection). Never use constant/infinite animations.
- **Clean Visual Feedback**: Focus on function over form. Use clear, subtle state changes (e.g., solid 1px borders, subtle opacity changes, or simple flat colors) for hover and selection states.
- **Modern & Functional**: The UI should feel like a modern, professional developer tool—clean, legible, and un-distracting.
- **Distinct Semantic Color Coding**: Ensure node categories and data types have highly visible, easy-to-recognize color coding. Do not make colors so muted that they become hard to distinguish at a glance.
- **Distinct Pin Geometry**: Data type pins must use easy-to-recognize distinct shapes (e.g., Execution = Chevron/Square, Boolean = Diamond, String = Circle, Number = Hexagon, Array = Grid/Stack). Never rely on color alone to differentiate data types.

# Visual Scripting Functional UI Elements Matrix

Whenever building or evaluating the UI panels, ensure the following professional Visual Scripting features and use-cases are accounted for:

### 1. Left Panel (Project)
- **UE-style category tree** (single scrollable panel): Graphs · Functions · Variables · Event Dispatchers. **Generated files** live in the right panel **Files** tab (not the project tree).
- **References** is a **top-level TopNav view**, not a left-panel category — `ProjectTree` uses `mode="references"` (single-click focuses reference graph).
- **Variable Lifecycle Management**: add, edit (Name, Type, Default Value), delete local variables.
- **Function/Event Sub-graphs**: custom functions open in separate graph tabs.
- **Drag-and-Drop Spawning**: drag variable → spawn Get/Set node on canvas.
- **Navigation modes:** `mode: 'canvas' | 'references'` — canvas single-click selects; references single-click `focusReference()`; double-click opens in Canvas.
- **Progressive disclosure:** per-category + row headers in project tree; **Files** tab shows full emit tree on demand.

### 2. Floating inspector (canvas overlay)

- **`GraphFloatingDetails.tsx`** — not a docked right sidebar in Canvas mode
- **Context-Aware Forms** — selection drives panel content:
  - *Selected Node*: Settings (`PropertySchemaPanel`) → Pins (`NodePinsPanel`) → binding plugins
  - *Selected Variable / Function / Event*: respective property panels
  - *No Selection*: panel hidden; graph settings via breadcrumb **settings** modal (`GraphSettingsModal`)
- **Call overload picker:** `CallNodeOverloadPanel` when `func.overloads.length > 1`
- **Progressive disclosure:** compact summary when collapsed; force-expand on broken ref

### 3. Center Panel (Graph Canvas & Interaction)
- **GraphSelectionToolbar** — selection-scoped duplicate/group/delete
- **Context-Sensitive Spawning**: wire into empty space → filtered context menu
- **Comment Grouping**, **Reroute Pins**, **Copy/Paste/Cut/Duplicate**

### 4. Top Navigation Bar
- **Generate/Validation Pipeline**: Auto Generate toggle + manual Generate; dirty/compiling/success/error states
- **Connect AI**: MCP modal — not a separate Integrations page
- **AuthButton** when cloud auth configured

### 5. Code Preview Panel
- Read-only generated code; target language in **Graph Properties** / settings modal
- Codegen via `@vvs/transpiler` (facade: `lib/mockCodegen.ts`)
- Selection highlight: `TranspileResult.sourceMap` + expression spans
- **Progressive disclosure:** compiler log collapses until errors; StatusBar **Code** toggle

# Show Data When Needed

When designing or extending any panel, tree, inspector, or overlay, follow [`.agents/skills/vvs_progressive_disclosure/SKILL.md`](../vvs_progressive_disclosure/SKILL.md):

- Default view = canvas + minimal chrome.
- Collapse secondary panels; reveal on user action or workflow events.
- Inspector idle until node/variable selected; graph settings on explicit open.
- Compact search affordances (icon-only control → expanded bar on focus).
