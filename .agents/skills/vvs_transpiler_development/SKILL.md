---
name: VVS Transpiler Development
description: Triggers when modifying or building the TypeScript code generation engine in packages/transpiler.
---

# Transpiler Boundaries & Testing

- The transpiler MUST be pure TypeScript with zero React dependencies, living in `packages/transpiler`. It must run fully offline in the browser.
- Web facade: `apps/web/src/lib/mockCodegen.ts` re-exports `@vvs/transpiler` — UI imports the facade, not transpiler internals.
- The transpiler is the most critical system. Any changes to code generation logic MUST be accompanied by tests verifying exact code output for fixed graph JSON (see `generate.test.ts`, `exampleSnapshots.test.ts`, `convert.test.ts`, `getInput.test.ts`).

# Text-shaped graphs (locked)

**Canonical:** `docs/visual_to_text_fidelity.md`

- Every behavioral node → **one visible construct** in export (statement line or expression span)
- Register **`sourceMap` / `expressionSpans`** for all new lowering — selection highlight is part of fidelity
- **Forbidden:** macro inline expansion, latent delay without AST, folding operations the graph does not show
- **Reuse:** `CallFunction` only — not `use_macro` paste (macro lowering is legacy; migrate to function call)
- **Events:** Define → method body; Dispatch → explicit call/emit line
- Generated code must run in **standard toolchains** without a VVS runtime

# Canonical spec

- **`docs/visual_to_text_fidelity.md`** — locked product direction, rejected Blueprint path
- **`docs/node_system.md`** — registry kinds, pins vs `properties`, conversion nodes
- **`docs/language_profiles.md`** — per-target portability; conversion emits per language
- **`packages/syntax-registry/core-pack.json`** — source of truth for `kindId`, semantics, `propertySchema`

# Three-stage pipeline (target architecture)

Enforce separation where possible: (1) Graph Analysis (DAG sorting), (2) IR / expression resolution, (3) Emitter. Current code mixes stages in `generate.ts` — extend via helpers (`codeExpr.ts`, `convertExprs.ts`, `inputHelpers.ts`) rather than inlining language strings in UI.

# Expression nodes vs statement nodes

| Kind | `emitStatement` | Codegen role |
|------|-----------------|--------------|
| `variable_get`, `math_*`, `convert_*` | returns `null` | Pure expression via `resolveNodeOutputExpr` |
| `action_print`, `variable_set`, `action_get_input`, … | emits tagged statement | `buildTaggedStatements` + `CodeSink` |

**Conversion nodes** (`convert_to_string`, `convert_to_number`):

- One graph node = **one** explicit call in source (`str()`, `String()`, `std::to_string`, etc.)
- Use `wrapExpr` from `codeExpr.ts` — registers spans for **source-map highlight** on the conversion node
- **Never fold** conversions into Print, Set, or other consumers

# No implicit coercion

- Print String (`action_print`) input is **`data_string`** only
- Numeric → print requires **Get → To String → Print** on the graph
- Do not add transpiler auto-cast shortcuts — teach 1:1 visual ↔ text mapping

# Adding a new node kind

1. Add row to `packages/syntax-registry/core-pack.json` (+ sync `server/.../core-pack.json`)
2. Extend `NodeSemantics` in `syntax-registry/src/registry.ts`
3. Lower in `generate.ts` (`emitStatement` and/or `resolveNodeOutputExpr`)
4. Add tests (unit + optional `exampleSnapshots.test.ts` matrix)
5. Optional `propertySchema` for inspector settings — transpiler reads `node.data.properties`, not React

# Example templates

- `apps/web/src/lib/examples/simpleExample.ts` — Hello World
- `apps/web/src/lib/examples/complexExample.ts` — Calculator (input, conversion, functions, events)
- Integrity: `apps/web/src/lib/examples/complexExample.test.ts` — analyze + wiring + 4-language codegen
- Builders: `apps/web/src/lib/examples/exampleGraphBuild.ts` — use `exampleDocument()` to normalize nodes

# Pin type validation (shared with UI)

- `@vvs/graph-types` `pinCompatibility.ts` — same rules as `apps/web/src/lib/graphWiring.ts`
- `analyzeProject` emits `PIN_TYPE_MISMATCH` for invalid saved wires
