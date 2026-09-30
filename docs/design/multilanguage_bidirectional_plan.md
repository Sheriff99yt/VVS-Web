# VVS: all-language bidirectional compatibility plan

Prepared 30 September 2026. Status: proposed next architecture and delivery plan, with a separate second-pass principles review. This document extends the approved reverse-import plan; it does not implement or publish code.

## 1. Outcome and honest compatibility contract

VVS should support source → visual graph → source and visual graph → source → visual graph for every registered language, including future languages, through versioned capabilities and independently checked semantic contracts. The goal is complete coverage of each declared supported profile, growing toward broader language coverage without silently changing programs.

“A to Z and Z to A” has three distinct meanings:

| Route | Required guarantee |
|---|---|
| Same-language source → graph → source | Preserve the supported program's bindings, types, evaluation order, control flow, effects and environment obligations. Formatting may normalize under an explicit policy. |
| Graph → source → graph | Preserve the graph's semantic projection, including declarations, roles and dependencies. Coordinates and incidental IDs need not match. |
| Language A → graph → language B | Allowed only when the destination supports the source semantic profile, or an explicit visible adaptation has been reviewed and validated. Two individually supported languages do not imply arbitrary translation between them. |

Full compatibility is a measured result for language/version/mode/environment/construct variants. It is not a promise to translate every arbitrary program, preserve its exact formatting, or prove general program equivalence. Unknown cases block acceptance or export for the affected closed unit. Preserving unsupported source is preservation, not successful visual conversion.

## 2. Verified baseline and evidence

Current default-branch files inspected for this plan:

- [README](https://github.com/Sheriff99yt/VVS-Web/blob/main/README.md): eight generation targets, local-first architecture and package boundaries.
- [Implemented reverse-import milestone](https://github.com/Sheriff99yt/VVS-Web/blob/main/docs/design/reverse_import_milestone.md): UI-free `@vvs/source-import`, separate validation entry point, three full-file JavaScript fixtures, independent Acorn/projection/mutation checks and deterministic materialization. File blob SHA: `7b440a3733bbe13984aa3095b393a4bf8fab747a`.
- [Importer public entry](https://github.com/Sheriff99yt/VVS-Web/blob/main/packages/source-import/src/index.ts): existing reusable seam.
- [Rosetta golden script](https://github.com/Sheriff99yt/VVS-Web/blob/main/packages/syntax-packs/scripts/generate-rosetta-goldens.ts): existing goldens extract bodies/imports; keep them and add full-file evidence.
- [Visual-to-text fidelity](https://github.com/Sheriff99yt/VVS-Web/blob/main/docs/visual_to_text_fidelity.md): canvas declarations, visible semantic operations, no hidden runtime or coercion, explicit function/event roles.

Also read the complete saved `VVS_Reverse_Import_Plan.md`. The implementation milestone supersedes its baseline where appropriate. No claim is made here that the full repository test suite or deployment was rerun.

Today: generation exists for Python, JavaScript, C++, Verse, GDScript, Rust, C# and Go. Reverse import is experimental JavaScript ES2022 script-mode plain-class import, with explicit existing entry-role consent. Standalone functions, modules, other import languages, workers and re-import remain open. Current JavaScript restrictions deliberately reject dynamic arithmetic/truthiness and unsupported context. Existing generation also has honest unsupported capabilities; generation support is not bidirectional certification.

## 3. Principles that every language must satisfy

1. Canvas is the accepted program's authoring authority. Symbol tables index; source provenance is immutable history, not a second editable program.
2. Every semantic declaration, conversion, import, allocation, callback registration and adaptation must have a visible graph correlate. No artificial class, invented entry, hidden helper runtime or invisible async wrapper.
3. Share contracts and stable construct identifiers; keep parsing, recognition, printing and independent expected evidence separate.
4. Source meaning takes precedence over superficial syntax similarity. Numeric operations, truthiness, exceptions, ownership and scheduling are language-specific until equivalence is established.
5. Import is deterministic, local and non-executing. No AI guessing, regex template reversal or uploaded-code execution authorizes acceptance.
6. Unsupported, ambiguous and unvalidated are distinct states. Parser recovery cannot authorize conversion; an unavailable validator cannot yield a pass.
7. Accept dependency-closed units atomically. Never convert an isolated statement whose scope, control or external dependencies cannot be represented.
8. Preserve exact original files, hashes and spans. Generated text fidelity and original-byte preservation are separate guarantees.
9. Existing generator/import behavior stays usable throughout incremental migration. New infrastructure cannot force all languages to wait for the most complex adapter.
10. Coverage reports are evidence-backed and versioned. A common node name or green snapshot alone is insufficient.

## 4. Architecture and dependency boundaries

| Layer | Owns | Must not own |
|---|---|---|
| Language/profile registry | Language ID, grammar/compiler versions, source modes, environments, capabilities and validator requirements | Importer algorithms or editor state |
| Shared graph semantic contracts | Node/options/pins, declarations, type/effect obligations, scope identities, persistence versions | Per-language parser ASTs or test expected answers |
| Source adapter per language | Parse, diagnostics, full-file context, normalized spans/tokens, binding/type facts with evidence | Graph/editor mutation or lifecycle inference by name |
| Reverse mapping adapter | Structural matching and semantic preconditions; supported/unsupported/ambiguous outcomes | Printer-template inversion or arbitrary coercion |
| Transient import plan | Closed compilation units, dependency obligations, origins, mapping versions and review receipt | Persisted parallel canonical program |
| Materializer | Ordinary visible graph, deterministic symbols and wiring, isolated transactional candidate | Parser-specific tree traversal or wall-clock identity |
| Existing analyzer/IR/printers | Validate and generate using public graph contracts | Importer dependency or source guessing |
| Validation coordinator | Compose import, generation, independent tools and semantic projections | Supply the expected answer from the implementation under test |
| Rosetta/test corpus | Canonical graphs, full files, handwritten programs, expected facts and mutations | Production source recognition |
| Editor integration | Review, diagnostics, cancellation and explicit acceptance | Private semantic rules or hidden conversions |

Preserve the current UI-free importer root and separate validation entry. Extend narrow public contracts before moving code. Generate must work without loading any importer. Language adapters should be lazy-loaded and version-pinned; browser use must not require a remote host. Large WASM parsers may run in workers where justified. Measure bundle, startup, parsing and memory costs before choosing tools.

Do not rebuild the existing transpiler IR as a universal AST. Add missing semantic capabilities only after confirming a faithful visible representation and reviewing existing targets. Source ASTs terminate at the adapter; typed import plans cross the materializer boundary.

## 5. Versioned language and mapping contracts

Each language profile records language ID, grammar/dialect version, file extensions, source modes, compilation-unit rules, target/toolchain version, runtime/environment, parser adapter version, span encoding, semantic variants, import/export/translation capabilities and evidence requirements.

Each reverse mapping records stable ID/version, AST shape, contextual preconditions, scope/binding/type requirements, source spans, target kind/version, options/pins/edges, effect/evaluation-order requirements, dependency obligations, rejection codes and independently maintained fixture IDs. Match results remain supported, unsupported or ambiguous. Multiple matches need disjoint preconditions or explicit ambiguity; registration order must not choose meaning.

Binding identities are assigned before uses are wired. Use declaration and body passes where needed for recursion, forward declarations and overloads. Dynamic or external resolution is never asserted as statically known without evidence. Preserve receiver semantics, aliasing, short-circuit evaluation and ordered effects.

Span contracts specify UTF-16, byte or code-point offsets per parser and convert explicitly to the review format. Original bytes and encoding are retained when file-based input exists. Test non-ASCII characters, CRLF and multibyte offsets. Grammar versions are explicit, never inferred solely from file extensions.

## 6. Compilation units and graph capability inventory

Before expanding syntax, define visible representations for files/modules/packages, standalone functions, class/struct members, imports/exports, declaration/definition separation, entry policy and external signatures. Ordinary library functions cannot require an `on_start` method or synthetic class.

Inventory these families across all eight languages, without assuming they already exist in VVS:

- Literals/types: integers, floats, strings, booleans, null/nil/None, aggregates, ranges and special values.
- Expressions: arithmetic, comparison, conversion, short-circuiting, conditional expressions, indexing and member access.
- Bindings: scope, mutability, initialization, assignment, destructuring, shadowing and captures.
- Functions: signatures, defaults, variadics, return forms, recursion, overloads, closures and callable values.
- Flow: branches, loops, switch/match, break/continue, return and deferred cleanup.
- Structure: modules/packages, classes/structs/interfaces/traits, inheritance and generics.
- Effects: errors/exceptions/results, I/O, async, concurrency, lifecycle and event registration.
- Native features: memory/ownership/borrowing, macros/preprocessing, reflection, annotations and environment APIs.

Classify every gap as missing importer mapping, analyzer/generator limitation, missing portable core, language extension, environment adapter, unresolved external dependency or ambiguity/out-of-scope. A language keyword does not automatically justify a new shared node.

## 7. Current-language workstreams

The following are planned semantic investigations, not claims of implemented import coverage. Exact parser/compiler choices require a maintained-version and browser-feasibility evaluation during implementation.

| Language | Context to model | Critical boundaries | Independent validation target |
|---|---|---|---|
| JavaScript | Script/module, strictness, lexical bindings, functions/classes | Number/BigInt, coercion, truthiness, receiver, hoisting, closures, promises | Second parser plus bounded trusted behavior fixtures |
| Python | Modules, indentation, functions/classes, imports | Arbitrary integers, truthiness, scope, late binding, generators, exceptions, decorators | Pinned CPython parse/compile checks and trusted fixtures |
| C++ | Translation units, headers, declarations/definitions, build flags | Preprocessor/macros, overloads, templates, lifetime, value categories, UB, integer overflow | Pinned compiler frontend with explicit include/build context |
| Verse | Modules, types, function/effect context and environment | Failure contexts, effects, concurrency and engine APIs | Available official toolchain/environment; absence recorded as unvalidated |
| GDScript | Script/class, engine version, annotations/signals | Variant operations, engine lifecycle, resources, await and signal binding | Pinned Godot parser/headless checks with explicit environment |
| Rust | Crates/modules, items, traits/impls, imports | Ownership/borrowing, moves, lifetimes, macros, Result, generics | Pinned rustc/cargo checks on controlled fixtures |
| C# | Compilation units, namespaces, types, references | Value/reference types, overloads, properties, delegates/events, async, generics | Pinned compiler/Roslyn checks and trusted fixtures |
| Go | Packages/files, imports, declarations and receivers | Multiple returns, interfaces, nil, pointer/value receivers, defer, goroutines/channels | Pinned Go parse/type/build checks and trusted fixtures |

No full compatibility badge is allowed when required context or a mandatory toolchain gate is unavailable. Verse can advance parser/mapping work while remaining explicitly uncertified at the unavailable gate. Real projects requiring includes, packages or framework references must supply a deterministic local context manifest; never auto-fetch or execute build hooks during import.

## 8. Capability ledger and compatibility decisions

Key each record by construct + semantic variant + language/version + source mode + environment + graph schema version. Record forward generation, reverse import, independent syntax/type evidence, behavior evidence, persistence coverage, source fidelity and cross-target portability separately.

Use states planned, blocked, implemented-unvalidated, validated, not-applicable and unsupported. Every validated record links positive and negative fixtures, toolchain configuration, expectations and last successful revision. Report missing evidence explicitly; do not convert skip into success.

Translation uses source-required semantics against destination-supported semantics, including whole-program dependencies and environment obligations. This is not just intersection of node names. Return compatible, requires-visible-adaptation, blocked or unvalidated, with reasons and affected nodes/spans. Any adaptation requires an explicit graph change and new validation. Numeric overflow, division, Unicode, exceptions, ownership and scheduling must not change silently.

## 9. Rosetta reuse and independent validation

Keep current extracted goldens as forward syntax regressions. Add full-file suites through the real generator. Classify all existing seeds for all eight language profiles, including concrete rejections, then extend beyond Rosetta with handwritten cases.

For each enabled capability, run:

1. Source → parse/context → plan → graph → analyzer → full generated files → independent validation → approved structural/semantic comparison.
2. Fixed canonical graph → full source → import → independent semantic graph projection. Ignore only IDs/layout; preserve declaration ownership, scope, options, types, effect order and dependencies.
3. Persistence: accepted graph → save/load/normalize → Generate, preserving semantics, mapping versions and provenance.
4. Trusted checked-in behavior cases: known results, side effects, exceptions and relevant scheduling/lifetime facts. Isolate, bound and pin tools. Never run uploaded user source.
5. Mutations: branch polarity, operand order/operator, symbol binding, dropped import/declaration, changed receiver, reordered effect, wrong numeric variant and ownership/async changes must fail the relevant gate.

Expected facts are handwritten or independently derived, not produced by the importer/printer under test. Golden regeneration requires reviewed intent. Identical ASTs are a conservative gate for supported same-language subsets, not universal equivalence; valid syntax alone cannot establish fidelity.

For cross-language cases, use a shared independent semantic expectation where meaningful and language-specific expectations for exceptions or native effects. Do not compare AST shapes across languages. Test all eight profile registries continuously; stage the 56 ordered cross-language pairs by certified capability families. Unsupported pairs must return a correct blocker rather than disappear from coverage reports.

## 10. Acceptance, provenance and source preservation

Mandatory runtime acceptance gates: clean parse; complete nonoverlapping classification; supported closed unit; resolved obligations; valid ordinary graph; visible source ownership; full-file regeneration under approved comparison; persistence/provenance retention; sealed source/config/graph receipt; atomic explicit acceptance.

Comments, formatting, directives, annotations and preprocessing need separate policies. Semantic comments/directives cannot be discarded as trivia. Retain originals exactly; classify whether comments can be reattached and disclose generated formatting differences. Keep unsupported code outside the accepted unit as provenance with clear excluded-output boundaries. An opaque source placeholder cannot count as visual compatibility or portable translation. Never splice unsupported code into export unless a separately designed boundary contract proves context and order.

Candidate construction remains deterministic; timestamps belong at save boundaries. Source edits, target/version changes, context changes or graph edits invalidate review. Existing projects and original files are not overwritten by import. Re-import/merge and simultaneous source/graph editing require a later conflict design; bidirectional conversion does not itself provide live synchronization.

## 11. Performance and operational constraints

Retain current conservative JavaScript limits until measured changes justify updates: 128 KiB source, 32 methods, 512 nodes, depth 64, 16,384 AST objects, 32 diagnostics and 1,500 ms analysis budget. These are baseline limits, not universal suitability guarantees.

Add worker lifecycle, hard termination, cancellation and stale-result rejection before broad parser rollout. Synchronous time checks cannot interrupt parsing. Measure source bytes, parse time, peak memory, graph nodes, diagnostics and worker startup per adapter; use language-specific budgets with consistent failure semantics. Multi-file closure expansion has its own limits. Cancelled or failed workers cannot commit partial candidates. Offline import remains available for locally bundled capabilities; CI-native validators certify releases rather than becoming a mandatory cloud import service.

## 12. Delivery sequence and completion gates

| Stage | Deliverable | Exit gate |
|---|---|---|
| 0. Baseline audit | Current contracts, fixtures, generation/import capabilities and eight-language inventory | Existing JS behavior retained; gaps and evidence missingness explicit |
| 1. Profile/ledger foundation | Versioned language adapter contract, separate forward/reverse/translation states, dependency checks | All eight languages registered; future adapter can register without dispatcher forks |
| 2. Compilation-unit design | Visible module/package/function/entry and dependency contracts | No artificial wrappers; graph/analyzer/generator/fidelity changes validated across existing targets |
| 3. Common subset pilots | JS standalone functions plus contrasting Python and one static-language pilot | Each pilot passes scope, full-file, negative, independent and persistence gates |
| 4. Eight-language adapter foundation | Parsers/context adapters and smallest honest supported units for remaining targets | Every target has usable certified subset or explicit evidence blocker; no fake complete badge |
| 5. Broader construct families | Bindings/calls/control, then types/modules/errors/native features in dependency order | Each construct enabled only with its complete per-language evidence |
| 6. Cross-language certification | Compatibility planner, visible adaptations and ordered pair tests | Portable subset passes independent expectations; unsafe pairs block |
| 7. Product hardening | Review UX, worker cancellation, version migrations, full save/reload/edit/Generate flows | Browser integration and performance budgets pass; diagnostics explain exact limitations |
| 8. Continuous expansion | Future languages and new language/toolchain versions | Same admission gates; regression coverage retained; certifications invalidated when semantics change |

Worker infrastructure can progress alongside stages 2–4; it is a prerequisite for exposing heavyweight parsers, not a reason to defer current conservative JS improvements. Stage 3 chooses its static-language pilot from the stage-0 evidence and toolchain availability; no unsupported assumption chooses it now.

For each slice: specify semantics, classify gaps, implement visible graph capability if needed, implement independent import mapping and printer support, add complete evidence, wire review UI, verify persistence, publish, merge after required green checks, then separately verify post-merge/deployment. Follow the user's standing direct-merge preference; use a PR only if repository policy/workflow requires it. This planning request does not initiate implementation or publication.

## 13. Future-language admission checklist

A new language must supply: unique ID; version/source-mode/environment profiles; parser/context adapter and exact spans; semantic differences inventory; reverse mappings; forward printer support; graph capability decisions; full-file Rosetta cases; handwritten/negative/mutation fixtures; independent syntax/type/behavior evidence as applicable; preservation/persistence tests; budgets/cancellation; coverage ledger; UI diagnostics; and migration policy.

Generation-only admission is allowed and labeled generation-only. Import-enabled admission requires validated reverse subset. Cross-language certification is separate. Avoid adding new language IDs to scattered switches; registry validation and build tests must detect missing integration hooks. Toolchain updates or mapping/schema changes invalidate affected certificates until rerun.

## 14. Second-pass principles review

This is a separate design review of the draft above, not a code test or independent-agent audit.

| Risk checked | Resolution incorporated | Remaining implementation obligation |
|---|---|---|
| “Full support” conceals restrictions | Coverage is per version/mode/environment/variant, not language checkbox | Generate truthful reports from the ledger |
| Circular self-validation | Separate recognition/printing and independent facts/tools/mutations | Verify gates catch deliberately wrong programs |
| Shared core becomes lowest-common-denominator | Portable core plus explicit native variants/extensions | Review core additions against all targets |
| Existing IR distorted to fit source ASTs | Transient typed plan before ordinary materialization | Maintain dependency and schema tests |
| Hidden wrappers/dependencies | Visible module/function/import/entry design precedes expansion | Prototype the canvas and export ownership |
| Language A import implies Language B export | Whole-unit semantic compatibility planner | Block coercion, lifetime and scheduling mismatches |
| Full-file scope omitted by goldens | Retain goldens and add complete compilation-unit suites | Audit actual full-file outputs per target |
| Toolchain absence becomes a green skip | Explicit unvalidated status blocks certification | Especially verify available Verse evidence |
| User source executes during validation | Only trusted repository fixtures run in controlled CI | Enforce no runtime execution/import side effects |
| Unsupported fragments accepted without context | Closed-unit dependency checks and excluded-output disclosure | Test captures, macros, external bindings and control boundaries |
| Bidirectionality mistaken for live sync | Re-import/conflict handling explicitly separate | Design hashes, reconciliation and conflicts later |
| Resource checks cannot stop parser | Worker termination and stale-result isolation | Measure each browser parser before exposure |
| Future language requires a rewrite | Registry admission contract and versioned certifications | Test with a minimal adapter that adds no central special cases |

No user decision is needed to begin stages 0–2. Parser choices, pilot order and toolchain availability are evidence-gathering decisions. Any later policy that changes preservation guarantees, opaque-code behavior or automatic adaptations requires an explicit design review before implementation.

## 15. Definition of done

The architecture milestone is complete when all eight language profiles and the future-adapter contract exist; compilation-unit and semantic variant decisions are documented; coverage states are evidence-backed; package boundaries remain acyclic; and common pilots prove both round-trip directions with independent failure detection.

A language's declared bidirectional profile is complete only when every included construct passes full-file, binding/type/effect, fidelity, independent validation, negative/mutation and persistence gates, with environment/toolchain context available. Cross-language compatibility is complete only for separately certified profiles and pairs. Broad language completeness remains an expanding roadmap, never inferred from the eight-language generator or agreement between importer and printer.
