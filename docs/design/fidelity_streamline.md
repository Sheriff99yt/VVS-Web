# Fidelity Streamline Redesign

**Status:** Active redesign (July 2026)  
**North star:** [visual_to_text_fidelity.md](../visual_to_text_fidelity.md) § No Hidden Magic · canvas source of truth  
**Pilot fixture:** Coverage Lab (`coverageLabUsabilityTest.ts`) · [language_capability_catalog.md](language_capability_catalog.md)  
**Backlog:** [.agents/memory/incomplete-ui.md](../../.agents/memory/incomplete-ui.md) §11 (U59+)

---

## Goal

Keep the middle systems — graph analysis, IR, syntax packs, thin emitters. Shrink **custom emit code that invents or corrects** generated text so the canvas stays the only author of meaning.

```mermaid
flowchart LR
  Canvas[Canvas_define_and_flow]
  Analyze[Analyze_fidelity]
  IR[IR_members_and_stmts]
  Packs[Syntax_packs]
  Emit[Thin_emit]
  Text[Generated_text_plus_sourceMap]
  Canvas --> Analyze --> IR --> Packs --> Emit --> Text
```

**Pipeline stays; magic shrinks.** Agents and contributors must not reintroduce Calculator-era shortcuts (declare stubs, invented `public`, hardcoded `float`/`f64`, silent class shells).

---

## Verify as the user sees (locked)

Final results are what the **Code | Files** panel shows for StartScreen Test Projects — not unit dumps that skip multi-class keying or integration path rules.

| Path | Role |
|------|------|
| `useProjectTranspileResult` | Same emit the Code panel uses |
| `bun apps/web/scripts/extract_test_project_outputs.ts` | Dump panel-identical outputs → `apps/web/test_project_outputs/` |
| Dual Class `_HOME_GRAPH_PREVIEW.txt` | Both class files + scoped imports |

Class homes: **target** is one file per container graph (all classes). Do **not** reintroduce class-per-file or a “split classes” profile — file boundaries are graph boundaries (user awareness).

---

## Classification

| Kind | Meaning | Examples |
|------|---------|----------|
| **Wrongful magic** | Infer keywords, invent includes/types/defaults, reorder to “fix” author order, dual emit paths, silent class shells | Hardcoded param types; `functionNeedsAsync` body inference; `fallbackVisibility: 'public'`; `appendMemberImplementations` two-phase path; auto-`openClassShell` without `ClassDecl` |
| **Allowed layout** | Language-required structure that still traces to canvas nodes | Rust `struct` then `impl` when methods appear (`ensureRustImpl`); empty-body `pass` when a handler exists but has no statements; access-section separators from pack slots when visibility is set on the node |
| **Require canvas node** | Semantic requirement must appear as a define/use/Import node | `class_define` for a class shell; Import Declare for `#include` / `import`; `isAsync` on `function_define` for async keywords; pin/symbol type for typed params |

---

## Work queue (U59+)

| ID | Phase | Scope |
|----|-------|--------|
| **U59** | 0 | Design lock — this doc + backlog §11 + roadmap pointer |
| **U60** | 1 | Delete dead dual paths (`appendMemberImplementations`, unused declare helpers) |
| **U61** | 2 | Property → slot → pack only (types, async, visibility; no invented keywords) |
| **U62** | 3 | Strict class shell — open only on `ClassDecl`; no auto-open from field/method |
| **U63** | 4 | Doc/skill realignment — Coverage Lab + this doc as active fidelity program |
| **U64+** | 5 | Deeper fidelity — **U64a/b done**. **U65 done.** **Cross-class event dispatch done.** Next: Phase 6 polish (perf/env/mobile). |

Related multi-class honesty: **U56** Generate/export, **U57** file-tab UX, **U58** **one graph → one file** (locked — no split-class profile) — backlog §10.

---

## Do not remove

These systems are **required** and must stay:

| System | Why |
|--------|-----|
| **IR** (`ir.members`, statements, sourceMap) | Sole bridge from canvas → emit |
| **Syntax packs** + Rosetta goldens | Language-specific print; data-driven, not hardcoded |
| **Analyzer fidelity errors** | `DEFINE_NODE_MISSING`, `DECLARATION_NOT_ON_CANVAS`, `ORPHAN_DEFINE_NODE` block Generate |
| **`modifierEffectiveness`** | UI disable for language-ineffective chips; emit still property-driven |
| **`appendIrMembersInOrder`** | One member emit path; canvas chain order = source order |

---

## Phase summary

| Phase | Outcome |
|-------|---------|
| **0** | Design hub + backlog + roadmap (no behavior change) |
| **1** | One member emit path only; dead declare helpers gone |
| **2** | No invented types / async / visibility keywords without canvas properties |
| **3** | Class shell only from `ClassDecl`; U56/U57 as capacity allows |
| **4** | Docs/skills name Coverage Lab + this file |
| **5** | Temps → pack+sourceMap (U64a switch selector done); Import Declare for stdlib (props shipped — place nodes explicitly) |

### Canvas surface added (2026-07-16)

| Gap | Software fix |
|-----|----------------|
| C++-style `Enum::Member` pasted into all langs | TypeRef `{ kind: 'enum' }` (+ legacy `enumType`) + pack `EnumMemberAccess`; Dual Class uses member names |
| No Get Enum value node | `expr_enum_member` |
| No Import settings for stdlib | `import_module` → `modulePath` / `importStyle` / `importNames` / **`targetLanguages`**; place **once at file top** on the first class chain; flow Import Module for conditional imports; optional `ownerClassId` |
| Parallel type overlay vs pin type | **TypeRef** unifies builtin / enum / class / Array / Map — [user_types.md](user_types.md) |
| Verse Array Push stub comment | pack `ArrayPush` template |
| Rust Sensor dropped inheritance | ClassDecl `extendsType` → Rust `base: Machine` composition field |
| Abstract invented `pass` / empty body | Ineffective langs emit `# abstract Name` / `// abstract Name` only |
| Multi-class one graph | **Locked:** one graph → one file (all classes). Per-class `preferFallbackOverModuleFile` was interim — migrate to graph emit (U58). No split-class profile. |
| Unit tests ≠ Code panel | Locked: verify via `extract_test_project_outputs.ts` / `useProjectTranspileResult` |
| Switch selector temp (`_vvs_sel`) | Pack `SwitchSelectBind` (py/gd/rs) + selector `expressionSpans` on all switch printers; name still TS `SWITCH_SEL_TEMP` — U64a |
| GetInput line temps (`_vvs_line*`) | Pack `GetInputLineNew` / `GetInputLineRead` / `GetInputParseLineF32` (rust/csharp number); literal + C++ prompt spans — U64b |

---

## Success criteria

- No emit path invents keywords, types, or includes without a canvas property/node
- One member emit path only (`appendIrMembersInOrder`)
- Docs/skills name Coverage Lab + `fidelity_streamline.md` as the active fidelity program
- Coverage Lab + Rosetta + modifier rollout tests remain green
- **Code panel parity:** StartScreen Test Projects dump via `extract_test_project_outputs.ts` matches what Code | Files shows (one home-graph file; shared imports once at top; conditional flow imports)

## Agent gate

Before merging emit changes:

1. Does this PR invent text without a canvas node or property? If yes — reject.
2. Prefer pack slots and define-node `properties` over emitter heuristics.
3. **Validate as the user sees** — run `bun apps/web/scripts/extract_test_project_outputs.ts` (or mirror `useProjectTranspileResult`) and check Dual Class preview: **one** home-graph file with both classes. Do not ship class-per-file invent or a split-classes profile.

See `.agents/skills/vvs_visual_code_fidelity/SKILL.md` · `vvs_usability_example_tests/SKILL.md`.
