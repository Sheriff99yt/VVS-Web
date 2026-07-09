---
name: VVS Usability Example Tests
description: >-
  Triggers when adding graph fixtures, StartScreen starters, UI coverage tests,
  language-specific inspector options, or planning missing nodes for a target language.
---

# Usability example tests (not tutorial demos)

**Canonical:** `docs/design/language_capability_catalog.md` · **Capability planning:** same doc § Catalog

Graph fixtures under `apps/web/src/lib/usabilityExampleTests/` exist to **discover UI/UX gaps** — missing spawn catalog entries, inspector fields, per-language member options, and codegen fidelity breaks. They are **regression harnesses** for visual availability of the editor, not end-user tutorials.

## Golden rule (locked)

**Canvas nodes + registry UI are the single source of truth.** Every generated line must map to a placed node (`sourceMap`). Usability tests must:

- Build graphs from **registry `kindId`s** via `usabilityTestGraphBuild.ts` helpers (same paths users and MCP agents use).
- Assert **strict fidelity** (`DEFINE_NODE_MISSING`, `DECLARATION_NOT_ON_CANVAS`, wiring rules).
- Fail when a language needs a construct that has **no canvas node** — that failure drives a catalog entry in `language_capability_catalog.md`, not a transpiler shortcut.

Panel/tree rows are indexes only; dual-write define nodes on create.

## Layout

| Path | Role |
|------|------|
| `usabilityExampleTests/helloWorldUsabilityTest.ts` | Baseline Declare → On → Print |
| `usabilityExampleTests/calculatorUsabilityTest.ts` | Full coverage: member chain, multi-graph, input, Call/Dispatch, Branch, Conversion |
| `usabilityExampleTests/usabilityTestGraphBuild.ts` | Spawn helpers — `usabilityTestDocument()`, `usabilityTestNode()` |
| `usabilityExampleTests/calculatorUsabilityTest.test.ts` | Analyze + wiring + 7-language codegen + vocabulary |
| `usabilityExampleProjects.ts` | `USABILITY_EXAMPLE_TESTS` — StartScreen openers |
| `packages/transpiler/src/usabilityExampleSnapshots.test.ts` | Cross-package transpile anchors (py/js/cpp/verse) |

## When to add a new fixture

1. Add a row to **§ Usability test matrix** in `language_capability_catalog.md`.
2. Implement snapshot + tests before (or with) the UI/node work the fixture exposes.
3. Wire StartScreen only if the fixture is a **primary** regression opener (keep the list small).

## Agentic / MCP workflow

AI changes must go through **graph mutations** (same JSON the editor saves):

- MCP tools: project/graph CRUD, symbol lifecycle with define-node dual-write, `run_rosetta_suite`, syntax pack proposals.
- Agents must not emit code by editing symbol arrays or bypassing canvas nodes.
- When a capability is missing, agents should **propose** a registry row + inspector schema + catalog update — not hardcode emit.

See `vvs_ui_api_loop/SKILL.md` for HTTP contract; `vvs_visual_code_fidelity/SKILL.md` for fidelity checklist.

## Pre-PR checklist

- [ ] New behavior is reachable from spawn catalog or inspector on canvas
- [ ] Usability test (or Rosetta fixture) covers the graph path
- [ ] `language_capability_catalog.md` row updated (`uiStatus`, `nodeKindId`)
- [ ] No emit from sidebar-only symbols

## Cross-refs

| Area | Skill / doc |
|------|-------------|
| Unified UI vocabulary | `docs/design/language_neutral_vocabulary.md` |
| Implementation phases | `docs/design/terms_refactor_plan.md` |
| Node registry | `docs/node_system.md` |
| Transpiler tests | `vvs_transpiler_development/SKILL.md` |
| StartScreen | `vvs_ui_development/SKILL.md` |
