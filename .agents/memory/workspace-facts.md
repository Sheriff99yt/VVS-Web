# Workspace Facts

Stable facts agents should assume without re-exploring the tree.

## Repository

- Monorepo root: `VVS Web/` — **public MIT repo** (see `CONTRIBUTING.md`)
- Implemented packages: `packages/graph-types`, `packages/syntax-registry`, `packages/language-profiles`, `packages/syntax-packs`, `packages/transpiler`, `packages/environment-templates`
- Go server: `server/` — registry HTTP, project REST, compile, local MCP SSE; **Phase 2:** `ProjectStore` (`MemoryStore` | `PostgresStore` via `pgx`), JWT middleware ([deployment.md](../../docs/deployment.md))

## Frontend entry points

- App shell: `apps/web/src/components/layout/EditorLayout.tsx` — mounts `GraphWorkspaceHost`, `EnvironmentImportModal`
- Start screen: `apps/web/src/components/start/StartScreen.tsx` — examples, explore, recents, `AuthButton`
- Graph edit canvas: `apps/web/src/components/graph/GraphCanvas.tsx` — includes `GraphSelectionToolbar`
- Floating inspector: `apps/web/src/components/layout/GraphFloatingDetails.tsx` — includes `CallNodeOverloadPanel`
- Project tree: function **double-click / open icon = Edit function body**; badges **Declare** (exists) / **Define** (body place) per locked vocab; docs survive tab close (`shouldRetainGraphDocument`); same-file emit = U80; Declare≠Define split = **U81**
- Vocabulary: `docs/design/language_neutral_vocabulary.md` — functions **Call** / **Declare** / **Define** (not header-file focus)- Graph settings: `GraphSettingsModal.tsx` — codegen target, portability summary, COA (planned), syntax pack lock, environment link
- Unified symbol architecture: `docs/design/unified_symbol_model.md` — declare/implement/invoke; COA deferred (`apps/web/src/lib/coaPolicy.ts`)
- Project state: `apps/web/src/contexts/ProjectContext.tsx` — includes `syntaxPackLock`
- API facade: `apps/web/src/lib/api/` — mock + HTTP via `NEXT_PUBLIC_API_MODE`

## Key libs (apps/web/src/lib)

| File | Role |
|------|------|
| `nodeCatalog.ts` | Spawn categories from `@vvs/syntax-registry` |
| `graphWiring.ts` | Pin compatibility (imports `@vvs/graph-types`), wire apply |
| `mockCodegen.ts` | Facade to `@vvs/transpiler` |
| `nodeKind.ts` | `normalizeNodeData`, display titles, binding-first kindId |
| `functionHelpers.ts` | Call binding, overload sync, `applyFunctionCallBinding` |
| `projectFolder/handleStore.ts` | `folderKeyFromHandleName()` stable folder keys |
| `environmentCatalog.ts` | Bootstrap built-in + imported environment manifests |
| `typePickerOptions.ts` | Type picker options from built-ins + canvas enum/class TypeRefs |
| `usabilityExampleTests/coverageLabUsabilityTest.ts` | Coverage Lab — primary fidelity golden |
| `usabilityExampleTests/firstGraphUsabilityTest.ts` | First Graph — simple StartScreen test |
| `usabilityExampleProjects.ts` | StartScreen `USABILITY_EXAMPLE_TESTS` cards |
| `apps/web/scripts/extract_test_project_outputs.ts` | Dump Code-panel-identical Test Project outputs |
| `apps/web/src/hooks/useProjectTranspileResult.ts` | Project-wide emit (what Code panel uses) |
| `editorFocus.ts` | Tree/canvas focus frames; class home graph resolution |
| `projectSelection.ts` | Tree symbol selection invariants |
| `symbolCodegenLink.ts` | Selection → codegen tab + sourceMap node ids |
| `recentProjectsSubscribe.ts` | Deferred localStorage recents (`useSyncExternalStore`) |

## Key packages

| Package | Notable modules |
|---------|-----------------|
| `graph-types` | `analyze.ts`, `codegenTarget.ts`, `fidelityMigration.ts` (kindId backfill), `projectFolder.ts` |
| `environment-templates` | `import/fromOpenApi.ts`, `fromAsyncApi.ts`, `buildEnvironmentManifest.ts` |
| `syntax-packs` | `resolve.ts`, `render.ts`, `packCoverage.test.ts`, `rosetta/` |
| `transpiler` | `lower/graphToIr.ts`, `print/` (all v1 families pack-first), `emit/classModule.ts`, `emit/sinkStatements.ts`, `emit/members.ts` |

## Syntax pack print migration (July 2026)

- **python + cpp:** pack-driven leaf + block print is authoritative — no silent fallback to hardcoded emitters.
- **javascript + verse:** legacy hardcoded branches in `print/stmt.ts` / `print/expr.ts` remain until milestone 2 (same pipeline, expand base packs, delete branches).
- **Member declare:** `VarDefine` template + pack `layout.varDeclIndent` for python/cpp variable declarations.
- **Indent:** `bodyIndent` / `handlerBodyIndent` read from pack `layout` (with JS/Verse fallbacks in `graphToIr.ts`).

## MCP & HTTP (Phase 1 local / Phase 2 VPS)

- MCP URL (Connect AI modal): `http://localhost:8080/mcp` — production: HTTPS + JWT ([deployment.md](../../docs/deployment.md))
- API base: `NEXT_PUBLIC_API_URL` default `http://localhost:8080`
- HTTP mode: `NEXT_PUBLIC_API_MODE=http` — `VvsApi.saveProject`, `loadProject`, `listProjects`, `compileProject`, `probeMcp`, `getHealth`
- Auth env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — JWT in `sessionStorage` → Bearer on project APIs
- Go env: `DATABASE_URL` (postgres), `AUTH_REQUIRED`, `SUPABASE_JWT_SECRET`
- Persistence: Go **`pgx`** → self-hosted Postgres JSONB — **not** PostgREST

## Codegen fidelity (strict)

**Canvas is the source of truth** — see `docs/visual_to_text_fidelity.md` § Canvas is the source of truth.

| Diagnostic | Level | Meaning |
|------------|-------|---------|
| `DEFINE_NODE_MISSING` | error | Symbol in table without matching define node on `classHomeGraphId` |
| `DECLARATION_NOT_ON_CANVAS` | error | Symbols exist but class graph has no define chain |
| `ORPHAN_DEFINE_NODE` | error | Define node on canvas with `symbolId` not in symbol table |
| `HIDDEN_EVENT_RUNTIME_UNSUPPORTED` | error | `event_emit` or `event_subscribe` node — hidden runtime helper; use Define + Dispatch |
| `MULTICAST_REQUIRES_SUBSCRIBE` | error | Multiple `event_define` handlers for same event without visible multicast pattern |

**Event model (enforced):** `event_dispatch` → direct handler call; no `_emit` / `_subscribe` injection; `event_emit` / `event_subscribe` excluded from spawn catalog (`SPAWN_EXCLUDED_KINDS` in `@vvs/syntax-registry`).

- Transpiler emit: `appendIrMembers` / `ir.members` from define chain only — **no** `appendLegacyPreamble`
- Panel dual-write: `defineNodeSync`, `useSymbolLifecycle`, `add*WithDefine` in `ProjectTree.tsx` / `GraphCanvas.tsx`
- Compile gate: TopNav blocks Generate when `!analyzeProject(...).ok`

**Active pilot (July 2026):** Coverage Lab (Machine+Sensor). **Verify as Code panel shows.** **Locked:** one graph → one file (all classes; no split-class profile — want two files → two graphs). Modifier chips disable when ineffective. Single-pass `appendIrMembersInOrder`. Imports: once at file top + conditional flow Import (`targetLanguages`; optional `ownerClassId`). Event defines: Y-ordered peers. Next: U68–U77. Do not invent keywords / includes / Default / file layout.

**U66/U67 (shipped):** `packages/language-profiles/src/nodeEffectiveness.ts` — gated Import Module **and** non-abstract Function Declare (non-C++) → `(x)` comments (Code panel toggle) + canvas dim (TopNav Dim). Prefs `showUnsupportedComments` / `dimUnsupportedNodes` default on.

## Agent assets

- Rules: `.agents/AGENTS.md`
- Skills: `.agents/skills/*/SKILL.md` — fidelity, usability (**panel-first**), transpiler, cross-language
- Memory: `.agents/memory/` — `decisions.md`, `workspace-facts.md`, `incomplete-ui.md`
- Canonical UI/codegen state: `docs/current_state.md`

## Build / test commands

```powershell
cd apps/web; bun run build
cd packages/transpiler; bun test
cd packages/syntax-packs; bun test
cd packages/graph-types; bun test
cd server; go build ./...
```

## Naming (user-facing)

Follow `docs/naming_and_product_direction.md` — use **module name**, **extends**, **Generate** (not Compile in user copy).
