# Workspace Facts

Stable facts agents should assume without re-exploring the tree.

## Repository

- Monorepo root: `VVS Web/` — **public MIT repo** (see `CONTRIBUTING.md`)
- Implemented packages: `packages/graph-types`, `packages/syntax-registry`, `packages/language-profiles`, `packages/syntax-packs`, `packages/transpiler`, `packages/environment-templates`
- Go server: `server/` — registry HTTP, project API, local MCP; **Phase 2:** `pgx` → self-hosted Supabase Postgres ([deployment.md](../../docs/deployment.md))

## Frontend entry points

- App shell: `apps/web/src/components/layout/EditorLayout.tsx` — mounts `GraphWorkspaceHost`, `EnvironmentImportModal`
- Graph edit canvas: `apps/web/src/components/graph/GraphCanvas.tsx`
- Floating inspector: `apps/web/src/components/layout/GraphFloatingDetails.tsx` — includes `CallNodeOverloadPanel`
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
- HTTP mode: `NEXT_PUBLIC_API_MODE=http` — `VvsApi.saveProject`, `loadProject`, `listProjects`, `compileProject`, `probeMcp`
- Persistence target: Go **`pgx`** → self-hosted Postgres JSONB — not PostgREST

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
