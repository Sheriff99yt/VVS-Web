# Locked Decisions

Choices agents must not undo without explicit user approval.

## Text-shaped graphs (July 2026 — major direction)

**Canonical spec:** `docs/visual_to_text_fidelity.md`

- **Product direction:** **Text-shaped graphs** — the canvas edits **ordinary source structure**; every behavioral node maps to **visible, locatable** generated text
- **Fidelity contract:** No compile-time paste, no hidden casts, no latent VM steps absent from export
- **Integration goal:** Generated files embed in **any** third-party stack (IDE, git, CI, MCP) — **no VVS runtime required**
- **Reuse:** **Function + Call Function** — not Blueprint macro inline expansion
- **Events:** Define/Dispatch → visible handler methods and call/emit lines; phase 2 multicast = **Subscribe + Emit** nodes, not hidden callback lists
- **Timing (future):** **Wait** / **Await Wait** nodes + async graph flag — explicit in text, not latent Delay
- **Macro tabs / `use_macro`:** **Deprecated as codegen concept** — migrate to Function + Call (UI may linger until alignment plan ships)
- **Rejected:** Blueprint-faithful semantics (macro expand, latent delay, VM-only behavior) — breaks visual↔text trust and third-party embedding
- **UE6 plugin:** Same fidelity rules; emits **Verse text** — does **not** simulate Blueprint VM

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

Still open: Library backend, **production VPS deploy** (PostgresStore + JWT middleware shipped locally) — see `docs/deployment.md` and `docs/ui_api_delivery_loop.md`.

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
- **Code panel:** Open by default; **CodeMirror 6** via `GeneratedCodeView` facade (§11 `docs/node_system.md`); Monaco swappable later
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

Still partial: syntax pack MCP tools (`propose_syntax_delta`, `run_rosetta` wire TBD); JWKS verification (HS256 via `SUPABASE_JWT_SECRET` today).

## Node design: property schema & conversion (July 2026)

- **`propertySchema`** on registry kinds drives **`PropertySchemaPanel`** (Settings in floating inspector) — first kind: **`action_get_input`**
- **Conversion nodes** (`convert_to_string`, `convert_to_number`) — pure expression; **one node = one call** in generated code; **no transpiler folding**
- **Print String** requires **`data_string`** — numeric display uses **Get → To String → Print**
- **`pinCompatibility.ts`** in `@vvs/graph-types` — shared with editor + `analyzeProject` (`PIN_TYPE_MISMATCH`)
- **Example templates:** Calculator demonstrates input, conversion, functions, events, branch — see `apps/web/src/lib/examples/`

## Syntax packs & codegen layers (July 2026)

**Canonical spec:** `docs/syntax_pack_architecture.md`

- **Syntax packs** (`@vvs/syntax-packs`) are the **authoritative print layer** — base JSON + capability overlays, resolved via explicit merge order
- **Structured IR** carries semantics only — no target-language strings in `lower/` after migration
- **Hybrid emit:** simple constructs in JSON templates; events, hoisting, async, multi-file, spans in TS `PrinterRegistry` printers
- **Language profiles** remain **portability policy** — native/emulated/unsupported; packs do not replace profiles
- **Tree-sitter: validator-only** — optional CI parse check on Rosetta output (Python/JS first); **not** syntax author or auto-ingestion
- **Agent scope:** may edit `packages/syntax-packs/**`; must not edit `lower/**`, IR schema, or fidelity rules without RFC
- **Verification gates:** Rosetta golden tests + span invariants + fidelity linter (+ optional parse validation)

## Architecture

- Transpiler: pure TypeScript in `packages/transpiler`, three-stage pipeline, zero React deps
- Go MCP tools: thin wrappers over pure functions in `internal/core/services/`
- Cross-domain communication via typed contracts only (`graph-types`, OpenAPI, `VvsApi`)

## Deployment & persistence (July 2026 — locked)

**Canonical spec:** `docs/deployment.md`

- **Self-hosted Supabase** on VPS — **Postgres + GoTrue (Auth) + Studio**; dev VPS + live VPS (shared hosting = static web only, not Supabase Docker)
- **Go is the only product API** — Next.js and MCP call `server/` REST + `/mcp`; **not** PostgREST for project/graph CRUD
- **Go ↔ Postgres via `pgx` pool** — `PostgresStore` replaces `MemoryStore`; same service interfaces
- **Auth:** GoTrue issues JWT; **Go middleware** verifies JWKS and scopes `user_id` on HTTP + MCP (production)
- **Storage:** `projects` table with **JSONB `ProjectSnapshot v2`**; tab-level document rows later for large graphs / collab
- **Browser transpiler stays primary** for editor preview; Go compile/MCP uses existing CLI bridge
- **No Redis v1** — Postgres + in-process cache until horizontal scale requires it
- **Phase 4 collab:** Go WebSockets + op log — not Supabase Realtime for product paths
- **`.vvs/` folders** remain first-class alongside cloud sync

## Graph system isolation (July 2026)

- **`GraphWorkspaceHost` always mounted** — owns `useGraphState` + `useGraphTabSync` + workspace API; no React Flow
- **Separate `ReactFlowProvider` per view** — edit (Canvas) vs read-only (References); never one global provider
- **`GraphEditContext`** bridges host state to `GraphCanvas` when Canvas view is active
- **`CodePreviewPanel`** reads tab documents via `useGraphDocuments`, not React Flow `useStore`
- **`referenceRootGraphId`** decoupled from `activeGraphTab` — only `focusReference()` updates it
- **`ProjectTree` navigation modes** — `canvas`: single-click selects; `references`: single-click focuses reference graph; both: double-click opens in Canvas
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
