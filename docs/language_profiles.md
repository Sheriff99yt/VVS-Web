# Language profiles and portability

VVS graphs are **language-neutral**. Features that do not map cleanly to every target are tagged in the project model and reported at compile / language-switch time.

## How warnings work

1. `collectPortabilityFeatures()` scans the project (`functions[]`, `extendsType`, flags).
2. `analyzePortability(features, targetLanguage)` compares against `packages/language-profiles`.
3. Warnings appear in the **compiler log**, **status bar**, and **code panel header**.

Warnings do **not** block compile unless paired with structural errors.

## Cross Over Architecture (deferred)

**COA is not a shipped product toggle.** The settings panel shows “Planned”; `COA_SHIPPED` is `false` in `apps/web/src/lib/coaPolicy.ts`.

**Shipped today:** single **codegen target** + portability warnings for that target only.

**Future COA** (see [design/unified_symbol_model.md](design/unified_symbol_model.md)):

- **Node effectiveness (shipped U66/U67):** `nodeEffectiveness` in `@vvs/language-profiles`
  - Codegen: pack-prefixed `(x)` + node label (`showUnsupportedComments`, toggle left of Code panel language selector)
  - Canvas: dim/grey unsupported nodes (`dimUnsupportedNodes`, toggle top bar left of Autosave)
  - v1 rules: Import Module `targetLanguages` gate only
- Multi-target export from one graph
- Optional authoring limits across a language set

The `@vvs/language-profiles` `analyzeCrossOverDiagnostics()` implementation remains for when COA ships; it is not wired to block Generate while deferred.

## Fidelity and portability

- The **editor** enforces strict pin compatibility (see `docs/node_system.md` §2.2b).
- **Print String** requires `data_string`; use **To String** / **To Number** conversion nodes for type changes.
- The **transpiler** never folds conversions or hides macro bodies — one graph node = one visible construct ([visual_to_text_fidelity.md](visual_to_text_fidelity.md)).
- **`data_any`** on **To String** input accepts any wired value; output pins are strictly typed.

## Shipped targets (July 2026)

| Target | Profile | Syntax pack | Rosetta | Environment template |
|--------|---------|-------------|---------|----------------------|
| Python | Yes | `python.base` | 14 fixtures | `env.python.*` |
| JavaScript | Yes | `javascript.base` | 14 fixtures | `env.javascript.*` |
| C++ | Yes | `cpp.base` | 14 fixtures | `env.cpp.*` |
| Verse | Yes | `verse.base` | 14 fixtures | (via multi-target envs) |
| GDScript | Yes | `gdscript.base` | 14 fixtures | `env.gdscript.godot-game` |
| Rust | Yes | `rust.base` | 14 fixtures | — (console env planned) |
| C# | Yes | `csharp.base` | 14 fixtures | — (console env planned) |
| Go | Yes | `go.base` | 14 fixtures | — (console env planned) |
| Graph JSON | Yes | — | — | — |

**Milestone 3 (July 2026):** Language platform closed — eight codegen families + 112 Rosetta goldens. **Next:** usability & workflow standards ([terms_refactor_plan.md](design/terms_refactor_plan.md)).

## Feature matrix (summary)

| Feature | Python | JavaScript | C++ | Verse | GDScript |
|---------|--------|------------|-----|-------|----------|
| Instance methods | Native | Native | Native | Native (`<override>`) | Native |
| Static methods | Emulated (`@staticmethod`) | Native | Native | Emulated (module fn) | Native (`static func`) |
| Module functions | Native | Native | Native | Native | Native (`func`) |
| Overloads | Unsupported (use defaults) | Emulated | Native | Emulated | Unsupported |
| Virtual | N/A | N/A | Native | N/A | N/A |
| Class inheritance | Native | Native | Native | Native | Native (`extends`) |
| Async / await | Emulated | Native | Emulated | Unsupported | Emulated (`await`) |
| Macro inline | **Deprecated** — use Function + Call | **Deprecated** | **Deprecated** | **Deprecated** | **Deprecated** |

## Adding a language

Four-step workflow — portability policy and print rules stay separate ([syntax_pack_architecture.md](syntax_pack_architecture.md)):

1. **Profile** — add entry in `LANGUAGE_PROFILES` (`packages/language-profiles`): native / emulated / unsupported matrix and default capabilities.
2. **Base pack** — add `family.base.json` in `@vvs/syntax-packs` with Lego templates and layout tokens for simple constructs.
3. **Rosetta fixtures** — add graph JSON fixtures + `.golden.txt` expected outputs per construct; span invariants must pass.
4. **Emitter registration** — register TS printers in `@vvs/transpiler` `PrinterRegistry` for complex constructs (events, hoisting, multi-file); wire `CodegenTarget` default mapping.

Document language-unique behavior and portability warnings in this file.
