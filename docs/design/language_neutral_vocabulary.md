# Language-neutral vocabulary (revision proposal)

**Status:** Locked glossary (July 2026) — **function Declare ≠ Define** locked; implementation split = **U81**. No mass `kindId` renames in this pass.  
**Goal:** Lock user-facing terms that map cleanly to C++, Java, C#, TypeScript, Python, Go, and Rust via syntax packs, while keeping stable internal identifiers (`kindId`, diagnostic codes, file names).

**Companion:** [naming_and_product_direction.md](../naming_and_product_direction.md) · [unified_symbol_model.md](unified_symbol_model.md) · [visual_to_text_fidelity.md](../visual_to_text_fidelity.md) · [node_system.md](../node_system.md) · [language_capability_catalog.md](language_capability_catalog.md)

---

## Why this document exists

Recent decisions unified member-chain UI copy around **Declare**, handler entry around **On**, and invoke around **Call** / **Dispatch**. Implementation is **partially aligned**: web registry and `nodeKind.ts` use Declare; internal code, diagnostics, starter templates, and the Go registry copy still say **define** in many places. Before Phase D/E rework (catalog, inspector, diagnostics, MCP), we need one locked glossary and a clear **internal vs user-facing** boundary.

**Out of scope for this pass:** renaming `kindId`s, diagnostic codes, modules (`defineNodeSync.ts`), or transpiler APIs.

---

## Principles for language-neutral UI terms

1. **Semantics over syntax** — UI labels describe *roles* (declare, handle, call), not language keywords (`def`, `class`, `func`, `var`).
2. **Three roles everywhere** — **Declare** (member exists) → **Implement** (body / handler) → **Invoke** (use at a call site). Same mental model in catalog, canvas, inspector, and Project tree.
3. **Widest common denominator** — Prefer terms that appear in CS curricula and multiple ecosystems (variable, function, class, handler) over engine jargon (Blueprint, dispatcher, macro, BeginPlay).
4. **Invoke split by symbol kind** — **Call** for functions; **Dispatch** for events/handlers. Avoids overloading “call” where languages distinguish methods from events/delegates.
5. **Syntax packs own surface forms** — UI stays neutral; `packages/syntax-packs` + printers emit `def` / `fn` / `func`, `this` / `self`, `raise` / `throw`, etc.
6. **Canvas honesty** — Terms must not imply sidebar-only symbols appear in generated code. **Declare** on canvas = declaration line; Project row = index + dual-write shortcut.
7. **Stable internals** — `kindId`, `symbolRole`, IR `*Decl` types, and analyzer codes may keep historical names (`*_define`) as long as user copy and docs are consistent.

---

## Proposed locked glossary

### Core symbol lifecycle

| Concept | UI term | Avoid | kindId / internal | Maps to (examples) |
|---------|---------|-------|-------------------|-------------------|
| Member exists in scope (ordered slot) — variables, **functions**, class, event slot | **Declare** `{name}` | Define (for existence-only slots) | `var_define`, `function_define` (declare role), `event_member_define`, `class_define`; `symbolRole: declare` | Field / function signature / class shell / event slot |
| Place function body in generated code (at this chain / drop position) | **Define** `{name}` | Declare (for body placement), “open tab” as the primary label | Function release **Define** → body insert site; `symbolRole: implement` | Body block inserted where Define is placed; authored in **Edit function body** tab |
| Function body authoring surface | **Edit function body** | Define (for the tab itself) | function graph tab | Authors the body graph; does not emit a second file (U80) |
| Handler / body entry (events) | **On** `{name}` | Handler only (as node title), Define Event, Event Begin | `event_define`, `event_on_update`; `symbolRole: implement` | `def on_x` (Py), `void onX()` (C++), `onX()` (TS), `func onX` (Go) |
| Function use at call site | **Call** `{name}` | Invoke, Execute, Run | `vvs.project.call_function`; `symbolRole: invoke` | `foo()`, `self.foo()`, `obj.foo()` |
| Event/handler use at call site | **Dispatch** `{name}` | Call (events), Emit, Trigger, Broadcast | `event_dispatch`; `symbolRole: invoke` | Direct handler call line (not hidden pub/sub) |
| Read variable | **Get** `{name}` | Load, Fetch | `variable_get` | `x`, `self.x`, `this.x` |
| Write variable | **Set** `{name}` | Assign, Store | `variable_set` | `x = …`, `self.x = …` |
| Program start hook | **On Start** (entry event) | BeginPlay, main(), Event BeginPlay | `events[]` `role: 'entry'` + Declare + On | `on_start()`, `main()`, `Start()` |
| Per-frame hook | **On Update** | Tick, Event Tick | `event_on_update` (lifecycle) | `on_update(dt)`, `Update()` |
| User-named signal | **Custom event** (panel) + **Declare** / **On** / **Dispatch** (canvas) | Event Dispatcher, Delegate (as primary UI) | `events[]` `role: 'custom'` | Language-specific handler + invoke (see node_system §12) |

### Function release menu (locked — parallel to variables)

Variables: **Get** / **Set** / **Declare**. Functions: **Call** / **Declare** / **Define**.

| Menu action | Meaning | Code effect |
|-------------|---------|-------------|
| **Declare** | “There is a function” | Existence / signature only — same role as **Declare** for a variable |
| **Define** | Place the body here | Connect the function so its body is inserted at this position in the code |
| **Call** | Use it | Call site |

**Not** about `.h` / `.cpp` file splits — about **roles on one (or more) text-shaped graphs**. Header-style multi-file layout is out of scope for this lock.

**Implementation (U81 — shipped):** `function_define` = Declare (existence / abstract signature only). `function_implement` = Define (body placement on the member chain). No legacy fold; no invented stub body without Define. Call unchanged.

**U82 / U66 (all seven targets):** Only **cpp** emits a real non-abstract Declare prototype (`FUNCTION_DECLARE_PROTOTYPE_LANGS`). Elsewhere non-abstract Declare is ineffective → U66 `(x) Declare Name` + canvas dim (never silent skip). Abstract still emits (`# abstract` / `= 0` / C# `abstract` prototype). **sourceMap:** Declare maps only to its own emit; Define maps to method/`def` header + body. See [visual_to_text_fidelity.md](../visual_to_text_fidelity.md) § Function Declare / Define per language.

### Per-kind member / implement mapping

| Symbol kind | Declare (member chain) | Define / Implement | Invoke |
|-------------|------------------------|--------------------|--------|
| Variable | Declare `{name}` (`var_define`) — e.g. `int x;` | defaults on declare node | Get / Set |
| Function | Declare `{name}` — signature / “exists” | **Define** `{name}` — body insert site + **Edit function body** tab | **Call** `{name}` |
| Event (member slot) | Declare `{name}` (`event_member_define`) | **On** `{name}` (`event_define`) | **Dispatch** `{name}` |
| Class / module shell | Declare Class `{name}` (`class_define`) | — | — |
| Nested graph reference | Graph Reference (`graph_ref`) | — | — |

Function graph tabs are **Edit function body** only (author the body). **Define** on the host graph is where that body is **placed** in generated code (same file per U80). **Declare** does not place the body.
### Workspace & graph chrome

| Concept | UI term | Avoid | Internal | Notes |
|---------|---------|-------|----------|-------|
| Visual program | **Graph** | Blueprint, Asset | `GraphDocument` | One tab’s nodes + edges |
| Workspace | **Project** | Level, Asset | `ProjectSnapshot` | Container for graphs + symbols |
| Left tree | **Project** panel | My Blueprint | — | Index + CRUD; dual-writes canvas |
| Sub-canvas tab | **Graph tab** / **Edit function body** | Blueprint tab | `graphTabId` | Function tabs author body only |
| Connection point | **Port** (beginner copy); **pin** OK in dev docs | — | `Pin`, `execution` type | Prefer **flow** for execution ports in UI |
| Execution wire | **Flow** connection | Exec wire | `pinType: execution` | Linear chain semantics (node_system §5) |
| Data wire | **Data** connection | — | typed pins | |
| Build → text | **Generate** / **Generate code** | Compile (toolbar shorthand OK) | `generate`, transpile pipeline | Logs: “generation” |
| Export name | **Module name** | Class name (as primary), `BP_*` | `moduleName` | Maps to class/module per target |
| Optional base | **Extends** | Parent, Super | `extendsType` | OOP targets only |
| Community full graph | **Script** | Blueprint | Library filter | |
| Community nodes | **Node pack** | — | — | |
| AI hookup | **Connect AI** | Integrations | MCP modal | |

### Flow & data nodes (stable — audit only)

| Concept | UI term | kindId | Notes |
|---------|---------|--------|-------|
| Conditional | Branch | `flow_branch` | Neutral across languages |
| Sequence | Sequence | `flow_sequence` | |
| Loops | For Loop / While Loop | `flow_for`, `flow_while` | |
| Multi-way branch | Switch | `flow_switch` | |
| Output | Print String | `action_print` | Not “Print to console” unless teaching |
| Explicit wait | Wait / Await Wait | `action_wait`, `action_await_wait` | Text-shaped; no latent VM |
| Type change | To String / To Number | `convert_*` | One node = one call in emit |
| External API | Call Native | `env.call_native` | Host integration escape hatch |

### Rejected / legacy (do not revive in UI)

| Term | Status | Replacement |
|------|--------|-------------|
| Define-only for functions (collapse Declare+body) | **Superseded** July 2026 | **Declare** (exists) + **Define** (place body) + **Call** |
| Define (for variables / class / event slot) | **Deprecated** in user copy | **Declare** |
| Emit Event / Subscribe Event | Blocked | **Dispatch** + visible handler; future subscribe must emit one line per node |
| Macro (codegen) | Deprecated | **Function** + **Call** |
| Blueprint, BeginPlay, BP_* | Forbidden in UI | Graph, On Start, module name |
| `event_on_start` node | Deprecated | `role: 'entry'` + Declare + On |

---

## Terms still ambiguous or mixed (recommended resolution)

| Area | Current state | Recommended user-facing | Recommended internal (keep until rework) | Notes |
|------|---------------|-------------------------|------------------------------------------|-------|
| **Member ordering chain** | “define chain”, “member define chain”, “member chain” used interchangeably | **Member chain** (UI/docs) | `define chain`, `collectMemberDefineNodeIds`, `MEMBER_DEFINE_KINDS` | One doc term: *member chain* = ordered Declare nodes on class home graph |
| **Canvas node for Declare** | “define node”, “member define node”, “declare node” | **Declare node** (docs); “member slot” in tooltips | `isMemberDefineNode`, `defineNodes.ts`, `DEFINE_NODE_*` codes | Do not rename files/codes in this pass |
| **Registry `symbolRole`** | `'declare' \| 'implement' \| 'invoke' \| 'define'` — `'define'` unused in core-pack | Use only **declare / implement / invoke** in registry | Remove `'define'` from type in a later cleanup | Go `core-pack.json` lacks `symbolRole` entirely today |
| **Event spawn role in UI code** | `role: 'define' \| 'dispatch'` in custom events | User sees **Declare** / **Dispatch**; internal enum → `'declare' \| 'dispatch'` (future) | Keep `'define'` in TS until refactor | `eventHelpers.ts`, `GraphCanvas.tsx`, `ProjectTree.tsx` |
| **Catalog section for handlers** | **Handlers** (plural section) vs node title **On Event** | Section: **Handlers**; node: **On** `{name}` | `spawnCatalogCategory` → `'Handlers'` | OK if section name stays plural |
| **Handler vs On** | Both used | Node title: **On** `{name}`; inspector badge: **Handler** optional | `event_define` | “Handler” is acceptable secondary label, not primary spawn title |
| **Dispatch vs Call** | Mostly aligned | Functions → **Call**; events → **Dispatch** | — | Locked in naming doc |
| **Diagnostic messages** | “no var_define node”, “define nodes”, “define chain” | User messages: “no **Declare** node for …”, “no **member chain** on class graph” | Keep codes `DEFINE_NODE_MISSING`, etc. | Phase: `analyze.ts` message pass only |
| **Starter / migration labels** | `label: 'Define start'` in snapshot/migration | `Declare start` or bind via `getNodeDisplayTitle` | — | Trivial content fix when rework starts |
| **Function names** | `defineNodeSync`, `addVariableWithDefine`, `hasDefineNodeFor*` | — | Keep filenames; alias `*Declare*` in docs | Implementation detail |
| **IR / lowering** | `VariableDecl`, comments “define nodes” | — | Keep IR names; comments may say “declare (define) nodes” | IR matches compiler tradition |
| **Server registry copy** | Go `core-pack.json`: **Define Function**, **Define Event** | Align to **Declare** (sync from TS pack) | Same `kindId`s | **Glaring drift** — fix when registry sync is touched |
| **Pin vs Port** | Code: `pin`; UI skill: port for beginners | **Port** in onboarding; **pin** in inspector/dev | `Pin` type | Document preference; no mass rename |
| **Symbol vs member** | `symbols.ts`, “symbol table”, “member chain” | Panel: **symbol** rows; canvas: **member** slots on chain | `VariableSymbol`, etc. | Symbol = project index; member = canvas declare slot |
| **Module vs class** | `moduleName`, `ClassSymbol`, “Declare Class” | **Module name** for export; **Class** for OOP declare node | Both kept — target-dependent | Python/JS: module; C++/Java: class |
| **Generate vs Compile** | Toolbar “Generate”; some docs say compile | **Generate (code)** primary | `compile` in portability docs OK for warnings | |
| **Custom event vs handler** | `ProjectEventDefinition`, “On damage” | Panel: event name; canvas: **Declare** + **On** + **Dispatch** | `events[]` | Avoid “dispatcher” as primary noun |

---

## Internal vs user-facing boundary

| Layer | Audience | Vocabulary rule | Examples |
|-------|----------|-----------------|----------|
| **UI labels** — canvas, catalog, Project tree, inspector badges, tooltips, onboarding | End user | Locked glossary above | Declare, On, Call, Dispatch, Get, Set |
| **Registry `title`** | End user (spawn) | Match glossary | `Declare Variable`, not `Define Variable` |
| **Docs** — vision, fidelity, naming, node_system | Contributors + users | Prefer glossary; internal terms in *Implementation* sections | “Declare node (`var_define`)" |
| **`kindId`** | Code, JSON, MCP | **Stable** — snake_case, `*_define` suffix OK | `function_define`, `event_member_define` |
| **`symbolRole`** | Registry, catalog grouping | `declare` \| `implement` \| `invoke` only | |
| **Diagnostic `code`** | Analyzer, CI, agents | **Stable** | `DEFINE_NODE_MISSING`, `ORPHAN_DEFINE_NODE` |
| **TypeScript modules / functions** | Developers | Historical `define*` names OK until refactor | `defineNodeSync.ts`, `isMemberDefineNode()` |
| **IR types** | Transpiler | Compiler-neutral `*Decl`, `DispatchEvent`, `CallFunction` | `VariableDecl`, `IrMemberDecl` |
| **Comments / tests** | Developers | May use “define” with parenthetical “(Declare)” once glossary locked | |
| **MCP / Go API** | Integrators | Stable tool names; **display titles** from synced registry | `connect_pins`, `generate_code` |

**Rule of thumb:** If the user can see it in the editor, it follows the glossary. If it appears only in stack traces, JSON, or TypeScript imports, stability beats renaming.

---

## Migration notes (future rework — no code in this pass)

| Phase | Scope | Outcome |
|-------|--------|---------|
| **V0 (this doc)** | Lock glossary + audit | Team sign-off on open questions below |
| **V1 — Copy alignment** | Registry titles, `nodeKind.ts`, catalog sections, Project tree buttons, RoadmapView, starter labels | No `kindId` changes; sync Go `core-pack.json` from TS pack |
| **V2 — Diagnostics & docs** | `analyze.ts` user messages; node_system cross-links; skills/memory | Codes unchanged; messages use Declare / member chain |
| **V3 — Internal aliases (optional)** | TS aliases `*DeclareNode*`, event role `'declare'`; deprecate `symbolRole: 'define'` | Codemod or incremental; tests updated |
| **V4 — System rework** | Unified spawn UX (Phase D), effectiveness badges (Phase E), COA deferred | Per [unified_symbol_model.md](unified_symbol_model.md) |

**Verification:** Snapshot tests and Rosetta goldens unchanged by copy-only passes. Add one registry test that no core-pack `title` contains `Define ` for member kinds.

---

## Audit summary — areas needing updates when vocabulary is locked

### Registry & types

| Location | Issue |
|----------|--------|
| `packages/syntax-registry/core-pack.json` | Canonical titles — mostly **Declare** ✓ |
| `server/internal/core/registry/core-pack.json` | **Drift:** Define Function, Define Event; missing `symbolRole` |
| `packages/syntax-registry/src/registry.ts` | `SymbolRole` includes unused `'define'`; legacy label inference still accepts `Define *` prefixes |
| `packages/graph-types/src/defineNodes.ts`, `classMembers.ts` | Internal “define” naming; comments |
| `packages/graph-types/src/analyze.ts` | User-facing diagnostic strings use “define node” / “define chain” |
| `packages/graph-types/src/snapshot.ts`, `fidelityMigration.ts` | Starter label `Define start` |
| `packages/transpiler/src/ir/types.ts`, `emit/members.ts` | Comments say “define nodes/chain” |

### Web UI

| Location | Issue |
|----------|--------|
| `apps/web/src/lib/nodeKind.ts` | Display titles — **aligned** ✓ |
| `apps/web/src/lib/defineNodeSync.ts` | Module name + `hasDefineNode*` exports |
| `apps/web/src/components/layout/ProjectTree.tsx` | Buttons say **Declare** ✓; imports `defineNodeSync` |
| `apps/web/src/components/graph/GraphCanvas.tsx` | `handleDeclare*` ✓; event `role: 'define'` internally |
| `apps/web/src/components/layout/GraphFloatingDetails.tsx` | Badges Declare/Dispatch ✓; `role: 'define'` |
| `apps/web/src/lib/eventHelpers.ts` | `applyEventDefineBinding`, `role: 'define'` |
| `apps/web/src/components/views/RoadmapView.tsx` | Mostly aligned; verify after lock |
| `apps/web/src/lib/developmentRoadmap.ts` | Describes Declare alignment — reference this doc |

### Docs & agent memory

| Location | Issue |
|----------|--------|
| `docs/naming_and_product_direction.md` | Canonical table — **aligned**; link to this doc |
| `docs/visual_to_text_fidelity.md` | Uses “define node/chain” in implementation sections — add glossary link |
| `docs/design/unified_symbol_model.md` | Aligned on Declare; internal “define chain” in diagrams |
| `docs/node_system.md` | Mixed define/Declare — §12 good; §fidelity table uses define |
| `docs/current_state.md`, `docs/roadmap.md` | Light pass for cross-links |
| `.agents/memory/decisions.md` | Stale bullet “User-facing Define”; update pointer |
| `.agents/skills/vvs_*` | Several skills say “define node” — link glossary |

### Tests (message/assertion updates only in V2)

- `packages/graph-types/src/analyzeDefineNodes.test.ts`
- `packages/syntax-registry/src/registry.test.ts` (already expects Declare)
- `packages/transpiler/src/generate.test.ts` (test names only)

---

## Open questions for team decision

1. **Member chain vs declare chain** — Lock **member chain** as the user-facing name for the ordered Declare sequence?
2. **Handler section vs On** — Keep catalog section **Handlers** while nodes show **On** `{name}`?
3. **Dispatch long-term** — Is **Dispatch** the permanent event-invoke label, or should syntax-pack targets show alternate preview labels (e.g. “Invoke” in docs only)? Recommendation: keep **Dispatch** in UI; packs emit idiomatic code.
4. **Event member Declare label** — **Declare Event** vs **Declare** `{name}` only (function/variable pattern)? Recommendation: dynamic **Declare** `{name}` everywhere; catalog template titles can stay typed for discovery.
5. **Diagnostic codes** — Rename `DEFINE_NODE_*` → `DECLARE_NODE_*` ever, or forever internal? Recommendation: **keep codes**; change messages only.
6. **`symbolRole: 'define'`** — Delete from type in V3? Recommendation: **yes**, unused.
7. **Go registry sync** — Single source of truth: generate Go pack from TS, or CI drift check? Recommendation: CI check or copy script in V1.
8. **Program entry display** — Panel shows entry event as “On Start” vs “start” stem? Align with `eventDisplayName()` behavior.

---

## Agent checklist (after lock)

- [ ] New UI strings use glossary — **Declare** for member existence (including functions)
- [ ] Function release menu: **Call** / **Declare** / **Define** (body placement ≠ existence)
- [ ] No Blueprint / BeginPlay / BP_ in user copy
- [ ] Functions → **Call**; events → **Dispatch** (not Call)
- [ ] Docs distinguish **symbol** (index) vs **member** (canvas chain)
- [ ] `kindId` renames require explicit RFC — not vocabulary alignment
- [ ] Do **not** frame this as “we need header files” — roles on text-shaped graphs
---

## Related documents

| Document | Role |
|----------|------|
| [naming_and_product_direction.md](../naming_and_product_direction.md) | Current canonical product vocabulary |
| [unified_symbol_model.md](unified_symbol_model.md) | Declare → implement → invoke architecture |
| [visual_to_text_fidelity.md](../visual_to_text_fidelity.md) | Canvas source of truth |
| [node_system.md](../node_system.md) | Registry kinds, events §12 |
| [syntax_pack_architecture.md](../syntax_pack_architecture.md) | Per-language print layer |
