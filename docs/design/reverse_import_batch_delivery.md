# Reverse-import batch delivery

Project-wide timing, gate selection and retry rules are defined in [the shared agentic batch workflow](../agentic_batch_workflow.md). The approved eight-language master plan remains the full scope. This delivery rule groups edits and validation; it does not reduce completion requirements.

## Batch workflow

1. Prepare native contracts, representative composed fixtures, ownership/IR/UI changes and acceptance criteria together. Resolve design dependencies before mapping additional syntax.
2. Implement the complete dependency batch, including source planning, visible graphs, inspector edits, persistence/reimport and roadmap feedback. Review the diff and finish implementation before starting validation.
3. Run one combined validation command containing each affected gate once. Shared IR/registry/emit changes include native oracles, package/web tests, canonical Code-panel/golden checks and relevant production/Pages workflows. Pure metadata updates do not trigger another application build or browser run.
4. After failure, diagnose the recorded output and saved state first. Repair the affected path and use focused tests plus the necessary build prerequisites. Repeat broader checks only when the repair changes their behavior or leaves a concrete uncertainty.
5. Record exact verification scope. Focused retries preserve prior full-suite failures; they never silently certify untested cases. The final full-goal audit still requires complete evidence across all planned language/project scope.

The combined runner supports an explicit `csharp-browser` production repair stage. It is excluded from the default full batch because `browser-import` already covers C#. Selected commands report their own exit status while retaining previous failures in the ledger. Exported Pages checks remain separate evidence.

## Next dependency batches

The user's cross-language direction now takes precedence over the older language-by-language ordering below. Use [the eight-language feature batches](reverse_import_cross_language_batches.md): plan one feature across all eight profiles, implement ready shared work and native adapters together, then validate the affected language set once. A language with unmet native prerequisites retains concrete prerequisite work in that same feature wave; it is never silently dropped or certified from another language's tests. Finish already-started edits coherently before switching waves.

| Batch | Implementation scope | Consolidated proof |
|---|---|---|
| C# declarations and mutable scopes | Grouped declaration ownership/ordered initializers, nested block scopes, assignments and explicit versus implicit void completion; source, IR, inspector, persistence/reimport together | Pinned compiler/binding pairs, fixed graphs and mutations, exact Code panels, composed browser edit/reload/conflict workflows |
| C# calls and control/evaluation | Same-class overload identities, ordered nested/statement calls and control-flow ownership; extend prerequisite native value domains where needed | Independent symbol/type/compiler evidence, effect order/count fixtures, saved-graph mutation and composed UI/project checks |
| C# wider native domains and project closure | Remaining types/members/operators, nullability, cleanup/suspension, namespace/reference/compilation units and remaining master-plan rows; divide into dependent implementation batches | Native project evidence plus source fidelity, editing, persistence, conflicts and relevant host/context checks |
| Remaining language closure | JS/Python/Go gaps and GDScript/Rust/C++/Verse readiness packets, native semantics/bindings, graphs and full project integration | One coherent validation batch per implemented dependency group; unavailable validators/access remain explicit prerequisites |

The C# local-style foundation is implemented and verified. Larger batches should extend it without rechecking unchanged foundations at every intermediate edit. Increasingly complex examples remain the discovery mechanism; ready gaps join the current implementation batch and prerequisite gaps retain roadmap entries.

## C# plain assignment checkpoint

Plain local `=` assignment is implemented and verified across native source/graph contracts, typed Set pins, pack printing, fixed saved-graph mutations, sealed reimport and actual production/Pages RHS invalid/recovery workflows. The affected proof passes 690 native cases and 2662 package tests, production/Pages builds, canonical Code-panel and exported checks; prior web/lint evidence is reused. Fresh failed prerequisites now skip dependent runner consumers. The declaration/scopes batch stays open for grouped ownership, nested scopes, compound/update and parameter writes, assignment expressions and unreachable regions. All wider language/project scope remains required.

## C# native mutation expansion

IR v14, shared mutation policy, source planner/structural comparison, Set pin ownership, C# pack rows, inspector choices and fixed/source/browser fixtures were implemented before the affected validation batch. Independent native evidence passes 1962 observations, including 1260 mutation pairs. A stale standalone-update unsupported assertion was repaired without repeating native checks; actual browser inspection then exposed the registry prefix Boolean schema gap, which was corrected with a schema regression and focused production/Pages prerequisites. Remaining grouped/nested/checked scopes, parameter writes, cross-arity rewiring, effectful expressions, calls and project scope are retained in the roadmap. Final outcomes are in current_state.

## C# parameter ownership checkpoint

Parameter writes now bind visible function/overload/parameter slots through source plans, Set nodes, native graph checks, IR output, inspector retargeting, signature rename/deletion, persistence and reimport. Implementation/fixtures were completed before the consolidated affected checks. Import/type repairs used focused web/build/browser prerequisites without repeating unchanged native/package gates. The final affected evidence passes 1982 native cases,3835 package/web tests and production/Pages edit/reload checks plus lint/host-type/goldens/Code-panel/parse. Grouped/nested/checked scopes, definite assignment, unreachable regions, cross-arity rewiring, effectful expressions and ref/out/in modes remain in the declaration/evaluation scope; all wider language/project requirements stay active.

## C# lexical scope prerequisite checkpoint

Completed source scope/reference ownership, return-value diagnostics and 15 increasingly nested/grouped native probes before one affected batch: csharp-native, packages, web and native-types. All pass (1997 native,3852 package/web tests); unchanged emit/browser gates were not repeated. Nested graph admission remains blocked on the recursive visible-node/IR/inspector/lifecycle contract in csharp_lexical_scope_contract.md. No narrowed full-language completion claim is made.

## C# visible scope checkpoint

Implemented recursive source plans, visible block ownership and IR15/context printing before affected validation. Initial native/package failures were fixture/test-gate mistakes; focused repairs reused green web/lint/type/golden/Code-panel/parse evidence and reran failed native/package plus build/browser prerequisites. Final production/Pages context editing and reload pass;2007 native and3859 package/web tests. Full browser-import historical failure remains separate. Grouped declarations, definite assignment, unreachable regions and all wider scope remain active.

## C# initialized group checkpoint

Implemented shared declaration ownership/IR16, recursive binding and exact span printing, atomic inspector projection, composed native/source cases and saved graph before affected validation. Failures exposed general flow initialization traversal, stale rejection assertions and a frontend/core document type mismatch; repairs reused passing gates and reran only affected checks/prerequisites. Production/Pages shared type/style/readonly and invalid/recovery/save-reload pass. Final evidence:2021 native,3867 package/web tests and affected build/browser/emit gates. Uninitialized/definite assignment, unreachable regions, membership/split-merge/trivia and all wider scope remain open.
