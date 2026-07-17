---
name: VVS Progressive Disclosure
description: >-
  Show data when needed — progressive disclosure for VVS editor UI. Use when
  designing panels, sidebars, inspectors, trees, search, modals, or any feature
  where the user should not see all data at once. Triggers on "show when needed",
  "progressive disclosure", "reduce clutter", "collapse by default", or new
  chrome in apps/web.
---

# Show Data When Needed (VVS)

**Principle:** The default view is the **task surface** (graph canvas, primary action). Secondary data appears only when the user asks, when selection demands it, or when a workflow event makes it relevant.

Pair with [`vvs_ui_development`](../vvs_ui_development/SKILL.md) for shell layout and styling.

## Canvas source of truth (locked)

**Canonical:** `docs/visual_to_text_fidelity.md` § Canvas is the source of truth · Trigger skill: `vvs_visual_code_fidelity/SKILL.md`

- Code preview stays **open by default** — fidelity is the trust contract between graph and export
- Project tree symbol rows are navigation/index — user discovers declarations on the canvas, not by inferring from sidebar alone
- Progressive disclosure does not hide the code panel to avoid showing missing define-node coverage

## Decision rule

Before adding visible UI, answer:

| Question | If **yes** | If **no** |
|----------|------------|-----------|
| Is this required to complete the primary task *right now*? | May show by default | Hide or collapse |
| Does the user explicitly open it (click, shortcut, drag)? | Show on action | — |
| Does an event make it relevant (error, compile, selection)? | Auto-reveal once | Stay hidden |
| Is it reference/metadata (exports, links, settings)? | Collapse in tree or behind a link | Inline in main view |

**Default stance:** hidden → revealed on intent → auto-reveal on event → dismissible again.

## Patterns (use these)

### 1. Collapsed chrome + status toggles

- **Compiler log** starts **collapsed**; expands on compile/error.
- **Code preview** stays **open by default** in Canvas (`docs/node_system.md`) — user may collapse via StatusBar **Code** toggle.
- Status bar provides **Log** / **Code** toggles.

**VVS:** `contexts/EditorPanelContext.tsx`, `StatusBar.tsx`, floating `FloatingPanelShell` overlays on canvas.

### 2. Compact affordance → expanded surface

- Default: small pill, icon, or single row.
- Expanded: full input, list, or form — only while focused or active.

**VVS:** `GraphNodeSearch.tsx` — icon-only circle → expands to search field + dropdown; **Ctrl+K** to open.

**VVS:** `GraphSelectionToolbar.tsx` — appears only when node(s) selected; hidden otherwise.

### 3. Tree sections collapsed by default

- Navigation section open (e.g. Graphs).
- Everything else (Functions, Variables, Generated) **collapsed** until expanded.
- Nested detail (signatures, codegen suffix, OK canvas checks) only on **hover or selection** — not inline by default.
- List **or** grid per section (header toggle; default list).
- Missing Declare/Define badges stay visible (fidelity).

**VVS:** `ProjectTree.tsx` — Symbols | Output | API; palette-first whole-row canvas drag; reorder grip on hover.

### 4. Context-aware inspector

- **No selection:** panel hidden (not an empty form).
- **Node / variable selected:** show floating inspector immediately (compact).
- **Hover (~180ms):** auto-expand; leave collapses unless **pinned**.
- **Pin:** persists via `detailsPanelPinned` in `uiPreferences` (migrates legacy `detailsPanelExpanded`).
- **Compact:** header-only strip (title + one-line subtitle); **no** body, **no** resize handle.
- **Expanded:** full inspector body; **2D resize** from bottom-left corner; top drag handle to move; size/position persist (`detailsPanelExpandedWidth/Height`, `detailsPanelOffsetRight/Top`).
- **Right-click:** Reset size & position.
- Auto-collapse paused during move/resize until pointer release.
- **Graph / project settings:** TopNav gear (**Settings**, right of Connect AI) → Settings modal **Project** tab; View → Project settings… / App settings…
- **App settings:** browser prefs (dim unsupported, panel defaults, reset floating layouts, shortcuts).
- Modifiers live on the selected-node chip strip (`NodeModifiers`); Details owns structure (TypeRef, pins, switch, overloads). Open Graph removed from symbol tree (U102).

**VVS:** `GraphFloatingDetails.tsx` — floating panel on canvas; `PropertySchemaPanel` + `NodePinsPanel`; force-expand on broken symbol ref.

### 4b. Compiler log (same compact / hover / pin pattern)

- Status bar owns open/close (`compilerLogOpen`).
- **Compact:** header + subtitle (error counts / last message / Empty).
- **Hover (~180ms):** expand; leave collapses unless **pinned** (`compilerLogPinned`).
- **Peek on error:** new errors open the panel and expand without pinning; border **flashes red**.
- Resize from top-left; move from top handle; **`** / `~` toggles pin.
- Right-click (panel or status Log icon): Reset size & position.
- Resize only when expanded (`compilerLogExpandedHeight` / width).
- Keep jump-to-node, error chip → first error, clear.

**VVS:** `GraphFloatingCompilerLog.tsx`.

### 5. Secondary indexes behind disclosure

- Show scoped data first (active graph's references in References view).
- Project-wide index behind expand / depth filters.

**VVS:** `ReferencesView` + `ReferenceGraphCanvas` — UE5 focus layout; type/depth filters. Do **not** use orphan `ReferenceViewer.tsx`.

### 6. Event-driven reveal (not always-on listeners)

- Dispatch domain events (`vvs:compile-state`, `vvs:validation-result`, `graphActions`).
- Panel provider subscribes and expands once; avoid polling or permanent split space.

### 7. StartScreen sectioning

- **Start** actions visible; **Examples** and **Explore** as separate sections — user chooses depth.
- Folder picker buttons hidden until `useFolderPickerSupported` confirms FS Access (avoids SSR/hydration flash).

## Implementation checklist

When adding or changing UI in `apps/web`:

```
- [ ] Default state is minimal — canvas / primary affordance unobstructed
- [ ] Secondary data is collapsed, icon-only, or behind explicit open action
- [ ] Selection changes what the inspector shows (no empty forms)
- [ ] Search/filter is compact until the user invokes it
- [ ] Tree lists use collapsed sections; counts OK in headers, not full lists
- [ ] Auto-reveal only on meaningful events (error, compile, validation)
- [ ] User can dismiss / collapse after auto-reveal
- [ ] Browser-only APIs gated post-mount (folder picker, localStorage lists)
- [ ] No new always-visible panel without justification in the checklist above
- [ ] Matches minimalist rules in vvs_ui_development (no heavy chrome)
```

## Anti-patterns (reject in review)

- Embedding long lists inside file-tree rows (use separate search or outliner-on-demand).
- Showing graph settings whenever nothing is selected.
- Permanent console/code split eating canvas space when idle.
- Expanding all tree sections on load.
- Empty tables, placeholder forms, or "coming soon" blocks in the main path.
- Auto-opening modals or drawers without user action or a blocking error.
- Reading `localStorage` during SSR render (use deferred `useSyncExternalStore` pattern).

## Where to wire new features

| Need | Prefer |
|------|--------|
| New floating panel | `FloatingPanelShell` + StatusBar toggle or selection gate |
| New project-tree group | `ProjectTree` section with `expanded: false` default |
| New canvas overlay | Compact trigger → overlay; dismiss on Escape / outside click |
| New inspector mode | Extend `selection` in `ProjectContext`; idle = hidden in `GraphFloatingDetails` |
| New workflow feedback | Custom event + single subscriber that expands the right panel |

## Code touchpoints (canonical)

| Area | Files |
|------|--------|
| Panel collapse/toggles | `EditorPanelContext.tsx`, `EditorLayout.tsx`, `StatusBar.tsx`, `FloatingPanelShell.tsx` |
| Node search overlay | `GraphNodeSearch.tsx`, `lib/nodeOutliner.ts` |
| Selection toolbar | `GraphSelectionToolbar.tsx`, `hooks/useGraphNodeSelection.ts` |
| Project tree | `ProjectTree.tsx`, `lib/projectTree.ts` |
| Floating inspector | `GraphFloatingDetails.tsx`, `*PropertiesPanel.tsx`, `PropertySchemaPanel.tsx` |
| References view | `ReferencesView.tsx`, `ReferenceGraphCanvas.tsx`, `lib/referenceGraphLayout.ts` |
| StartScreen / recents | `StartScreen.tsx`, `recentProjectsSubscribe.ts`, `useFolderPickerSupported.ts` |

## Review prompt (for PRs / self-check)

> "If I open a new project and do nothing, what do I see?"  
> Answer should be: canvas, collapsed chrome, collapsed tree sections, hidden inspector — **not** logs, full variable lists, selection toolbar, or settings forms.

## Related docs

- Shell matrix: [`vvs_ui_development`](../vvs_ui_development/SKILL.md)
- Implementation snapshot: [`docs/current_state.md`](../../../docs/current_state.md)
- UI backlog: [`.agents/memory/incomplete-ui.md`](../../memory/incomplete-ui.md) — **48/48 done** (July 2026)
