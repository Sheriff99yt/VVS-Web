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
- **Declare** = member existence: `class_define`, `var_define`, function declare, `event_member_define` (+ `enum_define`) on class home graph
- **Define** (functions) = body **placement** in generated code (distinct from Declare) — see U81 / `language_neutral_vocabulary.md`
- **Use** = Get/Set, Call Function, dispatch, flow nodes where logic runs
- Transpiler: `appendIrMembersInOrder` / `ir.members` only — **no** sidebar preamble
- Panel creates must **dual-write** declare/define nodes
- Strict errors block Generate: `DEFINE_NODE_MISSING`, `DECLARATION_NOT_ON_CANVAS`, `ORPHAN_DEFINE_NODE`
- Function release menu (locked): **Call** / **Declare** / **Define** — not header-file focus
- **C++ (U82):** Declare → in-class prototype; Define → out-of-line `Class::Method` after `};` (or separate `.cpp` graph). Never auto-split one graph into `.h`+`.cpp`.
- **Other langs:** non-abstract Function Declare is ineffective → U66 `(x) Declare Name` + U67 dim (same as gated imports). Abstract is native only on C++/C#; elsewhere also `(x)` + dim (e.g. Coverage Lab Declare Diagnose). Body stays on Define. **sourceMap:** Declare↔own emit only; Define↔header+body.

## Core Philosophy: No Hidden Magic

Never inject hidden structural code (stdlib includes, async wrappers, class `abstract` from members, `impl Default`). Users place **Import Module**, **enumType**, modifiers, etc. on the canvas.

## Coverage Lab + streamline (active)

**Fixture:** `coverageLabUsabilityTest.ts` · **docs:** `fidelity_streamline.md`

1. Canvas chain order = source order (`appendIrMembersInOrder`). **Y is secondary** for unconnected heads (+ event peers). Do not auto-reorder connected members by height. Do **not** emit chain-vs-height Compiler Log warnings (`CHAIN_ORDER_Y_MISMATCH` / `EVENT_PEER_Y_ORDER` disabled).
2. **One graph → one file (locked):** all `class_define` chains on a container graph emit into **one** module in canvas order. Want two files → two graphs. **No** class-per-file invent and **no** split-classes profile.
3. Import Module: `modulePath` / `importStyle` / `importNames` / `targetLanguages` — place **once at file top** (wire into the first class chain); emit at chain position. Flow Import Module inside branches for conditional imports (e.g. Python `if …: import json`). `ownerClassId` optional when scoping is needed.
4. Enum: `VariableSymbol.enumType` + switch `enumType`; pack `EnumMemberAccess`; node `expr_enum_member`.
5. Abstract: `# abstract Name` / `// abstract Name` / C# `abstract` prototype / C++ `= 0` — no invented body.
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
| Cross-language | `vvs_cross_language_mapping/SKILL.md` → one of `cpp.md` / `python.md` / … |
| UI shell | `vvs_ui_development/SKILL.md` |

Locked: `.agents/memory/decisions.md` § Coverage Lab + fidelity streamline · § Code panel verification
