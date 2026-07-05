# @vvs/syntax-packs

Pure TypeScript syntax pack layer for VVS code generation. Zero React dependencies.

## Architecture

- **Base packs** (`src/packs/*.base.json`) — print templates per language family
- **Overlays** (`src/packs/overlays/`) — capability deltas (e.g. `javascript.es2022.json`)
- **Resolver** (`resolve.ts`) — base ⊕ overlay merge, last-wins, `sourcePackId` tracing
- **Rosetta suite** (`rosetta/`) — graph fixtures + `.golden.txt` per construct × family

Transpiler `PrintContext` reads resolved templates before falling back to TS printers.

## MCP tools (Phase 5 — Go server, out of scope here)

| Tool | Purpose |
|------|---------|
| `list_syntax_packs` | Discover families, versions, capabilities |
| `propose_syntax_delta` | Returns diff against base pack (agent output) |
| `run_rosetta_suite` | Runs golden tests for a target |
| `validate_generated_parse` | Optional Tree-sitter parse check |

Agents may edit `packages/syntax-packs/**` only; must not edit `lower/**` or fidelity rules without RFC.

## Tree-sitter parse validation (Phase 6 — deferred)

Optional CI parse validation for Python/JS Rosetta outputs is **not implemented** in this package.
When added, it will be a devDependency + CI job only — not a merge blocker for Verse.

## Tests

```bash
bun test
```

Runs Rosetta golden compare, span invariants, fidelity linter, and pack resolver tests.
