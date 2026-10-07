# Source-owned runtime scalar trees

`packages/source-import/src/nativeRuntimeSource.ts` builds immutable Rust/C++/GDScript expression trees from pinned parser nodes and resolved ordinary function parameter declarations. The tree retains exact UTF-16 expression, parameter-read and declaration spans; grouping, authored operator spelling and conversions remain visible source constructs. Parameter slots come from matching lexical binding declaration spans to the reviewed function header, never from a name guess.

The analysis preserves full source/hash/syntax inventory and header diagnostics. Single ordinary return expressions and Rust final values are observed; discarded Rust expressions, unsupported bodies/calls and unresolved parameter reads retain diagnostics. Constant-only bodies belong to the existing constant-source contract. This analysis is not an atomic whole-module validity decision, graph snapshot or worker acceptance receipt.

Runtime result types derive from actual parameter types and the shared native operator policy. Constant islands are evaluated only when they contain no parameter read. Rust literal inference follows visible parameter peers, authored suffixes/casts and return context. Parameters remain unknown values. Result facts distinguish short-circuit evaluation but do not prove runtime overflow/division/effects or assigned-return conversion validity.

The shared binding inventory now traverses Rust `as`, C++ `static_cast` and Godot scalar `int`/`bool` conversions to retain operand parameter reads. Arbitrary calls remain unresolved; shadowed Godot conversion names reject. Conversion traversal is lexical ownership evidence, not a general native call-resolution contract.

## Evidence

Three handwritten modules contain nine ordinary functions: nested two-parameter arithmetic, grouped comparisons/logical conditions and explicit Boolean-to-integer conversions. Source tests check all parameter declaration targets, slots, exact spans, frozen trees, source/hash retention, Rust contextual literal range and discarded values. Invalid parameter edits retain diagnostics and no type fact.

The combined batch passes4317 package tests and public source-import types. The native gate now contains75 compiler checks:69 exact unchanged operator/type contrasts are retained, and6 new original composed modules/unbound-reference rejections are compiled fresh. Compiler/profile/hash/actual input bytes are verified; no fixture programs execute. Initial checks exposed a missing pure-context export and missing conversion traversal in all three binding inventories; affected gates were repaired together. No application/emit behavior changes or runtime browser admission are claimed.

## Next dependency work

Materialize these source-owned trees into visible parameter/operator/group/conversion graphs, then connect reviewed function/project ownership to runtime graph reconstruction. Verify original/generated/edited canonical Code-panel bytes and source maps under each pinned native profile. Preserve authored operator spelling and Rust inference without hidden conversion insertion. Coordinated signature/body port transactions and actual production/Pages lifecycle checks are still required before source acceptance expands. Existing JS/Python/Go/C# broader semantics/projects and Verse authoritative access remain required by the complete objective. See [the full dependency batch](native_runtime_expression_batch.md).
