# Project environment templates

Project **environments** are VS Code–style templates: a linked manifest declares discoverable events, methods, and natives; host entry files (for example `main.py`); and optional starter graphs. Users start blank or from a template, edit logic in VVS graphs, and browse/spawn inherited API without rebuilding boilerplate visually.

## Package

| Package | Role |
|---------|------|
| `@vvs/environment-templates` | JSON manifests, `loadEnvironmentManifest()`, `resolveApiSurface()`, `expandEnvironmentSymbols()`, `createProjectFromEnvironment()` |

Pure TypeScript — no React. Consumed by web UI, syntax-registry spawn palette, and transpiler multi-file emit.

## Snapshot fields

`ProjectSnapshotV2` adds optional linkage:

- `environmentId` — linked template pack (for example `env.python.console-app`)
- `environmentVersion` — version at link time for drift detection

Empty `environmentId` preserves blank-project behavior.

## Built-in environments

Seventeen first-party packs, all registered in `manifests/builtins.ts` and listed by Library. Community catalog is Phase 3, not this set.

| ID | Category | Default target | Host files |
|----|----------|----------------|------------|
| `env.python.console-app` | console | Python (also JS/C++/Verse) | `main.py` |
| `env.python.cli-tool` | console | Python (also JS) | `main.py` |
| `env.python.data-script` | data | Python (also JS) | `main.py`, `data/sample.csv` |
| `env.python.api-service` | api | Python (also JS) | `main.py`, `routes.json` |
| `env.javascript.browser-app` | web | JavaScript (also Python) | `index.html`, `main.js` |
| `env.javascript.spa-app` | web | JavaScript (also Python) | `index.html`, `main.js`, `styles.css` |
| `env.javascript.node-script` | console | JavaScript (also Python) | `main.js`, `package.json` |
| `env.javascript.data-script` | data | JavaScript (also Python) | `main.js`, `package.json`, `data/sample.csv` |
| `env.javascript.http-service` | api | JavaScript (also Python) | `main.js`, `package.json`, `routes.json` |
| `env.cpp.console-app` | console | C++ (also Python) | `main.cpp` |
| `env.cpp.game-loop` | game | C++ (also Verse/Python) | `main.cpp` |
| `env.csharp.console-app` | console | C# (also Python) | `Program.cs`, `App.csproj` |
| `env.csharp.data-script` | data | C# (also Python) | `Program.cs`, `App.csproj`, `data/sample.csv` |
| `env.go.console-app` | console | Go (also Python) | `main.go`, `go.mod` |
| `env.go.http-service` | api | Go (also Python) | `main.go`, `go.mod` |
| `env.rust.console-app` | console | Rust (also Python) | `src/main.rs`, `Cargo.toml`, `.devcontainer/devcontainer.json` |
| `env.gdscript.godot-game` | game | GDScript (also Python) | `project.godot` |

## Manifest shape

Each manifest includes:

- `apiSurface` — types, methods (`native` / `overrideable` / `lifecycle`), events
- `hostFiles[]` — entry templates with `{moduleName}` slots (not visual graphs)
- `module.extends` — resolved per target via `ApiTypeDef.targets[lang].extendsName`
- Per-target `callExpr` on methods for text-shaped native emission
- Optional `devcontainer: { path }` — a containers.dev reference that must name an existing `hostFiles[]` entry (typically `.devcontainer/devcontainer.json`). VVS ships the file with the pack and does not start Docker or apply the container.

## UI

- **Start screen** — built-in environment cards alongside examples
- **Project tree** — **Environment API** section when `environmentId` is set; `[Handler]`, `[Call]`, `[Override]` spawn manifest-bound nodes
- **Context menu** — **From environment** categories via `expandEnvironmentSymbols()`
- **Graph settings** — environment picker; `extendsType` read-only when linked

## Codegen

- `env.call_native` → manifest `callExpr` (visible line, no hidden runtime)
- Main tab transpile emits **module file + host files** in `TranspileResult.files[]`
- Code preview shows a file tab selector when multiple files are emitted

## Analyzer

| Code | Meaning |
|------|---------|
| `ENV_MANIFEST_MISSING` | Manifest-bound node without project `environmentId` |
| `ENV_METHOD_UNKNOWN` | Stale manifest method/event id after template update |
| `ENV_NATIVE_UNSUPPORTED` | Native not defined for active `targetLanguage` |

## Server

`GET /registry/environments` — embedded manifests (mirrors `@vvs/environment-templates` built-ins).

## Library

Library assets may use `type: 'Environments'` and `importKind: 'environment'`. `installedLibrary[].environmentVersion` tracks template drift.

See also [node_system.md](node_system.md) § registry composition and [visual_to_text_fidelity.md](visual_to_text_fidelity.md).

---

## Industry standards & automated import

VVS environment manifests align with common enterprise template workflows:

| Standard | Role in VVS |
|----------|-------------|
| **JSON Schema** | [`schema/environment-manifest.schema.json`](../packages/environment-templates/schema/environment-manifest.schema.json) + `validateEnvironmentManifest()` |
| **OpenAPI 3.x** | Operations → `apiSurface.methods` (natives); optional `x-vvs` per operation for `callExpr` |
| **AsyncAPI 2.x** | Publish channels → `apiSurface.events` |
| **Backstage scaffolder** | `template.yaml` metadata + `skeleton/` → `hostFiles[]` (Nunjucks placeholders → `{moduleName}`) |
| **TypeSpec** | `.tsp` models + operations → `apiSurface.types` / `methods` via `@typespec/compiler` (Node/CLI only) |

### OpenAPI `x-vvs` extension

Attach per operation for text-shaped emit bindings:

```json
"x-vvs": {
  "role": "native",
  "id": "api.getPet",
  "targets": {
    "python": { "callExpr": "get_pet({api_getpet_petid})" },
    "javascript": { "callExpr": "getPet({api_getpet_petid});" }
  }
}
```

Without `x-vvs`, import generates stub `callExpr` lines from `operationId` and parameters.

### CLI import

From repository root:

```bash
bun run env:import -- \
  --id env.custom.my-service \
  --out packages/environment-templates/src/manifests/env.custom.my-service.json \
  --openapi ./api.openapi.json \
  --asyncapi ./events.asyncapi.json \
  --typespec ./api.tsp \
  --backstage ./path/to/backstage-template-pack \
  --title "My Service" \
  --target python
```

Then register the manifest in [`loader.ts`](../packages/environment-templates/src/loader.ts) or call `registerEnvironmentManifest()` at runtime.

### Programmatic import

```typescript
import {
  buildEnvironmentManifest,
  importMethodsFromOpenApi,
  importEventsFromAsyncApi,
  importApiSurfaceFromTypeSpec,
  registerEnvironmentManifest,
} from '@vvs/environment-templates';
import { importBackstagePack, importTypeSpecFile } from '@vvs/environment-templates/node';
```

TypeSpec is a first-class import path next to OpenAPI/AsyncAPI: `loadTypeSpecDocument()` / `importTypeSpecFile()` compile a `.tsp` with `@typespec/compiler` (not a subset parser) and map `@service` title/namespace, `model`s, `interface` operations, and namespace `op`s into a `ProjectEnvironmentManifest`. Host files stay empty unless another importer supplies them. The compiler lives on the Node/CLI entry (`@vvs/environment-templates/node` and `scripts/env-import.ts --typespec|--tsp`) so it is not part of the hosted Pages bundle. `$onEmit` is also exported from `./emitter` for `tsp compile --emit`. Backstage catalog publish remains planned. Dev Container linkage is an optional manifest field + host file (no Docker runtime in the editor).

### Host file skip vs emit

`.vvs/integration.json` `hostFiles[path].strategy` is `skip` or `emit` (optional custom `path`, optional in-editor `contents`). Adopting a folder probes for existing host entries (`main.py`, `src/main.rs`, ...) and marks those `skip` so Generate does not clobber them. Missing template files stay `emit`. Graph settings host-file rows edit `contents` on the project snapshot; Generate emit writes that text when set. Skip still omits the file. Refresh still reads disk / last `appliedTemplate` (no merge IDE).

### Template upgrade

Graph settings **Refresh** re-applies host files from the linked environment version. User graphs are not rewritten. Files that still match the last applied template are refreshed (`applied`). User-changed files take a line-based three-way merge: non-overlapping template additions apply (`merged`); overlapping hunks stay `kept-yours` and are marked skip so Generate does not clobber them. Identical files are `already-current`. There is no in-editor merge IDE and no conflict-marker UI.
