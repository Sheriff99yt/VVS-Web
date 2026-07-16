---
name: VVS Visual Code Fidelity
description: >-
  Read before symbol-table, define-node, transpiler emit, or panel CRUD work.
  Triggers on canvas source of truth, sidebar preamble, define nodes, dual-write,
  DEFINE_NODE_MISSING, DECLARATION_NOT_ON_CANVAS, or visual-only codegen fidelity.
---

# Canvas source of truth (read first)

**Canonical:** `docs/visual_to_text_fidelity.md` § Canvas is the source of truth · **Streamline:** `docs/design/fidelity_streamline.md`

- **Canvas nodes emit code** — `variables[]`, `functions[]`, `events[]` are indexes and CRUD shortcuts only
- **Declare** = `class_define`, `var_define`, `function_define`, `event_member_define` (+ `enum_define`) on class home graph
- **Use** = Get/Set, Call Function, dispatch, flow nodes where logic runs
- Transpiler: `appendIrMembersInOrder` / `ir.members` only — **no** sidebar preamble
- Panel creates must **dual-write** define nodes
- Strict errors block Generate: `DEFINE_NODE_MISSING`, `DECLARATION_NOT_ON_CANVAS`, `ORPHAN_DEFINE_NODE`

## Core Philosophy: No Hidden Magic

Never inject hidden structural code (stdlib includes, async wrappers, class `abstract` from members, `impl Default`). Users place **Import Module**, **enumType**, modifiers, etc. on the canvas.

## Coverage Lab + streamline (active)

**Fixture:** `coverageLabUsabilityTest.ts` · **docs:** `fidelity_streamline.md`

1. Canvas chain order = source order (`appendIrMembersInOrder`).
2. **One graph → one file (locked):** all `class_define` chains on a container graph emit into **one** module in canvas order. Want two files → two graphs. **No** class-per-file invent and **no** split-classes profile.
3. Import Module: `modulePath` / `importStyle` / `importNames` / `targetLanguages` — place **once at file top** (wire into the first class chain); emit at chain position. Flow Import Module inside branches for conditional imports (e.g. Python `if …: import json`). `ownerClassId` optional when scoping is needed.
4. Enum: `VariableSymbol.enumType` + switch `enumType`; pack `EnumMemberAccess`; node `expr_enum_member`.
5. Abstract (ineffective langs): `# abstract Name` / `// abstract Name` — no invented body.
6. Rust inheritance: composition field `base: Parent` from ClassDecl `extendsType`.
7. Class shell opens **only** on `ClassDecl`.

## Verify as the user sees (locked)

Before claiming an emit fix is done:

1. Open or extract **StartScreen Test Projects** (First Graph + Coverage Lab).
2. Match **Code | Files** panel output — `useProjectTranspileResult` / `bun apps/web/scripts/extract_test_project_outputs.ts`.
3. Reject “passes unit test but panel shows one overwritten file / wrong import on wrong class.”

See `vvs_usability_example_tests/SKILL.md` § Verify as the user sees.

## Pre-PR checklist

- [ ] Every new emitted line maps to a canvas node / property with `sourceMap`?
- [ ] Emitting text without a node? → reject
- [ ] Dual-write define nodes on panel create?
- [ ] Magic (implicit imports, forced `public`/`override`, async-from-body, silent class shell)? → reject
- [ ] Validated via **Code panel path** for Test Projects?

## Skill cross-refs

| Area | Skill |
|------|--------|
| Usability + panel extract | `vvs_usability_example_tests/SKILL.md` |
| Transpiler | `vvs_transpiler_development/SKILL.md` |
| Cross-language | `vvs_cross_language_mapping/SKILL.md` |
| UI shell | `vvs_ui_development/SKILL.md` |

Locked: `.agents/memory/decisions.md` § Coverage Lab + fidelity streamline · § Code panel verification
