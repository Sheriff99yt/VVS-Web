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

**VVS:** `contexts/EditorPanelContext.tsx`, `StatusBar.tsx`, collapsible `Panel`s in `EditorLayout.tsx`.

### 2. Compact affordance → expanded surface

- Default: small pill, icon, or single row.
- Expanded: full input, list, or form — only while focused or active.

**VVS:** `GraphNodeSearch.tsx` — icon-only circle → expands to search field + dropdown; **Ctrl+K** to open.

### 3. Tree sections collapsed by default

- Navigation section open (e.g. Graphs).
- Everything else (Functions, Variables, Generated, References) **collapsed** until expanded.
- Nested detail (export filename, cross-refs) only under an **expanded graph row**.

**VVS:** `ProjectTree.tsx` — tabbed panel (Graphs / Variables / Browse); flat graph list; icon filter expands on demand.

### 4. Context-aware inspector

- **No selection:** idle hint, not a full settings form.
- **Node / variable selected:** show inspector immediately.
- **Graph settings:** behind explicit action ("Graph settings…").

**VVS:** `RightSidebar.tsx`, `GraphPropertiesPanel.tsx` (`onClose` back to idle).

### 5. Secondary indexes behind disclosure

- Show scoped data first (active graph's references).
- Project-wide index behind "Show all…" / chevron expand.

**VVS:** `ReferenceViewer.tsx` — `showAllLinks` toggle.

### 6. Event-driven reveal (not always-on listeners)

- Dispatch domain events (`vvs:compile-state`, `vvs:validation-result`).
- Panel provider subscribes and expands once; avoid polling or permanent split space.

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

## Where to wire new features

| Need | Prefer |
|------|--------|
| New bottom/right panel | `EditorPanelContext` + collapsible `Panel` + StatusBar toggle |
| New project-tree group | `ProjectTree` section with `expanded: false` default |
| New canvas overlay | Compact trigger → overlay; dismiss on Escape / outside click |
| New inspector mode | Extend `selection` in `ProjectContext`; idle state in `RightSidebar` |
| New workflow feedback | Custom event + single subscriber that expands the right panel |

## Code touchpoints (canonical)

| Area | Files |
|------|--------|
| Panel collapse/toggles | `EditorPanelContext.tsx`, `EditorLayout.tsx`, `StatusBar.tsx` |
| Node search overlay | `GraphNodeSearch.tsx`, `lib/nodeOutliner.ts` |
| Project tree | `ProjectTree.tsx`, `lib/projectTree.ts` |
| Inspector | `RightSidebar.tsx`, `RightSidebar/*PropertiesPanel.tsx` |
| References | `ReferenceViewer.tsx`, `lib/graphRelations.ts` |

## Review prompt (for PRs / self-check)

> "If I open a new project and do nothing, what do I see?"  
> Answer should be: canvas, collapsed chrome, collapsed tree sections, idle inspector — **not** logs, code, full variable lists, or settings forms.

## Related docs

- Shell matrix: [`vvs_ui_development`](../vvs_ui_development/SKILL.md)
- Implementation snapshot: [`docs/current_state.md`](../../../docs/current_state.md)
- UI backlog: [`.agents/memory/incomplete-ui.md`](../../memory/incomplete-ui.md)
