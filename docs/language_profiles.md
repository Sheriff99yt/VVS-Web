# Language profiles and portability

VVS graphs are **language-neutral**. Features that do not map cleanly to every target are tagged in the project model and reported at compile / language-switch time.

## How warnings work

1. `collectPortabilityFeatures()` scans the project (`functions[]`, `extendsType`, flags).
2. `analyzePortability(features, targetLanguage)` compares against `packages/language-profiles`.
3. Warnings appear in the **compiler log**, **status bar**, and **code panel header**.

Warnings do **not** block compile unless paired with structural errors.

## Feature matrix (summary)

| Feature | Python | JavaScript | C++ | Verse |
|---------|--------|------------|-----|-------|
| Instance methods | Native | Native | Native | Native (`<override>`) |
| Static methods | Emulated (`@staticmethod`) | Native | Native | Emulated (module fn) |
| Module functions | Native | Native | Native | Native |
| Overloads | Unsupported (use defaults) | Emulated | Native | Emulated |
| Virtual | N/A | N/A | Native | N/A |
| Class inheritance | Native | Native | Native | Native |
| Macro inline | Emulated | Emulated | Emulated | Emulated |

## Adding a language

1. Add profile entry in `LANGUAGE_PROFILES` (`packages/language-profiles`).
2. Add emitter rules in `@vvs/transpiler`.
3. Document language-unique behavior in this file.
