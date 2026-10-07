# Shared native scalar semantic core

Rust/C++/GDScript scalar literals and integer/Boolean constant expressions now live in the pure `@vvs/graph-types` package. Source-import retains its public functions as diagnostic bridges: `NativeScalarFailure` becomes `ImportFailure` with the same code/detail and the existing default span. Source-owned analysis still anchors failures to actual expression spans. No parser or source-import dependency enters graph-types or the transpiler.

This relocates the existing independently verified policies without widening their semantic domain. It retains the pinned Rust edition/pointer width, Clang LLP64 profile, Godot literal behavior, type/range/operator checks and evaluation budgets. Facts remain immutable, analysis-only and graph-admission blocked.

The shared package can now independently evaluate authored constant trees after operand edits. Tests compare its public API with the curated native constant cases and verify changed operands/divide-by-zero rejection. These are expression-tree tests, not saved-graph mutation evidence. Importer bridge tests retain diagnostic identity and prevent duplicated error prefixes.

Validation for this dependency batch is `packages,source-import-types,native-source-expressions` through the combined runner. The source-expression consumer checks the complete matching saved 121-case native compiler/source report. Compiler inputs, versions and profiles are unchanged; native facts may be retained. Emit, registry, UI and browser assets are unchanged, so their existing evidence is retained.

Next required work remains visible graph reconstruction/validation, native signatures and declaration context, IR/pack/inspector wiring, exact Code-panel/native proof and import/edit/persist/reimport browser acceptance. This shared core does not admit a new language adapter or finish the eight-language objective.
