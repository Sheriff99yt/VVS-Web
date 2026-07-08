---
name: VVS Syntax Packs
description: Triggers when editing syntax packs, print templates, Rosetta fixtures, capability overlays, or deciding whether a codegen change belongs in packs vs IR vs lowering.
---

# Canonical spec

- **`docs/syntax_pack_architecture.md`** — layers, pack inheritance, hybrid emit, agent workflow, fidelity linter
- **`docs/language_profiles.md`** — portability policy (profiles ≠ packs)
- **`docs/visual_to_text_fidelity.md`** — one node → one locatable region; span registration required

# Canvas source of truth (locked)

**Canonical:** `docs/visual_to_text_fidelity.md` § Canvas is the source of truth · Trigger skill: `vvs_visual_code_fidelity/SKILL.md`

- Print templates register spans for define-node emissions — `lintFidelity` in CI via `rosetta.test.ts`
- Packs print what lowering places in `ir.members` — do not add hidden preamble templates for symbol tables
- New define-node print rows must include `sourceGraphNodeId` span invariants

# When to edit what

| Change type | Edit | Do not edit |
|-------------|------|-------------|
| How `self.foo()` vs `this.foo()` prints | **Syntax pack** template or TS printer | `lower/graphToIr.ts` |
| New language version dialect (ES2022, type hints) | **Capability overlay** JSON on base pack | IR schema |
| New node kind semantics (what graph means) | **`core-pack.json`** + **lowering** → structured IR | Pack only (insufficient) |
| Event hoisting, async layout, multi-file | **TS printer** in `PrinterRegistry` | JSON template (too complex) |
| Native vs emulated feature warning | **`@vvs/language-profiles`** | Syntax pack |
| Environment API call shape | **`@vvs/environment-templates`** env overlay | Core `if`/`while` pack rows |
| Fidelity / span rules | **RFC + lowering + linter** | Pack workaround that hides nodes |

# Decision tree

```
Does the graph meaning change?
  YES → core-pack.json + lower/ (structured IR) + Rosetta fixture
  NO  → Is it print syntax only?
          YES → Is it a simple statement/expression?
                  YES → syntax-packs JSON template (+ overlay if version-specific)
                  NO  → transpiler print/ TS printer (+ register in PrinterRegistry)
        Is it portability / warning policy?
          YES → language-profiles
```

# Pack edit rules

- **Base pack** (`family.base.json`) — full profile for a language family
- **Overlay** — override-only rows; never duplicate entire base
- **Merge order:** base → capability overlays → project lockfile; last-wins; record `sourcePackId`
- **Lego rows:** `{ type: "static" | "slot", val }` + layout tokens `\x01`–`\x05` per `project_requirements.md` §2.3–2.4
- **Quasi-quotes** for expressions: `{receiver}.{callee}({args})`

# Required gates (every pack change)

1. **Rosetta golden** — strict string compare for affected `(fixture × family)`
2. **Span invariants** — behavioral node IDs in `sourceMap`; `expressionSpans` cover expected substrings
3. **Fidelity linter** — no statement without `sourceGraphNodeId` except `synthetic: true` scaffolding
4. **Optional parse validation** — Tree-sitter on Python/JS Rosetta output when CI job enabled

CI failure = do not merge. Agents propose diffs; humans review portability policy only.

# Agent boundaries

**May edit:**

- `packages/syntax-packs/**` — base packs, overlays, Rosetta fixtures
- `packages/transpiler/src/print/**` — TS printers (with gates above)

**Must not edit without RFC:**

- `packages/transpiler/src/lower/**` — lowering must stay language-neutral
- `packages/transpiler/src/ir/types.ts` — IR semver bumps need migration plan
- Fidelity rules in `docs/visual_to_text_fidelity.md`
- `@vvs/language-profiles` emulation policy (human review)

# MCP tools (Phase 2 — not wired yet)

Documented for future agent loops:

| Tool | Use |
|------|-----|
| `list_syntax_packs` | Discover families, versions, capabilities |
| `propose_syntax_delta` | Diff against base pack |
| `run_rosetta_suite` | Golden tests for a target |
| `validate_generated_parse` | Optional Tree-sitter check |

# Related skills

- **`vvs_transpiler_development`** — three-stage pipeline, snapshot tests, when lowering changes are required
- **`vvs_architecture_boundaries`** — monorepo package boundaries
- **`vvs_agentic_memory`** — update `decisions.md` if direction changes
