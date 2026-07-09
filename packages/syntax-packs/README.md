# @vvs/syntax-packs

Pure TypeScript syntax pack layer for VVS code generation. Zero React dependencies.

## Architecture

- **Base packs** (`src/packs/*.base.json`) — print templates per language family
- **Overlays** (`src/packs/overlays/`) — capability deltas (e.g. `javascript.es2022.json`)
- **Resolver** (`resolve.ts`) — base ⊕ overlay merge, last-wins, `sourcePackId` tracing
- **Rosetta suite** (`rosetta/`) — graph fixtures + `.golden.txt` per construct × family

Transpiler `PrintContext` reads resolved templates before falling back to TS printers.

## MCP tools

| Tool | Purpose |
|------|---------|
| `list_syntax_packs` | Discover families, versions, capabilities |
| `propose_syntax_delta` | Returns a validated template-row patch proposal for a target pack |
| `run_rosetta_suite` | Runs Rosetta golden checks and returns structured JSON |
| `validate_generated_parse` | Runs Tree-sitter parse validation on generated Rosetta outputs |

Agents may edit `packages/syntax-packs/**` only; must not edit `lower/**` or fidelity rules without RFC.

## Tree-sitter parse validation

Implemented for **Python** and **JavaScript** Rosetta outputs.

- Runs through `bun run validate:parse`
- Uses Tree-sitter as a **validator only**
- CI can enforce this on supported runners
- Unsupported local runtimes degrade to **skipped** results rather than crashing

## Tests

```bash
bun test
```

Runs Rosetta golden compare, span invariants, fidelity linter, and pack resolver tests.

```bash
bun run validate:parse
```

Runs Tree-sitter validation for generated Python/JavaScript Rosetta outputs. Use `--strict` in CI to fail when the native tree-sitter runtime is unavailable (Linux runners with installed prebuilds should pass).

## Adding a language family (v1 checklist)

1. **`packages/graph-types`** — add the family to `LanguageFamily` / `TargetLanguage`.
2. **Base pack** — create `src/packs/{family}.base.json` with full `layout` (including `emptyHandlerBody`, `emptyFunctionBody`) and Rosetta template keys (see `packCoverage.test.ts`).
3. **Rosetta goldens** — add `{fixture}.{family}.golden.txt` for every fixture in `rosetta/`.
4. **Transpiler** — register hybrid printers in `print/register.ts` if needed (`get_input`, `switch`); extend `PACK_DRIVEN_FAMILIES` in `print/template.ts`.
5. **Module shell** — shell templates in base pack (`ClassModuleOpen`, `EventHandlerOpen`, `FunctionDefOpen`); wire via `emit/shell.ts` (param/signature slots still assembled in TS for fidelity).
6. **CI** — family is covered by `bun test` in `packages/syntax-packs` and `packages/transpiler`; add Tree-sitter grammar if parse validation should apply.

See also [`docs/syntax_pack_architecture.md`](../../docs/syntax_pack_architecture.md).
