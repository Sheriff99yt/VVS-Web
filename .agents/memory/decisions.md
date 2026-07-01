# Locked Decisions

Choices agents must not undo without explicit user approval.

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
- UI components should call **`VvsApi` facade** (not direct `MockApi`) once A1/U20 is implemented; TopNav still uses `MockApi` until then
- **TopNav → canvas** uses `graphActions` custom events, not synthetic `KeyboardEvent`

## Graph editor (skeleton phase status)

Done for daily editing UX (sections 1–3 of `incomplete-ui.md`):

- Per-tab `GraphDocument` + `GraphTabMetadata`; save/load via `ProjectSnapshot`
- Undo/redo, reroute nodes, comment group/ungroup, in-app clipboard + Cut/Duplicate
- Variable object type, function/tab ID sync, variable rename propagation
- `data_array` pin geometry; simulation mock highlight
- Centralized wire validation in `graphWiring.ts` (single-wire-per-input, cycle guards)

Still open: File New/Import polish, mock validator, Library backend, MCP connect, real transpiler — see `incomplete-ui.md` sections 4–8.

## Public repository & product direction

- **MIT license** — repo intended for public collaboration; see root `LICENSE`, `CONTRIBUTING.md`
- **Lineage** — VVS 1 graduation project: [Sheriff99yt/Vision_Visual_Scripting](https://github.com/Sheriff99yt/Vision_Visual_Scripting); VVS Web is the active open continuation — `docs/history.md`
- **North star** — open visual scripting language portable across engines and workflows; **Verse is a v1 target language** in the web transpiler
- **Public roadmap** — `docs/roadmap.md` and `docs/vision.md` (not in-app Roadmap tab)
- **UE6 editor plugin (Phase 5)** — in-engine canvas + UE integration; **reuses Phase 1 Verse emitter**, not a separate codegen path
- **Web UI stays engine-neutral** — UE-specific affordances belong in plugin docs/surface, not generic web copy

## Architecture

- Transpiler: pure TypeScript in `packages/transpiler`, three-stage pipeline, zero React deps
- Go MCP tools: thin wrappers over pure functions in `internal/core/services/`
- Cross-domain communication via typed contracts only (`graph-types`, OpenAPI, `VvsApi`)

## Graph system isolation (July 2026)

- **`GraphWorkspaceHost` always mounted** — owns `useGraphState` + `useGraphTabSync` + workspace API; no React Flow
- **Separate `ReactFlowProvider` per view** — edit (Canvas) vs read-only (References); never one global provider
- **`GraphEditContext`** bridges host state to `GraphCanvas` when Canvas view is active
- **`CodePreviewPanel`** reads tab documents via `useGraphDocuments`, not React Flow `useStore`
- **`referenceRootGraphId`** decoupled from `activeGraphTab` — only `focusReference()` updates it
- **`ProjectTree` navigation modes** — `canvas`: single-click selects; `references`: single-click focuses reference graph; both: double-click opens in Canvas
- **Cycle prevention** — wire cycles (`graphCycles.ts`) and cross-graph dependency cycles (`graphRelations.ts`) block connects and node label changes
- **Centralized wiring** — `graphWiring.ts` owns pin compatibility, connection validation, single-wire-per-input, reroute split, and user-facing rejection messages; `GraphCanvas` delegates `onConnect`, `isValidConnection`, spawn-wire, and edge double-click through it
- **References** is a **top-level TopNav view**, not a left-panel category — do not re-add `ReferenceViewer` to `ProjectTree`

## Editor navigation history (July 2026)

- **Versioned `VvsEditorNavigationFrame`** (`types/editorNavigation.ts`) — graph tab, editor view, reference focus, selection, optional `focusedNodeId`; schema version field for future migrations
- **`EditorNavigationProvider`** is the single owner of browser `history.pushState` / `popstate` for in-editor back/forward (including mouse buttons 3 & 4)
- **Canonical API**: `useEditorNavigation().navigate(partial, { history: 'push' | 'replace' | 'none' })` or `dispatchEditorNavigate()` from non-React code
- **Sanitize on restore** — closed graph tabs fall back to `main`; legacy v0 history entries auto-upgrade
- **Do not push history manually** from feature code — use `navigate()` or let the provider's reactive sync record unmigrated `setActiveGraphTab` calls
