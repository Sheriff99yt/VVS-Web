# Incomplete UI Backlog

Tracked gaps between **what the shell shows** and **what the UI skill / product matrix requires**.  
Canonical implementation snapshot: [`docs/current_state.md`](../../docs/current_state.md) — this file is the **agent work queue** for UI-only slices.

**Last updated:** 2026-07-05  
**Depth-first:** Section **7 done**; Section **3 polish done**. **Frontend UI backlog complete.**  
**Score:** 48 / 48 done · 0 open

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
| U37 | Generated export folder in tree | **Done** | `listGeneratedExports()`, `ProjectTree.tsx` — Generated section |
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

_All UI backlog rows complete (2026-07-05). **Mock codegen depth (M1):** Call Function, Branch, per-function bodies — done. Next: `packages/transpiler` scaffold or more node types._

---

## Completed baseline (do not re-implement)

- React Flow canvas, custom nodes/edges, pin validation, reroute nodes
- Per-tab `GraphDocument` + `ProjectSnapshot` save/load/export
- Undo/redo, comment group/ungroup, in-app clipboard + Cut/Duplicate
- Variable drag → Get/Set; simulation mock highlight + console logs
- Pin geometry: execution, boolean, number, object, **array**
- Graph isolation: `GraphWorkspaceHost`, split React Flow providers, document bridge
- References view: UE5 focus graph, referencers/dependencies layout, tree panel
- Cycle prevention: wires + cross-graph function/macro calls
- Call Function nodes: explicit `linkedGraphId`, Project palette, complex example multifile demo
- Project tree dual mode: canvas selection vs reference focus (no view hijacking)

---

## Loop prompt

```text
Read .agents/memory/incomplete-ui.md. Depth-first: complete open rows in the current section before advancing. One row per iteration (UI only unless row says API). Follow vvs_ui_development skill. bun run build. Update this file. Sync docs/current_state.md if user-visible behavior changed.
```
