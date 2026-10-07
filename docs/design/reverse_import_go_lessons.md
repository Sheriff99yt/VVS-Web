# Reverse-import delivery: lessons from Go

## Follow-up cross-language lessons (October 6)

The [local binding packet](native_local_binding_contract.md) adds independent C++ target/span checks and Rust/GDScript contrast probes. Similar source shapes require separate native scope policies: Rust shadowing begins after the initializer, C++ declarators before it, and Godot rejects active ancestor/parameter shadowing. Do not infer those rules from a passing Go fixture.

Hash actual compiler input bytes, not only the logical source string. Explicit UTF-8 reads and LF writes now prevent Windows code-page/newline conversion from weakening source identity and byte-to-UTF16 evidence. Require immutable lexical identities and the pure `source-import-types` gate before value/effect contracts and graph admission. The 66-case source check, 30 lexical cases and 23 direct Clang targets prove the bounded packet; Rust/GDScript still lack a claimed native source-reference API and full-language scope remains open.

Updated October 5, 2026. This is the implementation sequence for the remaining reverse-import master-plan work. It supplements [the master plan](code_visual_master_plan.md), [adapter research](code_visual_adapter_research.md) and the [canonical coverage inventory](../../packages/source-import/planning/coverage-plan.json). It changes delivery order, not the approved eight-language scope. The checklist below is planned work unless a linked implementation/test proves otherwise.

## What Go established

The verified Go subset now has 124 ordinary and four word-context source/generated fixtures, 741 independent native observations and 134 compiler-checked fixture pairs. These prove bounded contracts, not full Go coverage. The useful result is a list of failure classes to address before another adapter starts accepting source.

| Observed issue | Evidence in the repository | Rule for subsequent work |
|---|---|---|
| A generic number pin loses native width, exact magnitude and typed/untyped identity | `goIntegerSemantics.ts`, `goRationalSemantics.ts`, `goValueSemantics.ts`; integer/rational/conversion/constant native probes | Establish native types, token storage, constant facts, contextual typing and representability before wiring declarations/operators. Pin shape alone cannot prove compatibility. |
| The destination can change expression typing; declarations can round constants | `goValueSemantics.ts`, `goScalarValidation.ts`, fixed `native-go-constant.fixture.json` | The same pure semantic contract must check source plans and edited saved graphs. Recompute transient facts from visible operands; do not persist folded values as source authority. |
| Syntax/type-check success can disagree with compiler acceptance | `validate-go-native.ts`; four retained shift-count divergence guards | Use independent compiler evidence as well as parser/type evidence where available. Retain disagreement cases and explicit guards until the contract is resolved. |
| Eager graph call placement cannot prove conditional ownership | `go-short-circuit-call` in `goUnitCorpus.ts`; visible expression placement and `expressionCallValidation.ts` now cover the Go subset | Model effect ownership and evaluation regions before accepting effectful short-circuit, conditional, cleanup or suspended expressions. A branch-shaped replacement must preserve the authored construct and evaluation count. |
| Imported provenance can conceal missing graph scope checks | `controlFlowValidation.ts`; persisted graph tests remove provenance and reorder declarations | Scope, binding and declaration visibility must remain valid after save/load, inspector edits and provenance removal. Source receipts are metadata, not a validation exemption. |
| Filtering diagnostic names omitted a real scope error | `graphToIr.ts` now consumes every blocking control-flow diagnostic; `LOCAL_NOT_INITIALIZED` regression | Share structured blocking diagnostics across review, graph analysis and code generation. Do not gate correctness on a naming prefix. |
| A full-file signature and function preview could disagree | `classModule.ts::emitFunctionTab`; native owning-definition tests | Home, function and exported-file Code panels must use the same visible native signature and owning file context. |
| Inspector failure could become an unhandled asynchronous preview rejection | `useProjectTranspileResult.ts`, `CodePreviewPanel.tsx`; invalid constant type/recovery browser workflow | Current errors must block output/copy and be visible; retired jobs must not publish results or failures. Test invalid edit, repair and reload. |
| A successful local fixture says little about package context | Package constants, groups/iota, aliases, receivers, imports/build context remain recorded gaps | Include a composed multi-file/context fixture in the design before claiming an adapter stage covers projects. Implement binding ownership before enabling acceptance. |

Evidence paths in this table are relative to `packages/graph-types/src`, `packages/source-import/src`, `packages/source-import/test`, `packages/source-import/scripts`, `packages/transpiler/src`, or `apps/web/src` as appropriate. The [current implementation state](../current_state.md) records the exact verification batch.

## Reuse boundaries

Reuse browser worker loading/cancellation, review receipts, atomic acceptance, persistence, conflict-aware re-import infrastructure, visible node ownership, registry-driven inspector fields, source mapping and the combined runner. Those are shared mechanisms, with language/context regression evidence still required.

Reuse exact integer/fraction operations only when their mathematical operation and resource bounds fit the target contract. Go's default types, typed/untyped constants, shift rules, rounding/context resolution, string rules and implicit assignability are Go policies. Do not copy them into C#, Rust, C++, GDScript or Verse under a common Number label. Generic pins remain UI categories; native facts carry semantic identity.

Keep the shared boundary small: native context, binding identity, expression facts, evaluation ownership and structured diagnostics. Start with concrete policies and compare the next adapter against Go before extracting a broader interface. A universal evaluator, arbitrary source execution or cross-language translator is not required for reverse import.

## Preflight packet for every language

Prepare these together before the first new source construct is accepted:

1. **Pinned context:** language/dialect version, grammar revision/runtime compatibility, validator version, word/target model, flags and project/reference/host context. Record unavailable components explicitly.
2. **Native oracle:** a non-executing harness for trusted fixture syntax, binding/types and compiler acceptance where available; normalize only documented formatting differences. Add its stage to the combined runner. Missing semantic/compiler evidence is not replaced by matching the adapter to itself.
3. **Semantic tables:** literals and encodings; native type identity/inference; constant versus runtime expressions; operator result/promotion; assignment versus explicit conversion; contextual typing; mutation/readonly; failure/overflow behavior and limits. Include positive, negative and boundary observations.
4. **Binding model:** file/package/type/function/block scopes, declaration timing, shadowing, captures, aliases, overload/receiver resolution and dependency identities. Specify which context edits invalidate a review receipt.
5. **Evaluation model:** order and multiplicity, short-circuit/conditional regions, call effects, cleanup, return/break/continue, suspension and language-specific ownership/failure obligations. Name any missing graph/IR construct before enabling the source syntax that needs it.
6. **Visible representation:** owner node, property/pin layout, source span, symbol index, inspector edit consequences, IR record and native print template for each accepted construct. Original source and transient inferred facts cannot emit hidden declarations or conversions.
7. **Project and fidelity model:** compilation-unit layout, paths/manifests/dependencies/host signatures, trivia/directives, stable IDs, save/load, authored additions and three-way re-import conflicts.
8. **Representative project:** one mixed-feature source unit and one multi-file project exposing the language's difficult interactions. Design these first; split implementation into coherent dependency batches. Unsupported regions must retain source and actionable diagnostics.

Readiness states remain **researched → implementation-ready → implemented → verified**. A packet with unresolved contracts is researched, even when its parser loads. Every acceptance claim links the supported feature/context row to native, fixed saved-graph, Code-panel and relevant browser evidence. This checklist is a delivery gate; it is not yet an automated completeness audit.

## Language-specific questions to settle early

These are preflight requirements and stress-fixture plans, not claims that the adapters implement them. Current official references guide research; the selected validator/profile must subsequently be pinned and tested.

| Language / workstream | Decide before broad mapping | Composed fixture planned before implementation |
|---|---|---|
| JavaScript | Native Number/BigInt/coercion, truthiness, lexical timing, capture identity and conditional effects | Closure inside a loop, short-circuit effectful call and a module dependency changed during graph edits |
| Python | Integer/float/string/container facts, function-wide binding, captures/default evaluation, exceptions and cleanup | Closure with default/captured state, conditional assignment and context-manager cleanup across early return |
| Go | Package/member scopes, group identity and omitted initializer/iota semantics, defined type versus alias, dependency/build context, conditional calls | Package constants used across files, nested constant groups, type/alias conversion and conditional call; preserve remaining numeric gaps |
| C# | Numeric promotions, constant conversions, checked/unchecked context, nullable state, overload resolution and assembly references | Constants plus mixed numeric operators, nullable/overloaded calls and cleanup across early return in a referenced project |
| GDScript | Typed versus dynamic bindings, integer/string/container identity, engine-owned names, resource paths and signal/await context | Typed script plus resource/script dependency, signal connection and suspension; validate in a controlled Godot project |
| Rust | Type inference, literal suffixes, overflow/context, place/value identity, moves/borrows/lifetimes, traits and macro/crate context | Borrow-sensitive helper plus match/early return, generic call and a separate module; classify macro obligations explicitly |
| C++ | Target/flags, promotions/conversions, overloads, value categories/lifetime, evaluation obligations, includes/templates/preprocessing | Two translation units with headers, overloaded/template call and cleanup across return; retain source constructs alongside expansion evidence |
| Verse / UE6 | Authoritative version/grammar/validator access, failure contexts and effects, rollback, concurrency and exact host API profile | Failable condition with state changes, suspension/concurrency and host dependencies in the available native validation context |

C# numeric promotion and constant/conversion rules are documented in the [C# expressions specification](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/expressions). Rust's [expression rules](https://doc.rust-lang.org/stable/reference/expressions.html) and [operator rules](https://doc.rust-lang.org/reference/expressions/operator-expr.html) make evaluation/overflow an explicit research area. Godot's [versioned GDScript reference](https://docs.godotengine.org/en/4.2/tutorials/scripting/gdscript/gdscript_basics.html) documents value/reference and native integer distinctions. These references justify the questions; they do not select or verify new adapter versions.

C++ native checks need compilation context; [Clang LibTooling](https://clang.llvm.org/docs/LibTooling.html) documents syntax-only tooling with a compilation database. Verse's [official glossary](https://dev.epicgames.com/documentation/fortnite/verse-glossary) documents failure/effect and concurrency concepts. Neither reference establishes that the required toolchain is integrated in this workspace.

## Revised implementation sequence

**Batch A — shared evaluation and binding contracts (MP-03/MP-04 with MP-09 evidence).** Specify effectful expression regions and graph ownership first, including ordered calls, short-circuit/conditional operands, scope after provenance removal and changed native context. Implement the required shared IR/graph contract with JS/Python/Go examples and fixed saved-graph mutation checks together. Keep already-reproduced conditional-call gaps blocking until this batch is verified. Exceptions/cleanup/suspension remain required follow-on contracts; short-circuit completion does not complete MP-04.

**Batch B — Go package/type completion groundwork (MP-09/MP-06).** Design visible package constants, grouped declarations with omitted initializer/iota, defined types/aliases and cross-file binding together. Implement them in dependency order with shared exact facts and declaration ownership. Do not flatten a group into independently evaluated numeric literals or substitute a defined type with its underlying type. This is the next Go delivery batch after the relevant contracts are established.

**Batch C — remaining adapter preflight (MP-08/MP-10/MP-11/MP-12/MP-13).** Build the packets above and native validator harnesses before enabling syntax. C# now has a pinned native oracle with 41 checked cases; its [readiness packet](csharp_reverse_import_preflight.md) records the exact profile and observations. Browser grammar integration and native value/binding/effect contracts remain open. Research the other profiles in the same coherent preparation batch rather than discovering their basic contracts after acceptance starts. No new chats or agent delegation is implied.

**Batch D — complete adapter vertical slices.** For each prepared language, implement native values/bindings, visible graph/inspector, source maps, actual Code-panel output, projects/dependencies and save/re-import together in related stages. Select batches by completed prerequisites and language-specific risk. Follow with advanced/native constructs and the representative projects already planned. C++/Rust lifetime/macro obligations and Verse failure/concurrency obligations are first-class scope, not features to defer indefinitely.

**Batch E — composed conformance and release audit (MP-14/MP-15).** Increase complexity and expand deterministic boundary/adversarial fixtures after the contracts exist. Audit every required grammar/context row and every deliverable against evidence. Passing corpus counts are not a language completion percentage. External toolchain/access gaps stay visible and prevent claims they would have proved.

## Decisions before the next language batch

Each batch starts with a reviewable contract matrix, not a list of syntax forms. For each feature, record the native context, inferred/declared/converted type distinctions, binding owner, evaluation order and multiplicity, visible graph representation, invalid-edit behavior and independent expected observation. Include implicit effects such as C# accessors and conversions. A syntax walk with no explicit calls does not establish purity.

Design the composed unit and multi-file fixture before implementing the feature mappings. Combine boundary values, shadowing, conditional effects, changed context and early exits where relevant. The fixtures expose contract interactions; isolated examples remain useful for identifying the failing contract. Unsupported valid source stays retained and enters the roadmap with its missing prerequisite and reproducer.

Classify failures before patching: native-invalid input, valid but unsupported construct, source-parser mismatch, semantic-policy error, missing visible representation, project-context gap, persistence/reimport error or deployment failure. Fix a shared mechanism when evidence shows a shared failure; implement native policy separately when language rules differ. Small ready fixes can join the current batch with regression evidence. Larger gaps become explicit prerequisite batches rather than ad hoc syntax patches.

The first concrete application is C#: its 41 native cases establish differences in numeric promotion, constant conversions, UTF-16, nullable flow, overload resolution and implicit effects. Browser inventory is next, followed by value/binding/effect contracts and visible mappings. Parsing alone cannot enable graph acceptance. GDScript, Rust, C++ and Verse still need their own pinned native packets before acceptance work.

## Combined verification gate

Define the fixture matrix before coding: isolated contract, composed unit, project context, invalid source, edited saved graph, context change, conflict re-import and browser error/recovery. Use native observations to distinguish an unsupported valid construct from invalid source. Test boundary combinations systematically instead of adding only the last failing example.

Implement each coherent batch first, then use `bun tools/validate_batch.ts` once to collect the stage results. Repair grouped root causes and rerun affected stages together. Do not repeat passing unrelated stages or run per-item validation loops. Browser checks follow a normal production build; Pages export has its own deployment asset/workflow gate. Pure planning changes require inventory/link consistency checks rather than application test reruns.

Complex examples remain essential feedback. Their role is to stress an explicit semantic model and identify missing contracts before broad acceptance, while retaining regressions against already-verified behavior.

## Applied shared preflight

`packages/source-import/src/expressionEvaluation.ts` implements call occurrence/dependency and nested conditional ownership analysis over all current typed expression variants. The initial Go parser/materializer guard used this analysis; current Go imports instead establish visible expression ownership. Non-Go eager materialization retains the preflight, and remaining-language conditional-call acceptance still needs its policy integration. The current_state validation entry records evidence. This is the first implementation step of Batch A, not completion of expression effects or MP-04.

## Applied Go ownership integration

Go value calls now use visible expression placement, with one owning path and no execution pins. Conditional calls are accepted after native/compiler, fixed graph, inspector/browser and conflict-aware reimport evidence. Existing CallExpr printing is reused. Shared preflight remains available for other languages; their ownership policy integration, cleanup/suspension and broader scope remain open. See current_state for the 18-stage verification batch.
