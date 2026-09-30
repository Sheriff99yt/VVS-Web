# Reverse import milestone: stages 0–3

Implemented 30 September 2026 against the reviewed architecture plan. The original class-import baseline remains the migration reference; standalone/module-function design is **stage 4**, and general U93 remains open.

## Ownership and contracts

`@vvs/source-import` is a local deterministic TypeScript package. Its root entry exports parser adapter, typed plans, scope/binding analysis, reverse mapping registry, transactional materializer and capability inventory. It imports no React, Next, editor stores, Rosetta harness, or generator. `@vvs/source-import/validation` separately coordinates the existing analyzer and full-file generator. Generate has no importer dependency. Shared function/event binding construction now lives in `@vvs/graph-types`; editor helpers delegate to those public semantic APIs.

Babel parses and reports exact UTF-16 ranges. A parser receipt freezes the original source/hash/classification; recovered parse errors cannot authorize mapping. Coverage is exhaustive and nonoverlapping. The accepted unit is one complete script-mode plain class with parameter-only closed bodies. Module context, directives, embedded comments and unresolved captures are rejected. Source elsewhere in the file remains immutable provenance and is explicitly excluded from generated output.

Mapping contracts carry stable IDs/versions, language/version/mode/environment, structural shapes, preconditions, target kinds/versions and pin/edge rules, failures, dependency obligations and evidence. Parameter identities are assigned per method scope before any uses are wired. Expression/statement registry resolution checks all structural matches and rejects ambiguity independent of registration order. Typed plans retain spans and resolved read obligations; no parser AST reaches the graph builder.

Materialization produces ordinary canvas nodes, compatible pins, edges, symbol indexes and body documents in isolation. Existing entry role requires explicit user consent for an existing ordinary `on_start`. No role is inferred solely from a name. Full source/hash/file/range and mapping version persist on Class Declare; generated nodes retain source-origin spans. The accepted snapshot is the sole editable graph authority, with no persisted parallel AST/import plan.

## Deliberate semantic tightening

The original baseline mapped `a + b` through numeric Math pins even though JavaScript permits strings, objects and BigInt. The migrated importer accepts arithmetic only when both operands are provably Number literal trees. Unknown parameter arithmetic and string concatenation are blocked with `JS_DYNAMIC_OPERATOR`. Boolean-literal terminal if/else is accepted; dynamic truthiness is blocked with `JS_TRUTHINESS`. Identity/parameter returns remain supported. No casts, type annotations or wrappers are invented. This narrows the experimental subset without claiming new syntax support; the dialog example and regression fixtures reflect the correction.

Numeric spelling/quote style/parentheses/locations and harmless EmptyStatements may normalize. Operators, literal values, method/static options, parameter bindings, directives and control structure must match. Unary `-0`, dynamic arithmetic, unsupported strict/loose comparisons and escaping drift reject; generated parsing is never allowed to recover errors. Math expression trees retain JavaScript Number evaluation order without constant folding. Cross-language equivalence is not promised.

## Acceptance gates

1. Exact source coverage, clean parser receipt, script unit and explicit mapping consent.
2. Scoped binding closure and supported/unsupported/ambiguous structural mapping.
3. Registry kind/version resolution, ordinary strict graph analyzer and visible Declare/Define consistency.
4. Generated source ownership for every executable node and declaration. Function Entry signature is owned by Function Define; paired JavaScript Declare is an index declaration with no separate executable statement.
5. Real `transpileProject` full-file output independently parsed without recovery, then conservatively compared with selected-source AST. AST equality is not a general semantic proof.
6. JSON save/load normalization preserves source provenance, symbol/option/pin/edge meaning and regenerated syntax.
7. Acceptance checks an exact sealed review, original source SHA-256, filename and role configuration, then returns a fresh copy. Source/options/graph changes require a new review. The dialog prevents changing mapping inputs while acceptance is pending; closing cancels the handoff.

Limits: 128 KiB before parse, 32 methods, 512 graph nodes, depth 64, AST budget 16,384 objects, 32 parser diagnostics and 1,500 ms analysis budget. Depth/object traversal is iterative before recursive mapping. Time checks detect an exceeded synchronous operation; they cannot interrupt the parser. Worker termination, hard timeouts and generalized cancellation remain stage 6. A parser stack failure rejects without an acceptable candidate.

## Independent evidence

`packages/syntax-packs/rosetta/full-file/` contains three explicit class/entry/function graph fixture units: literal parameter return, static arithmetic and terminal branch. The test harness composes public graph/generator/import APIs, using checked-in node/edge specs and handwritten expected semantic facts. It does not derive expected graphs from importer output. Existing 112 Rosetta body/import goldens are unchanged.

`packages/source-import/test/semanticProjection.ts` independently reads declarations, member order, static options, parameter bindings, operand order and branch/control/data edges. It ignores generated IDs/layout. Both S→G→S and G→S→G compare to fixed semantic facts. Acorn separately checks complete files using ECMAScript 2022 script grammar and its own AST; no native-parser availability skip can hide failures.

Mutation tests swap branch polarity, replace an operator, bind a read to another parameter, and omit a visible Declare. Structural or analyzer gates must reject them; the independent semantic projection also detects changed meaning. Ordered external effects in either order fail the mapping gate; current supported bodies contain no effects to reorder. Negative tests cover captures, shadowing, receivers, directives, modules, defaults, async, negative zero, parser recovery, limits, stale source/config/graph and ambiguous mappings.

## Capability inventory and next work

The concrete matrix is [`IMPORT_CAPABILITY_GAPS`](../../packages/source-import/src/capabilities.ts). Each record is keyed by construct + JavaScript ES2022 + script mode + no environment + semantic variant. It carries the smallest example, intended meaning, current graph/generator evidence, gap category, blocker and roadmap track. Tests require classification of every existing Rosetta seed; handwritten gaps cover dynamic arithmetic/truthiness, negative zero, escaping, standalone scope, inheritance, comments, directives and equality.

Rosetta is only a shared specification/test corpus. Production parsing never imports fixtures, matches templates or runs generated/user code. No user source is executed or sent to an external service.

Next: stage 4 module/function compilation-unit design without invented lifecycle; stage 5 scoped locals and resolved calls; stage 6 worker/cancellation lifecycle; stage 7 additional language adapters. No overwrite, reimport, source synchronization, arbitrary source acceptance, translation, AI guessing or project dependency resolution ships in this milestone.
