# C# branch control-flow contract

This analysis prerequisite extends the existing integral binder; it does not admit branch graphs or claim full C# flow support. Integral comparisons and composed predefined Boolean conditions retain transient type/constant facts. Visible source expressions must remain intact when mapped; facts must never substitute folded conditions or remove unreachable source.

The [C# definite-assignment specification](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/variables#9446-if-statements) defines assignment at joins over the paths that reach them. Each alternative starts from an independent copy of incoming state. The join intersects assignment across reachable alternative endpoints; a return contributes no endpoint, and a missing else contributes the unchanged incoming state. Constant conditions restrict reachable alternatives. Unreachable statements still require native type, readonly and declaration-space checks; reads at unreachable points are vacuously assigned. Mutable values never acquire literal constant facts merely from an assignment.

The source report records immutable per-statement spans, lexical/method ownership, entry/end reachability, assigned binding IDs and optional condition facts. Embedded statements retain the enclosing lexical scope; authored blocks own their distinct scopes. Dead statements and their read/write references remain represented. Method bodies with a reachable value-result exit produce a missing-return-path diagnostic. Undefined external names remain unsupported pending binding/project closure, rather than claiming complete compiler validity.

Independent pinned Roslyn probes cover all nine integral operand widths with six comparisons, Boolean operators, constants/exact wide values and runtime facts. Composed source cases cover sibling isolation, missing alternatives, early returns, constant versus mutable conditions, nested merges, scope reservations, short-circuit reads, unreachable reads and dead-code type errors.

## Mapping and remaining prerequisite batch

- Native Boolean graph/IR/pin facts, exact comparison/logical nodes and spans now have a bool-return method consumer under [the Boolean graph contract](csharp_boolean_graph_contract.md). Integrate those facts with branch conditions/joins; Boolean locals/parameters and calls still require their own signature and value-domain contracts.
- Map explicit if/else and authored lexical blocks, preserve absent alternatives and embedded-statement spelling, derive joins from visible flow and expose condition/branch editing.
- Retain unreachable regions visibly after terminal statements and constant branches; do not silently omit them or treat their reads as reachable failures.
- Prove exact Code-panel output, saved-graph condition/edge/ownership mutations, acceptance, conflict-aware reimport and production/Pages editing/reload.
- Extend analysis/mapping to loops, break/continue/goto, conditional/effectful expressions, switch/pattern bindings, exceptions and ref/out state. Side effects in conditions require explicit evaluation order and true/false assignment states; this prerequisite only analyzes side-effect-free conditions over integral bindings.

These items remain in the full eight-language objective. Fresh analysis evidence and historical mapping evidence must be reported separately.
