# Locked Decisions

Choices agents must not undo without explicit user approval.

## Cross-language mapping skill layout (July 2026)

- **One skill only:** `.agents/skills/vvs_cross_language_mapping/SKILL.md` (parent index + workflow).
- **Exactly one doc per language** (siblings of the skill, not skills): `cpp.md`, `python.md`, `javascript.md`, `csharp.md`, `rust.md`, `gdscript.md`, `verse.md`.
- **Shared cross-cutting only:** `shared/` (nodes-vs-settings, translation-matrix, declare-define-rules, feature-support).
- **Agent habit:** open parent skill → open **one** `<lang>.md` for the target; do not open other language docs.

## No live code execution (July 2026 — locked)

- **VVS does not execute code** — no Play, no interpreter, no target-language runner, no “run in IDE/engine from VVS” product path
- **In scope:** graph/codegen **logical checks** and **warnings** (analyzer, portability, `(x)` / dim, compiler log) so authors catch issues before export
- **Execution:** left entirely to **third-party** tools the user already has (IDE, Godot, compilers, CI, local MCP). Generate ordinary source; do **not** reinvent a run wheel inside VVS
- **Do not** revive mock Play/Pause simulation or backlog an in-app runner
- **Canvas scale:** **U83 virtualization** shipped (`onlyRenderVisibleElements` + pin/search subscribe cuts) — see `docs/roadmap.md` · `lib/graphVirtualization.ts`

## Text-shaped graphs (July 2026 — major direction)

**Canonical spec:** `docs/visual_to_text_fidelity.md`

- **Product direction:** **Text-shaped graphs** — the canvas edits **ordinary source structure**; every behavioral node maps to **visible, locatable** generated text
- **Fidelity contract:** No compile-time paste, no hidden casts, no latent VM steps absent from export
- **Integration goal:** Generated files embed in **any** third-party stack (IDE, git, CI, MCP) — **no VVS runtime required**
- **Reuse:** **Function + Call Function** — not Blueprint macro inline expansion
- **Events:** **Declare** (member) + **On** (handler) + **Dispatch** → visible handler methods and direct call lines (`self.on_<name>(…)`); **program entry** (`role: 'entry'`) uses the same pattern and emits `on_start` only from canvas — no hidden lifecycle shortcut
- **Event runtime (July 2026 — enforced):** `event_emit` / `event_subscribe` **blocked** (`HIDDEN_EVENT_RUNTIME_UNSUPPORTED`); transpiler does **not** inject `_emit` / `_subscribe`; duplicate handlers without visible multicast → `MULTICAST_REQUIRES_SUBSCRIBE` error — no hidden callback lists
- **Timing (future):** **Wait** / **Await Wait** nodes + async graph flag — explicit in text, not latent Delay
- **Macro tabs / `use_macro`:** **Deprecated as codegen concept** — migrate to Function + Call (UI may linger until alignment plan ships)
- **Rejected:** Blueprint-faithful semantics (macro expand, latent delay, VM-only behavior) — breaks visual↔text trust and third-party embedding
- **UE6 plugin:** Same fidelity rules; emits **Verse text** — does **not** simulate Blueprint VM

## Canvas source of truth (July 2026 — locked)

**Canonical spec:** `docs/visual_to_text_fidelity.md` § Canvas is the source of truth

- **Product promise:** The canvas is the source of truth for generated code — every export line maps to a canvas node via `sourceGraphNodeId` / `sourceMap`
- **Symbol tables:** `variables[]`, `functions[]`, `events[]` are **indexes and CRUD shortcuts** — they never emit declarations on their own
- **Declare vs use:** Member-chain nodes emit into the host file. UI: **Declare** for existence (variables, **functions**, class, event slots); **Define** for function **body placement**; Get/Set/Call/Dispatch for usage. See vocabulary doc
- **No sidebar preamble:** `appendLegacyPreamble` and `useLegacyPreamble` are **removed** — transpiler uses `appendIrMembers` / `ir.members` only
- **Dual-write required:** Panel create paths must spawn define nodes (`defineNodeSync`, `useSymbolLifecycle`) — no symbol-only creates
- **Strict analyzer errors (block Generate):** `DEFINE_NODE_MISSING`, `DECLARATION_NOT_ON_CANVAS`, `ORPHAN_DEFINE_NODE`, `PROGRAM_ENTRY_MISSING`, `PROGRAM_ENTRY_NOT_ON_CANVAS`, `LIFECYCLE_NODE_DEPRECATED`, `HIDDEN_EVENT_RUNTIME_UNSUPPORTED`, `MULTICAST_REQUIRES_SUBSCRIBE`
- **Class declare:** `class_define` required when home graph has any member define chain; blank class with no defines passes analysis; symbols-only off-canvas → `DECLARATION_NOT_ON_CANVAS`; deleting class Declare blocks export but preview may show member body without class shell (preview-only)
- **Program entry:** `events[]` with `role: 'entry'` — user declares start via `event_member_define` + `event_define` on the class graph (same pattern as custom events); transpiler emits `on_start` only from canvas; legacy `event_on_start` nodes error on load/analysis; **no** empty `on_start()` injection
- **Do not undo:** No backward-compat fallback that emits from symbol arrays without define nodes

## Unified symbol model & COA (July 2026)

**Canonical spec:** `docs/design/unified_symbol_model.md`

- **Declare → implement → invoke** — variables (Declare + Get/Set), functions (Declare + Define + Call; body tab), events (Declare + On + Dispatch)
- **Canvas only** for codegen; panel rows are indexes with dual-write
- **COA deferred** — `COA_SHIPPED = false`; single-target portability warnings shipped; full COA requires node effectiveness UI + multi-emit first
- **Future subscribe/emit** — only if each node emits one visible line (no hidden runtime)

## Language-neutral vocabulary (July 2026 — plan before rework)

**Canonical spec:** `docs/design/language_neutral_vocabulary.md` · **implementation plan:** `docs/design/terms_refactor_plan.md` · product table in `docs/naming_and_product_direction.md`

- **Plan first** — lock glossary and internal vs user-facing boundary **before** Phase D/E system rework (catalog, diagnostics, registry sync); execute phases V0–V4 per terms_refactor_plan.md
- **No mass renames in vocabulary pass** — `kindId`s, diagnostic codes (`DEFINE_NODE_*`), and `defineNodeSync` module names stay stable until dedicated refactor phases
- **Functions (locked July 2026):** Release menu **Call** / **Declare** / **Define** — parallel to variables Get / Set / Declare. **Declare** = “there is a function” (existence / signature only). **Define** = place the body in code at this position. **Call** = invoke. **Edit function body** = tab to author the body (not a second file). Roles are **not** an automatic `.h`/`.cpp` invent — file layout is author-driven (one graph → one file; want header+source → two graphs + extensions + Import Module)
- **Other member slots** — **Declare** `{name}` for `var_define`, `event_member_define`, `class_define` (fields / event slots / class shell)
- **Handler / On …** — event handler flow entry (`event_define`)
- **Dispatch** — event invoke (`event_dispatch`); not “Call” for events in UI copy
- **Do not** use “Define” for the inside of the function tab, or collapse Declare+Define into one user-facing concept
- **Known drift** — Go `core-pack.json` / some diagnostics may lag
- **U81 done:** Function Declare ≠ Define — `function_define` (existence / abstract only) + `function_implement` on member chain (body placement); no stub invent; no legacy fold
- **C++ Declare/Define reference (skill):** **U82 shipped** — non-abstract Declare → `void Boot();` inside class; Define → out-of-line `void Machine::Boot() { … }` after `};` (or on a separate `.cpp` graph). Abstract Declare → `virtual … = 0;`. Never auto-split one graph into `.h`+`.cpp`. Spec: `vvs_cross_language_mapping/cpp.md`

## Same-file function emit (U80 done)

- Function graph tabs are **body editors only** — do **not** emit as separate per-function files
- **U80 done:** `transpileProject` no longer emits function-tab files; bodies inline via `function_define` → `FunctionDecl` / `functionBodies`
- Body **placement** remains a Define-role concern (U81 separates it from Declare)

## Syntax pack milestones (codegen platform)

| Milestone | Scope | Status |
|-----------|--------|--------|
| **M1** | Python + C++ pack-first | **Closed** July 2026 |
| **M2** | JavaScript + Verse pack-first | **Closed** July 2026 |
| **M3** | GDScript + Rust + C# (Phase 6 v2 platform) | **Closed** July 2026 |

**Next major track:** Usability & workflow standards — [design/terms_refactor_plan.md](design/terms_refactor_plan.md) (vocabulary V0–V4, spawn catalog, diagnostics copy) and [design/language_capability_catalog.md](design/language_capability_catalog.md) (per-language UI capabilities, usability example tests).

## Coverage Lab + fidelity streamline (July 2026 — locked)

**Canonical:** `docs/design/fidelity_streamline.md` · `docs/design/language_capability_catalog.md` § Coverage Lab · `docs/visual_to_text_fidelity.md` § No Hidden Magic

- **Primary golden:** Coverage Lab (Machine + Sensor on one graph) — modifiers, enum, imports, inheritance, 1:1 order
- **Verify as the user sees:** Code panel / `useProjectTranspileResult` / `extract_test_project_outputs.ts` — not only raw `transpileGraph` dumps
- **One graph → one file (locked + shipped):** A container graph is one compilation unit. All `class_define` chains on that graph emit into **one** module file in canvas order (`emitMergedHomeGraphModules`). **No** class-per-file split and **no** “split classes” profile. Want two files? Put classes on two graphs.
- **No inventing keywords:** Emit modifiers **only** from define-node `properties`
- **Imports:** Import Module once at file top (`targetLanguages`); flow Import for conditional; optional `ownerClassId` — no auto `#include`
- **Enum:** TypeRef `{ kind: 'enum' }` (+ legacy `enumType` mirror) + pack `EnumMemberAccess`; no paste of C++ `::` into all languages
- **User types:** TypeRef for builtin / enum / class / Array / Map — declare on canvas → pick → emit (`docs/design/user_types.md`); locals never get class `var_define`
- **Skills:** `vvs_usability_example_tests`, `vvs_visual_code_fidelity`, `vvs_transpiler_development`, `vvs_cross_language_mapping`

## Code panel verification (July 2026 — locked)

- Agents **must** validate Test Project codegen against what the **Code | Files** panel shows
- Canonical extract: `bun apps/web/scripts/extract_test_project_outputs.ts`
- Emit unit: one file per **container graph** (all classes on that graph), not one file per class
- Failing a unit test while the panel is wrong (or vice versa) is not done

## Product UI (July 2026 revision)

- **No in-app Roadmap or Integrations tabs** — planning lives in `docs/`; MCP via Connect AI modal only
- **Library** is community scripts only — local spawnable nodes use `nodeCatalog.ts` + canvas context menu
- **No GraphToolbar** — Generate/Play in TopNav; Save in File menu
- **Honest offline chrome** — StatusBar shows disconnected/offline; no fake CPU/sync metrics
- **Target language** on main graph only (Graph Properties); function tabs have per-graph metadata, not target language
- **V1 target languages** — Python, JavaScript/TypeScript, C++, **Verse** (Phase 1 transpiler + web UI); UE6 plugin reuses Verse profile
- **Library mode** is full-width — hide editor side panels when Library tab is active

## Development approach

- **UI-first skeleton** with mock data until contracts are stable
- **Depth-first UI backlog** — complete sections in `incomplete-ui.md` order (1→8); finish open rows in a section before skipping ahead
- **One slice per API loop iteration** — see `docs/ui_api_delivery_loop.md`
- UI components call **`VvsApi` facade** — TopNav `persistSnapshot` uses `VvsApi.saveProject` in HTTP mode
- **TopNav → canvas** uses `graphActions` custom events, not synthetic `KeyboardEvent`

## Graph editor (skeleton phase status)

Done for daily editing UX (sections 1–3 of `incomplete-ui.md`):

- Per-tab `GraphDocument` + `GraphTabMetadata`; save/load via `ProjectSnapshot`
- Undo/redo, reroute nodes, comment group/ungroup, in-app clipboard + Cut/Duplicate
- Variable object type, function/tab ID sync, variable rename propagation
- `data_array` pin geometry; simulation mock highlight
- Centralized wire validation in `graphWiring.ts` (single-wire-per-input, cycle guards)

Still open: Library as **git catalog** (not blob hosting). **Not** product work: production VPS / dedicated-server deploy — see `docs/roadmap.md` § No dedicated server.

## Public repository & product direction

- **MIT license** — repo intended for public collaboration; see root `LICENSE`, `CONTRIBUTING.md`
- **Lineage** — VVS 1 graduation project: [Sheriff99yt/Vision_Visual_Scripting](https://github.com/Sheriff99yt/Vision_Visual_Scripting); VVS Web is the active open continuation — `docs/history.md`
- **North star** — open visual scripting language portable across engines and workflows; **Verse is a v1 target language** in the web transpiler
- **Public roadmap** — `docs/roadmap.md` and `docs/vision.md` (not in-app Roadmap tab)
- **UE6 editor plugin (Phase 5)** — in-engine canvas + UE integration; **reuses Phase 1 Verse emitter**, not a separate codegen path
- **Web UI stays engine-neutral** — UE-specific affordances belong in plugin docs/surface, not generic web copy

## Node system & codegen (July 2026)

- **Canonical spec:** `docs/node_system.md` — registry, ports, pin types, `TranspileResult`, selection highlight
- **Port strategy:** Hybrid (`kindId` + `kindVersion`, registry resolve, optional snapshot on save)
- **Pin types:** Logical types at wire layer; per-language mapping in emitter only
- **Selection → code:** `sourceMap` from one generate pass — **no** re-transpile on select; **shipped** in CodePreviewPanel
- **Code panel:** Open by default; **Code | Files** tabs (`CodeOutputPanel`); **CodeMirror 6** via `GeneratedCodeView` facade; per-graph `targetLanguage` + `targetFileExtension` with project defaults for new graphs (`graphCodegen.ts`)
- **Dynamic calls:** One kind `vvs.project.call_function` + `graphBinding`

## Cross-language redesign (July 2026)

Shipped in monorepo packages + web UI:

- **`@vvs/graph-types`** — `ProjectSnapshot` v2, `FunctionSymbol`/overloads, `Diagnostic`, `analyzeProject`
- **`@vvs/syntax-registry`** — `core-pack.json`, `list`/`resolve`/`expandProjectSymbols`; spawn sets `kindId`, `kindVersion`, `resolvedPorts`
- **`@vvs/language-profiles`** — `analyzePortability` per target language; see `docs/language_profiles.md`
- **`@vvs/transpiler`** — codegen + snapshot tests; web imports via `mockCodegen.ts` facade
- **Function UI** — `FunctionPropertiesPanel`, overload tree rows, `functionHelpers` pin sync, `selection.type: 'function'`
- **Portability UX** — warnings in compiler log, code preview badge, status bar (non-blocking)
- **Extract to function** — Ctrl+Shift+E / View menu
- **Go registry** — `GET /registry/nodes`, `GET /registry/core-pack` (MCP transport TBD)

Still partial: JWKS verification (HS256 via `SUPABASE_JWT_SECRET` today). Syntax pack MCP tools (`list_syntax_packs`, `propose_syntax_delta`, `run_rosetta_suite`, `validate_generated_parse`) shipped locally.

## Node design: property schema & conversion (July 2026)

- **`propertySchema`** on registry kinds drives **`PropertySchemaPanel`** (Settings in floating inspector) — first kind: **`action_get_input`**
- **Conversion nodes** (`convert_to_string`, `convert_to_number`) — pure expression; **one node = one call** in generated code; **no transpiler folding**
- **Print String** requires **`data_string`** — numeric display uses **Get → To String → Print**
- **`pinCompatibility.ts`** in `@vvs/graph-types` — shared with editor + `analyzeProject` (`PIN_TYPE_MISMATCH`)
- **Usability example tests:** First Graph + Coverage Lab — StartScreen Test Projects; verify via Code panel extract — see `apps/web/src/lib/usabilityExampleProjects.ts` and `docs/design/language_capability_catalog.md`

## Syntax packs & codegen layers (July 2026)

**Canonical spec:** `docs/syntax_pack_architecture.md`

- **Syntax packs** (`@vvs/syntax-packs`) are the **authoritative print layer** — base JSON + capability overlays, resolved via explicit merge order
- **Structured IR** carries semantics only — no target-language strings in `lower/` after migration
- **Hybrid emit:** simple constructs in JSON templates; events, hoisting, async, multi-file, spans in TS `PrinterRegistry` printers
- **Language profiles** remain **portability policy** — native/emulated/unsupported; packs do not replace profiles
- **Tree-sitter: validator-only** — optional CI parse check on Rosetta output (Python/JS first); **not** syntax author or auto-ingestion
- **Agent scope:** may edit `packages/syntax-packs/**`; must not edit `lower/**`, IR schema, or fidelity rules without RFC
- **Verification gates:** Rosetta golden tests + span invariants + fidelity linter (+ optional parse validation)
- **Milestone 1 (shipped):** Python + C++ leaf statements, control-flow bodies, and `VarDefine` member emit are **pack-driven**
- **Milestone 2 (shipped):** JavaScript + Verse migrated to the same pack-first model; all four v1 families use `@vvs/syntax-packs` templates with hybrid TS printers for get_input/switch only

## Architecture

- Transpiler: pure TypeScript in `packages/transpiler`, three-stage pipeline, zero React deps
- Go MCP tools: thin wrappers over pure functions in `internal/core/services/`
- Cross-domain communication via typed contracts only (`graph-types`, OpenAPI, `VvsApi`)

## Client-first product default (July 2026 — locked intent)

**Canonical:** `docs/roadmap.md` § Client-first direction

- **Default experience:** no VVS accounts, **no dedicated server**, no required backend; browser edit + Generate; local/folder / `.vvs/` save; GitHub for pack/library / static Pages
- **Do not remove** Auth, cloud save, HTTP API mode, hosted MCP probe, Library backend hooks, `server/` — keep code for reference/local experiments; **disable / hide / inactive** in the product default — **not** a roadmap to re-enable on a VPS
- **AI / MCP:** desktop **local** MCP + paste config; **mobile: no AI for now**
- **Library:** separate public git repo + links; private repos denied
- **Collab (later):** session client/host (P2P / lobby), not account cloud as default

## No dedicated server hosting (July 2026 — locked)

- **Out of scope as product:** running VVS on a **dedicated VPS / self-hosted Supabase stack** as the official hosting model
- **Ship the editor** as a **client** (static web / desktop-capable browser) + **local** project folders / git — not “sign into our server”
- **`docs/deployment.md`** and `server/` Postgres/Auth paths are **legacy / optional experiment** docs and code — do **not** treat production VPS deploy, ops backups, or enterprise self-host as open product work
- **Static hosting** (e.g. GitHub Pages for the showcase build) is fine — that is not a dedicated app server
- **Local Go MCP** on the user’s machine remains allowed (desktop) — that is not “hosting VVS”

## Unsupported nodes per language (July 2026 — locked UX)

**Product rule:** When a canvas node is not effective for the current codegen target, VVS must stay honest in **both** code and canvas — never silent skip.

1. **Unsupported comment lines (codegen)** — Emit a **comment** for that node whose text starts with `(x)` (after the language comment prefix), e.g. `# (x) Import iostream` / `// (x) Import iostream`. The line still maps via `sourceMap` to the canvas node. Prefer pack `commentPrefix` + node display label.
2. **Unsupported comments toggle** — Button **to the left of the Code panel language selector**. When off, omit `(x)` comment lines from preview/Generate; when on (**default**), show them. Preference: `showUnsupportedComments` in uiPreferences.
3. **Node dimming (canvas)** — On language change, nodes unsupported for that target are **dimmed / grey**. Selecting a language where the node is supported restores normal chrome. Dimming uses `nodeEffectiveness` (Import `targetLanguages` + non-abstract Function Declare outside C++) — same resolver as emit.
4. **Node dimming toggle** — Control in the **top bar, immediately left of Autosave**. When off, canvas does not grey unsupported nodes (codegen comments still follow the Code-panel toggle independently). Preference: `dimUnsupportedNodes` (default on).

**Function Declare (U82 + U66):** Non-abstract `function_define` is effective only for **cpp** (prototype). Elsewhere emit `# (x) Declare Name` (or omit when comments off) and dim the node. **Abstract** Declare effectiveness is **derived from** `modifierEffectiveness(lang, 'isAbstract')` — do not maintain a parallel allow-list. C++ (`= 0`) / C# (real prototype) only; other langs U66 `(x)` + U67 dim (Coverage Lab **Declare Diagnose** lock test). **sourceMap lock:** Declare maps only to its own emit; Define maps to method/`def` header + body — never dual-tag.

- **All seven targets follow the same Declare/Define table** — C++ = prototypes + out-of-line Define; Python / JS / C# / Rust / GDScript / Verse = U66 `(x)` for non-abstract Declare + in-class Define; no silent skip; no expanding `FUNCTION_DECLARE_PROTOTYPE_LANGS` beyond `cpp`; no out-of-line invent for C#/Rust. Spec: `docs/visual_to_text_fidelity.md` · skill `vvs_cross_language_mapping` (one doc per language: `cpp.md`, `python.md`, …).

**Do not:** invent real emit for unsupported constructs; hide unsupported nodes from the catalog; couple the two toggles (comments ≠ dimming). **Author Comment [C] (U68/U69)** is a third channel — `showUserComments` / `emitUserComments` — never emit as `(x)` and never gate with `emitUnsupportedComments`.

**Highlight / sourceMap (U71 — locked contract):**
- Code panel highlight is **generic** — `sourceMap[nodeId]` lookup only; **never** add per-`kindId` highlight UI.
- New nodes get highlight by tagging emit (`appendTagged` / `tagRange` / `expressionSpans`), not by writing CodeMirror code.
- Nested control-flow bodies must go through `appendIrStatements` (If/For/While/Sequence/Switch). Do not string-join nested statements into a single parent-tagged leaf.
- Code panel **auto-scroll** to selection highlight must be **smooth** (`EditorView.scrollHandler` → `scrollTo({ behavior: 'smooth' })`); respect `prefers-reduced-motion`.

**Comment lock semantics (July 2026 — locked):**
- **Unlocked (default):** soft `commentMemberIds`; no RF `parentId`; members move freely; comment follows member AABB; optional `commentFollowOffset` after manual drag; **Snap** clears offset.
- **Locked:** RF parent so **moving the comment moves members**; members stay independently draggable; lock **recaptures** nodes overlapping the comment rect into membership.
- **U79 comment order:** attached comments emit before the **topmost member** (absolute canvas Y); orphan comments sort by comment box Y. Member-chain topo still owns member↔member order — comments do not invent a parallel Y-only member order.
- **U79 canvas Y → code order (locked):** **Primary** = connected execution chain (nest/emit order). **Secondary** = vertical height for **unconnected chain heads** (and Event Declare peers). Intentional that a messy layout can “look wrong” vs top-to-bottom reading — emit does not auto-fix. **Do not** emit Compiler Log warnings for chain-vs-height mismatch (`CHAIN_ORDER_Y_MISMATCH` / `EVENT_PEER_Y_ORDER` disabled — noise). Do not reorder on Y for connected non-event members.
- **Compiler Log warnings (honesty):** Prefer warnings that match real emit. Dropped obsolete main-graph On Start entry warning. `BLOCKING_WAIT_ON_TARGET` only for stub targets (js/verse/json). Cross-class import warnings only across **different module graphs**. Emulated portability stays in the log as `Emulated emit (Lang): …`. Fidelity **errors** unchanged.
- **U79 event order (locked):** Emit orders Event Declares (`event_member_define`) by canvas Y among peers. **On** handlers (`event_define`) are independent — dragging a handler must **not** teleport its Declare (or any Call). To change code order, rearrange the Declares on the member chain.
- **Auto generate / Code panel (locked):** **On** = live Code preview (and debounced Generate). **Off** = Code panel **freezes** on last live emit while `compileState === 'dirty'` until Generate (`isCodePreviewPaused`); do not keep re-emitting into the panel. Files pin uses the same held `useProjectTranspileResult` bundle.

**Implements / expands:** roadmap `node-effectiveness` · unified model Phase C · `docs/language_profiles.md`.

## Graph system isolation (July 2026)

- **`GraphWorkspaceHost` always mounted** — owns `useGraphState` + `useGraphTabSync` + workspace API; no React Flow
- **Separate `ReactFlowProvider` per view** — edit (Canvas) vs read-only (References); never one global provider
- **`GraphEditContext`** bridges host state to `GraphCanvas` when Canvas view is active
- **`CodePreviewPanel`** reads tab documents via `useGraphDocuments`, not React Flow `useStore`
- **`referenceRootGraphId`** decoupled from `activeGraphTab` — only `focusReference()` updates it
- **`ProjectTree` navigation modes** — `canvas`: single-click selects; `references`: single-click focuses reference graph; both: double-click opens in Canvas
- **Explorer palette-first density (locked):** whole-row canvas drag (Call / Declare / Get-Set); reorder grip hover-only; list **or** grid per section (toggle in header; default list); meta / CodegenSuffix / open / OK badges on hover or selection; **missing** canvas badges always visible
- **Cycle prevention** — wire cycles (`graphCycles.ts`) and cross-graph dependency cycles (`graphRelations.ts`) block connects and node label changes
- **Centralized wiring** — `graphWiring.ts` owns pin compatibility, connection validation, single-wire-per-input, reroute split, and user-facing rejection messages; `GraphCanvas` delegates `onConnect`, `isValidConnection`, spawn-wire, and edge double-click through it
- **Linear flow chains (intentional)** — unlike UE Blueprint wire splicing, rewiring exec into the middle of `A → B → C` drops `A → B`; one exec in/out per handle. Encourages functions/shared graphs over duplicated linear chains. Documented in `docs/node_system.md` §5; tested in `graphWiring.test.ts`
- **References** is a **top-level TopNav view**, not a left-panel category — do not re-add `ReferenceViewer` to `ProjectTree`

## Editor navigation history (July 2026)

- **Versioned `VvsEditorNavigationFrame`** (`types/editorNavigation.ts`) — graph tab, editor view, reference focus, selection, optional `focusedNodeId`; schema version field for future migrations
- **`EditorNavigationProvider`** is the single owner of browser `history.pushState` / `popstate` for in-editor back/forward (including mouse buttons 3 & 4)
- **Canonical API**: `useEditorNavigation().navigate(partial, { history: 'push' | 'replace' | 'none' })` or `dispatchEditorNavigate()` from non-React code
- **Sanitize on restore** — closed graph tabs fall back to `main`; legacy v0 history entries auto-upgrade
- **Do not push history manually** from feature code — use `navigate()` or let the provider's reactive sync record unmigrated `setActiveGraphTab` calls
