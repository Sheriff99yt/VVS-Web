# Workspace Facts

Stable facts agents should assume without re-exploring the tree.

## Repository

- Monorepo root: `VVS Web/` — **public MIT repo** (git initialized; see `CONTRIBUTING.md`)
- Only `apps/web` is a fully implemented app package; `plugins/` is a UE6 plugin placeholder
- Graph types live in `apps/web/src/types/` until `packages/graph-types` exists
- `packages/transpiler`, `packages/syntax-registry`, `packages/graph-types` are empty placeholders
- Go server: `server/` — `GET /health` only; domain + ports in `internal/core/`

## Frontend entry points

- App shell: `apps/web/src/components/layout/EditorLayout.tsx` — mounts `GraphWorkspaceHost`; canvas unmounts when not active
- Editor route: `apps/web/src/app/editor/page.tsx` — passes `initialNodes/Edges/Documents` to `EditorLayout`
- Graph document host (always on): `apps/web/src/components/graph/GraphWorkspaceHost.tsx`
- Graph edit canvas (canvas view only): `apps/web/src/components/graph/GraphCanvas.tsx` — consumes `GraphEditContext`
- Reference view: `apps/web/src/components/views/ReferencesView.tsx` + `ReferenceGraphCanvas.tsx`
- Project panel: `apps/web/src/components/layout/ProjectTree.tsx` — `GraphExplorer` wrapper; `mode: 'canvas' | 'references'`
- Properties: `apps/web/src/components/layout/RightSidebar/` (inside edit `ReactFlowProvider` only)
- Project state: `apps/web/src/contexts/ProjectContext.tsx` — includes `referenceRootGraphId`, `focusReference()`
- Graph edit state: `contexts/GraphEditContext.tsx` — nodes/edges for active tab
- Workspace bridge: `contexts/GraphWorkspaceContext.tsx` — `getDocuments`, `subscribeMetadata`
- Active view: `contexts/EditorViewContext.tsx`
- **Editor navigation**: `contexts/EditorNavigationContext.tsx` — versioned frames, `navigate()`, browser history sync
- Per-tab documents: `hooks/useGraphTabSync.ts` + `hooks/useGraphDocuments.ts`
- Mock persistence: `lib/api/` (`VvsApi`) + `types/projectSnapshot.ts`

## Key libs (apps/web/src/lib)

| File | Role |
|------|------|
| `nodeCatalog.ts` | Spawnable nodes for context menu |
| `graphDefaults.ts` | `GraphDocument`, `GraphTabMetadata`, empty function/macro templates |
| `graphActions.ts` | `vvs:graph-action` + `vvs:node-action` dispatch |
| `graphCycles.ts` | In-graph wire cycle detection |
| `graphWiring.ts` | Pin compatibility, wire validation/apply, reroute split, single-wire-per-input |
| `graphRelations.ts` | Cross-graph reference index + cycle guards |
| `editorBootstrapSubscribe.ts` | Hydration-safe editor bootstrap from localStorage |
| `referenceGraphLayout.ts` | UE5-style reference flow layout |
| `referenceTree.ts` | Reference depth/breadth/type filter constants |
| `functionTabs.ts` | `func-{id}` sync between explorer and tab bar |
| `variableDefaults.ts` | Variable type defaults including `object` |
| `executionOrder.ts` | Mock simulation walk order |
| `mockCodegen.ts` | Mock code preview from execution flow + data wires |
| `graphTabs.ts` | Open graph tabs, generated file names |
| `projectTree.ts` | Breadcrumb segments, macro list helpers |
| `graphNavigation.ts` | `vvs:navigate-to-node` (→ navigation provider), focus-first error |
| `editorNavigate.ts` | `dispatchEditorNavigate`, `dispatchSwitchToCanvas` |
| `editorNavigationHistory.ts` | Versioned `VvsEditorNavigationFrame`, sanitize, browser read/write |
| `editorMessages.ts` | Editor warnings → output console |

## Cross-component events (window)

| Event | Purpose |
|-------|---------|
| `vvs:switch-editor-view` | Switch Canvas / References / Library (→ `EditorNavigationProvider`) |
| `vvs:editor-navigate` | Partial navigation frame + history mode (`EditorNavigationProvider`) |
| `vvs:graph-action` | Edit/View menu → canvas (copy, cut, paste, duplicate, group/ungroup, zoom-fit) |
| `vvs:node-action` | Node toolbar duplicate/delete with undo history |
| `vvs:variable-renamed` | Properties panel → update Get/Set node labels |
| `vvs:import-library-graph` | Library → new graph tab (`GraphWorkspaceHost`) |
| `vvs:simulation-log` | Mock play stepping → compiler console |
| `vvs:validation-result` | Generate validator → console + `validationErrors` in context |
| `vvs:navigate-to-node` | Console/call nodes → navigate to tab + focus node (history push) |
| `vvs:focus-first-validation-error` | Status bar error badge → first validator log |

## Agent assets

- Rules: `.agents/AGENTS.md`
- Skills: `.agents/skills/*/SKILL.md`
- Memory: `.agents/memory/` — **`incomplete-ui.md`** is the UI work queue

## Build commands

```powershell
cd apps/web; bun run build
cd server; go build ./...
```

## Naming (user-facing)

Follow `docs/naming_and_product_direction.md` — no Blueprint/BeginPlay/BP_ jargon in UI copy. Use **module name**, **extends**, **Generate** (not Compile in user copy).
