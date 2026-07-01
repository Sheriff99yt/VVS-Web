---
name: VVS UI Development
description: Triggers when building user-facing features, Next.js components, or React Flow UI in apps/web.
---

# UI-First Strategy

- When building user-facing features, prioritize designing the User Interface (Next.js components) first to establish the visual flow.
- **Crucially:** This does NOT override the Interface-First workflow. While building the UI, define the abstract data structures and interfaces the UI will need. Do not implement complex backend or transpiler logic until the interfaces and UI requirements are fully aligned and approved.
- Always build exactly as planned in `docs/project_requirements.md`, ensuring strict separation of concerns between UI, Transpiler, and Server.
- **Canonical shell reference:** `docs/current_state.md` — update it when the layout changes.
- **Naming:** `docs/naming_and_product_direction.md` — no Blueprint/BeginPlay/BP_ in user-facing copy.

# App Shell (Locked Layout)

### Top-level views (TopNav)

| View | Mode |
|------|------|
| **Canvas** | Full editor chrome (explorer, canvas, console, properties, code preview) |
| **References** | UE5-style reference viewer — own layout; edit canvas unmounted |
| **Library** | Full-width community UI only — hide editor side panels |

**Do not add:** Roadmap tab, Integrations tab, or duplicate node catalogs in Library.

### TopNav (Canvas only)

- **File:** New, Save, Load, Export JSON (mock save/load via `api-mock.ts`)
- **Edit:** Undo, Redo
- **View:** Zoom to Fit
- **Compile** button with dirty/compiling/success/error states
- **Play / Pause / Stop** simulation controls (`simulationState` in `ProjectContext`)
- **Connect AI** modal (MCP URL — show disconnected until backend exists)

**Do not add:** `GraphToolbar` or duplicate Compile/Save elsewhere.

### Mock / offline chrome

- Status bar: `MCP: DISCONNECTED`, `OFFLINE MODE`
- No fake CPU/MEM metrics or “sync active” indicators
- No `animate-pulse` on connection dots; no heavy `backdrop-filter` on modals

### Node spawning

- Spawnable nodes: `lib/nodeCatalog.ts` + canvas context menu (`NodeContextMenu`)
- Library view: community scripts only — not a second local node browser

# Modular & Maintainable Implementation (Frontend)

- Strictly divide Server Components (data fetching) from Client Components (interactive UI/React Flow). 
- Isolate complex state (e.g., Xyflow logic) into custom hooks. Keep React UI components "dumb" and purely presentational where possible.

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
- **UE-style category tree** (single scrollable panel): Graphs · Functions · Macros · Variables · Event Dispatchers · Generated.
- **References** is a **top-level TopNav view**, not a left-panel category — the same `ProjectTree` appears in References mode with `mode="references"` (single-click focuses reference graph).
- **Graphs** holds the primary **Event Graph**; functions/macros live in their own categories (not nested under Graphs).
- **Variable Lifecycle Management**: Users must be able to add, edit (Name, Type, Default Value), and delete local variables.
- **Function/Event Sub-graphs**: Users must be able to create custom macros/functions, which open in separate graph tabs.
- **Drag-and-Drop Spawning**: Users must be able to drag a variable from the list and drop it on the canvas to spawn a contextual `Get`/`Set` node.
- **Navigation modes:** `ProjectTree` / `GraphExplorer` accepts `mode: 'canvas' | 'references'` — canvas single-click selects; references single-click calls `focusReference()`; double-click always opens graph in Canvas.
- **Progressive disclosure:** Generated collapsed by default; per-category + on row headers.

### 2. Right Panel (Properties Inspector)
- **Context-Aware Forms**: The inspector must adapt based on the global selection state:
  - *Selected Node*: Show Node input forms.
  - *Selected Variable (Left Panel)*: Show Variable editing form (Name, Data Type dropdown, Default Value).
  - *No Selection / Graph*: Show global Graph settings in `GraphPropertiesPanel` — Class Name, Parent Class, Description, **Target Language**, Auto-compile toggle.

### 3. Center Panel (Graph Canvas & Interaction)
- **Context-Sensitive Spawning**: Dragging a wire into empty space must open the Context Menu automatically, filtered to ONLY show nodes compatible with that wire's data type.
- **Comment Grouping**: Users must be able to select multiple nodes and wrap them in a colored, resizable Comment Box for documentation.
- **Reroute Pins**: Double-clicking an edge must spawn a transparent reroute node to organize complex spaghetti wiring.
- **Copy/Paste**: Full clipboard support for nodes and wires.

### 4. Top Navigation Bar
- **Compile/Validation Pipeline**: Prominent Compile button with clear visual states (Dirty → Compiling → Success/Error).
- **Simulation Controls**: Play/Pause/Stop for stepping through execution flow.
- **Connect AI**: MCP connection modal — not a separate Integrations page.

### 5. Code Preview Panel
- Read-only generated code for the active target language.
- Language selection lives in **Graph Properties**, not in the code panel header.
- Until `packages/transpiler` exists, mock templates in `CodePreviewPanel` are acceptable.
- **Progressive disclosure:** panel starts collapsed; opens on compile success or via StatusBar **Code** toggle. See [`vvs_progressive_disclosure`](../vvs_progressive_disclosure/SKILL.md).

# Show Data When Needed

When designing or extending any panel, tree, inspector, or overlay, follow [`.agents/skills/vvs_progressive_disclosure/SKILL.md`](../vvs_progressive_disclosure/SKILL.md):

- Default view = canvas + minimal chrome.
- Collapse secondary panels; reveal on user action or workflow events.
- Inspector idle until node/variable selected; graph settings on explicit open.
- Compact search affordances (icon-only control → expanded bar on focus).
