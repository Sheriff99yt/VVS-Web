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
- Auth UI: `components/auth/AuthButton.tsx`, `hooks/useAuthSession.ts`, `lib/auth/session.ts`, `lib/auth/supabaseClient.ts`
- Graph settings: `GraphSettingsModal.tsx` — codegen target, COA, syntax pack lock, environment link
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
| `examples/simpleExample.ts` | Hello World template |
| `examples/complexExample.ts` | Calculator template |
| `editorFocus.ts` | Tree/canvas focus frames; class home graph resolution |
| `projectSelection.ts` | Tree symbol selection invariants |
| `symbolCodegenLink.ts` | Selection → codegen tab + sourceMap node ids |
| `exampleProjects.ts` | StartScreen `EXAMPLE_PROJECTS` cards |
| `recentProjectsSubscribe.ts` | Deferred localStorage recents (`useSyncExternalStore`) |

## Key packages

| Package | Notable modules |
|---------|-----------------|
| `graph-types` | `analyze.ts`, `codegenTarget.ts`, `fidelityMigration.ts` (kindId backfill), `projectFolder.ts` |
| `environment-templates` | `import/fromOpenApi.ts`, `fromAsyncApi.ts`, `buildEnvironmentManifest.ts` |
| `syntax-packs` | `resolve.ts`, `rosetta/` |
| `transpiler` | `lower/graphToIr.ts`, `print/`, `emit/` |

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

- Transpiler emit: `appendIrMembers` / `ir.members` from define chain only — **no** `appendLegacyPreamble`
- Panel dual-write: `defineNodeSync`, `useSymbolLifecycle`, `add*WithDefine` in `ProjectTree.tsx` / `GraphCanvas.tsx`
- Compile gate: TopNav blocks Generate when `!analyzeProject(...).ok`

## Agent assets

- Rules: `.agents/AGENTS.md`
- Skills: `.agents/skills/*/SKILL.md`
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
