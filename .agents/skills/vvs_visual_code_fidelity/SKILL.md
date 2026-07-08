---
name: VVS Visual Code Fidelity
description: >-
  Read before symbol-table, define-node, transpiler emit, or panel CRUD work.
  Triggers on canvas source of truth, sidebar preamble, define nodes, dual-write,
  DEFINE_NODE_MISSING, DECLARATION_NOT_ON_CANVAS, or visual-only codegen fidelity.
---

# Canvas source of truth (read first)

**Canonical:** `docs/visual_to_text_fidelity.md` § Canvas is the source of truth

- **Canvas nodes emit code** — `variables[]`, `functions[]`, `events[]` are indexes and CRUD shortcuts only
- **Declare** = `class_define`, `var_define`, `function_define`, `event_member_define` on class home graph
- **Use** = Get/Set, Call Function, dispatch, flow nodes where logic runs
- Transpiler: `appendIrMembers` / `ir.members` only — **no** `appendLegacyPreamble` or emit from symbol arrays
- Panel creates must **dual-write** define nodes (`defineNodeSync`, `useSymbolLifecycle`)
- Strict errors block Generate: `DEFINE_NODE_MISSING`, `DECLARATION_NOT_ON_CANVAS`, `ORPHAN_DEFINE_NODE`

## Pre-PR checklist

- [ ] Does every new emitted line map to a canvas node with `sourceMap`?
- [ ] Does this PR emit text without a node? If yes — reject.
- [ ] Do panel/import paths create define nodes, not symbol rows alone?

## Skill cross-refs

| Area | Skill |
|------|--------|
| Transpiler emit | `vvs_transpiler_development/SKILL.md` |
| Project tree / canvas UI | `vvs_ui_development/SKILL.md` |
| Save/compile API | `vvs_ui_api_loop/SKILL.md` |
| Analyzer ownership | `vvs_architecture_boundaries/SKILL.md` |

Locked decision: `.agents/memory/decisions.md` § Canvas source of truth
