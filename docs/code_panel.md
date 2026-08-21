# Code panel — features & navigation

Canonical guide to the **generated code** panel in Canvas mode (`CodePreviewPanel`). The panel is part of the primary authoring loop: **graph + code together**. The compiler log stays collapsed until errors or compile events.

**Related:** [visual_to_text_fidelity.md](visual_to_text_fidelity.md) · [node_system.md](node_system.md) §6 · [current_state.md](current_state.md)

---

## Role in the product

| Principle | Behavior |
|-----------|----------|
| Canvas is source of truth | Every highlighted line maps to a graph node via `sourceMap` — no emit from symbol tables alone |
| No re-transpile on select | One Generate / live preview result; selection only looks up ranges |
| Honest stale state | When preview is paused, code dims and shows a pause indicator — it does not pretend to be live |
| Text-shaped navigation | Hover and double-click reverse-map through the same `sourceMap` used for selection highlight |

Primary implementation: `apps/web/src/components/layout/CodePreviewPanel.tsx` · editor: `CodeMirrorGeneratedCodeView` · reverse map: `apps/web/src/lib/sourceMapReverse.ts`.

---

## Layout & chrome

### Open by default

In Canvas mode the code panel opens by default (locked). Do not re-collapse it on mount.

### Top bar (primary affordances)

| Control | What it does |
|---------|----------------|
| **File path** | Shows the active generated file path (mono, truncated); full path in tooltip |
| **Copy path** | Copies the path to the clipboard |
| **Language + extension** | `LanguageExtensionMenu` — hover for extension submenu; language-only click picks the first extension for that language. Hidden on organization-only graphs |
| **Error badge** | Appears when validation has errors; toggles **error line highlights** in the editor (red). Tooltip lists messages; notes when no lines are mapped yet |
| **Warning badge** | Same pattern for warnings (amber highlights) |
| **Copy code** | Copies the full file contents |

Secondary emit options (`//` user comments, `(x)` unsupported stubs, sync status, Format JSON) live in floating **details** when selection type is `code` (`CodePreviewPropertiesPanel`), not in the top bar.

### Empty states

| Condition | Message |
|-----------|---------|
| Organization graph | No generated code — open a class graph |
| Blocking fidelity / compile errors | Fix errors (e.g. restore missing Declare nodes) |
| Otherwise empty | Wire nodes to preview code |

---

## Preview content: what you see

### Which graph feeds the preview

`resolveSymbolCodegenLink` chooses a **preview tab** from tree/canvas selection. That tab may differ from the active canvas tab (e.g. project map vs class home).

- **Class / module home graphs** (non-JSON): prefer project-wide emit files owned by that tab (`useProjectTranspileResult` + `fileOwners`).
- **Function tabs / single-graph fallback:** `transpileGraph` for that document.
- **JSON language:** always `transpileGraph` so the panel matches the language picker dump.
- **Org-only graphs:** empty preview.

### Files pin (Structure → Output)

Selecting a generated file in the project tree **pins** that path into the panel (`selectedFilePath`). While pinned, the panel shows project emit for that file (and its `sourceMap`), even if the live graph slice would otherwise differ. Pin clears when the preview tab no longer owns that file.

### Auto-generate vs paused

| Mode | Behavior |
|------|----------|
| **Auto-generate on** | Live transpile follows graph edits |
| **Auto-generate off** + dirty tabs | Preview **pauses** — last clean result held; content opacity reduced; pause icon |
| **Compiling** (manual Generate) | Holds previous clean result until success/error; thin progress line when not auto |

Commit of a frozen preview can be forced via `vvs:commit-preview`. Compile lifecycle listens to `vvs:compile-state`.

### Emit preferences (details / settings)

| Preference | Effect |
|------------|--------|
| **User comments (`//`)** | Emit graph comment nodes into source |
| **Unsupported stubs (`(x)`)** | Emit pack-prefixed stub comments for unsupported nodes |
| **Format JSON** | Pretty-prints JSON preview content to the clipboard (JSON language or `.json` path) |

---

## Graph → code (selection highlight)

Selecting canvas nodes (or tree symbols that resolve to highlight node ids) **does not re-transpile**.

1. Collect highlight node ids from selection / `symbolCodegenLink.highlightNodeIds`.
2. Look up `sourceMap[nodeId]` ranges for the **file currently shown**.
3. Apply colored CSS decorations in CodeMirror; **smooth-scroll** to the first range.
4. Multi-node selection can paint multiple ranges (per-node colors from the graph).

**Invariants**

- Highlight navigation uses the same `sourceMap` as the file list being shown (avoids path oscillation between graph-only and project-wide emit).
- Nested control-flow bodies must tag statements via `appendIrStatements` so each statement is locatable (If / For / While / Sequence / Switch).

---

## Code → graph navigation

All reverse navigation uses `findNodeIdAtSourceLocation(sourceMap, { filePath, line, col })`.

### Hover (preview only — no selection)

| If the mapped node is… | Visual feedback |
|------------------------|-----------------|
| On the **current** canvas tab | **Yellow** outline on that node (`nodeCodeHover`) **and** yellow outline on the **current** graph tab |
| On **another open** graph tab | Yellow outline on that **other** tab only (no canvas ring, no tab switch, no camera) |
| On a **closed** graph tab | No canvas ring; no tab outline (double-click still opens/selects) |
| Unmapped | Clears hover state |

Store: `apps/web/src/lib/codeHoverHighlightStore.ts` (`nodeId` + `tabId`). Tab chrome: `GraphTabBar` (including overflow list).

Yellow is intentional so hover does **not** collide with **blue** selection (`--vvs-node-border-selected`). Hover uses a CSS `outline` so it can stack with a selected node’s blue border.

Leave the editor (or hover unmapped text) → clear both highlights. Switching graph tab or the displayed file also clears stale hover until the next mousemove.

Owning-tab resolution prefers the **active** tab when it contains the node (`findGraphTabContainingNodeId(..., preferredTabId)`), then other documents, then file-owner / preview tab fallbacks (same order as double-click).

### Double-click (select + navigate)

Double-click a mapped line:

1. Resolve `nodeId` from `sourceMap`.
2. Prefer the document that **contains** the node (`findGraphTabContainingNodeId`) over the file-owner tab.
3. `dispatchNavigateToNode(ownerTab, nodeId)` — switches tab if needed, selects the node, focuses the canvas.

JSON dump preview disables hover and double-click reverse map.

Tooltip on the editor: *Hover to highlight the node · Double-click to select it*.

---

## Diagnostics in the editor

| Toggle | Color | Source |
|--------|-------|--------|
| Error badge (pressed) | Error decoration | `validationErrors` → node ids with mapped ranges |
| Warning badge (pressed) | Warning decoration | `validationWarnings` → mapped ranges |

Turning a toggle on also navigates the Files pin / active file toward the first mapped diagnostic file when needed. Counts in the badge are total validation items; tooltips note when zero lines are mapped yet.

Live analysis feeds StatusBar and these badges even when the compiler log is collapsed (`useLiveProjectValidation`).

---

## Language & multi-file

- Target language and file extension are per graph / project settings (`useActiveGraphCodegenSettings`); changing them resets the active file index.
- Module graphs may emit multiple files; the panel shows one file at a time (index driven by pin or first owned file).
- Copy always copies the **visible** file.

---

## Keyboard & menu integration

| Action | Where |
|--------|--------|
| Sync / refresh code preview | Edit menu — Ctrl+Shift+S (`Sync code preview`) |
| Auto-generate toggle | TopNav Generate control |
| Blocking Generate | TopNav — `analyzeProject` errors block Generate when analysis is not ok |

---

## Testing what users see

Do **not** prove multi-class or emit fixes with raw `transpileGraph` dumps alone. Prefer the Code | Files path:

| Tool | Path |
|------|------|
| Project transpile hook | `apps/web/src/hooks/useProjectTranspileResult.ts` |
| Test Project extract | `apps/web/scripts/extract_test_project_outputs.ts` → `apps/web/test_project_outputs/` |
| Simple / Complex / Advanced usability goldens | `vvs_usability_example_tests` skill |

---

## Architecture notes (for contributors)

```text
Generate / live preview
  → TranspileResult { files, sourceMap, … }
  → CodePreviewPanel picks display file + map
       ├─ selection → highlightRanges + scroll
       ├─ hover → codeHoverHighlightStore → VVSNode + GraphTabBar
       └─ double-click → sourceMapReverse → dispatchNavigateToNode
```

- Transpiler stays in `packages/transpiler` (no React).
- UI never passes `selectedNodeId` into codegen.
- Fidelity errors (`DEFINE_NODE_MISSING`, `DECLARATION_NOT_ON_CANVAS`, `ORPHAN_DEFINE_NODE`) remain **errors** that block Generate — empty/blocked preview messages should stay honest.
