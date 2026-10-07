# Agentic batch workflow

For focused typed-local lifecycle checks, select native-local-browser,native-local-pages-browser. They exercise all three ready native adapters, including invalid type save/reload/recovery and both reimport choices. Production checks restore the normal build when a Pages artifact replaced it; changed Pages artifacts require their build. Preserve exact native input reuse and distinguish focused evidence from full-suite certification. See [the local admission contract](design/native_local_source_admission_contract.md).

For a runtime-admission-only browser repair, select `native-runtime-browser,native-runtime-pages-browser`. These stages exercise the composed Rust/C++/GDScript runtime modules without repeating the established scalar browser workflows. They retain the native/source/unit prerequisites, restore a normal production build only when the current `.next` artifact requires it, and use the existing verified Pages export. Default validation excludes these native-toolchain/browser stages. Focused passes do not relabel broader historical browser failures; artifact changes still require the corresponding build.

Applies to project development and documentation work. Preserve the user's full scope, required fidelity checks and authorization boundaries. Batch size follows dependencies and reviewability; a small task can be one small batch.

The explicit `native-local-source` stage checks handwritten Rust/C++/GDScript typed local/body sequences against pinned compile-only evidence and the established initialization observations. `--retry-native-local-source=` retains exact unchanged inputs; selected changed/new cases require compiler work. The initialization consumer's `--reuse-native` verifies actual bytes, commands, profiles and current tool pins before using retained results. Source sequence facts do not enable local graph or worker admission. See [the source-body contract](design/native_local_source_body_contract.md).

## Plan once per batch

Group related roadmap items that share contracts, modules, fixtures or build prerequisites. For each batch record:

For reverse-import work, apply [the eight-language feature-wave plan](design/reverse_import_cross_language_batches.md): combine shared fixes and ready native implementations across languages, with explicit prerequisites for every remaining adapter. Do not complete languages serially by default or infer one language's semantics from another's passing tests.

At each feature batch, consider all eight languages together. Use a feature-by-language matrix to distinguish ready implementation, retained verified behavior and missing prerequisites. Compare equivalent authored examples before editing shared code, patch common infrastructure once, and include every ready language-specific correction in the same batch. A missing validator or contract for one language must not hold up independent ready work in the others. This is coordinated scope, not permission to run conflicting edits or artifact builds simultaneously.

Plan one validation matrix for the completed feature batch: deduplicate shared package/build/Code-panel checks and run each affected language's independent native checks within that consolidated run. Do not start a separate full validation cycle after finishing each language. After a failure, inspect the other languages for the same root cause before completing the repair batch; retry affected gates and prerequisites, retaining matching unchanged evidence.

- Intended behavior and acceptance criteria, dependencies and exclusions that remain on the roadmap.
- Complete edit scope: contracts, implementation, UI, fixtures, persistence/reimport and documentation as applicable.
- A deduplicated validation set with the evidence each gate must provide.

Use a concise worklist for substantial tasks; do not add planning bureaucracy to a straightforward edit. Reuse already-read project context unless new evidence requires another read. Update the plan when scope or dependencies change.

## Implement together

Finish the planned dependency group, meaningful regression fixtures and static diff review before starting expensive validation. Prepare planned documentation and generated artifacts before the build that consumes them. Group independent reads/searches and batch independent work where safe; this does not authorize spawning agents or overlapping conflicting mutations.

Do not run the full suite, build or browser matrix after each file, small fix or roadmap item. An early focused probe is appropriate only when its result resolves a specific semantic, compiler, integration or design uncertainty; state what it will decide. Do not replace independent native evidence with adapter self-comparison.

## Validate once, repair selectively

Run the affected checks as one consolidated batch, normally using `bun tools/validate_batch.ts --only=<stages>`. Use the default full batch when the change warrants its complete scope or for the final full-goal audit. Choose gates by behavior and risk, retaining every mandatory gate required by the relevant skill.

| Change | Include once in the affected batch |
|---|---|
| Native import/semantics | Pinned native evidence, saved-graph/source/package tests and relevant import/edit/reimport browser workflows |
| Shared graph/IR/emit/packs | Package tests, canonical Code-panel/golden/span checks; relevant parsing/native and browser checks |
| Web UI/integration | Web tests, lint/type/build and composed affected user workflows; Pages checks when exported behavior is affected |
| Go sidecar or VS Code host | Their build/type/tests when those paths change |
| Agent rules, skills or prose only | Structure/frontmatter, local links and diff checks; no app build or browser suite unless behavior/artifact output is affected |

A combined package stage already covers package tests; do not repeat them individually. Build each artifact configuration once and share it across compatible checks. Production and Pages write the same `.next` directory, so keep their builds and browser consumers in dependency order. Never run overlapping validation runners or rebuild while their browser checks consume an artifact.

After failure, inspect the existing log, relevant source and saved state before editing. Identify the root cause, complete the repair and retry only affected tests plus required build prerequisites. Broaden testing only when the repair changes additional behavior or leaves a concrete unresolved risk. Skip consumers of a failed/missing prerequisite instead of testing stale artifacts. Keep a live process handle and poll the same job; do not restart it because an observation timed out.

Focused C# production retries use the explicit `csharp-browser` runner stage. It is omitted from the default full suite because `browser-import` already exercises C#. Other focused commands are acceptable; accurately identify their narrower evidence.

The new C++/Rust/GDScript prerequisite packet uses explicit `native-readiness`, with pinned portable setup described in [its contract](design/native_readiness_contract.md). Until CI provisions those tools, the default batch does not include or certify this gate. Explicit selection fails rather than skipping missing validators. This is compiler readiness evidence, not graph-adapter completion.

Source-import analysis changes include the small `source-import-types` gate: it checks the pure public API without an app build. `native-types` checks the VS Code host and does not substitute for that coverage. For new local binding evidence, select `native-readiness,native-bindings` together; exact actual compiler-input hashes and native UTF-8-to-review-UTF-16 spans are prerequisites. Neither syntax nor lexical facts grant graph admission.

The explicit `native-initialization` stage combines pinned compiler contrasts and analyzer comparisons for Rust/C++/GDScript ordinary scalar locals; it is excluded from default validation pending tool provisioning. C++ warning rejection is distinct from language validity and Godot check-only acceptance does not observe runtime defaults. A traversal-only repair may reuse matching saved compiler facts through the consumer's `--reuse-native` option; changed compiler inputs/profile require fresh compiler evidence. See [the initialization contract](design/native_initialization_contract.md).

## Close the batch honestly

The explicit `native-signatures` stage verifies source-owned scalar function headers across Rust/C++/GDScript against pinned compile-only function-pointer/check-only fixtures. Native-valid unsupported headers remain unresolved; source/header facts do not certify bodies or enable graph admission. The stage is excluded from defaults pending tool provisioning. See [the signature contract](design/native_scalar_signature_contract.md).

The explicit `native-source-expressions` stage consumes the complete matching native-constants report and checks source-derived trees, exact spans/context, native type/value/diagnostic agreement and blocked graph admission. A freshly selected native-constants failure skips it. This parser/analysis-only packet retains unchanged app/Code-panel/browser gates; it does not prove named bindings, dynamic effects or visible mappings. See [the contract](design/native_source_expression_contract.md).

The explicit `native-constants` stage verifies native integer/Boolean constant operators/conversions across Rust/C++/GDScript. For a failed case, `--retry-native-constants=<language>/<case-id>` reruns selected native inputs and retains matching previous cases only after exact source/expectation/toolchain pin checks. Other retained failures still block the report. New/changed inputs must be selected or receive a full native run. The stage is excluded from default validation pending portable provisioning; it does not certify dynamic effects or graph admission. See [the contract](design/native_constant_expression_contract.md).

The explicit `native-scalars` stage combines independent constant type/value assertions with pure literal analysis for Rust/C++/GDScript. Three false-assertion calibrations must reject; Godot check-only zero-division assertions observe constant values without running source programs. Input/profile changes require fresh native evidence; model-only repair may reuse matching reports. See [the scalar contract](design/native_scalar_literal_contract.md). The stage is excluded from default validation pending portable provisioning and does not certify graph admission.

Record implemented items, new gaps, exact fresh checks, reused evidence and any remaining failures once. Evidence-only documentation updates do not trigger a second application build/browser run; if an exported document is a requested deliverable, regenerate that artifact once after finalizing its content.

A focused pass does not certify an entire failed suite. Keep full-suite failures distinct from repaired-component evidence, and never reduce the requested completion scope to whichever tests passed. Update roadmap/current-state/memory at batch boundaries, then continue to the next authorized batch without asking for redundant approval.

C++ declaration-group lifecycle uses explicit native-group-browser/native-group-pages-browser stages. Select affected shared native-local workflows in the same batch when their reader or lifecycle changes. Group admission remains bounded by the [group batch contract](design/native_declaration_groups_batch.md); no borrowed language semantics or fixture execution.

The explicit native-local-inference stage checks analysis-only inferred local contracts against pinned compile-only originals/type calibrations; --retry-native-local-inference= retains exact unchanged inputs. Godot check-only applicability is weaker than exact inferred-type evidence. This stage does not certify saved graph/worker admission; see [the inference batch](design/native_inferred_initialization_batch.md).


Native inferred deduction inspector acceptance uses explicit `native-inference-browser,native-inference-pages-browser`. These run nine source-owned workflows across C++/Rust/GDScript: import reviewed typed modules, change authored modes, edit signature/operator/literal deduction, persist invalid state, recover the return type, reload valid graphs and exercise both reimport choices. They do not admit inferred source through the worker. Test-only browser repairs reuse unchanged native/unit evidence and Pages exports; a normal production build is restored when needed. Keep central wire/history triggers and wider inference constraints distinct. See [the inference packet](design/native_inferred_initialization_batch.md).
