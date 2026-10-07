# C# source binding contract

Verified October 6, 2026. This is an analysis-only subset; C# graph acceptance remains unavailable.

`packages/source-import/src/csharpBindings.ts` binds predefined fixed-integral parameters, initialized locals, constant locals, nested blocks and ordinary static same-class calls. It distinguishes mutable values from constant expressions, reserves declaration spaces before resolving reads, checks reads before declaration and illegal shadowing, selects supported overloads, records call order and preserves checked/unchecked contexts. Source spans identify analysis records; they are not durable reimport identities.

The implementation uses the C# integral policy rather than Go promotion or scope rules. Independent pinned Roslyn observations compare initializer expression/converted/declared types, exact constants and selected call parameter signatures. They do not yet compare complete compiler symbol identities. Unsupported domains remain explicit and retain source.

The native corpus has 539 cases: 374 compiler-valid and 165 rejected, including 458 integral policy pairs and 494 source binding pairs. Four compiler-valid cases expose remaining domains: numeric comparison/Boolean results, Unicode identifier identity, overloads with floating-point candidates and a user-defined type named var. These remain required work, not compiler errors. Local functions and mutation forms also remain outside this subset.

Normal and Pages browser workflows show binding diagnostics, contextual constant assignment, illegal nested shadowing and overflow-context recovery. The browser performs subset analysis, not full native compilation. The batch passes 2,540 package and 1,153 web tests, native validation, lint (99 existing warnings, zero errors), production/Pages builds, browser imports and artifact checks. Unchanged host/server/Go/golden gates retain preceding evidence; all 19 ledger gates are green.

Next integrate typed bindings, overflow context and call ownership into visible saved graphs, IR, native printing and inspector edits. Add actual Code-panel comparisons, graph mutation/reload and conflict-aware reimport. Complete namespaces/types/fields, aliases/reference closure, full symbol identity, remaining value/effect domains and control-flow validity. No purity or runtime success follows from a constant or successful compilation.

The delivery order follows [Go lessons](reverse_import_go_lessons.md): pinned native profile and oracle, semantic contracts, visible graph ownership, composed projects and conformance. Expand composed examples after the contracts exist, and retain every reproduced gap in the roadmap.

## Visible signature foundation verified

C# static class method signatures now have explicit fixed-integral parameter/result records on Function Define. The signature path uses C# pack templates, retains exact widths through binding refresh and prints case-sensitive/escaped parameter names. Integral identity-return bodies use the shared C# assignment policy, so narrowing edits block generation. Other expression/body domains need native graph contracts before this signature mode accepts them. This does not enable C# source acceptance.

A fixed saved graph covers all nine integral types, definition/header/body source ownership, function-tab output, JSON reload, invalid edits and recovery. The native runner compiles its generated class using the pinned Roslyn profile without executing it. Signature inspector controls expose the reviewed types; dedicated browser editing coverage is still required. The native corpus now has 540 cases (375 accepted/165 rejected); 2,545 package and 1,153 web tests, native/type checks, lint and production build pass. Production/Pages browser and artifact workflows pass. See current_state for unchanged preceding gate evidence and remaining verification.

## Integral expression graph extension

[The IR v12 integral graph contract](csharp_graph_integral_contract.md) now connects exact C# literal/operator/cast/parentheses/overflow facts to visible return expressions. Twenty-five generated expression/native fact comparisons and original-class compilations pass. Locals, calls, broader statements and source acceptance remain open; see current_state for final browser/batch evidence.
