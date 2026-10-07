## Local mutation integration checkpoint (October 6, 2026)

The predefined compound/update policy now has 1,260 independent Roslyn comparison pairs across nine target integral types, eleven compound operators, runtime/constant RHS types, readonly bindings and prefix/postfix forms. It enforces binary applicability plus the native narrowing/RHS rule and shift exception; mutable reads never become constants. Source planning, saved graph checks and syntax-pack statements share the policy. Wider value domains and advanced effect/scoping/project contexts remain required. Current verification and inspector repair status are in [current_state](../current_state.md); older foundation-only claims below are historical.

# C# predefined integral value contract

October 5, 2026. Implemented pure policy, not C# source-to-graph acceptance. This extends the [C# readiness packet](csharp_reverse_import_preflight.md) under MP-08/MP-03. The full native binding, value and graph scope remains required.

## Implemented contract

`packages/graph-types/src/csharpIntegerSemantics.ts` handles the fixed predefined sbyte, byte, short, ushort, int, uint, long, ulong and char domains. These widths do not inherit Go word-size policy. Facts carry native type and optional canonical decimal constant text. BigInt is transient arithmetic only; the authored literal token remains source authority. Operations return new facts and do not persist folded values, alter operands, prove purity or execute native source.

The API covers decimal/hex/binary integral tokens and suffixes, contextual constant assignment, explicit integral conversions, predefined unary/arithmetic/bitwise operators and C#12 logical right shift. Operator applicability includes implicit constant-expression conversions instead of applying a runtime-only promotion table to constants. Default compile-time overflow is checked; explicit unchecked arithmetic/conversion wraps to the destination width. Shift counts use native masks and shifts retain their overflow policy. Runtime facts have no invented constant value or runtime-success guarantee.

Native input facts must be canonical and representable in their declared domain. Token/resource limits reject oversized or executable payloads. This is a predefined primitive policy: a binder must establish the actual native identity and selected operator before calling it. No explicit-call syntax walk or numeric fact proves that a source expression is effect-free.

## Independent evidence

The pinned C#12/Roslyn compiler harness parses, binds and emits trusted fixture libraries without loading or executing them. The 499-case corpus has 349 accepted and 150 deliberately rejected cases. Of these, 458 have integral probe descriptors. The native stage compares model acceptance, native expression/converted type, constant availability and exact constant text against compiler observations. Unexpected internal model exceptions fail the gate rather than masquerading as expected native rejection.

The matrix includes 81 runtime binary-promotion pairs, 81 runtime assignment pairs, unary and shift operand combinations, literal suffix/separator/range boundaries, constant-dependent operator selection, explicit checked/unchecked casts at every fixed type boundary and constant arithmetic/shift overflow cases. Parenthesized negative literals are separate from direct token negation. `csharpIntegralContract.test.ts` also checks the retained native evidence; the combined runner generates native evidence before tests that consume it.

Two important observations are retained explicitly. Roslyn accepts runtime-valued division by constant zero in the tested profile; compiler acceptance does not guarantee runtime success. A magnitude above UInt64 produces native lexical diagnostic CS1021 although the WASM grammar recognizes the token structurally. Inventory records grammar completeness only and retains the entire source. The integral token contract rejects the oversized value; future source acceptance must invoke this contract rather than trusting CST recognition. Direct minimum-value negative literals, including the tested hexadecimal/binary forms, use the pinned compiler's result type; parentheses remain distinct authored syntax.

Current verification: 2,000 package + 1,113 web tests pass, together with the native stage, lint and production build. Unchanged browser/Pages/host/server/golden gates retain preceding evidence. There is no C# saved-graph mutation, Code-panel roundtrip or import-acceptance evidence yet.

## Required integration and remaining policy

1. Bind source and edited saved graphs to the same native policy. Keep expression, converted and declaration types distinct; recompute constant facts from visible operands and declaration ownership after edits/reload/provenance removal.
2. Add visible native type/signature and checked-context ownership with IR, inspector and print templates. Preserve casts, overflow contexts, operator syntax and original tokens. Never replace source expressions with the transient computed constants.
3. Resolve scopes, declaration timing, readonly bindings, namespaces/aliases, overloads and exact project/reference identities. User-defined operators/conversions/getters require explicit effect and evaluation ownership.
4. Implement the remaining required value policies: floating/decimal domains, UTF-16 string/character tokens, Boolean/reference/nullable/enum values, native-sized integers, generics/dynamic and context-sensitive expressions. Current fixed integral facts cannot substitute for these domains.
5. Integrate complete graph mappings, actual Code-panel output, inspector invalid-edit/recovery, projects/dependencies and persistence/conflict-aware reimport. Advanced constructs and representative composed projects remain part of the full goal.

Research references: [Microsoft expressions specification](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/expressions), [conversions specification](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/conversions) and [lexical specification](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/lexical-structure). Documentation guides the policy; the pinned native observations establish this batch's bounded evidence.
