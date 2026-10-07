# Graph-owned runtime scalar expression reconstruction

`packages/graph-types/src/nativeRuntimeGraphs.ts` reconstructs scalar runtime result types from saved expression nodes, actual edges and a reviewed native entry/parameter context. It never assigns dummy values to parameters. Returned facts retain unknown values, frozen visited-node/parameter inventories, result domains and nested short-circuit evaluation. Graph admission remains blocked until definition/project ownership, source mapping, emission and lifecycle gates are connected.

The reader checks the entry symbol/language and exact parameter output slots against authored/canonical types. Operand reads require actual entry handles or expression result handles. Native node forms/arity/kinds, result domains, ordered input ports, edge types, duplicate identities, cycles and budgets are checked independently of cached evidence. Inline operands and expression graph bindings reject. Operator applicability/result types use the previously native-verified runtime type contract.

Constant islands remain actual constant graphs. They use the existing literal/type/value checker only when the saved subtree contains no parameter reads. Rust inference follows visible parameter peers, suffixes/casts and reviewed return context; out-of-range literals and conflicting serialized hints reject. Dynamic parameter operands never acquire compile-time values. Parentheses retain their graph node and inherit the operand type, while nested logical operators retain short-circuit classification.

## Evidence

The44 handwritten runtime operator cases now also pass saved-graph reconstruction tests across C++/Rust/GDScript, including native-invalid variants. Additional mutations cover foreign entry owners, hidden inline values, poisoned domains/hints, missing/execution handles, wrong edge types, duplicate operands/nodes and cycles. Rust mixed parameter/constant comparison tests verify peer inference and edited out-of-range/poisoned literals. Grouped Boolean expressions retain both parameter identities and nested short-circuit evidence.

Combined validation passes4313 package tests and public source-import types. The69 pinned native type contrasts were retained after matching actual source bytes, expectations, compiler commands and toolchain hashes; zero compiler inputs needed recompilation. No application/UI or emit behavior changed in this dependency packet, so production builds/browser suites were not repeated. These checks establish the pure reader, not whole-function or source acceptance.

## Next integration

Connect reviewed definition-owned function bodies to this reader, then materialize exact source-owned parameter/operator/group/conversion graphs and validate result/return contexts. Lowering and pack printers must preserve authored operator spelling, operand order, expression source maps and Rust contextual literals without injecting hidden conversions. Coordinate signature edits across symbols/entry/Return ports and wiring. Before admission expands, compile original/generated/edited Code-panel outputs and verify affected production/Pages import/edit/save/reload/conflict-reimport workflows. Runtime effects/control, wider types/projects and Verse authoritative access remain in the full objective. See [the coordinated batch](native_runtime_expression_batch.md).
