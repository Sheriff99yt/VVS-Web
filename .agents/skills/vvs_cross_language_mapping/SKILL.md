---
name: VVS Cross Language Mapping Guide
description: >-
  Triggers when generating code, editing syntax packs, or determining how VVS
  visual nodes and settings translate into code across Python, C++, JS, C#,
  Rust, GDScript, and Verse. Read this parent skill first, then open exactly one
  language doc (<lang>.md) — one document per language, not separate skills.
---

# VVS Cross Language Mapping Guide

Parent skill for **visual → code** fidelity. **One markdown file per language**
(sibling of this skill). Those language files are **not** skills.

## Agentic workflow (locked)

1. Read **this** parent for workflow and shared links.
2. Open **exactly one** language doc below for that target’s emit / pack / inspector work.
3. Open `shared/` only for cross-cutting policy (all languages at once).
4. **Verify as the user sees:** Code | Files for StartScreen Test Projects
   (especially Coverage Lab) via the **Doc verification cycle** below.

## One document per language (not skills)

| Target | Document |
|--------|----------|
| C++ (U82 Declare/Define reference) | [`cpp.md`](cpp.md) |
| Python | [`python.md`](python.md) |
| JavaScript | [`javascript.md`](javascript.md) |
| C# | [`csharp.md`](csharp.md) |
| Rust | [`rust.md`](rust.md) |
| GDScript | [`gdscript.md`](gdscript.md) |
| Verse (UEFN) | [`verse.md`](verse.md) |

Each language doc is self-contained: Declare/Define, that language’s concept→emit column, declaration examples, and control-flow examples.

## Shared (cross-cutting only — not per language)

| Topic | Document |
|-------|----------|
| Distinct nodes vs inspector modifiers | [`shared/nodes-vs-settings.md`](shared/nodes-vs-settings.md) |
| Full 7-language matrix | [`shared/translation-matrix.md`](shared/translation-matrix.md) |
| U66 / U81 / U82 + file boundaries | [`shared/declare-define-rules.md`](shared/declare-define-rules.md) |
| Feature support / progressive confirmation | [`shared/feature-support.md`](shared/feature-support.md) |

## Rules agents must not skip

- **U81:** Function **Declare** ≠ **Define**.
- **U82:** C++ is the reference for prototypes + out-of-line bodies → [`cpp.md`](cpp.md).
- **U66 / U67:** No native prototype split → ineffective Declare is `(x) Declare Name` + dim.
- **File boundaries:** one container graph → one file; never auto-split `.h`/`.cpp`.
- **sourceMap:** Declare maps only to what it emits; Define maps to header + body.

## Doc verification cycle

Keep each `<lang>.md` aligned with **what the Code panel emits**. Prefer the folder-backed cycle (same as [`vvs_usability_example_tests`](../vvs_usability_example_tests/SKILL.md)):

```bash
bun apps/web/scripts/validate_test_projects_folder.ts
# optional: refresh goldens after a tiny intentional emit fix
bun apps/web/scripts/validate_test_projects_folder.ts --update-goldens
```

| Fixture | Golden |
|---------|--------|
| First Graph (simple) | `apps/web/test_project_goldens/simple/<lang>/_HOME_GRAPH_PREVIEW.txt` |
| Coverage Lab (complex) | `apps/web/test_project_goldens/complex/<lang>/_HOME_GRAPH_PREVIEW.txt` |

**Per-language pass checklist**

1. Confirm goldens green for that lang (or note validate failure as an issue).
2. Diff golden vs that lang doc (Declare/Define, Concept → emit, teaching fences).
3. Update the lang doc so teaching examples / Concept → emit match shipped emit.
4. For each finding: **fix if small**, else append to **Issues log** as `needs-system-plan` / `needs-code`.
5. If a Concept → emit cell changed, sync [`shared/translation-matrix.md`](shared/translation-matrix.md).
6. Mark lang status in the **Pass status** table.

**Policy:** docs follow goldens. Small/local drift → fix in cycle. Architecture / multi-lang emit redesign → log only (`needs-system-plan`). Do not weaken locked U66/U81/U82 rules to match a bug — log **P0** instead.

| Fix in cycle (small) | Document only (`needs-system-plan`) |
|----------------------|-------------------------------------|
| Doc example / Concept cell / matrix sync | New node kinds, IR redesign, multi-lang behavior change |
| One-line or local syntax-pack print fix | Expanding Declare prototypes beyond C++ (+ C# abstract) |
| Stale comment / `(x)` wording in docs | Canvas source-of-truth / dual-write architecture gaps |
| Refresh goldens after a tiny emit fix | Broad modifierEffectiveness or fidelity program work |
| Typo / fence / path in skill docs | Anything that needs a design decision or multi-PR plan |

## Pass status

| Lang | Doc | Last verified | Status |
|------|-----|---------------|--------|
| C++ | [`cpp.md`](cpp.md) | 2026-07-17 | synced_with_open_issues |
| Python | [`python.md`](python.md) | 2026-07-17 | synced_with_open_issues |
| JavaScript | [`javascript.md`](javascript.md) | 2026-07-17 | synced |
| C# | [`csharp.md`](csharp.md) | 2026-07-17 | synced_with_open_issues |
| Rust | [`rust.md`](rust.md) | 2026-07-17 | synced_with_open_issues |
| GDScript | [`gdscript.md`](gdscript.md) | 2026-07-17 | synced_with_open_issues |
| Verse | [`verse.md`](verse.md) | 2026-07-17 | synced_with_open_issues |

Statuses: `pending` · `in_progress` · `synced` · `synced_with_open_issues`

**Validate (2026-07-17):** `bun apps/web/scripts/validate_test_projects_folder.ts` — all 14 fixture×lang pairs **ok** (disk-loaded).

## Issues log (canonical)

All cross-language mapping findings live here (`CL-NNN`). Do **not** duplicate full lists inside lang docs — at most a one-liner pointing here.

| ID | Lang | Severity | Source | Finding | Disposition | Status |
|----|------|----------|--------|---------|-------------|--------|
| CL-001 | cpp | P1 | `complex/cpp`, `simple/cpp` | Teaching fences showed out-of-line `Machine::on_start` and non-`virtual` prototypes; Coverage Lab puts events **inside** the class and uses `virtual` / `= 0` / access sections / `(x) Import`. | fixed-in-cycle (`cpp.md`) | done |
| CL-002 | cpp | P1 | matrix / `complex/cpp` | Static field emit is `inline static float`, not bare `static`. For-each over arrays is range-for `for (T x : xs)`, not C-style `for(;;)`. | fixed-in-cycle (`cpp.md`, matrix) | done |
| CL-003 | python | P1 | `complex/python` | Concept → emit said Switch → `match:`; Coverage Lab emits `if/elif` cascade via `_vvs_sel`. | fixed-in-cycle (`python.md`, matrix) | done |
| CL-004 | javascript | P1 | `complex/javascript` | For Loop cell said `for(;;)`; Coverage Lab emits `for (const val of …)`. | fixed-in-cycle (`javascript.md`, matrix) | done |
| CL-005 | csharp | P1 | `complex/csharp` | Instance **Constant** emits `readonly`, not `const`. For-each is `foreach`, not `for(;;)`. | fixed-in-cycle (`csharp.md`, matrix) | done |
| CL-006 | csharp | P1 | `complex/csharp` | **Async** on void methods emits `async void` (Shutdown/Sample), not `async Task`. Correct Task-shaped async needs pack/IR return-type plan. | needs-system-plan (packs / transpiler — async return type) | open |
| CL-007 | rust | P1 | `complex/rust` | Switch cell said `match {}`; Coverage Lab emits `if/else if` cascade (`_vvs_sel`). | fixed-in-cycle (`rust.md`, matrix) | done |
| CL-008 | rust | P1 | `complex/rust` | **Static** / **Constant** field modifiers do not change emit (plain `pub Serial: f32` / `pub MaxPower: f32`). Docs now match; real `const`/`static` needs modifier plan. | needs-system-plan (packs / modifierEffectiveness) | open |
| CL-009 | rust | P1 | `complex/rust` | `HashMap<…>` used with no `use std::collections::HashMap;` (ineffective Import nodes are `(x)` comments only). | needs-system-plan (import wiring / packs) | open |
| CL-010 | rust | P0 | `complex/rust` | Inheritance is `base: Machine` composition, but bodies use `self.Power` / `Sensor::new()` without field projection or `new` impl — will not compile as Rust. Needs inheritance-lowering plan. | needs-system-plan — [plans/CL-010-rust-inheritance.md](plans/CL-010-rust-inheritance.md) | open |
| CL-011 | gdscript | P1 | `complex/gdscript` | Switch cell said `match:`; Coverage Lab emits `if/elif` cascade. | fixed-in-cycle (`gdscript.md`, matrix) | done |
| CL-012 | gdscript | P1 | `complex/gdscript` | Switch temp `_vvs_sel = self.Status` omits `var` — invalid GDScript. | needs-system-plan (transpiler temp decl) | open |
| CL-013 | gdscript | P1 | `simple/gdscript`, `complex/gdscript` | Get User Input uses `OS.read_string_from_stdin()` only — prompt string from the node is not printed (unlike other langs). | needs-system-plan (packs / GetInput print) | open |
| CL-014 | verse | P0 | `simple/verse`, `complex/verse` | Get User Input emits `var _vvs_input_… : float = 0.0` stub — not string input. Locked fidelity: behavioral nodes must map to real locatable constructs. | needs-system-plan — [plans/CL-014-015-verse-getinput-for.md](plans/CL-014-015-verse-getinput-for.md) | open |
| CL-015 | verse | P0 | `complex/verse` | For-each over array emits invalid hybrid `for (float val : Readings) {` (C++-like braces, unclosed block) instead of Verse `for (val : Readings):`. | needs-system-plan — [plans/CL-014-015-verse-getinput-for.md](plans/CL-014-015-verse-getinput-for.md) | open |
| CL-016 | verse | P1 | `complex/verse` | Class-typed field default `Host = false` (logic) for `Machine` — wrong defaulting. | needs-system-plan (Verse defaults / type defaults) | open |
| CL-017 | multi | P2 | `complex/*` | Native `match` / pattern Switch for Python, Rust, GDScript (and richer Verse cascade) not covered — today if-cascade is intentional ship shape; promote only with a Switch-lowering plan. | needs-system-plan (optional Switch lowering) | open |
| CL-018 | gdscript / verse | P2 | `complex/gdscript`, `complex/verse` | **Async** modifier ineffective in Coverage Lab emit (plain `func` / no `<suspends>`). Docs note current no-op; chip disable vs real async needs modifier plan. | needs-system-plan (modifierEffectiveness) | open |

## Related project docs

- [`docs/visual_to_text_fidelity.md`](../../../docs/visual_to_text_fidelity.md)
- [`docs/design/language_capability_catalog.md`](../../../docs/design/language_capability_catalog.md)
- [`docs/design/language_neutral_vocabulary.md`](../../../docs/design/language_neutral_vocabulary.md)
- Skills: [`vvs_syntax_packs`](../vvs_syntax_packs/SKILL.md) · [`vvs_transpiler_development`](../vvs_transpiler_development/SKILL.md) · [`vvs_visual_code_fidelity`](../vvs_visual_code_fidelity/SKILL.md) · [`vvs_usability_example_tests`](../vvs_usability_example_tests/SKILL.md)
