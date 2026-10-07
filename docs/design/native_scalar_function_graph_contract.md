# Definition-owned scalar function graph checks

Rust/C++/GDScript `analyzeNativeScalarFunctionGraph` reconstructs a bounded native header from the actual Function Define properties, then validates its visible entry/parameter/return body graph. Authored native types, canonical types and stable parameter slots must agree; declaration and entry symbol owners and language must match. Exact parameter ports and return/flow/data edges are required. Inline defaults/returns, missing or duplicate slots/IDs, incorrect edge roles/types and orphan constructs reject.

Verified bodies currently cover parameter-identity returns, exact-type graph-owned constant returns and empty void/unit completion. Constants use the existing saved-node/edge native reconstruction; serialized cached facts cannot replace it. Unknown return conversions, expressions combining runtime parameters, mutation/control/effects and wider types remain explicit body-contract prerequisites. A valid header cannot make an unsupported body valid.

Saved JSON tests cover the identity/empty cases from the independently compiled header corpus. The Rust mutable-parameter source is intentionally excluded from identity-body comparisons because its assignment changes the returned value; it requires native assignment mapping. Mutations cover declaration/entry ownership, return types, slot deletion, poisoned inline values, orphan statements and corrupt flow/data wiring. Returned signatures/facts are transient and immutable. Empty-body syntax and actual emit/source spans remain subject to Code-panel/native/browser acceptance.

This batch also fixes scalar header checks that could equate missing authored/native types and accept inherited C++ alias-table properties. Missing names and malformed type identity now reject explicitly.

Validate `packages,source-import-types` through the combined runner, then compare retained unchanged native-signature evidence with the current source consumer using `--reuse-native`. Compiler inputs/profiles are unchanged. Registry, IR, packs, emit, inspectors and browser acceptance remain unwired for the new scalar functions: graph admission stays blocked. The full eight-language scope remains active.

## Subsequent integration checkpoint

Identity/unit bodies now have actual saved-graph project analysis, IR/pack emission, exact Code-panel goldens and independent native compilation. The earlier analysis-only checkpoint above remains historical. Graph/source import-admission flags do not certify a lifecycle. Constant expression emission and wider runtime bodies remain open. See [the graph emission contract](native_scalar_graph_emit_contract.md).
