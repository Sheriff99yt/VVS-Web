# Multi-Class Projects & Canvas-Defined Symbols

**Status:** Design alignment (July 2026) — not implemented.  
**Companion:** [visual_to_text_fidelity.md](../visual_to_text_fidelity.md) · [naming_and_product_direction.md](../naming_and_product_direction.md) · [node_system.md](../node_system.md) · [current_state.md](../current_state.md)

---

## Summary

Today each **project** maps to **one implicit module/class** (`projectDetails.moduleName`). Variables, functions, and events live in flat project-level symbol arrays; the transpiler **prepends** declarations from that symbol table before lowering graph bodies. The user vision extends text-shaped fidelity to **class formation**: multiple classes per project, a **class list** in the Project panel, **class-scoped** symbol browsing, and **define nodes on canvas** that emit declarations in graph order — not hidden preamble magic.

---

## Current state vs vision

| Area | Current (shipped) | User vision |
|------|-------------------|-------------|
| **Module scope** | One `moduleName` on `projectDetails`; one emitted class/module per compile unit | Multiple **classes** per project; each class is a first-class symbol |
| **Project panel** | Flat sections: Graphs (Main only), Functions, Variables, Event Dispatchers | **Classes** section above/beside functions; selecting a class filters child symbols |
| **Symbol ownership** | `variables[]`, `functions[]`, `events[]` on `ProjectSnapshotV2` — no parent | Variables, functions, events scoped by `classId` |
| **Variable declaration** | Created in Project panel (`createVariableSymbol`); emitted in emitter preamble (`emitPythonModule` loops `ir.variables`) | **`var_define`** (or equivalent) node on canvas emits declaration at that position |
| **Function declaration** | Created in panel; signature emitted from symbol table; body from function graph tab + `function_entry` node | **`function_define`** node on class graph emits signature; body still in linked sub-graph |
| **Class declaration** | Implicit — emitter opens `class ${moduleName}` | **`class_define`** node (or ordered chain) opens class body; user sees formation order |
| **Graph tabs** | `main` + one tab per function/overload | Class may own a **class graph** tab; functions remain sub-graph tabs scoped to class |
| **Codegen fidelity** | Get/Set/Call nodes map to text; **declarations do not** | Declarations must map to visible text and `sourceMap` like other behavioral nodes |
| **Calculator example** | Vars in sidebar; Get/Set on canvas; `def Add`/`def Clear` from symbol preamble | Class graph shows define nodes for `A`, `B`, `Result`, `Add`, `Clear` in author order |

### Architectural tension (intentional)

The shipped model treats **sidebar symbols as source of truth** and **canvas nodes as usage sites**. The vision moves **declarations** onto the canvas while keeping **usage nodes** (Get/Set/Call) — aligning with [visual_to_text_fidelity.md](../visual_to_text_fidelity.md): *what you see on the graph is what you could have typed*.

Sidebar lists remain useful as **indexes and CRUD shortcuts**, but codegen must not emit declarations that have no canvas correlate once define nodes ship.

---

## 1. Data model

### 1.1 `ClassSymbol` (new)

```typescript
interface ClassSymbol {
  kind: 'class';
  id: string;
  name: string;              // UI + emitted class/module name (replaces per-class moduleName)
  extendsType?: string;      // optional base type — OOP targets only
  description?: string;
  /** Graph tab hosting class-level structure (define nodes, on_start, etc.). */
  graphTabId?: string;       // defaults to id when class graph is created
  visibility?: 'public' | 'private';
}
```

**Project snapshot (v3, planned):**

```typescript
interface ProjectSnapshotV3 {
  version: 3;
  // projectDetails: { name, description } — project container only; moduleName moves to ClassSymbol
  classes: ClassSymbol[];
  variables: VariableSymbol[];   // + classId: string
  functions: FunctionSymbol[]; // + classId: string
  events: ProjectEventDefinition[]; // + classId: string
  activeClassId: string;
  // ... existing fields (documents, openTabs, targetLanguage, etc.)
}
```

**Migration from v2:**

- Single implicit class: `{ id: 'main-class', name: projectDetails.moduleName, extendsType: projectDetails.extendsType, graphTabId: 'main' }`.
- All existing symbols get `classId: 'main-class'`.
- `projectDetails.moduleName` deprecated in favor of class name (loader copies for one release).

### 1.2 Scoping rules

| Symbol | Required `classId` | Cross-class |
|--------|-------------------|-------------|
| Variable | yes | Static/module binding may be referenced across classes via explicit import/call — **defer cross-class refs to slice 4** |
| Function | yes | Call Function nodes resolve within class first; cross-class = future `import` node |
| Event | yes | Dispatch/subscribe within class; cross-class events deferred |
| Graph tab | optional `classId` on tab metadata | `main` tab becomes **class graph** for active class |

### 1.3 Graph node kinds (new registry entries)

| `kindId` | Role | Lowers to |
|----------|------|-----------|
| `class_define` | Opens class/module body; name, extends, visibility | IR `ClassDecl` + begins ordered member emission |
| `var_define` | Declares instance/static/module variable + default | IR `VariableDecl` with `sourceGraphNodeId` |
| `function_define` | Declares signature; links to function graph tab | IR `FunctionDecl` + `functionBodies[funcId]` from sub-graph |
| `event_define` | Declares event signature (project event binding) | IR event signature (complements handler `event_define` nodes) |

**Existing nodes (unchanged usage):**

- `variable_get` / `variable_set` — reference symbol by id (must exist via define node or legacy sidebar until migration complete).
- `vvs.project.call_function` — call site only.
- `function_entry` — entry pin inside function sub-graph (not the public signature).
- `event_define` (handler) — handler body entry; distinct from project-level `event_define` **declaration** node on class graph.

**Ordering:** On a class graph, a **member chain** (exec-wired or explicit `sequence` of define nodes) determines emission order within the class body. Analyzer validates: every referenced symbol has a define node (or explicit legacy mode flag during migration).

### 1.4 IR changes (transpiler contract)

Extend `IrModule` (or introduce `IrClass` nested in `IrProject`):

```typescript
interface IrClass {
  classId: string;
  name: string;
  extendsType?: string;
  /** Ordered member declarations from canvas define nodes. */
  members: IrMemberDecl[];
  onStartBody: IrStatement[];
  eventHandlers: IrEventHandler[];
  functionBodies: Record<string, IrStatement[]>;
}

type IrMemberDecl =
  | { kind: 'VariableDecl'; sourceGraphNodeId: string; symbol: VariableSymbol }
  | { kind: 'FunctionDecl'; sourceGraphNodeId: string; symbol: FunctionSymbol }
  | { kind: 'EventDecl'; sourceGraphNodeId: string; symbol: ProjectEventDefinition };
```

**Emitter rule change:** For class-scoped compile, **do not** iterate `ir.variables` / `ir.functions` independently of `members`. Walk `members` in order, then append handlers/start bodies that are wired from define/handler nodes.

Legacy path (slice 0 / migration): if no define nodes present, fall back to current preamble behavior with a portability warning (`DECLARATION_NOT_ON_CANVAS`).

Multi-class compile: one output file per class (existing multi-file pattern) or single file with multiple classes — profile-driven via `integration.json` / language profile.

---

## 2. UI flow

### 2.1 Project panel layout

```text
┌ Project: MyApp ─────────────────┐
│ [filter]                        │
├ Classes ─────────────────── [+] │
│ ▶ Calculator          (active)  │
│   Main graph                    │
│   Functions (2)                 │
│   Variables (4)                 │
│   Events (2)                    │
│ ▶ Logger                        │
├ Graphs ─────────────────────────│  ← optional: collapse when class nested
│ ...                             │
└─────────────────────────────────┘
```

**Progressive disclosure** ([vvs_progressive_disclosure](../.agents/skills/vvs_progressive_disclosure/SKILL.md)):

- Default: **Classes** section expanded; one class selected.
- Child sections (Functions, Variables, Events) show **only active class** symbols.
- Double-click class → open class graph tab.
- `+` on Classes → create class (name dialog) + empty class graph with `class_define` starter node.

### 2.2 Selection → context

| User action | Effect |
|-------------|--------|
| Select class in tree | Set `activeClassId`; filter panel lists; breadcrumb `MyApp › Calculator` |
| Select function under class | Same as today + scoped to class |
| Add variable via panel | Adds to **active class**; optionally spawns `var_define` on class graph (slice 2) |
| Spawn define node from catalog | Creates symbol + define node wired in member chain |

### 2.3 Graph tabs vs classes

| Tab type | Purpose |
|----------|---------|
| `class` (new) | Class structure graph — define nodes, on_start, top-level flow |
| `function` | Function body (unchanged); parent = `classId` |
| `main` | **Migrate to `class` tab** — alias for default class graph during v2→v3 |

`GraphBreadcrumb`: `Project › {ClassName} › {FunctionName}`.

### 2.4 Inspector

- **Class selected:** name, extends, description, target language (inherit from project or override later).
- **Define nodes:** pin/schema editors bind to symbol ids; renames propagate via `useSymbolLifecycle`.

---

## 3. Transpiler contract (detailed)

### 3.1 Pipeline delta

```text
Today:
  snapshot.symbols → graphToIr → IrModule { variables[], functions[] } → emit preamble + bodies

Target:
  class graph define nodes → analyze member order → IrClass.members[]
  function sub-graphs → functionBodies (unchanged)
  main/class graph flow → onStartBody, eventHandlers (unchanged)
  emit walks members[] then handlers (no duplicate preamble)
```

### 3.2 Snapshot tests

Any emitter change **requires** Rosetta/snapshot updates per [AGENTS.md](../../.agents/AGENTS.md). Slice 3 delivers tests for:

- Single class with ordered var/function define nodes
- Calculator migrated layout
- Legacy v2 project fallback preamble

### 3.3 Source maps

Each `*_define` node registers spans for the declaration line(s) — same `sourceGraphNodeId` contract as statements.

---

## 4. Calculator migration (canvas shape)

### 4.1 Today

- Sidebar: `A`, `B`, `Result`, `ShowResult`, functions `Add`, `Clear`, events `calculate`, `clear`.
- Main graph: runtime flow only (input, set, dispatch, handlers).
- Function tabs: `function_entry` + logic.
- Emitted Python: class preamble with all vars + `def Add` + `def Clear`, then methods from graphs.

### 4.2 Target (single class `Calculator`)

**Class graph (new top section above flow):**

```text
[class_define Calculator]
    → [var_define A: number = 0]
    → [var_define B: number = 0]
    → [var_define Result: number = 0]
    → [var_define ShowResult: boolean = true]
    → [function_define Add → fn-add tab]
    → [function_define Clear → fn-clear tab]
    → [event_define calculate]
    → [event_define clear]
    → [On Start] → … (existing main flow)
```

**Function graphs:** unchanged bodies; signatures emitted from `function_define` nodes on class graph, not duplicated from sidebar.

**Hello World:** one `class_define HelloWorld` + On Start → Print; no sidebar variables.

### 4.3 Dual-write transition

During slice 2, creating a symbol from the panel also inserts a define node on the active class graph (or prompts). Analyzer warns if sidebar symbol lacks define node. Slice 3 removes preamble fallback for projects with any define node present.

---

## 5. Phased delivery

| Slice | Scope | Packages | Deps |
|-------|--------|----------|------|
| **1 — Types + panel** | `ClassSymbol`, `classId` on symbols, v3 snapshot loader (v2 compat), Classes section in `ProjectTree`, `activeClassId` in `ProjectContext`, filtered lists | `graph-types`, `apps/web` | None |
| **2 — Define nodes** | Registry kinds `class_define`, `var_define`, `function_define`, `event_define`; spawn + inspector; panel↔canvas sync; analyzer: symbol↔define pairing | `syntax-registry`, `apps/web`, `graph-types` analyze | Slice 1 |
| **3 — Transpiler** | `IrClass.members`, ordered emit, legacy fallback, Calculator/Hello World example rewrite, snapshot tests | `transpiler`, `syntax-packs` templates if needed | Slice 2 |
| **4 — MCP/API** | Go domain v3, MCP tools filter by class, `AddClass`/`ListClasses`, graph_edit scoped | `server/` | Slice 1–3 stable |

**Out of scope for initial slices:** cross-class calls, multiple classes in one output file (unless language profile already supports it), UE plugin parity (Phase 5 tracks web schema).

---

## 6. Roadmap placement

| Phase | Fit |
|-------|-----|
| **Phase 2** (active) | **Not required** — cloud/auth/MCP do not block class model |
| **Phase 2.5 / early Phase 3** | **Recommended home** — editor + transpiler fidelity enhancement before community library scale |
| **Phase 3** | Community templates benefit from multi-class example projects |
| **Phase 5** | UE plugin inherits `ClassSymbol` + define nodes for Verse modules |

**In-app Roadmap:** add under **Coming soon** → “Multi-class projects & canvas-defined symbols” linking here (see `developmentRoadmap.ts`).

---

## 7. Open decisions

1. **Tab type naming:** rename `main` → `class` in `GraphTab.type` or keep `main` as alias for default class graph?
2. **Module vs class UI label:** keep “Module name” per [naming_and_product_direction.md](../naming_and_product_direction.md) or expose “Class name” when OOP target selected?
3. **Member ordering:** exec chain only vs dedicated “Class members” sequence lane on canvas?
4. **Single-class projects:** hide Classes section when `classes.length === 1` (progressive disclosure)?

---

## 8. References (code)

| Topic | Location |
|-------|----------|
| Flat symbol arrays | `packages/graph-types/src/snapshot.ts` |
| Symbol types | `packages/graph-types/src/symbols.ts` |
| Project panel | `apps/web/src/components/layout/ProjectTree.tsx` |
| Symbol CRUD/rename | `apps/web/src/hooks/useSymbolLifecycle.ts` |
| Function ↔ tab link | `apps/web/src/lib/functionTabs.ts` |
| Calculator example | `apps/web/src/lib/examples/complexExample.ts` |
| Preamble emission | `packages/transpiler/src/emit/python.ts` (and js/cpp/verse) |
| IR module shape | `packages/transpiler/src/ir/types.ts` |
| Lowering entry | `packages/transpiler/src/lower/graphToIr.ts` |
