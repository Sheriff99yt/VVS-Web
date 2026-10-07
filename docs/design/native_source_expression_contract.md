# Shared source-owned constant expression trees

`analyzeNativeConstantSource` reads pinned Rust/C++/GDScript syntax trees and extracts immutable initializer and method-return expressions. Records retain owner name/kind/context spelling, exact UTF-16 expression/operand spans, syntax kinds, explicit grouping and literal/unary/binary/conversion structure. Parser trees are deleted before return; reports serialize without compiler pointers. The complete exact source and unresolved syntax inventory remain attached. No graph receipt or whole-source validity is inferred.

| Source profile | Ownership and semantic bridge |
|---|---|
| Clang/C++ grammar | Ordinary declaration initializers and explicit function returns; static_cast operands/type spelling; signed number tokens normalize to literal plus unary operator with separate spans; comments do not become operator spellings |
| Rust grammar | Const/static/ordinary local initializers, explicit returns and implicit final method operands; integer declaration/return context and typed peer inference through groups/unary/nested operators; grouped signed-minimum literal exception retained |
| GDScript grammar | Constant/ordinary local initializers and explicit method returns; int/bool conversion syntax; directly signed literals stay distinct from grouped negation for native overflow behavior |

Expression facts describe the expression before assignment. C++/Godot initializer/return context is retained without inventing an assigned conversion or binding value. Rust's supported integer context is checked. Named-value reads, calls/macros, closure captures, object/project scopes, conditional/dynamic effects and wider type inference remain explicit prerequisites. Closure bodies do not acquire an enclosing method's return ownership. Graph admission stays blocked even when a partial expression fact is available in a compiler-invalid file.

## Independent evidence and validation

The shared compiler corpus now has121 exact-input cases (118 comparisons/3 false assertions). Source extraction independently rebuilds the expression tree from each authored native source rather than using its handwritten semantic tree. VALUE owner/expression spans, type/value or diagnostic, complete source retention and blocked admission are checked against saved native compilation evidence. Three added method-return cases compare C++/Rust constexpr function results to their native VALUE; Godot supplies constant-expression value proof and a corresponding method type/check-only context, not observed function execution.

Two additional Rust negative/nested peer-type comparisons expose source inference contexts. Initial source tests found the C++ grammar's signed number tokens; normalization preserves the unary construct and fixes native expression facts. Group nodes, parser-owned operator tokens with comments, real diagnostic spans and source contexts are retained. Unsupported source cannot be promoted through a constant fact.

October7 evidence passes121 native compiler/source-span comparisons,3,800 package tests and pure API types. A final closure-ownership repair passes124 focused source tests without repeating unchanged suites; the preceding package pass remains distinct from that focused repair. Changed compiler inputs were run in two/three-case retries retaining matching source/command/toolchain packets. No programs execute. Previous native initialization/binding and application/Code-panel/production/Pages/browser evidence is retained; no emit/UI/assets changed.

Run `bun tools/validate_batch.ts --only=packages,source-import-types,native-source-expressions`. Select native-constants too when its input/profile changes; source-expressions consumes its complete exact-input report and skips after a freshly selected native failure. This portable stage is explicit, excluded from the default batch pending provisioning, and cannot certify visible graph acceptance.

## Next dependency group

Connect source-owned trees to native local reference/value/type/assignment and conditional/effect contracts, then implement visible declarations/returns/conditions/operators/conversions and source spans. Preserve exact authored context while adding inspector mutation/recovery, canonical Code-panel, persistence/conflict-aware reimport and project ownership evidence. All broader existing JS/Python/C#/Go gaps and Verse authoritative host validation remain on the full eight-language objective.
