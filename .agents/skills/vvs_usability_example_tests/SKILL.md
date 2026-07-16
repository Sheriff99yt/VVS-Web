---
name: VVS Usability Example Tests
description: >-
  Triggers when adding graph fixtures, StartScreen starters, UI coverage tests,
  language-specific inspector options, or planning missing nodes for a target language.
  Also triggers when verifying codegen — always test what the Code panel shows the user.
---

# Usability example tests (not tutorial demos)

**Canonical:** `docs/design/language_capability_catalog.md` · **Streamline:** `docs/design/fidelity_streamline.md`

Graph fixtures under `apps/web/src/lib/usabilityExampleTests/` exist to **discover UI/UX gaps** and lock **codegen fidelity**. They are regression harnesses for the editor, not end-user tutorials.

## Golden rule (locked)

**Canvas nodes + registry UI are the single source of truth.** Every generated line must map to a placed node (`sourceMap`).

## Verify as the user sees (locked — July 2026)

**Do not trust unit dumps that bypass the Code panel path.** Agents and contributors must validate codegen against **what StartScreen Test Projects show in the Code | Files panel**.

| Source of truth | Path |
|-----------------|------|
| **UI emit** | `useProjectTranspileResult` — key `` `${tabId}:${classId}` `` + `withProjectCodegenTarget` |
| **Panel preview** | `CodePreviewPanel` — multi-class home shows all owned files for that graph |
| **Extract dump** | `bun apps/web/scripts/extract_test_project_outputs.ts` → `apps/web/test_project_outputs/` |
| **Hook regression** | `apps/web/src/hooks/useProjectTranspileResult.test.ts` |

**Anti-pattern:** Asserting only `transpileProject({ activeClassId })` or inventing one file per class / a “split classes” profile — file layout is graph layout (user awareness). Coverage Lab must show **one** home-graph file containing both classes.

**Required when changing emit / integration / multi-class:**

1. Run `extract_test_project_outputs.ts` (or mirror its emit loop).
2. Diff `_HOME_GRAPH_PREVIEW.txt` for Coverage Lab + First Graph.
3. Confirm distinct class files (e.g. `src/machine.py` + `src/sensor.py`) are **not** inventing a split — home is one module (`src/CoverageLab.*`).

## Coverage Lab golden (active)

**Canonical:** `docs/design/fidelity_streamline.md` · catalog § Coverage Lab

1. **Primary golden:** Coverage Lab — Machine + Sensor on one graph (modifiers, enum, imports, inheritance, switch/for, Get User Input).
2. C++ Machine still anchors access-section modifiers; Python/JS/etc. via `calculatorModifierRollout.test.ts` (Coverage Lab–based).
3. Member emit: `appendIrMembersInOrder` — canvas chain order = source order.
4. Imports: place **once at file top** on the first class chain (`targetLanguages` gate); optional **flow Import Module** inside branches (Python-style conditional import). Do not duplicate the same import per class.
5. Enum: `enumType` + member names; pack `EnumMemberAccess`.
6. **One graph → one file:** all classes on a container graph share one module (U58). Do not assert class-per-file or invent a split-classes option.
7. Do **not** revive Calculator / Async Fetcher / Dual Class Lab as StartScreen fixtures.

## Layout

| Path | Role |
|------|------|
| `usabilityExampleTests/firstGraphUsabilityTest.ts` | Simple StartScreen test — Declare · GetInput · Call |
| `usabilityExampleTests/coverageLabUsabilityTest.ts` | Complex StartScreen test — TypeRef enum/class/array/map + multi-class |
| `usabilityExampleTests/usabilityTestGraphBuild.ts` | Spawn helpers |
| `usabilityExampleProjects.ts` | StartScreen registry + stable `vvs-test-*` seed/open |
| `scripts/extract_test_project_outputs.ts` | Dump Code-panel outputs; `--update-goldens` |
| `test_project_goldens/` | Expected `_HOME_GRAPH_PREVIEW.txt` per fixture × lang |
| `usabilityExampleGoldens.test.ts` | Emit vs golden compare (U65) |
| `hooks/useProjectTranspileResult.ts` | What the Code panel uses |
| `components/graph/NodeModifiers.tsx` | Disable language-ineffective chips |

## Pre-PR checklist

- [ ] Behavior reachable from spawn catalog or inspector
- [ ] Asserted via **Code panel emit path** (extract script or hook mirror), not only raw `transpileGraph`
- [ ] Coverage Lab home preview shows **both** classes in one module with correct imports/order
- [ ] Catalog row updated if new node/setting
- [ ] No emit from sidebar-only symbols

## Cross-refs

| Area | Skill / doc |
|------|-------------|
| Fidelity | `vvs_visual_code_fidelity/SKILL.md` |
| Transpiler | `vvs_transpiler_development/SKILL.md` |
| Multi-class | `docs/design/multi_class_symbols.md` |
| Streamline | `docs/design/fidelity_streamline.md` |
