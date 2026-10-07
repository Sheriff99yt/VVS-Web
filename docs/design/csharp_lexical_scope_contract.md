# C# lexical scopes and overflow statement mapping

This is the next dependency group in the full reverse-import plan. Straight-line local and by-value parameter writes are already mapped. The implementation batch now adds visible scope nodes, recursive source planning/native graph environments, structured IR v15, pack/sink output, generic overflow-context inspector editing and scope-aware comparison/reimport. Verification results belong in current_state; grouped declarations, definite assignment and unreachable source regions remain separate required contracts.

## Source binding contract

The integral binder reports immutable `scopes` and `references` alongside its existing binding and initializer observations. A parameter scope owns the method parameters. Every method body and nested block has a source-stable scope ID, parent ID, method ID, source span, authored kind and effective overflow context. Checked/unchecked scope spans include the keyword. Declared binding IDs retain their own declaration space; references resolve a binding ID in the consuming scope rather than copying a name.

Plain assignment records a write, while compound/update targets record a read and write. Their RHS reads remain separate occurrences. Checked expressions can override the effective context of a reference without creating a lexical declaration space. Scope records and references remain analysis evidence; they cannot issue acceptance receipts or become the persisted editable authority.

The source reservation pass includes later declarations in each enclosing block, so a child cannot reuse an ancestor's later name. Sibling blocks can reuse names with distinct binding IDs. Mutable values never acquire constants after writes. Bare returns in value-returning methods are invalid, including inside nested blocks.

## Required visible mapping batch

1. Add one visible lexical-block node per authored ordinary/checked/unchecked block, with body execution and continuation pins. Introduce a structured IR statement that owns the braces, optional overflow keyword and nested statement source maps. A sequence node does not establish lexical scope.
2. Plan nested statements recursively with lexical environments and globally unique local IDs. Preserve grouping as a separate declaration contract; do not split grouped source into independent declarations. Preserve keyword and block structure in source comparison and reimport.
3. Replace the flat native graph walk with recursive ownership validation. Pre-reserve each declaration space, isolate child locals on exit, allow writes to visible ancestor locals/parameters and reject sibling/escaped references, multiply owned bodies, cycles and hidden operands. Derive every fact from visible graph nodes without source provenance.
4. Carry checked/unchecked context through initializer, mutation and return inference. Return inside a terminal nested block must propagate its binding environment and context. Detect continuation after a guaranteed return; unreachable source needs its own visible region contract instead of silently dropping it.
5. Infer nested declaration inspector edits in the actual consuming scope. Expose block context editing, recover from invalid overflow edits, preserve selection, symbol indexes, persistence and conflict-aware reimport.
6. Verify fixed saved graphs and increasingly composed original/regenerated compiler fixtures, canonical Code-panel output and spans, source comparison, provenance removal, malformed ownership, and production/Pages edit/reload/reimport workflows in one affected validation batch.

## Evidence boundaries

`test/csharpScopeCases.ts` adds independent Roslyn/source-binder comparisons for nested constants, sibling reuse, later ancestor reservation, parameter shadowing, checked/unchecked statement and expression overrides, overflow, readonly updates, missing return values and ordered grouped initializers. These exercise the native binding prerequisite; they do not certify graph mapping, definite assignment, unreachable regions or full C# support.
