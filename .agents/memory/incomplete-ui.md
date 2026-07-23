# Incomplete UI Backlog

Tracked gaps between **what the shell shows** and **what the UI skill / product matrix requires**.  
Canonical implementation snapshot: [`docs/current_state.md`](../../docs/current_state.md) — this file is the **agent work queue** for UI-only slices.

**Last updated:** 2026-07-23  
**Depth-first:** Sections **1–14** complete. **§13–§14** — U68–U83 done. **§16** — U84–U90 / U96 done. **§17** — U91 / U92 / U94 / U95 done; U93 long-term. **§18** — U97 · U102 · U107 · U108–U119 done; U98–U101 / U103–U106 open. Code-panel hover nav + [code_panel.md](../../docs/code_panel.md) shipped (U71 follow-on).  
**Public roadmap:** [`docs/roadmap.md`](../../docs/roadmap.md) · in-app Open/Done: `developmentRoadmap.ts`  
**Score:** 58 / 58 UI (§10–11) · §12 **2 / 2** · §13 **10 / 10** · §14 **U77 / U78 / U83 done** · U64–U82 shipped · **U84–U92 / U94–U97 / U102 / U107 / U108–U119 done** · U93 / U98–U101 / U103–U106 open

## Status legend

| Status | Meaning |
|--------|---------|
| **Done** | Shipped in `apps/web`; build passes |
| **Open** | Not finished — see gap column in sections 4–8 |
| **Skeleton** | Layout only; primary action missing |
| **Partial** | Started; missing wiring or edge cases |
| **Polish** | Works but below skill bar |

## Priority

| Priority | When to pick |
|----------|----------------|
| **P0** | Skill matrix requirement or broken primary affordance |
| **P1** | Skeleton completeness before API wiring |
| **P2** | Polish after A1–B6 API loop |

---

## 1. Project panel (`GraphExplorer`) — **Done**

| # | Item | Status | Key files |
|---|------|--------|-----------|
| U1 | Variable `object` type | **Done** | `ProjectTree.tsx`, `VariablePropertiesPanel.tsx` |
| U2 | Function ↔ tab ID sync | **Done** | `functionTabs.ts`, `GraphTabBar.tsx`, `ProjectTree.tsx` |
| U3 | Outliner selection sync | **Done** | `ProjectTree.tsx` — nested under active graph |
| U4 | Event hooks in catalog | **Done** | `nodeCatalog.ts` — On Start, On Update, Custom event |
| U38 | Explorer tabs & scope UX | **Done** | `project-tree/*`, `ProjectTree.tsx` — Structure \| Symbols \| API, scope header, popover creates |

---

## 2. Properties inspector (`RightSidebar`) — **Done**

| # | Item | Status | Key files |
|---|------|--------|-----------|
| U5 | Node properties depth | **Done** | `NodePropertiesPanel.tsx` — label, description, category |
| U6 | Graph properties per tab | **Done** | `GraphTabMetadata` on `GraphDocument`; `GraphPropertiesPanel.tsx` |
| U7 | Variable rename propagation | **Done** | `vvs:variable-renamed` → `GraphCanvas.tsx` |

---

## 3. Graph canvas & interaction — **Mostly done**

| # | Item | Status | Key files |
|---|------|--------|-----------|
| U8 | Node toolbar undo | **Done** | `vvs:node-action`, `graphActions.ts` |
| U9 | Comment box editing | **Done** | `VVSCommentNode.tsx`, color + label in inspector |
| U10 | Comment ungroup | **Done** | Ctrl+Shift+U, View menu, `ungroupSelectionInComment` |
| U11 | Pin geometry — array type | **Done** | `data_array` in `types/graph.ts`, `VVSNode.module.css` |
| U12 | System clipboard paste | **Done** | `graphClipboard.ts`, `GraphCanvas.tsx` — OS clipboard + in-app fallback |
| U13 | Cut / Duplicate in Edit menu | **Done** | `TopNav.tsx`, `graphActions.ts`, Ctrl+X / Ctrl+D |
| U14 | Wire deletion affordance | **Done** | Alt+click, right-click menu, Delete key, canvas hint |
| U15 | Multi-graph dirty indicator | **Done** | `dirtyTabIds` in `ProjectContext`; tab bar + tree dots |

---

## 4. Top navigation & file menu — **Done**

| # | Item | Status | Key files |
|---|------|--------|-----------|
| U16 | File → New graph | **Done** | `emptyProject.ts`, `applyProjectSnapshot.ts`, `TopNav.tsx` |
| U17 | File → Import JSON | **Done** | `TopNav.tsx` — file picker + `isProjectSnapshot` |
| U18 | Generate validation errors | **Done** | `graphValidator.ts`, `TopNav.tsx`, `OutputConsolePanel.tsx` |
| U19 | Simulation pause semantics | **Done** | `GraphCanvas.tsx` — pause clears highlight; `SkipForward` single-step |
| U20 | `VvsApi` facade | **Done** | `lib/api/` — mock + HTTP client; `TopNav.tsx` (= API **A1**) |

---

## 5. Code preview & console — **Done**

| # | Item | Status | Key files |
|---|------|--------|-----------|
| U21 | Code generation fidelity | **Done** | `mockCodegen.ts` — execution order + data wire resolution |
| U22 | Auto-generate on tab switch | **Done** | `CodePreviewPanel.tsx` — regen on `activeGraphTab` |
| U23 | Compiler log channels | **Done** | Validator logs with `tabId`/`nodeId` metadata |
| U24 | Error navigation | **Done** | `graphNavigation.ts`, `OutputConsolePanel.tsx`, `StatusBar.tsx`, `GraphCanvas.tsx` |

---

## 6. Library view — **Done**

| # | Item | Status | Key files |
|---|------|--------|-----------|
| U25 | Install button | **Done** | `LibraryView.tsx`, `ProjectContext` `installedLibrary` |
| U26 | Installed tab data | **Done** | persisted in `ProjectSnapshot` |
| U27 | Open installed script | **Done** | `libraryImport.ts`, `vvs:import-library-graph` |
| U28 | Asset detail / preview | **Done** | `LibraryAssetDetail.tsx` |

---

## 7. Status chrome & Connect AI — **Done**

| # | Item | Status | Key files |
|---|------|--------|-----------|
| U29 | MCP connection test | **Done** | `TopNav.tsx`, `VvsApi.probeMcp()` — mock honest fail + http probe |
| U30 | Health-aware status bar | **Done** | `StatusBar.tsx`, `useApiHealth.ts` — mock offline / http poll |
| U31 | Sync / autosave indicator | **Done** | `lastSavedAt` in `ProjectContext`; `formatSavedAt.ts` |

---

## 8. Cross-cutting / docs drift

| # | Item | Status | Gap | Files |
|---|------|--------|-----|-------|
| U32 | `current_state.md` sync | **Done** | Graph architecture + References view documented (July 2026 pass) |
| U33 | Naming in docs vs UI | **Done** | Uses moduleName / extends in UI + docs | — |
| U34 | Project name in TopNav | **Done** | `projectDetails.moduleName` in `TopNav.tsx` | — |

---

## 9. Project navigation (tree) — **Done**

| # | Item | Status | Key files |
|---|------|--------|-----------|
| U35 | Project tree (root → graphs → variables) | **Done** | `ProjectTree.tsx`, `projectTree.ts`, `graphTabs.ts` |
| U36 | Breadcrumb (`Module › Functions › Name`) | **Done** | `GraphBreadcrumb.tsx` |
| U37 | Generated files browser (output **Files** tab) | **Done** | `GeneratedFilesPanel`, `buildGeneratedFileTree`, `useProjectTranspileResult` — removed flat Generated section from project tree |
| U38 | Reference viewer (UE5 top-level view) | **Done** | `ReferencesView.tsx`, `ReferenceGraphCanvas.tsx`, `referenceGraphLayout.ts` |
| U46 | Graph domain isolation | **Done** | `GraphWorkspaceHost.tsx`, split `ReactFlowProvider`, `GraphEditContext` |
| U47 | Left-panel navigation modes | **Done** | `ProjectTree` `mode: 'canvas' \| 'references'` — no view-switch collision |
| U48 | Call Function nodes + complex example wiring | **Done** | `projectNodeCatalog.ts`, `linkedGraphId`/`linkKind`, `complexExample.ts` |

---

## 10. Start screen & project hub — **Done**

| # | Item | Status | Key files |
|---|------|--------|-----------|
| U39 | Start screen (`/`) | **Done** | `StartScreen.tsx`, `app/page.tsx` |
| U40 | Multi-project localStorage | **Done** | `projectStore.ts`, `projectRegistry.ts` |
| U41 | Editor bootstrap route (`/editor`) | **Done** | `projectBootstrap.ts`, `app/editor/page.tsx` |
| U42 | Recent projects list | **Done** | `StartScreen.tsx` — open + remove from recent |
| U43 | Community templates on start | **Done** | `createProjectFromTemplate.ts`, `LIBRARY_CATALOG` |
| U44 | Save on close + register on open | **Done** | `TopNav.tsx`, `registerProjectIfNew` |
| U45 | Browse full library from start | **Done** | `initialView: 'library'` bootstrap |

---

## Suggested depth-first order (remaining)

**§15–§18 priority:** **U89–U92** chrome · AI/examples → **U97–U106** graph/menu/OOP fidelity → **U93** long-term code→visual. **U77 Go**, **U78 Pack Manager**, **U83**, and **U84–U88 / U94–U96** done. Client-first: **no dedicated server**, **no live code execution**. Emit fidelity plans (CL backlog): [cross_language_mapping/SKILL.md](../skills/vvs_cross_language_mapping/SKILL.md) · [roadmap.md](../../docs/roadmap.md).

---

## Completed baseline (do not re-implement)

- React Flow canvas, custom nodes/edges, pin validation, reroute nodes
- Per-tab `GraphDocument` + `ProjectSnapshot` save/load/export
- Undo/redo, comment group/ungroup, in-app clipboard + Cut/Duplicate
- Variable drag → Get/Set; mock Play **removed** — **no live execution** in VVS (checks/warnings only; third parties run code)
- Pin geometry: execution, boolean, number, object, **array**
- Graph isolation: `GraphWorkspaceHost`, split React Flow providers, document bridge
- References view: UE5 focus graph, referencers/dependencies layout, tree panel
- Cycle prevention: wires + cross-graph function/macro calls
- Call Function nodes: explicit `linkedGraphId`, Project palette, complex example multifile demo
- Project tree dual mode: canvas selection vs reference focus (no view hijacking)

---

## 9. Modifier effectiveness & Dual Class Lab pilot — **Done** (July 2026)

Canonical plan: [`docs/design/language_capability_catalog.md`](../../docs/design/language_capability_catalog.md) § Dual Class Lab · § Modifier effectiveness.

| # | Item | Status | Key files |
|---|------|--------|-----------|
| U49 | C++ Dual Class Lab golden (1:1 modifiers + access sections) | **Done** | Dual Class Lab Machine C++ (Calculator retired) |
| U50 | Strip emit magic (inferred abstract, unconditional `public:`, invented Default/override) | **Done** | `emit/classModule.ts`, `emit/shell.ts`, `emit/members.ts` |
| U51 | `modifierEffectiveness` table + disable ineffective `NodeModifiers` chips | **Done** | `packages/language-profiles/src/modifierEffectiveness.ts`; `NodeModifiers.tsx` |
| U52 | Roll same property→pack flow to other languages after C++ green | **Done** | packs + `calculatorModifierRollout.test.ts` (Dual Class Lab) |
| U53 | Enum/array/switch/for coverage | **Done** → Coverage Lab Sensor | `coverageLabUsabilityTest.ts` |

---

## 10. Many classes per graph (**Done** — July 2026)

**Product rule:** Any graph may host **N** `class_define` chains. Generated output must include **every** class on that canvas — not only `activeClassId`.

**Root cause (investigated):** `packages/transpiler` `transpileProject` already keys emits as `` `${tabId}:${classId}` ``. The web hook `useProjectTranspileResult` keyed only by `tabId`, so the second class on a shared home graph was skipped. Code preview `liveResult` called `transpileGraph` once with `classForHomeGraphId` (first class only).

Canonical: [`docs/design/multi_class_symbols.md`](../../docs/design/multi_class_symbols.md) · Dual Class Lab fixture.

| # | Item | Status | Key files |
|---|------|--------|-----------|
| U54 | Project Files emit includes every class on a shared home | **Done** | Superseded by U58 graph=file; `emitProjectLikeCodePanel` |
| U55 | Code preview shows owned module(s) for the open graph | **Done** | `CodePreviewPanel` uses project emit for class-home tabs |
| U56 | Generate / export same emit as Code panel | **Done** | `emitProjectLikeCodePanel` + folder `writeGeneratedFilesToFolder` on Generate; CLI `transpileProject` |
| U57 | Code panel graph-file UX (one module per open graph) | **Done** | Class-home tabs always show project-owned file(s); no per-class file picker (graph=file lock) |
| U58 | **One graph → one file** | **Done** | `emitMergedHomeGraphModules`; Coverage Lab → `src/CoverageLab.*` |

---

## 11. Fidelity streamline (July 2026)

**Goal:** Keep analyze → IR → pack/emit; remove wrongful emit magic. Canonical: [`docs/design/fidelity_streamline.md`](../../docs/design/fidelity_streamline.md) · Dual Class Lab.

| # | Item | Status | Key files |
|---|------|--------|-----------|
| U59 | Design lock — hub doc + backlog §11 + roadmap Phase 6 track | **Done** | `docs/design/fidelity_streamline.md`, this §11, `docs/roadmap.md` |
| U60 | Delete dead dual paths (`appendMemberImplementations`, unused declare helpers) | **Done** | `packages/transpiler/src/emit/members.ts` (removed); `memberDeclare.ts` deleted; `validate_matrix.ts` uses `appendIrMembersInOrder` only |
| U61 | Property → slot → pack only (types, async, visibility; no invent) | **Done** | `emit/emitTypes.ts`, `shell.ts`, `helpers.ts`, `members.ts`, `sinkStatements.ts`; Dual Class goldens |
| U62 | Strict class shell — open only on `ClassDecl` | **Done** | `emit/classModule.ts` — removed `onBeforeField`/`onBeforeMethod` auto-`openClassShell`; Rust `ensureRustImpl` remains layout-only |
| U63 | Doc/skill realignment — Dual Class Lab + streamline hub | **Done** | catalog, decisions, fidelity/transpiler/cross-lang/usability skills, `current_state.md`, `multi_class_symbols.md` |
| U64 | Phase 5 deeper fidelity — temps pack+sourceMap; Import-only stdlib | **Done** | **U64a:** `SwitchSelectBind` + selector spans. **U64b:** `GetInputLineNew` / `GetInputLineRead` / `GetInputParseLineF32` (rust/csharp number paths); string literal spans; C++ GetInput prompt spans. Temp **names** still TS constants. |
| U65 | Rethink Test Projects → localStorage → expected codegen compare | **Done** | Stable `vvs-test-*` ids; seed/open refreshes fixtures (`source: test`). First Graph + GetInput; Coverage Lab + TypeRef map `Tags`. `test_project_goldens/` + `usabilityExampleGoldens.test.ts`; extract `--update-goldens`. |

---

## 12. Per-language unsupported nodes (**Done** — July 2026)

**Canonical:** `.agents/memory/decisions.md` § Unsupported nodes per language · expands roadmap `node-effectiveness`.

| # | Item | Status | Spec |
|---|------|--------|------|
| U66 | `(x)` unsupported comment lines in codegen | **Done** | Import Module gates + non-abstract Function Declare (non-C++); pack `commentPrefix` + `(x)` + label; `sourceMap` tagged; toggle **left of Code panel language selector** (`showUnsupportedComments`, default on) |
| U67 | Canvas dim unsupported nodes for current language | **Done** | Same `nodeEffectiveness` resolver (imports + Function Declare); `VVSNode` `.nodeUnsupported`; toggle **top bar left of Autosave** (`dimUnsupportedNodes`, default on) |

---

## 13. Editor UX, comments, highlight, Go (July 2026) — **Open**

Public: [`docs/roadmap.md`](../../docs/roadmap.md) § Next · in-app `developmentRoadmap.ts` `editor-ux-next`.

| # | Item | Status | Spec |
|---|------|--------|------|
| U68 | Comment **[C]** on selection; soft `memberIds`; **create locks by default**; **lock** = move-comment-moves-members (+ overlap recapture); **unlock** = free peers + AABB follow + snap; dashed vs solid | **Done** | `graphCommentMembership.ts`, `VVSCommentNode`; pack prefix; never `(x)` |
| U69 | Code panel toggle for **user-added comments** (separate from `(x)` unsupported) | **Done** | `showUserComments` / `emitUserComments` next to `(x)` |
| U70 | AI / MCP panel — paste IDE/CLI config; **local MCP** on device; dangerous-tools consent | **Done** (stub) | Paste Cursor/Claude + CLI hint; `mcpAllowDangerousTools` pref; hosted probe gated |
| U71 | Highlight system rethink + **reverse select** (double-click Code panel text → canvas node) | **Done** | Reverse select; generic `sourceMap` UI (no per-kindId highlight); Switch structured sink (U71a); smooth auto-scroll; CI gate + Coverage Lab completeness test. Print-path switch printers remain string-join (not live emit) |
| U72 | Unify **TopNav right** button cluster styles | **Done** | Shared zinc border icon buttons (Bot / Settings) |
| U73 | Revise **Code panel top bar** usage / UI / UX | **Done** (light) | Action cluster + Format JSON affordance |
| U74 | Rethink left panel **Output** view usefulness | **Done** (light) | Empty state + Generated files label; log empty hint |
| U75 | Node chain **auto-layout** (S / A / S S) | **Done** | Forward+attrs / full chain; `lane-topo-v1` with above·below·below-extended (stair + spine buffer); head-anchored; multi-chain Y-separate; absolute layout through locked comments; Settings `chainAttributeDirection` |
| U76 | **Format JSON** when selected in Code panel | **Done** | Pretty-print on demand in Code panel |
| U77 | Add **Go** as target language | **Done** | `go.base.json` syntax pack; `goProfile`; Go custom statement printers (`getInput`, `switch`); 14 Rosetta goldens; UI target language selectors |

---

## 14. New app views & client-first updates (July 2026) — **Open**

Public: [`docs/roadmap.md`](../../docs/roadmap.md) § Next · in-app `developmentRoadmap.ts` `new-views-client`.

Top-level **views** beyond canvas (Pack versions is the first named; more TBD).

| # | Item | Status | Spec |
|---|------|--------|------|
| U78 | **Pack versions** manager view | **Done** | Pack releases **accumulate** (never overwrite). List installed versions; user sets **active**. GitHub check prompts to **add** a version. First of multiple new views (Library git catalog, etc.) |
| U79 | **Investigate / rethink canvas Y → code order** | **Done** | **Locked:** chain = primary emit/nest order; Y = secondary for unconnected heads (+ event peers). Teaching warnings `CHAIN_ORDER_Y_MISMATCH` / `EVENT_PEER_Y_ORDER` — no auto-reorder. Comment attach topmost Y remains. |
| U80 | **Same-file function emit** — stop per-function output files; function tabs = **Edit function body** only | **Done** | `transpileProject` no longer emits function-tab files; fixtures rev 2; goldens refreshed |
| U81 | **Function Declare ≠ Define** — `function_define` (Declare, chain) + `function_implement` (Define, chain placement); no stub without Define; no legacy fold | **Done** | Emit/order/sourceMap; tree badges; release menu; Test Project fixtures on chain |
| U82 | **C++ honest Declare/Define emit** — non-abstract Declare → prototype; Define out-of-line / dual-graph `.h`+`.cpp` (no auto-split) | **Done** | Lowering + `FunctionDefOutOfLineOpen`; two-phase C++ emit; impl-only graphs; Coverage Lab / First Graph C++ goldens; two-graph test |

---

## 15. Canvas scale (July 2026) — **Priority / Open**

Public: [`docs/roadmap.md`](../../docs/roadmap.md) § Next · in-app `developmentRoadmap.ts` `canvas-virtualization-u83`.

| # | Item | Status | Spec |
|---|------|--------|------|
| U83 | **Canvas virtualization** — viewport culling / virtualized rendering for 500+ nodes at 60fps | **Done** | `onlyRenderVisibleElements`; `isPinWired` / `nodesForSearchSubscription`; canvas source guard + unit tests in `lib/graphVirtualization.test.ts` |

**Out of scope (do not backlog as product):** live code execution of any kind (Play, interpreter, runner, “run from VVS”). Leave execution to third parties. In scope: logical checks and user warnings ([decisions.md](decisions.md) § No live code execution).

---

## 16. Editor chrome & scale UX (July 2026) — **Partial** (U84–U88 / U96 done; U89 partial · U90 open)

Public: [`docs/roadmap.md`](../../docs/roadmap.md) § Next · in-app `developmentRoadmap.ts` `editor-chrome-u84`.

Details, Compiler Log, tabs, References, Library, and **wire / connection** polish for large projects and client-first Library direction.

| # | Item | Status | Spec |
|---|------|--------|------|
| U84 | Node search — **all graphs** toggle + single clear | **Done** | Layers toggle (default on); `type="text"` removes native clear X; one custom clear |
| U85 | **F** / **Ctrl+F** find + menu | **Done** | F = find symbol in this graph (else frame); Ctrl+F = all graphs; symbol menu both; pane click + drag clear tree focus |
| U86 | Details panel **compact** rethink | **Done** | Compact subtitle: kind/category · pins · bound symbol (no “hover for details”) |
| U87 | Compiler Log **language-scoped** mode | **Done** | Languages toggle + `compilerLogLanguageScoped` pref; Validator lines tagged by target language |
| U88 | Graph **tabs** UI/UX rethink | **Done** | Scroll active into view; overflow list; dirty/active affordances; middle-click / Ctrl+W close |
| U89 | **References** viewer redesign (huge projects) | **Done** | Huge-project redesign shipped: Graph vs Tree List view toggle, Referencers/Dependencies metrics bar, type filter badges, and breadcrumb path toolbar |
| U90 | **Library** page redesign (post direction change) | **Done** | Client-first Library redesign: Templates tab (environments & OpenAPI/AsyncAPI spec imports), Git Imports tab (useGitCatalog hook, GitPackImportModal, GitHub repo import), and Installed Extensions tab |
| U96 | **Wire / connection UX** | **Done** | Larger pins; edge Insert reroute + Disconnect; selection toolbar **Auto-connect** (2 compatible nodes) + **Disconnect** |

---

## 17. AI, examples, help & reverse import (July 2026) — **Partial** (U91/U94/U95 done)

Public: [`docs/roadmap.md`](../../docs/roadmap.md) § Next · in-app `developmentRoadmap.ts` `ai-examples-help-u91`.

| # | Item | Status | Spec |
|---|------|--------|------|
| U91 | **AI / MCP audit & agent autonomy** | **Done** | Go MCP write consent guard (EnsureWritePermission, VVS_MCP_ALLOW_WRITE=1), unit tests (consent_test.go), mcpActivityStore, and live MCP Ready activity status indicator in StatusBar |
| U92 | **New examples** (cross-lang + lang-specific) | **Done** | Three full test projects (First Graph, Branch Lab, Coverage Lab) across 8 target languages (24 goldens total) + StartScreen starters for all 8 languages + validate_test_projects_folder.ts |
| U94 | **Custom tooltip** widget | **Done** | App-default `Tooltip.tsx` — Esc + clamp; left panel + chrome migrated off native `title=` (section/popover `title` props remain) |
| U95 | First graph open → **help** | **Done** | Already shipped: `canvasWelcomeDismissed` auto-opens shortcuts help on first canvas visit |
| U93 | **Long-term: code → visual** | **Open** (long-term) | System that reads raw source and builds text-shaped graphs (reverse of Generate). Must preserve canvas source of truth / fidelity — research track, not near-term polish. |

---

## 18. Graph catalog, functions, async & OOP (July 2026) — **Partial** (U97 · U102 · U107 · U108–U117 done)

Public: [`docs/roadmap.md`](../../docs/roadmap.md) § Next · in-app `developmentRoadmap.ts` `graph-model-u97`.

Add-menu honesty, function/event pin fidelity, language-neutral async, symbols chrome cleanup, components visual concept, and overload / override / inheritance design.

| # | Item | Status | Spec |
|---|------|--------|------|
| U97 | **Add-node menu audit** (imports + all catalog nodes) | **Done** | Full catalog audit completed; naming convention prefixes integrated into spawn menu labels. All 38 nodes verified for correct spawnability, categorization, and dynamic handling. |
| U98 | **Function argument pins** | **Open** | Parameters as pins end-to-end (define · call · emit). |
| U99 | **Function return with arguments** | **Open** | Return / multi-return as pins where targets support it — visual + emit. |
| U100 | **Event listeners** | **Open** | Listen / subscribe visuals that map to text across languages (beyond entry/dispatch). |
| U101 | **Cross-language async concept** | **Open** | Language-neutral async model (nodes, options, or hybrid) that packs can map — not one-off per language. |
| U102 | **Symbols overlay rethink** | **Done** | Open Graph removed from symbol tree + Details; modifier chips on **hover** (pinned while menus open). Selection toolbar + right-click menus with shortcuts remain. |
| U103 | **Components** (visual + examples) | **Open** | Design a component visual that works for **all** languages; add to multi-lang Test Project examples. |
| U104 | **Overloading** revise & stress-test | **Done** | Audit current overload UX/emit; fix or document gaps under real fixtures. |
| U105 | **Overwriting (override)** study | **Open** | Decide if override needs custom visuals or is fully covered by current modifiers / defines. |
| U106 | **Inheritance** design | **Open** | How inheritance is authored on canvas and lowered per language (pairs with CL-010). |
| U107 | **Canvas pan / select gestures** | **Done** | Right-drag pans; left-click selects one; Ctrl/⌘+click multi-selects; left-drag box-select; middle-drag pans; right-click (no drag) spawn menu |
| U108 | **Action history window** | **Done** | Floating panel — graph undo restore + activity log (save/generate/import/export/delete/wire/copy/cut/paste/duplicate) |
| U109 | **Top bar menus** | **Done** | File · Edit · View · Help — shortcuts, history, settings |
| U110 | **Settings redesign** | **Done** | Sidebar: Project · Editor · Shortcuts · Audio · About |
| U111 | **Shortcut reassignment** | **Done** | Settings → Shortcuts — record chords; conflict block; browser prefs |
| U112 | **Audio feedback** | **Done** | Web Audio cues for save / generate / undo / delete / wire / errors (off by default) |
| U113 | **VVS Web naming** | **Done** | User-facing rename from VVS 2.0 (UI + primary docs) |
| U114 | **Symbol undo/redo** | **Done** | Create / delete / duplicate (var · fn · event) on shared Ctrl+Z stack — project slice restores symbols + all documents + tabs |
| U115 | **Undo: rename + class CRUD** | **Done** | Rename + class create/rename/delete/move; slice includes classes / activeClassId / projectDetails |
| U116 | **Undo: preserve across tab switch** | **Done** | Tab switch no longer clears history; snapshots carry activeGraphTab |
| U117 | **Undo: lean canvas snapshots** | **Done** | Canvas edits = nodes+edges+tab; pushHistory = full project slice (true op-deltas deferred) |
| U118 | **Dynamic naming conventions** | **Done** | Settings options to follow default VVS global naming or specific language. |
| U119 | **Bad practices / Not recommended settings** | **Done** | Settings to toggle: (1) allow multiple exec outputs to one input (warns/prevents code redundancy), and (2) Dynamic/Weak typing warnings. |

---

## Loop prompt

```text
Read .agents/memory/incomplete-ui.md. Depth-first: complete open rows in the current section before advancing. One row per iteration (UI only unless row says API). Follow vvs_ui_development skill. bun run build. Update this file. Sync docs/current_state.md if user-visible behavior changed.
```
