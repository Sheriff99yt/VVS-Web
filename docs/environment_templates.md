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

| ID | Target | Host files |
|----|--------|------------|
| `env.python.console-app` | Python (also JS/C++/Verse bindings) | `main.py` |
| `env.javascript.browser-app` | JavaScript (partial Python) | `index.html`, `main.js` |

## Manifest shape

Each manifest includes:

- `apiSurface` — types, methods (`native` / `overrideable` / `lifecycle`), events
- `hostFiles[]` — entry templates with `{moduleName}` slots (not visual graphs)
- `module.extends` — resolved per target via `ApiTypeDef.targets[lang].extendsName`
- Per-target `callExpr` on methods for text-shaped native emission

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
  registerEnvironmentManifest,
} from '@vvs/environment-templates';
import { importBackstagePack } from '@vvs/environment-templates/node';
```

**Planned:** TypeSpec emitter, devcontainer.json linkage, Backstage catalog publish action.
