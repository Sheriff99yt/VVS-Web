## Native inference editing recovery (October 7, 2026)

Recovery-oriented flow inspection now separates structural ownership from strict native body validation. C++/Rust/GDScript declaration-mode edits can retain unrelated invalid assignment/constant/body semantics while independently checking selected initializers and every preceding inferred type mirror. Strict generation still rejects those invalid bodies; malformed flow and stale inferred widths reject atomically. Four added web regressions cover all three languages, invalid JSON reload/recovery, input immutability and stale preceding inference. Verified: 4,371 package and 1,331 web tests, public API types, lint (99 existing warnings), production and Pages builds, C++ group workflows and local workflows for all three native adapters in both artifacts. C++/Rust browser cases additionally switch to inference during a readonly-assignment error, persist/reload the invalid graph, and recover mutability. Native Code-panel checks verify all 98 exact unchanged inputs with zero recompilation; unchanged inference/local-body/initialization and golden/extraction evidence remain retained. A review-driven stale-mirror guard extended the initial passing checks, followed by an affected consolidated retry. No fixture programs execute. Automatic deduction reconciliation after initializer/operator/parameter edits, inferred worker admission, wider language/project contracts and authoritative Verse access remain required. Historical broader browser/docs failures are unresolved; this packet does not certify the full suite or full goal.

## Native authored mode transactions and inspectors (October 7, 2026)

Typed/Inferred mode transactions and collapsed inspectors now coordinate C++/Rust/GDScript locals and entire C++ groups, including child selections. Inference derives from actual initializer wiring without the previous declaration type as a hint; unsupported Rust constraints and GDScript inferred constants reject atomically. Typed conversion preserves incompatible body wires for recovery. Combined 4,371 package tests, 1,327 web tests, public API types, lint (99 existing warnings), production and Pages builds pass. Native Code-panel checks pass 98 inputs: 13 fresh and 85 exact retained. Production and Pages local workflows for all three languages and the C++ group workflow pass mode switches, active inferred-mode save/reload, invalid edits/recovery and both reimport choices. The final persistence-only test expansion used focused browser checks, restoring the normal production build and retaining the unchanged Pages export; compiler and unit checks were not repeated. Existing inference 28/local-body 18/initialization 45 and unchanged goldens/extraction evidence remain retained. No fixture programs execute. Automatic deduction reconciliation after initializer/operator/parameter edits, recovery-oriented flow analysis, inferred worker admission, broader language/project semantics and authoritative Verse access remain open. This is a bounded completed packet; the full goal remains active.

## Visible inferred graph/IR foundation (October 7, 2026)

Opt-in C++/Rust/GDScript inferred source graphs now retain visible authored inference modes and exact spelling instead of substituted explicit types. Saved function analysis recomputes initializer types without the declaration cache as an inference hint, checks mirrored types/ports, and shares bounded Rust fixed-initializer constraints with source analysis. C++ auto groups preserve one ordered owner and common deduction; IR v21 and language packs preserve auto/unannotated let/:= output. Ten composed disk-backed Code-panel fixtures cover chains, Boolean shadowing, C++ unsigned-char promotion and inferred groups; exact full-file goldens, node spans, normalized reload, individual renames, stale same-domain widths/foreign modes and unsupported Rust unsuffixed edits pass. Combined4,371 package/1,322 web tests, public API types, lint99, production build, existing usability goldens and canonical disk extraction pass. Native source/Code-panel85 checks pass:22 fresh inferred generated/renamed and new C++ original inputs,63 exact retained inputs. Inference28/local-body18/initialization45 are verified exact retained evidence. Initial failures were TypeScript union narrowing, wrong Rust/Godot fixture extensions and a Boolean mutation that left the type unchanged; focused repairs passed affected gates while retaining unchanged checks. No fixture execution. Public previews require inferredLocals:true; worker/sealed reviews remain unchanged and do not admit inference yet. Complete mode/deduction reconciliation, inspectors, sealed lifecycle/production/Pages workflows, forward/default/deferred contexts, broader all-eight-language scope/projects and authoritative Verse access remain open. Full goal stays active.

Continue [inference transactions and admission](design/native_inferred_initialization_batch.md).

## Native inferred-local source prerequisite (October 7, 2026)

The shared source-analysis prerequisite now distinguishes C++ auto, fixed-type Rust inferred lets and GDScript := from authored scalar types through explicit inferredLocals opt-in. Ordered bindings/references, native result types, authored inference modes, exact spans and unknown runtime values are retained. Mixed C++ auto-group deductions reject; Rust unconstrained numeric locals with later i8/i64 constraints remain unsupported rather than becoming fabricated i32 locals. GDScript initialization now recognizes := as an inference marker, while dynamic = and native defaults retain separate boundaries. Sixteen source fixtures and28 independent pinned compiler inputs pass, including C++ decltype/Rust fixed-type positive and false-type calibrations. Godot evidence covers native validity/applicability, not independent exact inferred-type or runtime-default observations. Combined4,371 package tests and public API types pass. Exact unchanged native evidence is retained:63 saved Code-panel inputs,18 local-body contrasts and45 initialization cases; no fixture execution. The initial failure exposed the GDScript initialization marker, then a diagnostic expectation was corrected to the actual BINARY_DOMAIN code. Affected retries pass. Production/Pages builds,1,312 web tests,lint99 and established group/local browser evidence remain retained; no new inferred graph/UI/worker/browser acceptance is claimed. Visible inferred declaration modes, saved recomputation, IR/packs/inspectors/lifecycle, forward constraints, deferred/default contexts, wider language semantics/projects and Verse access remain required. Full goal stays active.

Continue [the shared inference/initialization batch](design/native_inferred_initialization_batch.md), including visible graph ownership and lifecycle before admission.

## C++ declaration groups and shared local regression batch (October 7, 2026)

C++ typed initialized comma declarations now import as a visible group owner with ordered declaration children, exact binding identities and separate group/child source spans. Saved readers reconstruct actual order and initialization; IR v20 and C++ pack templates preserve authored grouping while retaining the C# contract. Coordinated group and child type/mutability edits update indexes/ports together and retain incompatible wiring for blocking diagnostics and recovery. Sealed worker acceptance, invalid-type save/reload/recovery, individual rename, valid persistence, unchanged reimport and both conflict choices pass in production and Pages. Shared typed-local workflows also pass for C++/Rust/GDScript in both artifacts. Combined 4,355 package tests, 1,312 web tests, public API types, lint (99 existing warnings), production and Pages builds pass. Native source/Code-panel checks pass all63 inputs:6 fresh C++ composed original/generated/renamed/alias/incoming/const-write-rejection checks and57 exact retained inputs. Earlier foundation compiled4 group inputs while retaining53; initial goldens/canonical disk extraction passed and remain retained. No fixture source executes. This closes only the supported C++ group packet; inferred/deferred/default bindings, membership/split/merge, conversions, broader control/effects/types/projects, existing-adapter audits and authoritative Verse access remain open. The full eight-language goal remains active.

[Group contract](design/native_declaration_groups_batch.md). Next: [inference and initialization](design/native_inferred_initialization_batch.md).

## Shared variable binding identity audit (October 7, 2026)

The shared variable lookup and synchronization audit now preserves explicit declaration/reference identity across same-name indexes. UI legacy-name lookup requires one exact matching index; core legacy case-folded name references require one matching index. Missing/empty IDs or the wrong explicit binding kind remain unresolved rather than becoming name references. Synchronizing one symbol cannot rewrite a same-name reference bound to another or missing symbol. The main document lifecycle already uses exact symbol IDs and retains that behavior. Added ambiguity, malformed JSON, foreign binding and immutable synchronization contrasts pass with4,354 package and1,309 web tests, public API types and production build. Lint99 from the initial audit batch remains retained; all53 native source/graph inputs are verified unchanged with zero recompilation. All three production local browser workflows pass, including invalid-type reload/recovery and conflict choices. Pages was not rebuilt in this audit packet; its earlier local lifecycle evidence remains bounded. This closes these shared identity gaps, not the full scope/capture/project audit or any language. Continue declaration-group ownership and native inference/initialization prerequisites across the readiness matrix; broader language/master-plan and Verse requirements remain open.

[Binding audit](design/reverse_import_binding_identity_audit.md). Next: [declaration groups](design/native_declaration_groups_batch.md).

## Native local worker admission and lifecycle verified (October 7, 2026)

Rust/C++/GDScript ordinary Library modules now admit reviewed typed initialized locals, exact binding reads, ordinary assignments and final explicit/Rust-tail returns through sealed worker preview/review/acceptance. Three composed modules/nine functions pass private seals, single-use receipts, tampered index rejection, canonical persistence and unchanged/conflicting reimport; Rust shadowing and GDScript constants also pass sealed acceptance. Actual production and Pages workflows pass all three languages: local rename, readonly/type invalid-recovery, invalid Boolean type save/reload/recovery, valid save/reload and both reimport conflict choices. The shared declaration inspector lookup now uses symbolId rather than a same-name fallback; seven current adapters have identity regression cases. Native local type edits now coordinate the structured typeRef mirror as well as the domain, declaration and reference ports. Combined 4,353 package tests, 1,307 web tests, public API types, lint (99 existing warnings), production and Pages builds pass. Native source/graph53 inputs pass:3 fresh incoming local modules and50 exact retained cases; the final type-mirror repair retained all53 with zero recompilation. No fixture programs execute. Initial browser failures exposed the missing declaration lookup and remain historical failures. C++ grouped graph declarations, inferred/deferred/default locals, assignment conversions, broader control/effects/types/projects, existing-adapter semantic audit and authoritative Verse access remain open; no full-language or goal-completion claim.

[Local admission contract](design/native_local_source_admission_contract.md).

## Native local inspector transaction checkpoint (October 7, 2026)

Rust/C++/GDScript native local declarations now have immutable coordinated name/authored-type/mutability transactions and a collapsed dedicated inspector. The transaction validates declaration/function/body/index ownership, updates only the matching variable index and visible declaration/read/write names and ports, refreshes edge type metadata only for changed source outputs, and preserves all wiring, provenance and unrelated malformed metadata. Readonly/type edits can leave blocking body diagnostics and recover through later edits. Generic variable/default/style controls are replaced for these native declarations and their selected indexes. Three composed cross-language tests cover rename, readonly/type invalid-recovery, canonical normalized reload, damaged owners, duplicate declarations, input immutability and inspector rendering. Combined4,347 package/1,297 web/public API types/lint(99 existing warnings)/production build gates pass. Native source/graph50 inputs pass:3 new normalized renamed Code-panel modules and47 exact retained cases; no fixture programs execute. Initial host checks pass and are retained for the focused type/panel repair. The initial build caught an overly broad native pin return type; it now declares its actual Boolean/number domain. A new panel effect warning was repaired without changing compiler inputs. Inspector rendering/unit transactions are not live browser evidence. Local worker review/acceptance and production/Pages edit/save/reload/conflict-aware reimport remain next; grouped/inferred/deferred locals, wider control/effects/types/projects, existing-adapter audit and authoritative Verse access remain open.

[Local transaction contract](design/native_local_transaction_contract.md).

## Native local graphs and Code-panel checkpoint (October 7, 2026)

Rust/C++/GDScript typed scalar locals now materialize as visible declarations, reads, ordinary writes and final returns through explicit localStatements:true previews. Saved graph analysis derives native types, initialization order, mutability and Rust shadowing from actual declarations and execution/operand edges; variable indexes cannot supply hidden values or types. IR v19 and pack-owned templates produce canonical Code-panel output with source maps for three composed modules/nine functions, Rust shadowing and Godot constants. The actual normalizeProjectSnapshot load path preserves emitted files and maps; a mutable-index flag mismatch was repaired to honor the existing omitted-readonly convention while retaining blocking readonly/type/owner checks. Combined 4,347 package tests, 1,294 web tests, public source-import types and production build pass. Native source/graph validation covers47 inputs: eight new local generated/edited/special modules plus39 established inputs; the final normalization follow-up retained all47 exact inputs with zero recompilation. Established75 runtime,18 local-source and45 initialization checks remain exact retained evidence; prior disk goldens/extraction and lint (99 existing warnings) remain bounded earlier evidence. No fixture programs execute. Default sealed worker acceptance for local bodies remains closed; canonical loader tests do not certify browser persistence. Local inspector transactions, worker admission and actual production/Pages edit/save/reload/reimport are next. C++ grouped graph declarations, inferred/deferred locals, implicit assignment conversions and broader all-eight-language control/effects/types/projects, existing-adapter audit and authoritative Verse access remain open.

[Local graph contract](design/native_local_graph_code_panel_contract.md).

## Native local source-body ownership verified (October 7, 2026)

Rust/C++/GDScript source analysis now retains immutable ordered typed local declarations, local assignments and final explicit/Rust-tail returns, with exact parameter/local declaration identities, expression spans, canonical native types and unknown runtime values. Three composed modules/nine functions cover successive initializers, mutable writes, Boolean conditions and explicit conversions; contrasts cover C++ grouped/own-initializer policy, Rust shadowing/discarded returns and Godot constants/shadowing. The shared AST decoder/inference also backs established runtime imports. Initialization traversal now retains reviewed conversion and Godot not operand reads. Combined 4,343 package tests, 1,289 web tests, public source-import types and lint (99 existing warnings) pass. Native validation compiled 18 fresh body contrasts and retained 75 runtime, 39 saved-graph Code-panel and 45 initialization inputs. Initialization reuse now verifies actual files/hashes/commands/profiles/current pins and diagnostic logs; the focused verification follow-up retained 18+45 inputs with zero recompilation. No fixture programs execute. This source sequencing dependency does not admit local graphs: visible declaration/read/write settings, saved order/type/initialization analysis, IR/packs/Code-panel, inspectors and worker/browser lifecycle remain next. Broader all-eight-language control/effects/types/projects, existing-adapter audit and authoritative Verse access remain open.

[Source-body contract](design/native_local_source_body_contract.md). Continue [the shared local graph batch](design/native_local_graph_batch.md).

## Native runtime worker admission and lifecycle verified (October 7, 2026)

Rust/C++/GDScript ordinary Library modules now admit source-owned parameter arithmetic, comparisons, logical conditions, grouping and reviewed explicit conversions through sealed worker review/acceptance. Three composed modules/nine functions pass single-use receipts, private seals, JSON persistence and unchanged/conflicting reimport tests. Actual production and Pages runtime browser workflows pass all three languages: return-type invalid/recovery, invalid literal recovery, literal/operator edits, save/reload and both conflict choices. The overlay repair adds accessible panel close controls; browser selectors close the current inspector and use the actual searchable operator menu. Combined4323 package/1289 web/public-host types/lint(99 existing warnings)/production+Pages builds pass. Native source/Code-panel39 inputs pass:6 fresh operator/incoming modules and33 exact retained inputs; no programs execute. Final focused native-runtime-browser/native-runtime-pages-browser passes retain the verified Pages export and unchanged native/unit/build evidence. Historical broader native-browser/native-pages-browser failures remain failures and are not relabeled. Wider locals/control/effects/types/projects, existing-adapter gaps and authoritative Verse access remain open; no full-language or overall completion claim.

[Runtime admission contract](design/native_runtime_source_admission_contract.md). Next: [shared local declaration/body graphs](design/native_local_graph_batch.md).

## Native signature project transactions verified (October 7, 2026)

Rust/C++/GDScript native definition inspectors now apply immutable coordinated symbol/definition/entry/Return/call-port edits through the project lifecycle. Wires/provenance persist; incompatible edits block, matching Boolean parameter/return edits recover, and unrelated malformed edge metadata is retained. Selection/view loss was repaired; persistence checks respect active-function Code-panel scope. Combined4320 package/1286 web/API-host types/lint(99 warnings)/production+Pages builds pass. Native source-graph33 checks include3 fresh actual Boolean edited modules and30 exact retained inputs. Focused production/Pages all3 imports, Boolean signature/output/port save-reload, literal recovery and both reimport choices pass. Final missing-overload/duplicate-owner guard repair reran affected package/web/API/build gates with unchanged valid native/browser evidence retained; broad historical suites are not relabeled. Runtime worker acceptance, wider language semantics/projects/effects and Verse access remain open. See [the transaction contract](design/native_scalar_signature_transaction_contract.md).

## Runtime modules and canonical Code-panel output verified (October 7, 2026)

Rust/C++/GDScript complete ordinary runtime modules now materialize through explicit runtimeExpressions analysis previews into registry-versioned visible projects and canonical Code-panel output. Nine functions retain authored headers, stable IDs, parameter/operator/group/conversion wiring, Return/expression source maps and JSON persistence. Exact full-file goldens and literal invalid/edit checks pass. Combined4320 package/1283 web/public-host types/lint(99 existing warnings)/production build pass. Native source-graph30 checks pass:9 fresh original/generated/edited runtime modules and21 exact retained scalar/calibration/role cases. No fixture execution. Default sealed source/worker review remains scalar-only; runtime lifecycle admission and coordinated native symbol/body/port edits remain next. Broader eight-language semantic/project/effect scope and Verse access remain required. See [the Code-panel contract](design/native_runtime_code_panel_contract.md).

## Runtime graph materialization and function ownership verified (October 7, 2026)

Rust/C++/GDScript source-owned runtime trees now construct visible expression graphs with actual parameter slot wiring, ordered operands, exact node/edge origins and cloned entry documents. Entry ownership/types/ports, collisions/budgets/cycles and saved runtime reconstruction are checked; no parameter values or frozen literal hints are invented. Definition-owned scalar function analysis now integrates runtime parameter expressions and blocking project diagnostics while preserving constant/identity/orphan checks. Nine composed functions pass graph/JSON/Return ownership tests. Combined4320 package/1280 web/API types pass;75 runtime/source native contrasts and21 established scalar Code-panel checks are retained by exact inputs/commands/toolchain pins with zero recompilation. Newly generated runtime Code-panel output and browser admission are not yet verified. Complete module/registry/IR/packs/Code-panel/native edited output, coordinated inspectors and lifecycle remain next; broader eight-language/project/effect/Verse scope stays active. See [the materialization contract](design/native_runtime_materialization_contract.md).

## Native runtime source ownership verified (October 7, 2026)

Rust/C++/GDScript now expose immutable source-owned runtime expression trees with exact spans, resolved parameter declaration slots, authored grouping/operators/conversions, unknown values and native result typing. Shared binding inventories now traverse reviewed Rust as/C++ static_cast/Godot int-bool conversions rather than losing operand references; arbitrary calls and shadowed Godot conversion names remain unresolved. Three composed modules/nine functions and unbound edits pass source tests. Combined4317 package/API types and75 native checks pass:6 new original/unbound compiler fixtures,69 matching retained contrasts. Missing public pure-context export and conversion traversal were repaired together. Source graph materialization, definition/project/IR/pack/Code-panel and coordinated inspectors/browser lifecycle remain required before runtime acceptance; full eight-language control/effects/types/projects/Verse scope stays active. See [the source contract](design/native_runtime_source_contract.md).

## Native runtime graph reconstruction verified (October 7, 2026)

Rust/C++/GDScript saved runtime scalar expressions now reconstruct native types from actual entry parameter slots and operand edges, without dummy parameter values. The pure reader verifies ownership/ports/domains/hidden operands/cycles/budgets, retains nested short-circuit facts, and checks real constant islands with visible Rust peer inference.44 native-case graph checks plus ownership/value-edit mutations pass; combined4313 package tests/public API types pass.69 unchanged native contrasts are retained after exact byte/expectation/command/toolchain verification with zero recompilation. This is a graph-reader prerequisite, not new source/runtime admission. Definition/project integration, source materialization, IR/packs/Code-panel, coordinated signature transactions and actual browser lifecycle remain next; broader eight-language control/effects/types/projects and Verse access stay required. See [the graph contract](design/native_runtime_graph_contract.md).

## Native runtime operator type prerequisites verified (October 7, 2026)

Rust/C++/GDScript now have pure unknown-parameter scalar operator result typing, preserving native C++ promotions/LLP64 signedness, Rust matching operands/heterogeneous shifts/Boolean bitwise rules and Godot logical/Boolean-order behavior. No runtime values are invented. Combined4264 package tests/public API types and69 independent compiler applicability/result contrasts pass. Native repair compiled9 changed cases and retained60 exact source/expectation/file/command/pin matches; initial Godot Boolean-order policy was corrected from native evidence. This is a prerequisite, not source/runtime graph admission. Saved runtime wiring, source mapping, visible inference, coordinated signature transactions, Code-panel/native edited graphs and browser lifecycle remain next; wider eight-language flow/effects/types/projects and Verse access remain required. See [the type contract](design/native_runtime_type_contract.md).

Coverage follow-up: source planning profiles and report generation now retain the three verified native subsets, with fresh sealed accept/JSON reload/unchanged reimport probes and rejection of unverified profile/version claims. The combined coverage-ledger stage and4219 package tests pass. Broad seed rows/corpus counts stay unchanged; no completion percentage is inferred.

## Native scalar worker admission and browser lifecycle (October 7, 2026)

Rust/C++/GDScript ordinary scalar Library modules now have sealed worker review/acceptance and verified production/Pages browser import, signature/literal invalid-edit recovery, Code-panel edits, save/reload and both reimport conflict choices. Final focused runner77069 is terminal green:4218 package/1280 web tests, public source-import types, native-source-graphs21, production/Pages builds and native3 browser stages. The native gate verified matching source/expectation/file/command/toolchain evidence and retained all21 unchanged compiler inputs; the initial expanded gate compiled7 new inputs and retained14. Earlier existing JS/Python/Go/C# browser prefix checks passed; historical full browser-import/docs-artifacts failures remain recorded separately from the focused native3 repair. Native signature domain changes still need coordinated symbol/body/port transactions. Runtime operations, declarations/control/effects, comments/operator spelling, wider types/projects and authoritative Verse access remain open.

Source materialization uses actual registry kind versions, target-specific safe source paths, source provenance and normal editor auto-generation. Unsupported modules remain atomic retained source with diagnostics. Native syntax comparison preserves Rust tail-return and Godot direct/grouped negative distinctions; sealed receipts reject stale or copied reviews. Browser evidence exposed disabled auto-generation and overlapping expression/Return layout; both are repaired. See [the admission contract](design/native_scalar_source_admission_contract.md). Historical checkpoints below retain their original scope.

## Native scalar source graph modules (October 7, 2026)

Rust/C++/GDScript ordinary scalar source now materializes atomic complete global function graph previews from parsed headers, resolved parameter reads and exact source-owned constants. Current-v3 snapshots retain authored types/qualifiers, source origins and stable case-safe function IDs across body edits. Rust implicit final values retain a visible tail-return option through graph validation, IR and pack printing; explicit returns stay explicit. Unsupported roots/header contexts, comments, wider bodies and implicit conversions retain source/diagnostics without a partial snapshot. C++ main/GDScript constructors remain separate roles; Rust main is ordinary only in the explicit library profile.

Combined evidence passes4203 packages,1276 web tests, public/host types,14 native original/regenerated/calibration/role checks, server build/tests, disk goldens, canonical extraction, lint and production build. Native repair compiled2 changed C++ outputs and retained12 exact-input/profile/pin matching results. Independent compilation exposed and repaired global C++ public: emission from required symbol visibility; access sections now remain inside class scope. Initial snapshot schema and two loose test/report lint types were repaired with affected checks. The full existing JS/Python/Go/C# production browser import/edit/save/reload/reimport suite passes. New-three source previews still have no worker/browser admission certification.

Worker/sealed acceptance and actual new-adapter browser lifecycle remain closed. Next connect source worker/adapters, visible comment/operator spelling and context-aware editing, then import/edit/save/reload/conflict reimport. Runtime/control/effects, broader types/projects and authoritative Verse/UE6 access remain in the full objective. See [the source graph contract](design/native_scalar_source_graph_contract.md).

## Native constant graph emission and contextual names verified (October 7, 2026)

Rust/C++/GDScript visible integer/Boolean constants, operators, grouping and conversions now connect typed result domains, saved-graph reconstruction, reviewed function contexts, IR and pack-owned Code-panel emission. Tokens remain exact, direct/grouped Godot negation stays distinct, and adjacent unary signs cannot become unintended increment/decrement. Rust inference derives from authored suffixes/casts/peer operands and the visible function return; conflicting serialized literal hints reject. Ordinary native header keyword guards now retain pinned contextual names and reject type-reference shadowing.

Combined evidence passes4187 packages,1273 web tests, public/host types,107 pinned constant graph compiler cases (104 exact saved modules/3 false assertions),470 independent native identifier contexts,3 fixture-path guard tests, server build/tests, lint, production build and the full existing JS/Python/Go/C# browser-import suite. Initial101 generated modules were compiled fresh;3 new nested-unary cases were compiled with104 unchanged inputs retained by exact hashes/files/commands/pins. Final104 full-file Code-panel goldens are covered by108 focused tests after the broad gates, without another production rebuild. Existing disk goldens/extracted output checks passed before the focused repairs. No programs execute; Godot function bodies are check-only, with separate emitted constant-expression type/value assertions.

Native Godot observations corrected over-broad documentation-derived keyword assumptions and distinguished parameter/type shadowing. A Windows value/Value filename collision was detected by retained-evidence checks;470 identifier contexts were then fully compiled under unique indexed paths. The shared native harness now rejects case-folding collisions before compiler work. Source admission for the new three stays closed; native special entry/constructor names, Unicode/raw/implementation-reserved names, context-aware inspector edits, source worker materialization/acceptance, runtime bindings/operators/control/effects, types/projects and new-adapter edit/save/reimport remain required. Verse/UE6 stays in the full active objective with authoritative validator access unresolved. See [the constant graph emission contract](design/native_constant_graph_emit_contract.md).

## Native scalar saved-graph emission verified (October 7, 2026)

Rust/C++/GDScript reviewed ordinary global scalar functions now connect native signature validation, project/body ownership, IR parameter references and pack-owned header emission through the canonical Code-panel path. Identity returns and empty void/unit bodies produce one module per home graph without synthetic class shells, prototypes or Global qualification. Project preflight rejects invalid homes before file selection; missing bodies, unknown overloads, duplicate definitions, symbol/port/target mismatches, hidden inline values and unsupported/orphan body constructs block. Library entry metadata remains explicit. Full-file goldens and definition/return source maps cover all29 typed identity/unit functions.

Combined affected evidence passes4182 package tests, public source-import/host types,6 fresh pinned native compiler inputs (3 complete saved-graph modules and3 rejection calibrations), lint, production build and the full existing JS/Python/Go/C# browser-import suite. Web1165, disk goldens and extracted Code-panel regressions passed in the initial batch and were retained for focused repairs; final3 focused Code-panel tests also check exact full-file goldens and JSON save/reload output. Initial type narrowing and silent missing-home bypass failures were repaired, then only affected packages/types/native gates reran. No fixture programs execute or source bodies substitute for generated code. Final roadmap-description/golden assertion edits are prose/test artifacts, not a new production build claim.

New-three source-import admission remains closed. Native identifier/reserved-name policy, constant/runtime expression result pins/settings/IR/packs, assignment/conversion/control/effects, wider types/projects and actual new-adapter browser edit/save/reimport remain required. Verse/UE6 is included in the full active objective; authoritative validator access remains unresolved. See [the emission contract](design/native_scalar_graph_emit_contract.md).

## Native scalar signature refresh/inspector verified (October 7, 2026)

Rust/C++/GDScript draft signature refresh now preserves authored/native types and mutability by stable slot across renames/reorders/deletions; added/mismatched slots and return pin changes invalidate native identities rather than substituting defaults. Shared pure edit helpers update explicit parameter/return types and qualifiers. The collapsed existing inspector exposes these profiles, explicit missing-type placeholders and Rust/C++ mutability; typed defaults/rest remain disabled. This is draft edit infrastructure, not new-adapter import/admission.

Combined evidence passes4152 packages,1162 web tests, source-import/host types, lint (warnings retained), production build and the full JS/Python/Go/C# browser-import suite, including native inspectors, save/reload and both conflict choices. Initial build failed because newly shared scalar modules used BigInt literals under web ES2017;26 small integer literals now use the existing Go/C# BigInt constructor convention. Focused repair retained passing web/lint evidence and reran affected packages/types/build/browser once. Retained native scalar89/constant121/source121 consumers also pass after the compatibility change; no native inputs/profiles changed. New-three inspector tests are rendering/edit-helper evidence, not live new-adapter browser acceptance. Actual registry/IR/body/native Code-panel/lifecycle/project/effect and Verse scope remain open. See [the edit contract](design/native_scalar_signature_edit_contract.md).

## Native scalar signature printing verified (October 7, 2026)

Rust/C++/GDScript packs now own typed parameter/function-open syntax, with pure transpiler printers retaining authored aliases, qualifiers, explicit modifiers and unit return spelling. The shared function-header renderer consumes these contracts and rejects unsupported contexts, roles and hidden defaults. Header spans belong to the visible definition; no receiver, visibility or conversion is injected. Existing public native-signature admission still excludes these three languages, pending actual registry/inspector/body/IR and new-adapter Code-panel/browser ownership proof.

One combined affected batch passes4148 packages, source-import/host types,33 fresh generated-header compiler inputs, disk-loaded goldens and canonical Code-panel regressions. Final guard strengthening passes28 focused signature-printer tests; host types rechecked. Native print fixtures combine generated headers with trusted source bodies/type-pointer probes solely for validation; production emit never reads original source bodies. New-adapter full graph Code-panel and browser acceptance are not certified. Prior unchanged native/source/graph/app evidence retained. See [the print contract](design/native_scalar_signature_print_contract.md); the full eight-language scope stays active.

## Definition-owned scalar function graphs verified (October 7, 2026)

Rust/C++/GDScript analyzeNativeScalarFunctionGraph reads actual Function Define native header properties and checks visible entry parameter slots, symbol ownership, exact flow/return/data wiring and orphan constructs. Bounded identity, graph-constant exact-type and empty void/unit bodies are covered; returned facts are transient and immutable. Runtime-parameter operators, assignment/return conversions, mutation/control/effects and broader types remain required. New graph admission remains blocked pending actual registry/IR/packs/emit/inspectors and Code-panel/browser lifecycle proof.

One combined affected batch passes4121 packages and public source-import types. The unchanged native-signature consumer also verifies38 matching retained compiler/header inputs (5 native-valid unsupported); no recompilation was needed. Saved tests cover32 native identity/empty header cases; the Rust mutating-body fixture is intentionally excluded from identity claims. Missing type/name guards and inherited C++ alias-key lookup are repaired. Registry/emit/UI/browser artifacts remain unchanged, retaining their prior evidence. See [the function graph contract](design/native_scalar_function_graph_contract.md). Full eight-language scope remains active.

## Source-owned scalar signatures verified (October 7, 2026)

Rust/C++/GDScript ordinary function headers now retain authored/canonical parameter and return types, mutability/modifiers and exact source/name/type/body spans through analyzeNativeSourceSignatures. Graph-types supplies pure scalar signature identities and pin domains. Pointers/borrows/defaults/generics, wider types, bodies/projects and actual registry/IR/emit/inspector/lifecycle admission remain open. Header facts remain graph-admission blocked.

Combined validation passes4085 packages, source-import API types and38 independent pinned native/header cases, including5 native-valid unsupported headers. Initial13 C++ source failures came from Clang __is_same function-pointer type argument syntax not parsed by the pinned browser grammar. Fixtures now use standard C++ type aliases/typed pointer assignments;13 changed native inputs reran while25 matching source/expectation/file/command/toolchain cases were retained. This grammar extension gap remains on the roadmap. No programs execute; Godot check-only does not observe body execution. Earlier native/source/graph and unchanged emit/UI/browser evidence retained. See [the signature contract](design/native_scalar_signature_contract.md). The full eight-language goal remains active.

## Saved native constant graph reconstruction verified (October 7, 2026)

Rust/C++/GDScript now reconstruct immutable integer/Boolean constant trees directly from saved expression nodes and edges through graph-types analyzeNativeConstantGraph. Actual tokens, visible unary/group/conversion constructs and ordered wiring determine facts; cached values/direct-negative flags cannot override the graph. Kind/arity/ports, inline/duplicate/missing operands, targets, duplicate IDs, cycles and budgets reject corruption. Godot direct negative spelling is derived structurally. Rooted expressions currently use conservative data-any pins and remain admission-blocked; this is not whole-source/whole-graph validity.

One combined batch passes4044 packages, pure source-import types and121 exact source/compiler comparisons with matching retained native reports. Strengthened exact semantic-rejection assertions pass123 focused saved-graph tests afterward. No native inputs/profiles, registry, emit, UI or browser assets changed; prior native/application evidence retained. Next native function/declaration context and registry/result pins/IR/pack/inspector mapping, then canonical Code-panel/native and import/edit/save/reimport acceptance. Full eight-language/project/effect scope and authoritative Verse access remain open. See [the graph contract](design/native_constant_graph_contract.md).

## Shared native scalar core verified (October 7, 2026)

Rust/C++/GDScript literal and integer/Boolean constant semantics now live in pure graph-types, allowing future saved-graph validation without a source-import dependency cycle. Source-import public wrappers preserve ImportFailure code/detail/span identity; source-owned diagnostics keep their expression anchors. Independent shared-public-API cases and edited operand/divide-by-zero tests pass. These are expression-tree tests, not saved-graph acceptance. Facts remain analysis-only with graph admission blocked.

One combined affected batch passes3921 package tests, source-import API types and121 exact native/source comparisons using the complete matching retained compiler report. No native inputs/profiles, emit, registry, UI or browser artifacts changed; earlier compiler and application evidence is retained. Visible reconstruction/signatures/IR/packs/inspectors/lifecycle/projects and authoritative Verse validation remain open. See [the shared-core contract](design/native_scalar_shared_core_contract.md).

## Shared source-owned native expressions verified (October 7, 2026)

Rust/C++/GDScript now rebuild immutable constant initializer/method-return trees directly from pinned source parsers. Exact owners, UTF-16 expression/operand spans, syntax kinds, grouping and conversion spelling are retained with complete source/hash/unresolved inventory. Rust context/peer inference covers negative/nested operands and implicit final returns. C++ signed number tokens normalize to literal plus unary spans; parser-owned operator tokens preserve comments. Godot direct negative spelling stays distinct from grouped negation. Assigned C++/Godot conversions/binding values are not inferred from expression facts, and closure returns cannot acquire an enclosing method owner.

Native compiler/source-expression evidence now passes121 exact-input cases (118 comparisons/3 false assertions),3,800 package tests and pure API types. Initial C++ negative-token failures and source peer/group/context gaps were repaired; changed native inputs used two/three-case retries, retaining matching inputs/commands/toolchains. A final closure-ownership repair passes124 focused source tests; the preceding full package result remains separate. C++/Rust method cases compare constexpr return results; Godot has corresponding check-only method context plus constant value assertions, not runtime function execution. No programs execute.

Public analyzeNativeConstantSource remains analysis-only and every new adapter remains researched, with graph admission blocked. Named native values/bindings, conditional/dynamic/effect/ownership, broader type/project contexts, visible mappings/inspector/Code-panel/lifecycle and Verse validation remain required. Prior initialization/binding and app/production/Pages/browser evidence is retained. See [the source-expression contract](design/native_source_expression_contract.md); the full eight-language goal stays open.

## Shared native constant operators/conversions verified (October 7, 2026)

Rust/C++/GDScript now expose pure integer/Boolean constant-expression trees and exact immutable native facts. Shared arithmetic/comparison/bitwise/conversion logic preserves native-specific type promotions/ranks, narrowing, overflow, division/remainder, bounded shifts and directly/grouped negative literal behavior. Rust grouped signed-minimum literals get their native exception; Godot rejects negative bit-shift operands instead of receiving Clang's arithmetic-shift behavior. Conditional/dynamic effects and graph admission remain unsupported.

Affected combined validation passes116 native cases (113 comparisons/3 false-assertion calibrations),3,672 package tests and pure API types. The shared compiler harness change also passed the89 literal cases. Windows-invalid comparison fixture IDs were repaired; native Godot shift rejection and Rust unsigned-negation diagnostic failures produced focused model/fixture repairs. Final native retry compiled one Godot case and retained115 exact-input/profile-matching cases; stale pins/inputs/expectations or other retained failures remain blocking. No programs execute. No mappings/UI/assets changed, so preceding initialization/binding and application/production/Pages/browser evidence is retained without repetition.

See [the constant expression contract](design/native_constant_expression_contract.md). Native conditional/dynamic/effect/ownership and wider value/type/project contexts, visible graphs/inspector/Code-panel/lifecycle and Verse validation remain required. All three new adapters stay researched; the full eight-language goal remains open.

## Shared native scalar literals verified (October 7, 2026)

Rust/C++/GDScript now expose immutable exact Boolean/integer literal facts with authored spelling, native type/width/signedness, decimal-string payloads, directly negative spelling and native warning tags. Rust covers signed/unsigned widths through128, pointer64, suffix/context/default typing and signed minima. C++ follows pinned Windows LLP64 decimal/nondecimal candidate lists and suffixes, including unsigned negation and Clang's unsigned decimal extension. Godot uses independently verified int64 spelling-sensitive decimal/based overflow behavior, rather than guessed modular values.

Independent constant assertions initially rejected four proposed Godot wide-literal values while package tests passed. Focused check-only comparisons exposed based saturation,19-digit decimal wrap and later-digit saturation; the evaluator and authored fixtures now include signed minima, binary,20-digit and leading-zero contrasts. Fresh consolidated native-scalars89 (86 comparisons/3 deliberately false native assertions), package3558 and source-import types pass. C++ uses static_assert exact types/values, Rust const/type/fallback assertions, and GDScript constant type/value zero-division checks. No programs execute. Exact compiler-input bytes and hashes are required; portable gate remains explicit pending CI provisioning.

The API remains analysis-only, with graph admission blocked. Operator/conversion/effect/ownership semantics, composed negative expressions/warnings, visible graph/inspector/lifecycle/Code-panel and projects remain required. All new adapters stay researched; full existing-adapter and Verse authoritative scope remains open. Prior initialization/binding/native and production/Pages/browser evidence is retained without repetition. See [the literal contract](design/native_scalar_literal_contract.md).

## Shared native scalar-local initialization verified (October 6, 2026)

Rust/C++/GDScript now expose immutable declaration origins and initialization read facts using the verified ordinary local identities. Shared flow logic merges definite and possible assignments across live branch exits, excludes returning arms, preserves RHS-before-write and compound/update reads, and checks readonly assignment with each language's native policy. Rust deferred bindings need definite assignment and allow one immutable initialization. C++ indeterminate scalar reads are unsafe under an explicit warning profile; ordinary compilation rejection is not claimed. GDScript supplies native initialization defaults, without a runtime default-value claim. C++ discarded nonvolatile scalar identifiers do not read their values, unlike Rust. Volatile reads, loops, calls/borrows/effects and unreachable ownership retain unsupported diagnostics.

Fresh consolidated evidence passes 45 exact-input native compiler contrasts (28 accepted/17 rejected), 3,471 package tests and source-import public-API types. Initial failed cases repaired Rust explicit-return and GDScript augmented-assignment traversal in the shared binding walker; the existing 30 binding/23 direct Clang target gate passes as well. Native results were retained for the first traversal repair; new discarded-value fixtures then justified the expanded compiler run. New explicit native-initialization is excluded from the default runner pending pinned portable provisioning. No graph/IR/emit/UI/asset changes required another app build/browser run; preceding broad production and Pages evidence is retained.

See [the initialization contract](design/native_initialization_contract.md). Values/types/operators/conversions, runtime defaults, broader initialization/control/effects, visible graphs/inspector/lifecycle and projects remain required. All three new adapters stay researched and graph admission blocked; Verse authoritative validation and all remaining eight-language master-plan scope stay open.

## Coordinated language plan and broad import integration verified (October 6, 2026)

The user reaffirmed development across languages together so comparable cases expose common gaps. The [eight-language feature plan](design/reverse_import_cross_language_batches.md) now reflects the verified Rust/C++/GDScript bindings and specifies the next coordinated values/declarations/initialization/conditions packet. Shared graph/IR/inspector/lifecycle repairs are implemented once for affected adapters; native acceptance remains independent per language. Verse authoritative validation is still a required prerequisite.

Fresh `bun tools/validate_batch.ts --only=browser-import` passes the normal production build and full existing browser-import stage: JavaScript/Python/Go import/accept/code/persistence/reload, Go inspector/rejection flows, multi-file reimport, no-JavaScript docs and C# worker/signature/expression/local/group/scope/mutation/Boolean/lifecycle/conflict workflows. The old C# local-initializer failure is superseded by this current broad-stage pass, without another application repair. This is not the entire default validation batch or new-adapter graph acceptance. Previously verified package/native/type/Pages evidence is retained, not rerun. Plan links and diff checks pass; all remaining eight-language master-plan items stay open.

## Shared native local bindings verified (October 6, 2026)

Rust/C++/GDScript now expose immutable analysis-only identities for ordinary function parameters, locals, nested/if/else scopes and identifier read/write targets. Native policies remain distinct: Rust introduces shadowing lets after their initializer; C++ introduces the new declarator before its initializer; GDScript rejects active ancestor/parameter shadowing while accepting sibling and later-parent reuse. Authored type specifiers and mutability are retained without inferring native values, initialization, effects or graph eligibility. Unsupported expressions/patterns/context retain diagnostics and partial facts; graph admission remains blocked.

Thirty new corresponding binding probes extend the native corpus to 66 compiler cases (42 accepted/24 rejected). All compiler inputs now use explicit UTF-8 and exact LF bytes, checked against the committed fixtures. The preceding Windows harness had three Unicode source-hash mismatches and newline translation that displaced native byte offsets; those claims are superseded by the corrected 66-source identity evidence. Clang provides 23 direct declaration/reference matches across exact UTF-8-to-UTF-16 spans. Rust/GDScript use compiler contrast probes, not a native source symbol-table API.

Affected evidence passes 3,425 package tests, 66 native compiler cases, the 30-case binding/23-target independent check, VS Code host types and the new source-import public-API type gate. The type gate uses ES2023 declarations required by existing Go code. Initial Bun1.3.1 compilation crashed on a callback and silently erased standalone calls to a runtime helper named declare; extracting the helper and using addBinding resolves that tooling issue. C++ condition clauses and Rust expression-statement if wrappers were repaired from the failed cases. Focused retries retained passing compiler evidence until the actual-input byte correction required a native rerun.

Mapping/emission/UI/parser assets are unchanged, so prior web/build/Code-panel/browser evidence remains valid for its preceding subsets and was not repeated. The historical broad browser-import failure remains separate. All three new adapters remain researched: native value/type/initialization/effect policies, graph/inspector/lifecycle, projects and host context still require implementation. Verse authoritative validation stays open. See [the local binding contract](design/native_local_binding_contract.md); the full eight-language goal remains active.

## Shared native syntax inventory verified (October 6, 2026)

Rust/C++/GDScript now have exact immutable source inventories using lazy pinned browser grammars. Shared hash/ABI contracts preserve existing Go/C# ABI15 and admit the new ABI14 grammars independently. Source/trivia/Unicode regions are contiguous; syntax names remain syntax observations, native bindings unvalidated and all executable regions unresolved. Forged candidate promotion cannot grant graph acceptance. Malformed input and source/depth budgets block inventory; corrupt grammar loads recover with valid late configuration.

Rust0.24.0/C++0.23.4 publish WASM; GDScript6.1.0 is built with pinned Emscripten4.0.17 into a vendored MIT artifact/provenance packet. Scanner assertions initially embedded checkout paths; file-prefix mapping produces identical hashes from distinct directories. The native loader snapshots exactly the supplied byte view before asynchronous digest/loading. The recovery regression initially mutated an aliased Buffer slice; its repair now also verifies offset-view recovery.

Consolidated evidence passes 36 trusted native cases (24 accepted/12 rejected), the GDScript reproducible build, 3,393 package +1,159 web tests (4,552), C#2,672 native observations, Go native checks/134 compiler pairs, docs-source, lint (99 existing warnings/zero errors), host types, production/Pages builds and browser/artifact gates. All 36 new source fixtures pass hash/ABI/Unicode/trivia checks in production and Pages. Existing C#/Go import/edit/reload flows remain verified for their preceding subsets. Package failure skipped expensive consumers; focused repair reran affected package/C#/type/build/browser gates, retaining unchanged web/lint/Go/new-native/provenance evidence. Historical broad browser-import failure remains separate.

All three new adapters remain researched: native binding/type/effect/source ownership, visible graph/IR mappings, inspector/lifecycle, Code-panel fidelity and project closure still require implementation. Verse authoritative host/grammar/native validator access remains open. Continue shared JS/Python/C#/Go conditions/control-flow alongside those binding contracts. See [the syntax inventory contract](design/native_syntax_inventory_contract.md); the full eight-language goal remains active.

## Cross-language XL-01 native readiness verified (October 6, 2026)

One combined compiler gate now verifies 24 trusted fixtures across C++/Rust/GDScript (12 accepted, 12 rejected). Clang 19.1.5/C++17 emits declaration/type/range AST facts with an explicit Windows target and no includes. Official archive-pinned rustc 1.99.0/edition2021 emits metadata and JSON errors; Godot 4.5.2 uses an isolated headless check-only project. Installed Rust/compiler/library and Godot files are compared against pinned archives. No fixture programs are executed. Portable setup stays in ignored scratch and retains a bounded-transfer fallback for observed download stalls.

`bun tools/validate_batch.ts --only=native-readiness` passes; raw evidence is in ignored `scratch/native-readiness/results.json`. This stage is explicitly selected pending CI provisioning, so the ordinary default batch does not certify it. Existing JS/Python/C#/Go evidence is retained, not rerun for this compiler-harness-only batch. Application mappings/emission/UI are unchanged; no app build/browser repetition is needed. The historical broad browser-import failure remains separate.

All three new adapters stay researched: pinned browser grammars, native binding/value/source ownership contracts, graph acceptance, inspector/lifecycle/Code-panel/browser evidence and project closure remain required. Installed UE5.6/5.7 inspection did not establish authoritative Verse validation; host/version/validator access remains open. See [the readiness contract](design/native_readiness_contract.md) and [the shared eight-language waves](design/reverse_import_cross_language_batches.md). Full language and full-goal completion remain open.

## C# Boolean graph consumer verified; cross-language waves adopted (October 6, 2026)

Visible native expressions now support exact Boolean literals, predefined integral comparisons, logical/bitwise/equality operators, negation and authored parentheses/overflow wrappers. IR18 and Boolean output pins retain graph-derived result domains without weakening numeric consumers. Static methods with existing integral parameters/locals can return bool. Source normalization, sealed acceptance, native validation, persistence/reimport and provenance-free generation preserve the expression trees and spans. Signature lifecycle projection retains a Boolean return separately from the still-integral parameter domain.

Short-circuit graph checks validate both operands' names/types/wiring while excluding unreachable reads from definite-assignment requirements. Reviewed C# bodies delegate generic eager-read checks to their native expression walker; unreviewed methods cannot bypass signature/ownership validation. Eight original/regenerated compiler pairs and a fixed saved graph verify literal, comparison, logical, exact-wide/minimum, overflow, mutable-local and lazy uninitialized-read cases. Saved mutations block eager reads, domain drift, hidden values and wrong native operators. The twelve-method shared browser fixture verifies actual bool Code-panel output, invalid/recoverable comparison-to-logical edits and save/reload in production and Pages.

Affected evidence passes 2,672 native observations (1,834 valid/838 rejected), 3,353 package +1,159 web tests (4,512), docs-source, lint (99 existing warnings/zero errors), host types, build, goldens, Code-panel, strict parsing, focused C# production browser, Pages build and exported browser/artifact checks. A remaining numeric-only signature/result-index guard initially blocked Boolean methods; its repair reran native/packages/types and skipped dependent build/browser stages, retaining unchanged passing web/lint/golden/Code-panel/parsing evidence. The historical broad browser-import failure remains separate.

The user now directs delivery by shared feature waves across all eight languages. [The new wave plan](design/reverse_import_cross_language_batches.md) supersedes language-by-language completion order and includes native prerequisite work for GDScript/Rust/C++/Verse alongside ready JS/Python/C#/Go fixes. Branch/unreachable ownership, Boolean bindings/parameters/calls, loops/effects/exceptions/ref-out, group editing, wider types and project closure remain required. See [the Boolean graph contract](design/csharp_boolean_graph_contract.md); full C# and the full eight-language goal remain open.

## C# native branch-flow prerequisite verified (October 6, 2026)

Source analysis now records immutable statement-level entry/end reachability, assigned binding IDs, lexical/method ownership and optional Boolean condition facts. Alternative environments are isolated; joins intersect only reachable exits, including unchanged state for an absent else. Returns end a path, constant conditions constrain alternatives, and dead statements retain references and native name/type/readonly checks. A reachable exit from a value-result method now reports a missing return path. Mutable values retain no inferred constant. Pure shared Boolean helpers cover predefined integral comparisons and Boolean negation/logical/bitwise/equality operators; they do not change emission or admit Boolean signatures/locals.

Pinned Roslyn evidence adds 582 Boolean/comparison probes (all nine integral operand widths across six comparisons, exact wide constants and Boolean/runtime combinations) and 31 composed branch cases. These cover sibling isolation, nested joins, one/both returned alternatives, missing else, const versus mutable conditions, declaration spaces, short-circuit reads and dead-tail/type errors. One compiler-invalid escaped name remains an explicitly unsupported external-binding boundary; it is not claimed as a resolved native diagnostic. Fixed analysis tests verify immutable/repeatable flow evidence and that valid branch analysis still cannot bypass graph admission.

The consolidated analysis batch passes 2,656 native observations (1,818 valid/838 rejected), 3,343 package +1,159 web tests (4,502), lint (99 existing warnings/zero errors) and host type checks. The first native run found uppercase Boolean expectations against the harness's documented lowercase representation; correcting the test expectations required only native/package retries, retaining unchanged passing web/lint/type evidence. Build/Code-panel/browser/Pages gates were not repeated because visible mappings and emission are unchanged; preceding initializer mapping evidence remains valid for its existing subset. The historical broad browser-import failure remains distinct.

Visible Boolean conditions, if/else ownership and joins, authored embedded-statement spelling, unreachable regions, inspector editing, saved-graph mutations and source acceptance/persistence/reimport/production/Pages proof remain required under [the branch-flow contract](design/csharp_branch_flow_contract.md). Boolean bindings/signatures, loops/control transfers, side effects, exceptions/ref-out, calls/types/projects and the complete eight-language objective remain open. This checkpoint verifies analysis, not branch import.

## C# uninitialized locals and definite assignment verified (October 6, 2026)

Typed mutable integral locals now retain authored initializer absence, including mixed and wholly uninitialized declaration groups. Visible declarations omit their value input/edge when `hasInitializer` is false; IR v17 and C# pack templates emit no synthetic value. Source and graph environments track declaration separately from initialization. Plain assignment initializes its target only after validating the RHS and conversion; reads, compound assignments, updates and self-reads require prior initialization. Ordinary/checked/unchecked lexical blocks propagate assignment to existing ancestor bindings while discarding child locals. Parameters start initialized; var and const still require initializers.

The initializer inspector uses a pure document projection and one lifecycle transaction. Enabling creates an empty required value input; disabling removes the input/edge and unshared initializer expression ancestry, retaining shared owners. Production and Pages verify actual Code-panel output, rejection/recovery and saved/reloaded absence. Parameter-dependent var-to-typed editing now derives native parameter types from the matching visible method/overload definition. The shared browser fixture contains eleven methods.

Six composed source cases supply twelve original/regenerated compiler checks; ten independent Roslyn/source probes cover assigned/unassigned reads, mixed groups, ancestor writes, compounds/updates, self-reads and missing var/const initializers. A fixed saved graph checks exact mixed syntax, declaration spans, provenance-free generation and malformed hidden operands. The consolidated affected batch passes 2,043 native observations (1,274 valid/769 rejected), 2,727 package +1,159 web tests (3,886), docs-source, lint, native host types, build, goldens, canonical Code-panel, strict parsing, focused C# production browser, Pages build and exported browser/artifact checks. Both browser logs explicitly confirm definite-assignment and initializer workflows. No unchanged application gates were repeated for this evidence update. The historical broad browser-import failure remains distinct.

Conditional branch merges, loop fixed points, exception/ref-out effects and visible unreachable regions remain required; this checkpoint covers straight-line statements and existing lexical blocks. Group membership/split-merge/trivia, cross-arity editing, calls/overloads, wider native domains and project/reference closure also remain open. The complete eight-language objective remains active. See [the definite-assignment contract](design/csharp_definite_assignment_contract.md).

## C# initialized declaration groups verified (October 6, 2026)

Comma-separated initialized typed/const declarations now retain a visible `csharp_declaration_group` owner and ordered Variable Define children. The owner supplies the shared native type/style; children retain stable binding IDs, initializer graphs and precise name/initializer column ranges. IR v16 `DeclarationGroup` prints one authored statement through the C# pack rather than splitting declarations. Groups establish no new lexical scope. Recursive graph checks enforce shared type/style, readonly indexes, membership, order, forward-read and name reservations independently of source provenance; source comparison, sealed acceptance, JSON persistence and reimport retain grouping.

Group and child inspectors use one pure projection and lifecycle transaction to edit every shared type/style and readonly index while retaining selection. Grouped var is unavailable. Native-invalid widening or const initialization blocks generation and is recoverable through the same editor. The shared production/Pages source now has ten methods, including const and mutable groups in an unchecked block; actual group type/style editing, readonly indexes, Code-panel output and save/reload pass.

Five original/regenerated group compiler pairs, four native rejections and a fixed saved graph cover dependency order, mutations, unchecked const dependencies, sibling group identities, exact long minimum and void completion, plus malformed membership/count/order/type and precise spans. The affected batch passes 2,021 native observations (1,259 valid/762 rejected), 2,708 package +1,159 web tests (3,867), lint (99 existing warnings/zero errors), host type checks, production build, saved-folder goldens, canonical Code-panel, strict parsing, focused C# production browser, Pages build and exported browser/artifact checks. Complex groups exposed a general flow-checker gap: its initialization facts now follow declarator children into the continuation and traverse C# scopes without depending on provenance. Stale rejection tests were updated to still-unsupported uninitialized declarations. A frontend/core document type mismatch was repaired by preserving the caller's document type in the pure projection. Repairs reused passing gates and reran affected checks/prerequisites; historical broader browser-import failures remain separate.

Uninitialized declarators/definite assignment, visible unreachable regions, group membership and split/merge editing, detailed declarator trivia, cross-arity rewiring, effectful expressions/ref-out-in, calls/overloads, wider native domains and project/reference closure remain required. Full C# and the complete eight-language objective remain open.

## C# visible lexical scopes verified (October 6, 2026)

Ordinary nested blocks and checked/unchecked statements now map to visible `csharp_scope` nodes with separate body/continuation execution pins. IR v15 `ScopeBlock` and C# pack templates preserve each block and optional keyword; the sink tags nested statements and expression spans without hidden conversions or flattened scope text. Source planning, structural comparison, sealed acceptance, JSON persistence and reimport retain lexical structure, sibling local identity, ancestor writes, empty blocks, void completion and terminal nested returns.

The recursive native graph walk pre-reserves each declaration space, derives initializer/mutation/return overflow context from visible scopes, isolates child bindings and checks declaration/index scope ownership. Escaped references, malformed or multiply owned flow, invalid contexts/inline operands, shadowing later ancestors and continuation after terminal return block generation. Inspector inference reaches nested declarations; the generic scope-context editor is verified in production and Pages through invalid checked overflow, recovery, save/reload and actual Code-panel output. These checks still work after generation provenance is removed; import acceptance itself continues requiring exact provenance.

Five composed original/regenerated scope pairs and a fixed saved graph add independent compiler evidence, exact nested output, statement ownership, reload, overflow-context edits, escaped references and index drift. The shared browser source now contains nine methods. Final affected evidence passes 2,007 native observations (1,249 valid/758 rejected), 2,700 package +1,159 web tests (3,859), lint (99 existing warnings/zero errors), host type checks, production build, saved-folder goldens, canonical Code-panel, strict parsing, focused C# production browser, Pages build and exported browser/artifact checks. The first run found a missing fixture class brace and an incorrectly chosen provenance-removal test gate; repairs reran native/package and skipped build/browser prerequisites, reusing unchanged passing web/lint/type/golden/Code-panel/parse evidence. Historical broader browser-import failure remains distinct.

Grouped declaration ownership, uninitialized locals/definite assignment, visible unreachable regions, cross-arity inspector rewiring, effectful expressions/ref-out-in, calls/overloads, wider native domains and project/reference closure remain required. The complete eight-language objective remains active; this verifies the composed lexical-block subset, not full C#.

## C# lexical scope binding prerequisite verified (October 6, 2026)

Source binding analysis now exposes immutable lexical scopes (method/parent identity, authored block or checked/unchecked kind, effective overflow context and declared binding IDs) and exact read/write references to resolved bindings. Sibling locals retain distinct identities; compound/update targets record both accesses; expression overflow overrides retain the consuming lexical scope. Bare returns in integral-result methods now produce a native-invalid diagnostic, including nested returns.

Fifteen new independent Roslyn/source comparisons cover nested constants, sibling reuse, later ancestor reservation, parameter shadowing, checked/unchecked nesting and expression overrides, overflow, readonly updates, missing return values and grouped initializer order. The consolidated affected batch passes 1,997 native observations (1,239 valid/758 rejected), 2,693 package +1,159 web tests and host type checks. No emit or editor behavior changed, so build/browser/Code-panel gates were not repeated; preceding mapping evidence remains historical evidence for its existing subset.

This is an analysis prerequisite, not nested graph admission. The remaining recursive planner, visible scope node/structured IR, graph ownership/context validation, inspector and persistence/reimport checks are specified in [the lexical scope contract](design/csharp_lexical_scope_contract.md). Grouped declarations, definite assignment, unreachable source, effects/calls/types/projects and all eight-language scope remain required.

## C# by-value parameter writes verified (October 6, 2026)

Visible `parameter_set` nodes now bind to function, overload and parameter IDs instead of introducing variable indexes. Plain/compound assignments and standalone prefix/postfix updates map ordinary integral by-value parameters; reads denote the named mutable parameter at their consuming statement. Shared native mutation rules derive target type from the visible signature. Source planning, sealed acceptance, JSON persistence, reimport and IR v14 local-target printing preserve each occurrence and its order with local declarations. Crossed methods/overloads, stale or removed slots, bad names, malformed prefix options and hidden operands block generation independently of provenance.

The inspector can retarget a Set to another parameter in the same method, preserving RHS/operator wiring. Signature renames update Set labels by stable ID; deletion remains a blocking ownership error. Spawn rows expose distinct parameter slots in the active function, and menu keys distinguish overload/parameter identities. C# compound Set effectiveness now matches verified support instead of dimming these nodes as unsupported.

Five composed original/regenerated parameter-write cases and a fixed saved graph cover narrow constants, exact long minimum, compounds/shifts/updates, char and ordered mixed local/parameter writes. Native totals pass 1,982 observations (1,232 compiler-valid/750 rejected), including the unchanged 1,260 mutation pairs. The affected proof passes 2,676 package +1,159 web tests (3,835), lint (99 existing warnings/zero errors), host type checks, build, saved-folder goldens, canonical Code-panel, strict parsing, production/Pages builds and exported browser/artifact workflows. The shared eight-method browser fixture verifies actual parameter retarget/save/reload and invalid signature/recovery alongside the existing import/conflict flows. Import/type repairs retried affected gates with build prerequisites; unchanged passing native/package evidence was reused. Historical full browser-import failures remain separate.

Grouped declarations, nested/checked scopes, definite assignment, unreachable regions, cross-arity rewiring, effectful assignment/update expressions and ref/out/in modes remain open; calls/overloads, wider domains and full project/reference closure follow. All eight reverse-import languages remain in the active goal.

## C# compound/update batch checkpoint (October 6, 2026)

IR v14 adds the authored unsigned-right-shift assignment operator `>>>=`; C# local Set nodes now map all eleven predefined integral compound operators and standalone prefix/postfix increment/decrement. Shared source/graph mutation checks preserve declared native width, readonly identity and mutable nonconstant reads. Updates own execution pins only, and pack templates print each occurrence without hidden expansion. The fixed mutation graph checks exact output, statement ownership, reload, invalid RHS and hidden update operands. Binary/unary inspector choices preserve arity; cross-arity rewiring, effectful assignment/update expressions, parameter writes, nested/checked statement scopes, grouped declarations, members/indexers and user-defined operators remain required work.

Independent pinned Roslyn evidence passes 1,962 cases (1,212 valid/750 rejected), including 1,260 mutation type/operator/constant/update pairs. Seven composed assignment sources now cover narrow compound conversion, all shifts, char updates and unsigned locals through sealed acceptance/reimport and original/regenerated compilation. Package, web, lint, host type, saved-folder goldens, Code-panel and strict parsing gates pass after correcting a stale unsupported-update assertion. Browser verification exposed and repaired a registry `bool`/`boolean` mismatch that rendered prefix editing as text. The Boolean schema regression and actual production/Pages compound operator, invalid RHS/recovery, prefix/postfix and save/reload checks pass. Fresh totals: 2,668 package + 1,157 web tests (3,825), native evidence, lint (99 existing warnings/zero errors), host type checks, build, saved-folder goldens, canonical Code-panel, strict parsing, production/Pages browser and exported artifact checks. Focused repairs reused unchanged passing gates; the historical full browser-import failure remains distinct. No full-language completion is claimed.

## C# plain local assignment checkpoint (October 6, 2026)

Plain `=` assignments to preceding integral locals now retain statement order, native width and declaration identity through source planning, graph analysis, Code-panel output, save/load and conflict-aware reimport. Set inputs use the declared Number pin; const writes, forward references, invalid implicit narrowing, stale bindings and hidden inline values block generation. Mutable reads remain nonconstant. The C# pack now prints local assignment without redeclaring the variable.

Four composed original/regenerated sources cover narrow constants, exact signed-long minimum tokens, repeated self-dependent runtime assignments and explicit narrowing. Four native-invalid assignments reproduce readonly, forward-use, constant overflow and runtime narrowing failures independently. Native evidence passes 690 cases (521 accepted/169 rejected); 2,662 package tests, production build, canonical Code-panel checks and focused C# production browser pass. The preceding unchanged web/lint evidence remains valid. Pages builds and exported browser/artifact checks also pass, including the assignment RHS invalid/recovery checks. Broader historical full-suite failures remain separate.

Grouped declaration ownership, nested scopes, compound/update operators, parameter writes, effectful assignment expressions and unreachable regions remain open, followed by calls/overloads, wider domains and project/reference closure. The full eight-language goal remains active. The combined runner now skips consumers of fresh failed selected prerequisites instead of spending browser/build cycles on a known-invalid batch.

## C# void completion with visible locals verified (October 6, 2026)

Ordinary C# void methods can now end after initialized typed/var/const declarations without an explicit return. The planner retains this authored absence; native graph validation walks the declaration chain to its natural end and checks every initializer/index/edge, without adding a hidden return node or printed statement. Explicit void returns stay explicit, and integral-result methods still require a return. Disconnected declarations, incomplete value-return paths and orphan expressions remain blocking.

Three composed original/regenerated completion pairs pass independent pinned Roslyn compilation, sealed acceptance and reimport. The shared browser fixture now includes a void method with const → inferred → runtime-promoted local declarations. Focused production and Pages workflows verify its actual Code-panel output, saved/reloaded function tab and absence of an inserted return alongside existing signature/type/style/reimport checks. Native totals: 670 cases (505 compiler-valid/165 rejected). The consolidated affected batch passes 2,656 package + 1,157 web tests (3,813), lint (99 existing warnings/zero errors), production/Pages builds, focused C# browser and exported artifact checks. Prior full-suite failure records remain distinct from focused repairs; unchanged broader gates retain preceding evidence.

This advances the declarations/scopes batch; it does not complete that batch or the language. Grouped declaration ownership, nested scopes, assignments and unreachable statement ownership remain next, followed by ordered calls/overloads, wider domains/effects and project/reference closure. The full eight-language goal remains active, using the shared batched workflow.

## C# declaration-style transactions verified (October 6, 2026)

The local inspector now changes typed/var/const spelling, graph-derived width and readonly index together. Variable-to-explicit edits infer only through the selected declaration so later invalid assignments do not prevent repair. The lifecycle transaction preserves native initializer/execution pins and retains inspector selection during document replacement. Graph tests cover mutable const dependencies, reload, downstream invalidity and immutable projection; pinned Roslyn independently compiles edited original/regenerated forms.

Native evidence totals 664 cases (499 compiler-valid/165 rejected). Package/web checks pass 2,655 + 1,157 tests (3,812); production type checking/build and focused C# browser checks pass. Pages build and exported workflows verify style cycling, exact Code output, recovery and persistence. Earlier broad browser retries exposed wiring, pin and selection bugs; their failed full-suite ledger entry is retained, with the repaired C# workflow separately verified by the focused stage. No repeated full-suite certification or complete-language claim is made.

Delivery now follows [dependency batches and focused repair checks](design/reverse_import_batch_delivery.md). Next batch: grouped declaration ownership, nested scopes, assignments and void completion; ordered calls and wider native/project closure follow. All eight languages remain in the active goal.

## C# local inspector and browser workflows verified (October 6, 2026)

The shared six-method source fixture now includes a composed const-byte → inferred-local → typed-byte pipeline. Both production and Pages import through the deployed worker, verify exact typed/var/const Code-panel output, show the nine native integral type choices, widen the const type to int to block the downstream byte assignment, recover, save/reload the function tab and reject grouped incoming declarations atomically. Inspector native type choices are target-specific; inferred declarations retain var. Local declaration-style conversion is not exposed until its coherent index/readonly update contract is implemented.

The combined runner freshly passes pinned C# native checks (658 cases, 493 valid/165 rejected), 2,654 package + 1,156 web tests (3,810), lint (99 existing warnings/zero errors), production and Pages builds, all existing production imports and the new local workflows, and exported parser/documentation checks. All 19 ledger gates are green; unchanged Go/server/host/golden/strict-parse gates retain preceding evidence. Groups, nested scopes, assignments, ordered calls/overloads, implicit void fallthrough, wider types/effects and project/reference closure remain open. The full eight-language goal remains active.

# C# straight-line local source integration (October 6, 2026)

The C# whole-class planner now maps initialized typed, inferred and const local declarations before a final explicit return through IR v13 visible declaration/read nodes. Structural comparison preserves declaration type/style/name/order and exact initializers. Sealed review/acceptance and original/regenerated reimport use the existing graph-owned native policy. Groups, nested blocks, assignments, calls/overloads and implicit void fallthrough remain explicit gaps; dedicated local inspector/browser workflows are still required. Native evidence now has 658 cases (493 compiler-valid/165 rejected), including four local original/regenerated compiler and read-fact pairs. The combined runner passes 2,654 package + 1,156 web tests (3,810), pinned C# native checks, lint, native host types, production build and coverage-ledger refresh. Local-specific tests retain graph edits, require conflict resolution for concurrent source changes and preserve current state atomically. Existing browser/Pages/Go/server/golden gates retain preceding evidence; they do not certify the newly admitted local workflows. This does not claim full C# or eight-language completion. See [local contract](design/csharp_local_binding_graph_contract.md).

## C# native local IR/printing and graph body validation (October 6, 2026)

IR v13 adds C# typed, var and const local metadata and pack-owned native declaration templates. Native method body validation now derives ordered local facts, validates declaration/index/class/body/pin/readonly ownership, checks native return conversions and rejects orphan expressions/disconnected declarations/extra execution edges. Name validation also blocks a damaged graph that renames its declaration/index while retaining a stale getter name: inference follows the symbol identity, while lowering emits the getter name. See [IR amendment](design/native_local_ir_rfc.md) and [local graph contract](design/csharp_local_binding_graph_contract.md).

Four composed emitted local graphs and four independent native type/constant probes pass: const-byte pipelines, exact minimum constants and runtime byte/char promotions. Native totals are 650 cases (485 compiler-valid/165 rejected). The fixed csharp-local.fixture.json survives full project normalization and class/function-tab Code-panel printing with source maps. Index/readonly/type/scope/name/order mutations block generation without provenance. The coherent batch passes 2,648 package + 1,156 web tests (3,804), C# native evidence, lint and production build. Unchanged browser/Pages/Go/server/host/golden/Code-panel checks retain preceding evidence; no new local browser workflow is claimed.

Next connect local source planning/materialization and structural comparison, C# local inspector options, native source/generated pairs and production/Pages import/edit/save/reload/reimport. Grouping, nested scopes, assignments, ordered calls/overloads, wider types/effects and referenced projects remain required. Full C# and eight-language completion remain open.

## C# shared local binding policy and graph groundwork (October 6, 2026)

`csharpIntegralLocal` now owns source and graph initialization facts for predefined integral typed/var/const locals. Explicit assignments retain native declared widths, inferred declarations retain initializer types, const reads retain native constants and mutable reads discard constant facts. The C# binder uses this policy in the existing 494 independent source-binding/Roslyn pairs; native totals remain 642. The graph local walker computes facts from visible initialized declarations along an execution path, rejects self/forward references and shadowing, and forwards their transient facts through exact native expressions. Readonly/type/pin/hidden-input mutations, cycles, ambiguous initializer edges, overflow edits and JSON reload have regression coverage.

The final coherent batch passes native checks, 2,642 package + 1,156 web tests (3,798), lint (99 existing warnings/zero errors) and production build, including source-policy centralization and entry/read guards. Unchanged browser/Pages/host/server/Go/Code-panel/golden stages retain preceding evidence. This is local graph inference groundwork; C# local source/body admission remains blocked until native local IR/printing, source planning/materialization and full declaration/index/body validation are implemented. Calls/overloads, assignments/nested scopes and broader types/effects/projects remain required. See [local graph contract](design/csharp_local_binding_graph_contract.md).

## C# browser acceptance and reimport verified (October 6, 2026)

The worker/dialog now admit ordinary C# 12 classes with public static integral/void methods and native return expressions. Whole-source eligibility remains separate from a receipt; review rebuilds the class with the real file/options and seals its validated graph inside the worker. Stale source/path/graph/target checks, retired receipts, async supersession and client hard cancellation/deadline guards remain active. Unsupported source stays in analysis with its original text, declarations, binding findings and mapping diagnostics. Reimport file selection now includes .go and .cs.

Production and Pages workflows import the shared five-method `csharp-import-browser.fixture.json`, edit/recover native signatures, preserve exact case/verbatim reads in Code panels, save/reload and verify function-tab output. They retain graph-only changes, exercise both reimport conflict choices, persist source replacement and block unsupported additional classes without changing the project. The same original/regenerated browser fixture compiles independently; native totals are 642 cases (477 compiler-valid/165 rejected), alongside the preceding 25 expression and 25 sealed source-graph/native pairs.

Fresh combined checks pass 2,638 package + 1,156 web tests (3,794), C# native checks, lint (99 existing warnings/zero errors), normal/Pages builds, all 48 preceding production imports/module/reimport/inspector workflows, C# analysis/signature/overflow and new import/reimport workflows, plus exported documentation/parser assets. Final coverage/roadmap refresh and rebuilt/exported artifacts pass; all 19 ledger gates are green. Unchanged server/host/Go/golden/Code-panel/strict-parse checks retain preceding evidence. C# now has an implemented subset, not full language/project coverage. Next integrate locals/constants/scopes and ordered calls/overloads, then wider types/domains/effects, namespace/reference closure and remaining adapters. The full eight-language goal remains active.

## C# sealed core acceptance and reimport verified (October 6, 2026)

`reviewCSharpImportGraph` independently replans complete ordinary C# integral/void classes, validates graph ownership/analysis/persistence and compares generated structure before issuing the shared sealed receipt. Acceptance rejects source/path/options/graph mutations and forged review copies. Comparison preserves native signatures, exact tokens, expression grouping, casts, overflow contexts and minimum-literal/unary-minus adjacency, including hexadecimal and underscore spellings. Browser C# acceptance remains disabled pending worker/dialog integration.

C# three-way reimport now uses this core gate for both baseline and incoming source. It retains project settings, paths and graph metadata through normalization; graph-only edits survive by default, simultaneous edits require conflict resolution, and stale transactions are rejected. Unsupported incoming additions, invalid current graphs and additional authored units block atomically. Generated-comment comparison retains authored graph explanations. The native corpus's 25 source-graph pairs now pass through sealed acceptance and reimport before regenerated-source type/constant checks and independent class compilation; totals remain 640 cases (475 compiler-valid/165 rejected).

The coherent core batch freshly passes csharp-native, 2,638 package + 1,153 web tests (3,791), lint (99 existing warnings/zero errors), production build, all 48 existing production browser imports/module/reimport/inspector workflows, C# analysis/signature/overflow inspector workflows, Pages build/exported workflows, documentation artifacts and coverage-ledger refresh. All 19 ledger gates are green; unchanged server/host/Go/golden/Code-panel/strict-parse stages retain their preceding evidence. There is no C# browser acceptance/reimport claim. Next connect worker receipts/cancellation/staleness and dialog candidates, verify production/Pages import/edit/save/reload/reimport, then complete locals/constants/calls/overloads, wider types/domains/effects and project/reference closure. Full eight-language scope remains active.

## C# source-to-graph planning foundation verified (October 6, 2026)

The UI-free planner now maps ordinary C# classes containing public static integral/void methods to typed plans and the shared transactional materializer. It retains parameter identity/case/verbatim spelling, native signatures, source spans and exact expression/cast/parentheses/overflow ownership. Expression-bodied methods, one-return bodies, empty void methods and explicit void returns are supported. Namespace/member/overload/local/call/trivia and broader language contexts remain whole-plan rejections until their contracts are implemented. Browser C# review/acceptance remains disabled; this planner does not create receipts. See [source graph plan](design/csharp_source_graph_plan.md).

Twenty-five composed source → plan → graph → regenerated-source comparisons match Roslyn types/constants, and each actual regenerated class is independently compiled. The native corpus now has 640 cases (475 compiler-valid/165 rejected), with 25 source graph pairs in addition to 25 expression graph pairs, 458 integral policy pairs and 494 source binding pairs. The fixed multi-method source-planned graph verifies source maps, normalized reload and generation after provenance removal. Class normalization now preserves omitted and protected visibility rather than silently inserting public.

All 19 combined stages pass freshly: 2,602 package + 1,153 web tests (3,755), native C#/Go evidence, server/host/type checks, lint (99 existing warnings/zero errors), production build, disk-loaded goldens and canonical Code-panel extraction, strict parsing, all existing production browser imports/module/reimport/inspector workflows, C# analysis/signature/overflow inspector workflows, Pages build and exported artifact checks. No fixture program is executed.

Next implement C# sealed review/acceptance, structural/semantic comparison and conflict-aware reimport/browser import workflows, then integrate local/constant scopes, ordered calls/overloads, wider statements/domains/types/effects and project/reference closure. Full C# and eight-language completion remain open.

## C# visible integral expressions and inspector workflows (October 6, 2026)

IR v12 adds graph-owned exact C# integral tokens, predefined unary/binary operators, casts, authored parentheses and nested checked/unchecked expression contexts. Transient inference applies the pinned-Roslyn-backed integer policy to parameters and visible operands, checks return conversions and rejects cycles, orphan expressions, malformed/hidden inputs and removal of the reviewed native signature. Print templates retain authored structure and token spelling; facts are never serialized or folded into output. See [integral graph contract](design/csharp_graph_integral_contract.md).

The corpus now has 590 native cases (425 compiler-valid, 165 rejected), including 25 generated expression/native type-and-constant comparisons and separate compilations of each original generated class, plus the nine-type saved signature class. The existing 458 integral policy and 494 source binding comparisons remain; four compiler-valid source gaps stay explicit. Graph fixtures cover minimum-value lexical context, UInt64 spelling, promotion, checked casts, nested overflow, masked shifts and composed parameter expressions. Canonical class/function-tab output, source maps, JSON reload and invalid graph mutations pass.

The combined batch passes 2,573 package + 1,153 web tests (3,726), native/type checks, lint (99 existing warnings/zero errors) and final production build. Production and exported Pages browser workflows pass exact signature edits, invalid narrowing/recovery, widening, save/reload/function-tab fidelity and checked-overflow invalid edit/recovery/persistence through the actual Code panel. Unchanged Go/host/server/golden gates retain preceding evidence. Dedicated coverage of all operator/cast inspector variants remains open beyond these exercised workflows.

C# source acceptance remains unavailable. Next connect source planning/materialization and local/constant/scope/call ownership to these graph contracts, then finish wider statements, native values/effects/types, project/reference closure and conflict-aware reimport. The full eight-language goal remains active.

## C# visible native signature foundation verified (October 6, 2026)

Function Define now owns exact C# fixed-integral parameter/result records for ordinary static class methods. C# pack templates print native widths; binding refresh retains reviewed types, and case-sensitive/escaped parameter reads follow declaration names. Signature inspector controls expose these types. Identity-return bodies use the shared C# implicit assignment policy; narrowing, wrong entry/class ownership, unsupported modifiers, extra return pins and unsupported body forms block generation. C# source acceptance remains disabled.

A fixed saved graph covers all nine integral types, class/function-tab output, definition/body source maps, JSON reload and invalid-edit recovery. Pinned Roslyn compiles its actual generated class without executing it. Native evidence now has 540 cases (375 compiler-valid, 165 rejected), including the generated graph, 458 integral policy pairs and 494 source binding pairs with four compiler-valid gaps retained.

The combined batch passes 2,545 package + 1,153 web tests (3,698), native/type checks, lint (99 existing warnings/zero errors) and the final production build. Production browser and Pages build/artifact workflows also pass; dedicated browser editing coverage for the new C# signature inspector is still required. All 19 ledger gates are green with unchanged preceding Go/host/server/golden evidence. Next connect source declarations and native expression/constant/overflow/call ownership to visible graph mappings, Code-panel inspector workflows, saved graphs and reimport. Remaining domains/projects and the full eight-language goal stay open. See [binding and graph contract](design/csharp_source_binding_contract.md).

## C# source binding subset verified (October 6, 2026)

C# analysis now checks predefined integral parameters, initialized/constant locals, declaration spaces, nested scopes, supported same-class overloads, call order and checked/unchecked contexts. The dialog displays invalid and unsupported findings separately, retains source and keeps graph acceptance disabled. See [source binding contract](design/csharp_source_binding_contract.md).

Pinned Roslyn evidence covers 539 cases (374 compiler-valid, 165 rejected), 458 integral policy pairs and 494 source binding pairs. Four compiler-valid unsupported cases remain recorded: Boolean comparison results, Unicode identifier identity, floating-point overload candidates and user-defined contextual var. This verifies selected types/constants/call signatures, not complete symbol identity or full compilation-unit validity.

The combined batch passes 2,540 package + 1,153 web tests (3,693), native checks, lint (99 existing warnings/zero errors), normal/Pages builds, production/exported browser workflows and artifact checks. All 19 ledger gates are green; unchanged Go/host/server/golden checks retain preceding evidence. Visible saved graphs, IR/printing/inspector ownership, Code-panel fidelity, projects and persistence/reimport remain next, alongside remaining native domains/effects. The full eight-language goal remains active.

## C# predefined integral contract verified (October 5, 2026)

The pure C# fixed-integral contract now checks exact literal domains/suffixes, contextual constant assignment, predefined unary/binary operator selection, casts and checked/unchecked overflow, including C#12 shifts. Facts remain transient and do not fold authored output or establish purity. See [integral contract](design/csharp_integral_value_contract.md).

The native corpus now has 499 cases (349 compiler-valid, 150 deliberately rejected), including 458 independent integral contract/compiler pairs. Promotion/assignment matrices, native widths, literal boundaries, casts at every fixed type boundary, constant arithmetic and shift contexts pass without fixture execution. A UInt64-overflow token is structurally readable to the WASM grammar but receives Roslyn lexical diagnostic CS1021; this distinction is retained and future acceptance must use the semantic/token contract. Native evidence is regenerated before package tests that consume it.

The combined batch passes 2,000 package + 1,113 web tests (3,113), the native stage, lint (99 existing warnings/zero errors) and production build. Unchanged browser/Pages/native-host/server/golden gates retain their preceding evidence. C# source/saved-graph binding and policy integration, remaining native domains/effects, visible graph/IR/inspector ownership, Code-panel fidelity, projects and persistence/reimport remain open. This is not full C# or eight-language completion.

## C# worker/UI source analysis verified (October 5, 2026)

The import dialog offers C# source analysis with expandable declarations, exact retained source and .cs file selection. Worker-owned analysis cannot become a graph acceptance receipt: C# review/acceptance is explicitly blocked, earlier receipts are invalidated, and superseded results are rejected. Core validation also prevents forged C# candidates from entering the JavaScript mapper. Analysis distinguishes readable syntax from semantic/compiler validity; the browser does not yet validate native C# types.

The combined runner verifies 1,079 package + 655 web tests (1,734), lint with 99 existing warnings/zero errors, production/Pages builds and both browser worker/UI workflows. Cold grammar-load cancellation, deadline/recovery, Unicode/declaration retention, malformed syntax, native-invalid but readable syntax, .cs upload, no new project and Go switching pass. Existing 48 browser imports, inspector invalid-edit/recovery, module/reimport persistence and exported Go acceptance/reload pass. All 19 ledger stages are green; unchanged native/compiler/server/host/golden gates retain their preceding evidence. Partial production-browser retries now inspect the build context and add the normal-build prerequisite when Pages has overwritten .next.

C# native value/binding/effect contracts, visible graph/IR/inspector mappings, Code-panel fidelity, project/dependency integration and persistence/reimport remain required. Other languages and the full eight-language goal remain open. See [C# readiness packet](design/csharp_reverse_import_preflight.md).

## C# pinned grammar and source inventory (October 5, 2026)

The shared web-tree-sitter runtime now has independent lazy Go/C# grammar caches. C# uses tree-sitter-c-sharp 0.23.5 (MIT), runtime 0.27.0 and ABI 15; asset generation and exported verification pin its WASM SHA-256. `inventoryCSharpSource` retains immutable whole source/hash, declaration spans/names and nested owners with bounded parsing. Its analysis-only result is separate from graph acceptance receipts. Every unit in the 41 native cases parses, including seven compiler-invalid cases; syntax completeness is not semantic validity.

The combined runner verifies 1,078 package tests, the C# native oracle, lint (99 warnings, zero errors), production/Pages builds, asset hashes and exported browser runtime loading through `/VVS-Web`. Unicode source, C#12 collection syntax, malformed/deep/oversize inputs and concurrent Go/C# grammar loading are covered. Existing exported Go worker preview/accept/reload passes and does not eagerly load C#. Other unchanged gates retain their preceding evidence. C# worker/dialog integration, cancellation workflows, native semantic contracts, graph/IR/inspector mappings, Code-panel fidelity, projects and persistence/reimport remain open. See [readiness packet](design/csharp_reverse_import_preflight.md).

## C# native semantic preflight (October 5, 2026)

The trusted Roslyn harness is integrated before C# visual acceptance. C# 12 / SDK 9.0.310 / Roslyn file version 4.1400.26.6401 / runtime/reference pack 9.0.12 uses x64 library compilation with nullable enabled. Both Roslyn assemblies and all 164 reference assemblies are SHA-256 pinned; SDK/runtime roll-forward is disabled. Fixture source is parsed/bound/emitted only, never executed. Browser grammar and C# source-to-graph acceptance remain unimplemented.

The 41 native observations cover primitive literals/domains, constant/runtime numeric promotion, checked/unchecked conversion, exact float/decimal/UTF-16 values, nullable declared/expression/flow distinctions, overloads, conditional/ternary/coalescing calls, implicit getters/conversions, multi-file aliases and target-typed C#12 collections. Thirty-four compile and seven are deliberately rejected; warnings remain distinct. See [readiness packet](design/csharp_reverse_import_preflight.md) and [native evidence](design/code_visual_csharp_native_evidence.json).

The combined runner now has 19 stages, including csharp-native. Native/inventory/package checks pass; existing application gates retain the preceding verified Go batch evidence because this adds only developer/CI validation and planning infrastructure. CI is configured for the pinned SDK, but a remote CI run and Linux hash portability have not been observed here. Final loaded compiler/runtime/options consistency checks pass, together with all 1,033 package tests and the coverage-ledger gate. This does not complete MP-08 or any remaining-language adapter scope.

## Go visible expression-call ownership (October 5, 2026)

Call Function now has a visible statement/expression placement setting. Go value calls have no execution pins and belong to a single visible expression path; statement calls retain ordinary execution ownership. Graph validation rejects duplicated/shared call evaluation, missing/cyclic/disconnected owners, execution edges and mixed eager dependencies. Binding refresh and inspector placement changes retain value wiring and restore/remove execution pins. Native CallExpr emission preserves conditional operators and repeated loop conditions without invented temporaries.

Eight composed native fixtures and a fixed saved nested-call graph cover conditional calls, ordered arguments, repeated occurrences, loops, scope and graph mutation. Four browser examples add inspector invalid-edit/recovery/reload coverage. All 18 combined validation stages pass: 1,033 package and 610 web tests (1,643 total), 128 native Go AST/type pairs, 741 independent native observations, 134 source/generated compiler pairs, five retained compiler-valid gap reproducers and four compiler/typechecker divergence guards. All 48 browser imports pass, including placement inspector invalid-edit/recovery/reload, two guarded rejection workflows and exported Pages verification. Worker tests cover conditional-call conflict choices and stale ownership receipts. Go package/constants/groups/iota/defined types and the broader eight-language scope remain open.

## Shared expression call ownership preflight (October 5, 2026)

`packages/source-import/src/expressionEvaluation.ts` now inventories distinct call occurrences, argument dependency order and nested conditional operand ownership across current typed expression-plan variants. Go parsing reuses this inventory, and graph materialization independently refuses eager placement of conditional calls. Seven contract tests cover same-function repeated calls, wrappers/collections, nested guards, budgets and parser-independent materialization. All 18 combined stages pass: 1,026 package plus 590 web tests (1,616 total), 741 native Go observations, 120 AST/type pairs, 125 source/generated compiler pairs, retained gap/divergence checks, 44 browser imports and exported Pages workflows. This is a shared preflight implementation; conditional-call graph/IR acceptance remains open, as do cleanup/suspension and the full eight-language scope.

## Go-informed reverse-import delivery (October 5, 2026)

The delivery sequence now uses [the Go lessons and per-language preflight packet](design/reverse_import_go_lessons.md). Native validators and value/binding/evaluation contracts precede broad adapter mapping; representative mixed-feature projects are planned first. Shared conditional-effect regions and Go package/type ownership are the next contract work. This is planning progress; no additional source constructs are enabled by this update.

## MP-09 Go local constant bindings (October 5, 2026)

IR v11 adds visible typed/untyped Go const declarations with readonly bindings and graph-owned initializer expressions. Exact numeric constants retain their values and typed declaration rounding through references, comparisons, conversions, calls, local initialization and loops. Boolean/string constants, concatenation, logical operators and UTF-8 comparison order use the same transient source/graph facts. Local constants may be unused; variables keep Go's use requirement. Constant assignments, dynamic initializers, cycles, incompatible scalar/pin records and damaged readonly metadata block generation. Native Go local dominance is enforced after provenance removal as well; native lowering honors all blocking control-flow diagnostics, including scope errors without a NATIVE_ prefix. Code previews catch async generation failures, discard cancelled requests and show current failures as blocking diagnostics with invalid output/copy disabled. Accepted const declarations also carry the visible Const modifier.

The corpus adds 24 increasingly composed source/generated examples (116 ordinary plus four word-context fixtures), a fixed saved constant graph and 144 independent constant-binding/comparison observations. Browser examples increase to 44, including a declaration-type inspector edit and reload. All 18 combined validation stages pass: 1,019 package and 590 web tests (1,609 total), 120 Go AST/type pairs, 741 independent native observations, 125 source/generated compiler pairs, six compiler-valid gap reproducers and four retained compiler/type-check divergence guards. All 44 browser imports pass, including invalid constant inspector edits, blocking diagnostics, recovery and reload; two guarded rejection workflows and exported Pages checks also pass. These counts verify this bounded batch, not full language coverage.

Six newly reproduced prerequisites are in the coverage ledger: package constants, constant groups/iota, defined numeric types, aliases, short-circuit right-hand calls and native byte strings. Eager pending-call placement cannot implement conditional evaluation, so right-hand calls remain explicitly blocked rather than being silently moved. Go-specific invalid JSON-style escapes/surrogate escapes are rejected; native byte escapes require their own representation. Full Go package/type/project contracts and all remaining eight-language master-plan work stay open.

## MP-09 Go float32 and explicit numeric conversions (October 5, 2026)

Go float32 signatures, locals, calls, arithmetic/comparisons and compound updates now preserve their native width through graph editing and save/reload. Explicit numeric conversions are visible one-operand nodes with a validated editable destination type. IR v10 and a native syntax-pack template emit only the authored target(value), without hidden casts or folded output. Constant conversions check native overflow, fractional-to-integer failures and rounding from the existing exact evidence; runtime conversions retain their native behavior without evaluation. Conversion context controls nonconstant shift typing. Edited conversions cannot resolve to shadowing parameter/function bindings.

The inspector exposes destination choices for Go conversion nodes and hides the unrelated operator field. A generated conversion label follows its target. Code-panel mutation tests verify saved edits, target rejection and native return-type compatibility. Function-tab previews now read the owning visible Function Define native return signature; this fixes numeric return types being replaced with float64. Browser checks await actual editor navigation/canvas before reload and exercise the conversion inspector in its function tab. Native conformance adds 271 constant/runtime conversion observations across 32/64-bit contexts. Coverage contains 92 ordinary Go source/generated fixture pairs plus four word-context pairs, 251 integer and 75 rational observations, 101 compiler pairs and 40 browser imports. The final combined-runner ledger has all 18 stages passing: 987 package + 565 web tests (1,552), 96 AST/type fixture pairs, 597 numeric observations, 101 compiler pairs and four retained divergence guards. All 40 production-browser imports, both guarded rejections, conversion inspector edits, re-import/module persistence and exported Pages worker/assets/editor/reload pass. One earlier exported-editor navigation attempt reached the error boundary; two subsequent checks passed. Its intermittent cause remains an open reliability investigation, with console/network/editor diagnostics retained in the harness.

Constant declarations, defined numeric types/aliases, string/rune conversion, complex constants and the big.Float fallback remain required numeric contracts. Composite/nested count contexts and wider Go bindings, package/type/project semantics remain open. The full eight-language reverse-input goal remains active.

## MP-09 Go exact rational constants (October 5, 2026)

Visible Go floating literals now retain decimal, exponent, underscore and hexadecimal spellings as validated token strings. Untyped arithmetic uses transient exact fractions; native float64 assignment checks overflow and rounds nearest with ties even, including subnormal values and underflow. Integral untyped floats can initialize native integer bindings when representable. Native arithmetic, comparisons, declarations, call arguments, compound updates and applicable shift contexts retain native identity; generated output keeps the original operands/tokens without folded values or hidden conversions. Saved graph checks apply the same contract after edits and reload.

This rational-kernel batch originally left float32 graph bindings open; the subsequent IR v10 float32/conversion batch below integrates them. Outside the pinned Go fraction domain (component bit lengths below 4096), the big.Float fallback remains a reproduced prerequisite. Complex constants, defined numeric types/casts/iota, nonconstant float-based nested count contexts and full Go package/type/project contracts remain open. The full eight-language reverse-input goal remains active.

Coverage now includes 78 ordinary Go fixture pairs plus four explicit word contexts, 251 integer observations, 75 rational observations, ten reproduced gaps and 36 production-browser import examples. Native compiler checks include 87 curated source/generated pairs without execution. All 18 combined validation stages pass: 971 package + 545 web tests (1,516), 82 AST/type pairs, 251 integer + 75 rational observations, 87 compiler pairs and four retained typechecker/compiler divergence guards. All 36 production-browser imports and two rejection workflows pass, as do module/re-import persistence and the actual exported Pages Go worker/base-path assets/accept/reload. Native host/types, server checks, lint, canonical goldens, Code-panel extraction and strict parsing pass.

## MP-09 Go contextual shifts and numeric updates (October 5, 2026)

Go variable shifts now retain native typing from returns, initialized declarations, assignments, call arguments, comparisons and typed operand peers. Unary and composed expressions propagate destination context without persisted conversions or folded output. IR v9 extends visible numeric assignment operators to remainder, bitwise, bit-clear and left/right shifts; shift counts retain independent native types. Large constant shifts use the pinned 1074 count limit and 512-bit result precision, while dynamic shifts permit native-representable counts without allocating or evaluating runtime results.

Simple nested untyped shift counts retain Go's untyped nonconstant behavior. Their literal storage is checked against the pinned compiler's signed/unsigned 64-bit storage bounds independently of target word size. Composed untyped count expressions remain a reproduced feedback item: go/types leaves operands unresolved and can accept inputs rejected by the compiler. Trusted source/generated fixtures now receive compile-only checks, and explicit divergence observations retain importer guards. Imported programs are never executed.

The corpus contains 65 ordinary Go fixtures plus four explicit word-context fixtures, 251 integer type/constant observations and ten feedback gaps. New Code-panel mutations cover destination representability, zero remainder and changed target context; production-browser examples cover contextual/complement/nested shifts, compound assignments and large runtime counts. Package/web verification passes 953 + 531 tests (1,484); 32 production-browser imports and two rejection workflows pass, including module/re-import save/reload checks. Native checks verify 69 AST/type pairs, 251 integer observations, 73 compile-only fixture pairs and four retained compiler/typechecker divergence guards. All 18 combined validation stages pass, including the production/Pages builds and exported Go worker/base-path assets/accept/reload, native host/types, server checks, lint, goldens and strict parsing. The full eight-language reverse-input goal remains active. Go numeric rational/float/complex constants, defined types/casts/iota, composite shift-count contexts and package/build semantics remain open alongside the other language adapters and shared master-plan scope.

## MP-09 exact Go integers and target context (October 5, 2026)

Go integer tokens now retain exact decimal/binary/octal/hex spelling and underscores as validated visible Native Literal payloads. Integer unary/binary operators preserve native syntax, division/remainder, shifts and bit operations without folding, execution or hidden conversions. Shared constant evidence checks representability, overflow, zero division, invalid shifts, native identity and short-declaration inference during import and graph editing. Native word-sized int/uint/uintptr types use the Package Clause node's explicit 32/64-bit context. Import review exposes this choice; save/reload and conflict-aware re-import retain it, and acceptance rejects stale target-context receipts. IR v8 carries native expressions and package word context.

The corpus contains 50 ordinary Go source/generated AST/type pairs plus four explicit 32/64-bit word-context pairs. Independent Go 1.26.4 checks also cover 147 integer type/constant observations. Code-panel mutation checks block corrupted/injected literal tokens, width/sign/range drift, missing or changed word context, inappropriate default inference and incompatible call/assignment/operator values. Ten feedback reproducers retain remaining native gaps; the original value+1 integer example is now accepted. Contextual nonconstant untyped shifts, bounded large-shift handling, rational/float/complex constants, defined types/casts/iota and full package/build/project contracts remain open. Floating constant arithmetic is blocked pending exact rational evidence rather than accepted through generic Number pins.

Combined validation passes all 18 stages: 935 package + 515 web tests (1,450), 54 native Go AST/type pairs across the ordinary and explicit word-context corpora, 147 integer observations, 27 production-browser imports and two guarded rejection workflows. Module/re-import workflows, exported Pages worker/assets/accept/reload, production/Pages builds, native types/host, lint, goldens, Code-panel extraction, server and strict parsing pass. Package context is restricted to the owning file graph; function-body package/settings nodes block generation. The full eight-language reverse-import goal remains active. See [the numeric contract](design/go_integer_domain_contract.md).

## MP-09 Go locals and loop composition (October 5, 2026)

The native Go adapter now preserves initialized typed `var` and inferred `:=` declarations, single assignments, numeric compound/postfix updates, lexical shadowing, partial Boolean branches, counted and condition-only loops, nearest-loop Break/Continue and void call statements. Structured IR v6 and syntax-pack templates retain declaration style/type and each visible loop header component. Set emits `=`; it no longer silently redeclares a local. Short numeric declarations require proven float64 inference; integer constants defaulting to native integer domains remain open. Missing returns, unused/escaped locals, incompatible values and unresolved bindings block source acceptance.

The corpus has 23 independently parsed/type-checked source/generated Go AST pairs and nine reproduced feature gaps. Native graph mutation checks block invalid local style/type/name, removed records, untyped inferred numbers, prefix updates, illegal typed-var loop headers and disconnected reads hiding unused locals. Code-panel tests cover each visible construct through JSON reload and scalar edits; browser imports cover typed reassignment, counted loops/control, repeated calls and nested shadowing. Advanced multi-bindings, integer widths, range iteration, tuples, types/receivers, package context, comments, cleanup and concurrency remain open. The full eight-language goal and MP-09 remain active.

Combined validation passes all eighteen stages: 898 package + 481 web tests (1,379), 23 native Go AST/type pairs, 22 single-file browser imports, closed module import, JS/Go conflict-aware re-import and the exported Pages Go pipeline with base-path asset/persistence checks. Native host/types, lint (existing warnings), production/Pages builds, goldens, Code-panel extraction, server and strict parsing also pass. See the combined runner results in ignored `scratch/batch-validation` and the [coverage report](design/code_visual_coverage.json).

## MP-09 Go library-unit stage (October 5, 2026)

The active all-complete goal covers JavaScript, Python, C#, Go, GDScript, Rust, C++ and the previously deferred Verse/UE6 reverse-import scope. Cross-language translation remains separate. Earlier dated deferral notes below are historical snapshots superseded by this goal. Verse grammar/version/native-validator access remains an open prerequisite; no unsupported language is declared complete.

Go now imports scalar library files through pinned tree-sitter-go 0.25.0/web-tree-sitter 0.27.0 WASM (ABI 15). Visible Package Clause nodes and typed float64/string/bool Function Define records own native signatures and source maps. Returns, scalar comparisons/arithmetic, complete Boolean branches, same-file typed calls and bare void returns round-trip. IR v5 adds a package member. Normal/Pages builds copy parser assets and licenses; transient parser trees are bounded and deleted. The browser import dialog includes Go file, pipeline and branch examples. Parameter names/types follow declaration editing; malformed package/signature/value edits block generation.

The fixed Go graph exercises actual Code-panel source maps, scalar edits, signature renames, binding refresh and JSON reload. Library source re-import retains project settings and rejects stale/conflicting reviews. Trusted Go 1.26.4 go/parser/go/types checks independently compare ten source/generated AST pairs and reject invalid types/bindings. Imported programs are never executed. CI pins the native validator; the combined runner now has eighteen stages.

The JS/Python corpus remains 91 examples (68 supported/23 rejected), plus seventeen native-value probes. Go adds ten positive unit fixtures and nine reproduced roadmap gaps as a separate denominator in `nativeAdapterProbes`. Typed locals, integer domains, tuples, loops, receivers/types, package imports, cleanup/concurrency and comments remain open; full MP-09 is incomplete. C#, GDScript, Rust, C++ and Verse adapter stages and the broader shared-semantic/project/fidelity batches remain incomplete. See [the master plan](design/code_visual_master_plan.md), [adapter research](design/code_visual_adapter_research.md) and [coverage report](design/code_visual_coverage.json).

Combined validation passes all eighteen stages: 885 package + 466 web tests (1,351), ten independent native Go AST/type pairs, invalid native fixtures, native types/host, production/Pages builds, canonical goldens, Code-panel extraction and strict parsing. Eighteen single-file browser imports plus atomic module import and JS/Go re-import retain context through save/reload. Export verification checks parser pins/hashes/licenses and independently imports the Go pipeline from the actual Pages artifact through `/VVS-Web`, verifying all worker JS/WASM requests and persistence. Lint passes with existing warnings.

## Reverse-import objective and MP-03 signatures (October 4, 2026)

Approved scope has since expanded to all eight languages, including Verse/UE6; see the October 5 status above. Cross-language translation is outside this goal's acceptance criterion. The October 5 Go unit stage is implemented; the other new adapters remain unimplemented; parser research alone does not establish acceptance.

MP-03 now supports graph-owned defaults and final rest parameters in file-owned JS/Python functions, and ordered named Python call arguments. Definition-time Python defaults are emitted in native headers; supplied call arguments never receive hidden default literals. Defaults that require enclosing-scope captures or calls remain blocked. Native signature/argument inspector controls edit modes, default pins, supplied count and keyword names; parameter binding refresh preserves default pins and updates names/order. Scalar default/argument pins retain their concrete input type. A fixed callable graph covers Code-panel edits and JSON reload; independent Acorn/CPython ASTs and graph mutation diagnostics cover source semantics. Browser import/accept/save/reload covers the new forms.

Combined validation: all 17 stages pass, including 862 package tests, 453 web tests (1,315 total), 15 production-browser imports, native-host checks, production/Pages builds, fixed Code-panel extraction and strict parsing.

The feedback corpus contains 91 examples: 68 supported and 23 rejected. MP-03 remains incomplete: closures/callable values, destructuring, keyword-only/kwargs/unpacked calls and enclosing-scope default effects remain open. Other adapter and semantic batches retain their explicit prerequisites in the master plan.

## MP-03 callable foundations in progress (October 4, 2026)

Implemented a bounded foundation, not the complete batch: JavaScript file-owned functions retain positional defaults and final rest parameters on visible Function Define records/default pins. Calls retain only explicitly supplied ordered argument pins; omitted defaults are emitted in native signatures, never filled with hidden call literals. Reload/binding refresh preserves these pins. Graph analysis blocks malformed signatures, missing defaults/arguments, target mismatches and invalid supplied arity. Python function locals assigned on every branch become initialized at the join; missing paths and reads before assignment remain blocked. The structured IR amendment is recorded in `docs/design/callable_binding_ir_rfc.md`.

Grouped validation passes: 848 package tests, 444 web tests, native types, native host, production build, canonical Code-panel extraction and strict parse. New default/rest call and branch-assignment examples cover independent JS syntax, persistence, graph arity mutation and actual Code-panel source maps. This does not provide browser inspector editing or certify all MP-03 semantics. Closures/captures, callable values, Python defaults/named/rest arguments and destructuring remain open. MP-04–MP-12 and MP-14–MP-15 remain authorized and incomplete; MP-13 UE6 stays deferred.

## MP-02b native values and visual mappings (October 4, 2026)

All four planned MP-02b scope items are implemented for bounded JS ES2022/Python 3.11 imports: exact scalar settings; ordered native collections, keys/spreads/holes and access/slices; explicit native operator modes; combined round-trip, Code-panel, graph mutation, persistence and browser evidence. Four registry families lower to structured IR v4 through syntax packs; legacy saved graphs regenerate IR without migration. Graph analysis blocks incompatible targets, invalid payloads/ports/container contexts, cycles and disconnected/reordered call evaluations. Native operations retain their language coercion/overload/error behavior without implicit numeric conversion. The syntax corpus now supports 62/85 cases; seventeen additional native contract probes remain a separate denominator. New uncovered variants stay explicit roadmap gaps. See [native contracts](design/native_value_contract.md) and [IR RFC](design/native_expression_ir_rfc.md). UE6 remains deferred.

## MP-01 inventory and MP-07a re-import context (October 4, 2026)

The [all-language coverage ledger](design/code_visual_coverage.json) and [adapter research / ordered backlog](design/code_visual_adapter_research.md) are implemented as planning/evidence tooling. Eight profiles and twenty feature families remain separate from the 85 corpus examples. Rejections are categorized as feature gaps, safety guards or missing dependency contexts. New adapter research does not enable acceptance. MP-07a retains project preferences, workspace/library links, integration/environment settings, pack pins/capabilities, output policies and graph metadata during single-file JS/Python and closed-module re-import. Three-way previews use saved codegen context; incompatible targets/packs, changed output ownership, persistence drift and stale settings block acceptance. Unchanged module files retain their graph edits and output order. The Code-panel/worker and production-browser apply/save/reload paths are covered. Targeted authored-unit merges remain open; UE6/Verse engine implementation remains deferred. Combined validation results are recorded in [the work list](development_worklist.md).

## Reverse-import follow-up batches (October 4, 2026)

The approved control-flow, class, and module/re-import batches are implemented for reviewed subsets: nearest-loop control, repeated conditions, lexical dominance, Python integer/range semantics; JS fields/constructors/receiver and resolved same-file parents; Python constructor-owned classes; named JS module sets and three-way conflict review through File → Re-import source. Complex fixtures and remaining boundaries are tracked in [the expansion plan](design/reverse_import_expansion.md) and [feedback corpus](design/reverse_import_feedback.json). Package/web validation passes 1,220 tests; the feedback corpus now contains 85 examples (58 supported, 27 rejected). All 16 validation stages pass, including ten production-browser imports, re-import review/apply, atomic module import/reload, 32 strict parse cases and 44 exported node-page checks. Remaining semantic boundaries stay explicit roadmap gaps. UE6 remains deferred.

# VVS Web — Current Implementation State

**October 4 control-flow patch:** reverse import includes explicit JS strict equality and proven scalar comparisons, comparison-driven branches, separate After continuations, early returns, JS/Python While and JS counted For with visible initializer/condition/update nodes. Set exposes native compound and prefix/postfix update options for numeric JS locals. The analyzer guards malformed headers, escaped loop locals and unsupported target/operator variants. The import dialog includes a control-flow example. All 16 validation stages passed, including 1,178 package/web tests, Go/native host checks, six browser flows and 31 strict parse cases. The feedback corpus now has 69 examples (39 supported, 30 rejected). Break/Continue binding, effectful repeated conditions, dynamic coercion/truthiness and Python unbounded-integer loop updates remain roadmap gaps. See the RI-C contract in [reverse_import_expansion.md](design/reverse_import_expansion.md).

**October 4, 2026 reverse-import expansion:** JS/Python Library imports now support initialized body-owned locals, type-stable reassignment, ordered statements, complete same-file function sets, forward/nested/recursive calls and explicit native conversions. JS Number and parseFloat retain distinct persisted modes. Scope ownership, readonly identity and conversion-shadowing guards are enforced. The handwritten feedback corpus contains 43 examples: 20 supported round trips and 23 rejected cases with diagnostics and roadmap links. See [the full expansion plan](design/reverse_import_expansion.md) and [generated feedback](design/reverse_import_feedback.json). Comparisons/loop joins, full class semantics, modules, trivia/re-import and additional adapters remain open roadmap work; UE6 remains deferred.

**October 3, 2026 batch:** revision-aware serialized saves and recoverable browser folder transactions; shared pure connection rules; dirty-buffer/multi-root native Generate and output conflict protection; Verse input/Bind diagnostic truth; diagnostic-only export preflight; bounded catalog/search and touch-end fixes; registry-based docs artifacts; narrow Python 3.11 Library import with independent CPython evidence. See [development_worklist.md](development_worklist.md) for exact coverage and remaining host/device gates. UE6 implementation is deferred. COA remains off.

This document is the **canonical snapshot** of what exists in the repo today versus what is still planned. Update this file whenever the UI shell or integration boundaries change. Start is a VS Code-like activity rail + collapsible sidebar (Start includes recent; Examples); Library/Roadmap/Docs stay routes. Start main is a concise graph-to-code hero + recent; actions show in the sidebar on wide screens and in the main area on narrow screens. The redundant first-visit welcome overlay was removed. In-project canvas help remains separate.

**Public repository:** Vision, roadmap, origin story, and contribution guide — [history.md](history.md), [vision.md](vision.md), [roadmap.md](roadmap.md), [../CONTRIBUTING.md](../CONTRIBUTING.md).

Last aligned with codebase: **24 September 2026** (Start, docs, Git catalog, native host slice). Interactive live docs: **partial** (`/docs` catalog + node/feature pages from `CORE_NODE_REGISTRY`; `docsUrl()` / `docsPath()` with home hashes; same `StandaloneTopBar` as Library/Roadmap; `DocsInfoIcon` hover from registry on node headers and Details options (click opens `/docs/nodes/{kindId}` or `#opt-{key}`); modifier chips have no `?` — right-click the chip opens `#opt-{key}`). Guidance for Branch, Print String, and Math Add is shipped; remaining overlay prose and playground are open. Public Pages URL is `https://sheriff99yt.github.io/VVS-Web/docs` (`basePath` `/VVS-Web`; `/docs` on github.io without that prefix 404s). Custom domain (vvscodes.com on this same Pages project) is prepared via `VVS_CUSTOM_DOMAIN` (empty basePath + `SITE_ORIGIN`); **not flipped** until DNS is verified. App chrome uses the original vvscodes.com mark (`public/brand/VVS_White2.png`) in the Start and editor top bars, plus app icon / Open Graph. User-facing docs rewrite `3e1a2b2`. Bind leftover `eventName` hidden in Details (`f864100`). High-priority Research cards: `vscode-native-plugin`, `ue6-native-plugin` (`ccab00d`). Product law unchanged: client-first; eight generate targets (JavaScript is one target); Simple / Complex / Advanced home-preview goldens (U65); Rosetta = pack fixtures; `COA_SHIPPED` false; U93 research; Bind honest on csharp / javascript / gdscript only; Verse GetInput = Print + `(x)` + typed empty-string/zero placeholder; Library auth/upload frozen; no PWA; an initial VSIX is packaged in `apps/vscode` with limited visual editing; UE6 not released as of 22 August 2026 (Epic public EA end of 2027 on the Research card).

Example completeness: Simple + Complex emit with zero leftover `(x)` on all 8 languages; Advanced runs on most (Verse GetInput leftover only). Complex covers branch / for / while / enum switch; Advanced covers Machine/Sensor Diagnose override + GetInput + Wait.
Symbol delete / deleteClass now remove function Define (`function_implement`) with Declare (`function_define`).

Shipped (August 2026): C++/call-site overload emit, language profile JSON packs, off-thread transpile worker, rust + Go console env (`env.rust.console-app`, `env.go.console-app`) + optional `devcontainer` ref (no Docker runtime), Library client token search + language chips (not embeddings; active chip stays at count 0; empty copy names search + chip). First-party templates **Done** (17 built-in env packs; Library lists all). Community catalog still Phase 3 (`library-backend`). Implements list + Class form shipped for csharp/rust (`form` + `implementsTypes`; python does not print Implements; Super stays first Extends parent). Added `env.csharp.data-script` and `env.go.http-service`. Backstage `template.yaml`/skeleton import + Nunjucks `{moduleName}` normalize; environment template refresh (`applied` / `merged` / `kept-yours` / `already-current`; line-based 3-way merge; no merge IDE); host skip/emit + custom path + `appliedTemplate` + in-editor `contents` (Generate emit uses edited text; skip stays skip; no merge IDE). In-app roadmap: `graph-doc-split` shipped (in-memory per-tab documents; folder save one `.graph.json` per container/function; localStorage still full snapshot); `mobile` partial (Agent/Bot/StatusBar chip hidden at max-width 768px; coarse pin snap 40px vs mouse 20px; larger TopNav hit targets on coarse/mobile; gestures and radial menus still planned). `extends-list-mi-locked-visual`, `yield-statement-later`, `switch-match-cl017`, `env-typespec-emitter` shipped (python/cpp multi-base emit; `yield_stmt` py/gd; Switch native match; TypeSpec CLI → apiSurface).

**Product direction:** [visual_to_text_fidelity.md](visual_to_text_fidelity.md) — every behavioral node maps to honest generated text; no Blueprint VM semantics.

**Vocabulary alignment:** Phased implementation plan — [design/terms_refactor_plan.md](design/terms_refactor_plan.md) (glossary: [design/language_neutral_vocabulary.md](design/language_neutral_vocabulary.md)).

---

## Contents

- [Development Approach](#development-approach)
- [Repository Layout (Actual)](#repository-layout-actual)
- [Frontend (`apps/web`) — Implemented](#frontend-appsweb--implemented)
- [Graph system architecture (isolated domains)](#graph-system-architecture-isolated-domains)
- [Transpiler & syntax packs (shipped)](#transpiler--syntax-packs-shipped)
- [Backend (`server/`) — API, registry, optional local MCP sidecar](#backend-server--api-registry-optional-local-mcp-sidecar)
- [Documentation Map](#documentation-map)
- [UI Revision Decisions (Locked)](#ui-revision-decisions-locked)

## Development Approach

**UI-first** with **shared analysis packages** and **text-shaped codegen fidelity** ([visual_to_text_fidelity.md](visual_to_text_fidelity.md)).

- Mock persistence: `apps/web/src/lib/api/mock.ts` (localStorage / fixtures).
- Status chrome must be **honest**: show offline/disconnected, not fake “connected” states.

---

## Repository Layout (Actual)

```text
VVS Web/
├── apps/web/              # Next.js 16 + React 19 editor
├── packages/
│   ├── graph-types/       # ProjectSnapshot v3 (v1/v2 loader), ClassSymbol, analyzeProject, CodegenTarget
│   ├── syntax-registry/   # core-pack.json, list/resolve/expandProjectSymbols
│   ├── language-profiles/ # per-target portability matrix + capabilities + analyzePortability
│   ├── syntax-packs/      # versioned print templates, Rosetta fixtures, fidelity linter
│   └── transpiler/        # analyze → lower (structured IR v2) → print → emit
├── server/                # Go — domain v2 types, registry HTTP, tests
├── docs/                  # Architecture, language_profiles.md, this file
├── tools/                 # start_app.ps1, setup_env.ps1
└── .agents/               # Agent skills + AGENTS.md
```

Web types re-export from `@vvs/graph-types` (`apps/web/src/types/graph.ts`, `projectSnapshot.ts`).

---

## Frontend (`apps/web`) — Implemented

### App views (TopNav)

On `/`, `/library`, `/roadmap`, and `/docs` the left activity rail is the view switch (Start / Examples / Library / Roadmap / Docs). `StandaloneTopBar` is brand + Contribute (no page-switch cluster). In a loaded project the same cluster (Project / References / Library / Roadmap / Packs / **Docs**) lives on the left activity rail (GraphExplorer sidebar still collapses beside it). File / Edit / View menus, Save, and Generate stay in the in-project TopNav.

| View | Purpose |
|------|---------|
| **Canvas** | Primary graph editor (default) |
| **References** | UE5-style reference viewer — focus center, referencers left, dependencies right; huge-project breadth + persisted prefs |
| **Library** | Browse `/library`: templates + git import (Installed is in-project only). Auth / upload frozen |
| **Roadmap** | In-app development roadmap. Browse `/roadmap` uses the activity rail plus Open / Done / Research sidebar (same chrome as Library). |
| **Packs** | In-project pack versions / host skip-emit. With no project loaded, the tab returns home |

**Removed from product UI** (do not re-add as duplicate surfaces):

- ~~Integrations~~ / ~~Connect AI~~ (hosted agent is the in-page TS **Agent** panel; optional Go sidecar paste lives in a collapsed section)

### Canvas layout mode

When **Canvas** is active, the full editor chrome is visible:

```text
┌──────────────────────────────────────────────────────────────┐
│ TopNav: File · Edit · View · [Auto save|Save] [Auto generate|Generate] … │
├──────────┬───────────────────────────────┬───────────────────┤
│ Project  │ GraphTabBar                   │ Code output       │
│ explorer │ GraphCanvas (React Flow)      │ Code preview      │
│ Structure│ + floating details (top-right)│ (@vvs/transpiler) │
│ Symbols  │ + floating compiler log (br)  │                   │
│ API tabs │                               │                   │
├──────────┴───────────────────────────────┴───────────────────┤
│ StatusBar: Local (client-first) · Agent ready/error · Log · compile     │
└──────────────────────────────────────────────────────────────┘
```

### References layout mode

When **References** is active, Canvas chrome is **unmounted** (no edit React Flow instance). A dedicated layout shows:

```text
┌──────────────────────────────────────────────────────────────┐
│ TopNav                                                       │
├──────────┬───────────────────────────────┬───────────────────┤
│ Project  │ Reference graph (read-only    │ Reference tree    │
│ tree     │ React Flow — own provider)    │ (hierarchy)       │
│ (ref     │ UE5 focus + depth/type filters│                   │
│  mode)   │                               │                   │
└──────────┴───────────────────────────────┴───────────────────┘
```

- Single-click in left tree **focuses** the reference graph (does not switch views).
- Double-click **opens** the graph in Canvas.

### Library layout mode

When **Library** is active in-project, TopNav + the activity rail + full-width `LibraryView` + StatusBar are shown. GraphExplorer and the output console stay **hidden**. On `/library` the activity rail plus a Library sidebar (Templates / Git imports) wrap the same view; Installed is omitted in browse mode.

Library sections:

- **Templates** — 17 first-party environment packs (console / web / data / api / game) & OpenAPI/AsyncAPI spec imports; language chips filter by default/supported target (token search, not embeddings). Active language chip stays visible at count 0; empty copy names search + chip. Community catalog is Phase 3.
- **Git Imports** — repo / pack import
- **Installed** — installed extensions
- Auth / upload remain frozen (client-first; no accounts as product)

Local spawnable nodes are **not** listed in Library. They come from `nodeCatalog.ts` via the canvas **spawn catalog** (empty-pane right-click, keyboard spawn, dangling wire, or Node Actions → Add node…).

---

## Graph system architecture (isolated domains)

Edit canvas and reference viewer **must not share one React Flow store**. Implementation:

```text
ProjectProvider
└── GraphWorkspaceProvider          ← document bridge API
    └── GraphWorkspaceHost          ← ALWAYS mounted; no React Flow
        ├── useGraphState           ← live nodes/edges for active edit tab
        ├── useGraphTabSync         ← Map<tabId, GraphDocument>; function bodies retained when tab closes
        ├── registerWorkspace()     ← getDocuments, subscribeMetadata, …
        └── GraphEditContext        ← consumed by GraphCanvas when mounted

Canvas view (mounted only when active):
  ReactFlowProvider (edit)
  └── CanvasWorkspace → GraphCanvas, CodePreviewPanel

References view (mounted only when active):
  ReactFlowProvider (reference)
  └── ReferenceGraphCanvas (read-only layout)
```

**Tab vs document:** Closing a function tab removes it from `openTabs` only. Function/overload body documents stay until the function symbol is deleted. Tree **double-click** / open icon = **Edit function body**; **Define** badge places/focuses the host-graph definition node.
| Layer | File | Role |
|-------|------|------|
| Document host | `components/graph/GraphWorkspaceHost.tsx` | Tab documents, undo, compile dirty, workspace registration |
| Edit state context | `contexts/GraphEditContext.tsx` | Nodes/edges API for `GraphCanvas` |
| Workspace bridge | `contexts/GraphWorkspaceContext.tsx` | `getDocuments()` for References without owning RF |
| Active view | `contexts/EditorViewContext.tsx` | `canvas` / `references` / `library` |
| Document snapshots | `hooks/useGraphDocuments.ts` | Subscribes to workspace metadata revisions |
| Reference layout | `lib/referenceGraphLayout.ts` | UE5 horizontal layout (referencers ← focus → dependencies) |
| Cycle guards | `lib/graphCycles.ts`, `lib/graphRelations.ts` | Wire + cross-graph dependency cycle prevention |

**Agent rules:**

- Do **not** wrap edit + reference canvases in one top-level `ReactFlowProvider`.
- `CodePreviewPanel` reads documents via `useGraphDocuments`, not React Flow `useStore`.
- `referenceRootGraphId` updates via `focusReference()` only — not from `activeGraphTab`.
- `GraphExplorer` / `ProjectTree` uses `mode: 'canvas' | 'references'`; **Symbols | Output** (cycle toggle) + optional API; single-click selects, double-click opens; filter always visible; **Ctrl+Space** / `/` focus filter.
- `useGraphTabSync` debounces metadata notify on edits; prunes closed tabs from `documentsRef`.

Orphan: `components/layout/ReferenceViewer.tsx` — superseded by `ReferencesView`; do not re-add to left panel.

### Editor selection coordination (tree → canvas → code preview)

Single pipeline for project-tree symbol focus, canvas tab changes, and CodeMirror highlights:

| Layer | File | Role |
|-------|------|------|
| Focus API | `hooks/useEditorFocus.ts` | Tree/canvas entry: opens tabs + `navigate(canvasFocusFrame(...))` with explicit `selection` |
| Pure helpers | `lib/editorFocus.ts` | `resolveClassHomeGraphTarget` (dynamic: searches all docs for `class_define`), `canvasFocusFrame`, `resolveVariableFocusFrame` |
| Selection invariants | `lib/projectSelection.ts` | `isTreeSymbolSelection`, `clearCanvasSelectionKeepTreeSymbol` |
| Code preview link | `lib/symbolCodegenLink.ts` | Maps `selection` → `tabId` + `highlightNodeIds` via `collectSymbolUsages` |
| Live validation sync | `hooks/useLiveProjectValidation.ts` in `GraphWorkspaceHost` | Memoized `runProjectAnalysis`; syncs validation to ProjectContext when signature changes (StatusBar + code panel even when output collapsed) |
| Canvas sync | `hooks/useSyncProjectSelection.ts` | Mirrors React Flow selection; preserves tree symbols on deselect/tab change |
| History | `contexts/EditorNavigationContext.tsx` | Versioned frames in `history.state`; `ensureGraphTabOpen` opens container + function tabs |

**Flow:** ProjectTree / compiler log / graph_ref double-click → `useEditorFocus` → `EditorNavigationContext.navigate` → `ProjectContext.selection` + `activeGraphTab` → `CodePreviewPanel` resolves `symbolCodegenLink` (preview tab may differ from active canvas tab on project map) → `displayResultForView.sourceMap` highlight ranges (aligned with pinned **Files** tab paths).

**Class/graph decoupling (July 2026):** Classes are no longer coupled to a fixed "home graph" tab. `class_define` and member define nodes can be placed on **any** graph. The transpiler (`analyzeClassMembers`) discovers class members dynamically across all documents. `insertDefineNode*` resolves the target graph via: (1) existing `class_define` node location, (2) active graph tab, (3) legacy home graph fallback. Double-clicking a class in the ProjectTree spawns a `class_define` on the active graph if one doesn't already exist. Project Tree action badges use absolute overlay positioning to avoid layout shifts.

**Invariants:** Tree symbol selection is never cleared by tab switches or React Flow deselect (`GraphCanvas` + `useSyncProjectSelection`). Tab bar / breadcrumb navigation sets `selection: { type: 'graph', ... }` intentionally. Browser back/forward restores all selection types including `event` / `function` / `class`. Highlight navigation uses the same `sourceMap` as the file list being shown — avoids path oscillation between graph-only and project-wide emit paths.

---

### TopNav actions (Canvas only)

| Control | Location | Notes |
|---------|----------|-------|
| **Auto Generate** toggle | TopNav | When on, debounced validate & transpile on graph dirty; when off, use **Generate** or Ctrl+G |
| **Auto Save** toggle | TopNav | When on, debounced persist **ProjectSnapshot v3** (local; cloud only when hosted features + signed in); when off, use **Save** or Ctrl+S |
| **Save** / **Generate** | TopNav (action segment) | Manual save project / manual generate — same as File → Save project and Edit → Generate |
| Sync code preview | Edit menu (Ctrl+Shift+S) | Refresh code preview from graph without full validation pipeline |
| Validate & compile | — | Same as **Generate** (Ctrl+G) — `runProjectAnalysis()` then transpile when no errors |
| Save project | File menu (Ctrl+S) | Persist **ProjectSnapshot v3** JSON (folder, localStorage, or cloud); v1/v2 load via normalizer |
| **Agent** | TopNav Bot button (tooltip **Agent**) | In-page TypeScript agent. `EditorLayout` mounts `AgentHost` (Worker starts with the editor). `AgentPanel`: prompt, optional local LLM key/base/model in `localStorage` `vvs:agent-llm` (default `https://api.openai.com/v1` + `gpt-4o-mini`). `/tool name json` works without a key. Writes gated by `agentAllowWrites` (default **false**). `window.vvs.agent` / `window.vvs.tools`: `listTools()`, `callTool(name, args)`. StatusBar **Agent ready** / **Agent error** / **Agent…** from `agentStatusStore` (not fake MCP Ready). Collapsed sidecar pastes optional local Go MCP config — not the hosted path. |
| **Docs** | Sixth icon after Packs; Start Explore; `/docs` | Catalog from `CORE_NODE_REGISTRY`. Hover on the header info icon shows registry title / kindId / ports / options (no invented prose). Click opens the kind page. Details Settings option icons open `#opt-{key}`. Modifier chips have no `?`; right-click a chip opens `#opt-{key}`. Overlay essays and playground are not shipped. |
| **Contribute** | TopNav / `StandaloneTopBar` right cluster | GitHub icon. Opens `CONTRIBUTING.md` on Sheriff99yt/VVS-Web in a new tab. Same control on home, library, roadmap, and in-project. |
| Settings | TopNav gear + **Help** menu | Sidebar modal — **Project** · **Editor** · **Shortcuts** (rebind) · **Audio** · **About**. Search catalogs every section (honest Editor blurb, Project grouping includes environment / host skip-emit / host contents / Refresh 3-way merge / export, Audio cards). Replaces flat Project/App tabs |
| Action history (U108 / U114–U117) | Edit menu · floating panel | Shared undo: graph + symbol/class CRUD; survives tab switch; lean canvas snapshots |
| Extract to function | View menu (Ctrl+Shift+E) | Selected nodes → new function graph + Call node; keeps extracted body + Declare |
| Chain select / layout (U75) | Canvas shortcuts | **S** = forward exec + data attrs; **A** = full undirected chain; **S S** = layout (`lane-topo-v1`). Attribute direction in Settings (above / below / below-extended). Head-anchored; multi-chain Y-separate; works inside locked comments |
| Node search (U84/U85) | Canvas overlay + shortcuts | **Ctrl+F** = find in this graph; **Ctrl+Shift+F** = find in all graphs (Layers forced on; prefill from tree symbol). **F** with a tree symbol selected = find in this graph only; otherwise frame selection. Space / Ctrl+K open search respecting Layers. Symbol context menu: Find in this graph / Find in all graphs. Outside click / canvas drag clears tree-symbol focus |
| Tooltips (U94) | Editor chrome | App-default `Tooltip` (`components/ui/Tooltip.tsx`) — portal tips with Esc dismiss + viewport clamp; native `title=` replaced on left panel, TopNav, status, toolbars, panels, nodes, start screen (section/popover heading `title` props remain) |
| Selection / modifiers chrome | Hover + select | **Quick Actions** strip above selection (disconnect / duplicate / comment / delete + ⋯ More). Full **Node Actions** on node right-click (S / S S / A, wires, clipboard, extract, Add node…). Spawn catalog on empty-pane right-click. Modifier chips on hover overlay. U102: Open Graph removed from symbol tree/Details |
| Mouse Back / Forward | Editor navigation | Restores tab / view / selection / **camera viewport** (dwell ~2s after pan/zoom; coalesced unless a graph edit or node-options change intervened). **Not** graph undo — that is Ctrl+Z and Log → History |

### In-page agent (hosted path)

Hosted app (GitHub Pages / editor) uses an **in-page TypeScript agent**. Live canvas is the source of truth. No Cursor, Go, or extra install. `EditorLayout` mounts `AgentHost` — the Worker starts with the editor. Spec: [design/mcp_autonomy_audit.md](design/mcp_autonomy_audit.md).

| Piece | Location | Notes |
|-------|----------|-------|
| **Agent** (Bot button) | TopNav | Tooltip **Agent** opens `AgentPanel` |
| LLM settings | `localStorage` `vvs:agent-llm` | Optional key / base / model; default `https://api.openai.com/v1` + `gpt-4o-mini` |
| `/tool name json` | Agent panel | Runs a named tool without an LLM key |
| Write gate | `uiPreferences.agentAllowWrites` | Default **false**. Gates `add_class`, `add_node`, `remove_node`, `connect_pins` |
| Bridge | `window.vvs.agent` / `window.vvs.tools` | `listTools()`, `callTool(name, args)` |
| Status | StatusBar | **Agent ready** / **Agent error** / **Agent…** from `agentStatusStore` — not fake **MCP Ready** |
| Tools (safe) | `lib/agent/toolDefs.ts` | `list_available_nodes`, `list_syntax_packs`, `list_classes`, `get_graph`, `generate_code` |
| Tools (write) | same | `add_class`, `add_node`, `remove_node`, `connect_pins`. `add_node` refuses leftover kinds (`SPAWN_EXCLUDED_KINDS`) |
| Sidecar (optional) | Agent panel collapsed section | Localhost Go MCP paste-config for Cursor / VS Code / Claude Desktop. **Not** the hosted path. `mcpAllowDangerousTools` does **not** reach Go (`VVS_MCP_ALLOW_WRITE` does) |

**Deferred (do not implement as if shipped):** MCP wrapper for other apps over the same TS package; `save_project` / rosetta / `validate_generated_parse` / `propose_syntax_delta` in the TS runtime; streamable HTTP; live-tab control without the editor open; Chrome DevTools bridge; in-page chat on StartScreen; product accounts.

**Floating panels** (canvas overlay, shared `FloatingPanelShell`):

| Panel | Corner | Compact | Expanded |
|-------|--------|---------|----------|
| Details | top-right | Title (13px) + kind / pins / bound-symbol subtitle | Full property forms |
| Compiler log | bottom-right | Last 3 log lines | Full log with sources |

StatusBar **Output** cycles the floating Output panel (` · Log → History → Activity → off).

**Removed:** mock Play/Pause simulation controls. **Locked:** VVS does **not** execute code (no interpreter, runner, or run-from-editor path). In-app work is edit + Generate + **logical checks / warnings**; execution is third-party after export. `GraphToolbar` and bottom-docked output console also removed.

### Properties inspector (floating)

Context-aware (`ProjectContext.selection`), shown on graph canvas when something is selected. Header type scale matches graph tabs (13px title). Compact (unpinned, pointer away) shows kind/category, pin counts, and bound symbol hints. **Expanded/collapsed state persists** across selection changes. Non-codegen fields (description, node id, comments) are excluded — focus is **pins and codegen parameters**. Graph module settings open from breadcrumb **settings** icon (modal).

| Selection | Panel |
|-----------|-------|
| Variable | `VariablePropertiesPanel` — name, type, binding (instance/static), readonly, default |
| Event | `EventPropertiesPanel` — handler name, parameters (`SymbolParameterEditor`) |
| Function | `FunctionPropertiesPanel` — name, binding, visibility, overloads, return parameters, flags (`isGenerator` persist-only; no `function*`) |
| Node | `PropertySchemaPanel` (when kind defines `propertySchema`) + `NodePinsPanel` — pins, inline values, linked graph; event define/dispatch binding plugin |

Graph-level and project settings → TopNav **Settings** (gear, right of Agent) / View → **Project settings** (`GraphSettingsModal` Project tab: active-graph codegen, properties, project defaults, syntax packs, environment / host skip-emit / host contents / export paths; `isProjectMapTab` gates class form / implements / extends rename). **App settings** (same modal App tab): browser UI prefs — dim unsupported, panel defaults, reset floating layouts. Canvas overlay: icon-only dim (EyeOff) sits left of canvas help; same `dimUnsupportedNodes` pref. Dim is not in TopNav.

**Codegen model:** `documents[tabId].metadata.targetLanguage` and `targetFileExtension` override project-level `targetLanguage` / `targetFileExtensions` for that graph. Unset fields inherit project defaults at emit time (`resolveGraphCodegenSettings` in `@vvs/graph-types`). New graphs seed metadata from project defaults when first opened (`useGraphTabSync`).

Target languages in UI: **Python, JavaScript, C++, Verse, GDScript, Rust, C#, Go, Graph JSON**. Codegen runs in **`@vvs/transpiler`** (facade: `apps/web/src/lib/codegen.ts`). Portability warnings per target: **`docs/language_profiles.md`**. **Function Declare/Define:** all eight targets share the same canvas table — C++ prototypes + out-of-line Define; others U66 `(x) Declare` + in-class Define (never silent omit). Spec: [visual_to_text_fidelity.md](visual_to_text_fidelity.md) § Function Declare / Define per language.

### Graph editor features

Shell and core interactions are in place. **UI backlog:** [`.agents/memory/incomplete-ui.md`](../.agents/memory/incomplete-ui.md) — **U84–U92, U94–U99, U101–U102, U104–U119 shipped** (August 2026); Function constructor/destructor role + leftover-role locks + settings search audit shipped. Remaining: CL-014 honest (x), U93 long-term, U90/library Phase 3. U100 remains cut; Event Bind is **partial** (C# `+=` / JS `.on` / GDScript `.connect` printers+spawn; Details picker + rename write-through shipped; other langs unspawned or `(x)` Bind). **U103 locked** as Class (field or Extends; no Component node) — not remaining work. **Extends list UI shipped** (python/cpp print every Extends row; js/gd/verse/cs first parent only; go/rust hidden). **Implements list + Class form shipped** (cs/rs UI + emit; python does not print Implements; Super stays first Extends parent). `lambda_define`, `flow_try`, `yield_stmt`, and Switch match (CL-017) shipped.

| Feature | Status |
|---------|--------|
| React Flow canvas, custom nodes/edges | Done |
| Context menu node spawn (`nodeCatalog.ts` → registry) | Done |
| Unified node registry (`@vvs/syntax-registry`) | Done — `core-pack.json`, `list`/`resolve`/`expandProjectSymbols`, `propertySchema` |
| Get User Input node (`action_get_input`) | Done — registry kind, schema-driven Settings; Python/JS/C++ emit. Verse stays honest `(x)` + prompt (CL-014 open — no invented player API) |
| Conversion nodes (`convert_to_string`, `convert_to_number`) | Done — explicit per-language calls, source-map highlights, no implicit casts |
| Pin type validation on wires | Done — `PIN_TYPE_MISMATCH` in `@vvs/graph-types` analyze; shared with editor wiring |
| Usability example tests (Simple, Complex, Advanced) | Done — `simpleUsabilityTest.ts`, `complexUsabilityTest.ts`, `advancedUsabilityTest.ts`; Async Fetcher / Dual Class Lab / calculators stay retired |
| Usability test integrity | Done — analyze + wiring + multi-language codegen; drives UI gap discovery per `language_capability_catalog.md` |
| Call Function nodes (`vvs.project.call_function` + `graphBinding`) | Done |
| Dispatch event nodes (`event_dispatch` + `graphBinding.kind: dispatch_event`) | Done — per-event spawn in context menu / tree drag; canvas-first **New event here…** on class graph; emits direct handler call (`self.on_<name>(…)`) |
| Event bind nodes (`event_bind`) | **Partial** — Details picker + rename write-through shipped (same path as Dispatch). C# `+=` / JS `.on` / GDScript `.connect` printers+spawn; other langs unspawned or `(x)` Bind |
| Event emit/subscribe nodes (`event_emit`, `event_subscribe`) | **Blocked** — excluded from spawn catalog; `HIDDEN_EVENT_RUNTIME_UNSUPPORTED` blocks Generate; no `_emit` / `_subscribe` injection in transpiler |
| Program entry (`events[]` `role: 'entry'`) | Done — `event_member_define` + `event_define` on class graph; `on_start` only from canvas; legacy `event_on_start` deprecated; new class/project bootstraps entry via `createClassHomeBootstrap` |
| Function symbols + overloads (`FunctionSymbol`, snapshot v3) | Done — tree, inspector, pin sync; symbols carry optional `classId` |
| Extends list (MI visual) | **Done** — list UI on Declare Class (`extendsTypes`, `[0]===extendsType`); python/cpp print every Extends row; js/gd/verse/cs first parent only (C# Extends extras are not auto-migrated to Implements); go/rust list hidden; Super still first Extends parent |
| Implements list + Class form | **Done** — `form` (`class`/`interface`/`trait`) + `implementsTypes` on Class / `class_define`. UI + emit for csharp/rust only. C# `class Child : Base, IFoo` or `interface IFoo`. Rust `pub trait` + `impl Trait for Type` when Implements has names. Python does not print Implements. Super stays first Extends parent. No `implements_define`. |
| Lambda expression (`lambda_define`) | Done — spawn py/js/cs/rs/gd; capture option; 5-lang pack templates |
| Try / catch (`flow_try`) | Done — spawn py/js/cpp/cs/gd; empty finally omitted; hidden go/rust |
| Yield (`yield_stmt`) | Done — spawn python/gdscript; hidden elsewhere; Python `yield` / bare `yield`; typed value pin via `resolvePinValueExpr`. `isGenerator` persist-only — no `function*` |
| Switch match (CL-017) | Done — Python `match` / Rust `match`; C#/JS/C++ keep `switch`; GDScript/Go/Verse keep if-cascade. Add Case uses `case_*` indices |
| Multi-class projects | Done — `ClassSymbol`, `classes[]`, `activeClassId`, `graphContainers[]` (each container is a real canvas at `documents[container.id]`; default **Project map** at `main-graph`), v2→v3 loader, **Folders** section in ProjectTree **Structure** tab (click folder/class to select; double-click to open graph), class-scoped symbol lists on **Symbols** tab, drag Get/Set/Call/Declare on class graphs only, `graph_ref` on project-map graphs. **Class declare fidelity:** `class_define` required when class has symbols or any member define on home graph; `DEFINE_NODE_MISSING` / `ORPHAN_DEFINE_NODE` for class; panel `addClassWithDefine` + tree Declare badge + restore; deleting `class_define` blocks Generate but preview still shows member body in chain order (no phantom `class Name:` shell). In-page agent + optional Go sidecar: `list_classes`/`add_class`, `class_id` on graph tools. Design: [design/multi_class_symbols.md](design/multi_class_symbols.md) |
| Pin type validation on connect | Done |
| Wire / cross-graph cycle prevention | Done — `graphCycles.ts`, `graphRelations.ts` |
| Linear flow chains (break on middle rewire) | Done — `graphWiring.ts` + editor warning |
| Extract selection to function | Done — `extractToFunction.ts`, Ctrl+Shift+E; keeps body + Declare |
| Variable/function/event lists in explorer | Done — **Symbols** tab: **Functions** (base row + override rows only) → **Event dispatchers** (drag row to dispatch) → **Variables** |
| Generated files browser | Done — **Structure** tab **Output** toggle merges graph folders and project files in one tree: `.vvs/` metadata, emit paths with graph+file icons on the same row, workspace/host stubs; drag classes between folders to set emit path; click generated file opens code preview |
| Searchable dropdowns | Done — `SearchableSelect` replaces native `<select>` in codegen, property panels, import pickers, environment import |
| Import graph / class / module pickers | Done — `ImportGraphTargetPanel` + `projectGraphCatalog.ts`; searchable list of all project graphs |
| Reference viewer (top-level view) | Done — `ReferencesView`, UE5 focus graph + tree |
| Project breadcrumb | Done — compact path + Edit/Refs at start of `StatusBar` (`GraphBreadcrumb`) |
| Graph tabs (main / function / container) | Done — per-tab documents + `GraphTabMetadata` (module fields + optional `targetLanguage` / `targetFileExtension`); Project map (`main-graph`) pinned; legacy macro tabs migrate on load |
| Undo/redo | Done |
| Comment nodes + grouping | Done — color, ungroup, inspector label |
| Drag variable → spawn Get/Set | Done |
| Drag event → spawn Dispatch | Done — tree → canvas drop |
| Reroute pins | Done — `vvs_reroute_node` |
| Copy/paste / Cut / Duplicate | Done — in-app + system clipboard (`graphClipboard.ts`) |
| Simulation / live execution | **Out of scope** — mock Play removed; logical checks + warnings only; third parties execute |
| Pin geometry (distinct shapes) | Done — incl. `data_array`; inline pin widgets |
| Mock project save/load | Done — `ProjectSnapshot` v3 persist; v1/v2 normalizer upgrades to implicit `main-class` |
| Shared analysis pipeline | Done — `analyzeProject` + `analyzePortability` → compiler log / status / code badge |
| Generate / validation pipeline | Done — `projectAnalysis.ts` + `@vvs/transpiler`; errors block compile |
| Code preview | Done — CodeMirror 6; graph language + `.{ext}`; Format JSON; **hover → yellow node/tab outline**; **double-click line → canvas node**; selection highlight via `sourceMap`; live analysis. Full UX: [code_panel.md](code_panel.md) |
| Graph History | Done — **Output panel → History / Activity**; `` ` `` cycles tabs; undo/redo restores edits **and** jumps to that location (not mouse nav); mouse Back/Forward = navigation history only; edit while newer exist → in-app confirm |
| Editor focus | Done — `useEditorFocus` + `editorFocus.ts` + `projectSelection.ts` + `symbolCodegenLink.ts`; tree opens pass explicit `selection` through `navigate()`; compiler log variable jumps open class home graph; function overload preview respects active tab |
| Error navigation | Done — validator log / status bar → canvas node |
| Library install flow | Done — install, detail panel, open in project |
| In-page agent | Done — `AgentHost` + `lib/agent/` Worker; tools against the live canvas; writes via `agentAllowWrites` (default false); leftover kinds refused on `add_node` |
| Health chrome (optional HTTP / sidecar) | Done — `useApiHealth`; `VvsApi.probeMcp` only for the optional Go sidecar, not the hosted path |
| Call overload picker | Done — `CallNodeOverloadPanel` in floating details when `func.overloads.length > 1` |
| Syntax pack lock UI | Done — `SyntaxPackLockPanel` in graph settings → `.vvs/project.json` |
| OpenAPI / AsyncAPI import UI | Done — `EnvironmentImportModal` (Library + graph settings); `VvsApi.importEnvironment` |
| HTTP project API (frontend) | Done — `VvsApi.listProjects`, `compileProject`, save/load when `NEXT_PUBLIC_API_MODE=http` |
| Stable folder reopen key | Done — `folderKeyFromHandleName()` dedupes recents by folder name hash |
| File New / Import JSON | Done |
| `VvsApi` facade | Done — `lib/api/` |
| Graph domain isolation | Done — `GraphWorkspaceHost`, split `ReactFlowProvider`s |
| Shared monorepo packages | Done — `graph-types`, `syntax-registry`, `language-profiles`, `syntax-packs`, `transpiler` |
| Syntax packs + Rosetta suite | Done — `@vvs/syntax-packs` base JSON packs, capability overlays, golden tests, fidelity linter — [syntax_pack_architecture.md](syntax_pack_architecture.md) |
| Structured IR v2 + print layer | Done — language-neutral `lower/graphToIr.ts`, `print/` registry, hybrid JSON + TS emit |

### Mock data sources

| Data | File / package |
|------|----------------|
| Core node pack | `packages/syntax-registry/core-pack.json` |
| Spawn catalog (web) | `apps/web/src/lib/nodeCatalog.ts` → `buildCoreCategories()` |
| Project call palette | `apps/web/src/lib/projectNodeCatalog.ts` → `expandProjectSymbols()` |
| Advanced usability example (two classes / one graph) | `apps/web/src/lib/usabilityExampleTests/advancedUsabilityTest.ts` |
| Simple usability example | `apps/web/src/lib/usabilityExampleTests/simpleUsabilityTest.ts` |
| Complex usability example | `apps/web/src/lib/usabilityExampleTests/complexUsabilityTest.ts` |
| Code panel Test Project extract | `apps/web/scripts/extract_test_project_outputs.ts` → `apps/web/test_project_outputs/` |
| Project transpile (Code panel) | `apps/web/src/hooks/useProjectTranspileResult.ts` |
| Codegen | `packages/transpiler` + `@vvs/syntax-packs` — web facade: `apps/web/src/lib/codegen.ts` |
| Rosetta fixtures | `packages/syntax-packs/rosetta/` — print, branch, assign, call, convert, dispatch, wait, for, while, switch, sequence, import_module, await_wait, call_native (+ `.golden.txt` per family) |
| Syntax pack lock | `.vvs/project.json` → optional `syntaxPackLock` on `VvsProjectManifest` |
| Project analysis | `packages/graph-types` (`analyzeProject`) + `packages/language-profiles` |
| Web analysis wrapper | `apps/web/src/lib/projectAnalysis.ts` |
| Live validation hook | `apps/web/src/hooks/useLiveProjectValidation.ts` — memoized analysis → ProjectContext |
| Reference layout | `apps/web/src/lib/referenceGraphLayout.ts`, `referenceTree.ts` |
| Cross-graph index | `apps/web/src/lib/graphRelations.ts` |
| Cycle detection | `apps/web/src/lib/graphCycles.ts` |
| Wire validation / apply | `apps/web/src/lib/graphWiring.ts` |
| Function pin sync | `apps/web/src/lib/functionHelpers.ts` |
| Extract to function | `apps/web/src/lib/extractToFunction.ts` |
| Community library cards | `lib/libraryCatalog.ts`, `LibraryView.tsx` |
| Save/load | `apps/web/src/lib/api/` (`VvsApi` mock → `localStorage`) |

### Running tests

From repository root (Bun workspaces):

```bash
bun install
bun test packages/syntax-packs packages/transpiler packages/graph-types
cd apps/web && bun test src/lib
cd server && go test ./...
```

CI (`.github/workflows/ci.yml`): **packages** job runs syntax-packs / transpiler / graph-types / language-profiles / syntax-registry suites + `validate:parse --strict`; **web** job runs lint / build + `src/lib` tests; **server** job runs `go build` + `go test`. **Release cycle:** Pages + floating `pre-release` on each green `main` (`.github/workflows/pages.yml`); SemVer zips on `v*` tags (`.github/workflows/release.yml`). Local Pages gate: `bun run pages:verify` (see [setup.md](setup.md) § Release channels).

---

## Transpiler & syntax packs (shipped)

Three-stage pipeline with a **decoupled print layer** — see [syntax_pack_architecture.md](syntax_pack_architecture.md).

```text
Graph → analyze/ → lower/graphToIr (structured IR v2, IR_VERSION=2)
                 → print/ (PrinterRegistry + @vvs/syntax-packs templates)
                 → emit/ (module layout, events, hoisting, multi-file)
```

| Component | Location | Status |
|-----------|----------|--------|
| Structured IR | `packages/transpiler/src/ir/types.ts` | Done — `IrExpr` tree, structured stmts; wave-1 `IrEmittedStmt` deprecated |
| Language-neutral lowering | `packages/transpiler/src/lower/graphToIr.ts` | Done — no target-language strings in lower/ |
| Print registry | `packages/transpiler/src/print/` | Done — **eight pack-driven families** (python, javascript, cpp, verse, gdscript, rust, csharp, go) pack-first |
| Print adapter | `packages/transpiler/src/print/template.ts` | Done — `printFromTemplate`, pack `layout` helpers (`bodyIndent`, `blockPlaceholder`, `emptyHandlerBody`, …) |
| Unified block emit | `packages/transpiler/src/print/blocks.ts` | Done — `buildIfBranch` / `buildForLoop` / … for string print path (`stmt.ts`) |
| Block close helpers | `packages/transpiler/src/print/blockHelpers.ts` | Done — `condSpanOffset`, `blockCloseLine`, `ifElseLine` shared with `emit/sinkStatements.ts` (span-aware nested emit) |
| Nested emit sink | `packages/transpiler/src/emit/sinkStatements.ts` | Done — writes IR to `CodeSink` with `sourceMap`; headers/closes via `blockHelpers` + pack templates; **Switch** case bodies via nested `appendIrStatements` (U71a — not string-join leaf) |
| Pack render engine | `packages/syntax-packs/src/render.ts` | Done — `renderQuasi`, `renderLego`, `renderTemplate`; pack `layout` (indent, placeholders, comment prefix) |
| Module emit | `packages/transpiler/src/emit/classModule.ts` | Done — unified class module + function tab emitter; **pack shell templates** for class open/close, handlers, function headers |
| Module shell renderer | `packages/transpiler/src/emit/shell.ts` | Done — `ClassModuleOpen`, `EventHandlerOpen`, `FunctionDefOpen`, etc. from pack JSON |
| Empty body layout | `packages/transpiler/src/emit/layout.ts` | Done — `emptyHandlerBody` / `emptyFunctionBody` from pack `layout` (no hardcoded `pass` / `// empty` in emit) |
| Pack migration CI gate | `packages/transpiler/src/print/packMigrationGate.test.ts` | Done — bans legacy emitters in `stmt.ts` / `expr.ts`; per-language `emit/*.ts` removed; `classModule` + `sinkStatements` use pack helpers |
| Base syntax packs | `packages/syntax-packs/src/packs/*.base.json` | Done — full Rosetta + shell + layout for all eight families |
| Capability overlay | `javascript.es2022.json` | Done — proof of inherit-only version deltas |
| Rosetta fixtures (pack goldens; not home-preview) | `packages/syntax-packs/rosetta/` | Done — **14 fixtures × 8 families** (112 golden pairs); regen via `scripts/update-{family}-goldens.ts` |
| Pack coverage gate | `packages/syntax-packs/src/packCoverage.test.ts` | Done — required Rosetta + **shell** template keys + layout profile per base pack |
| Fidelity linter | `packages/syntax-packs/src/fidelity.ts` | Done — CI via `rosetta.test.ts` |
| CodegenTarget | `packages/graph-types/src/codegenTarget.ts` | Done — family + capabilities + syntaxPackLock |
| Graph codegen settings | `packages/graph-types/src/graphCodegen.ts` | Done — `resolveGraphCodegenSettings`, `codegenMetadataSeed` for new graphs |
| Tree-sitter parse CI | `packages/syntax-packs/src/parseValidation.ts` | Done — python/javascript on Linux CI (`validate:parse --strict`); skips gracefully on dev machines without native prebuild |
| Syntax pack MCP tools | `server/internal/transport/mcp/` | Optional Go sidecar only — `list_syntax_packs`, `propose_syntax_delta`, `run_rosetta_suite`, `validate_generated_parse`. Not in the in-page TS runtime (deferred) |

### Codegen fidelity (strict)

**Product promise:** The canvas is the source of truth for generated code — [visual_to_text_fidelity.md](visual_to_text_fidelity.md) § Canvas is the source of truth.

| Rule | Implementation |
|------|----------------|
| **Emit path** | `appendIrMembersInOrder` / `ir.members` from member chain only — **no** sidebar preamble (`appendLegacyPreamble` removed); class shell only on `ClassDecl` |
| **Symbol tables** | `variables[]`, `functions[]`, `events[]` are indexes; panel creates **dual-write** define nodes via `defineNodeSync` / `useSymbolLifecycle` |
| **Define nodes** | `class_define`, `var_define`, `function_define`, `event_member_define` on `classHomeGraphId` exec chain |
| **Class declare** | `class_define` required when home graph has any member define chain (`classRequiresClassDefine`); blank class with no defines passes analysis; symbols-only off-canvas → `DECLARATION_NOT_ON_CANVAS` (not duplicate class `DEFINE_NODE_MISSING`); deleting class Declare omits `class Name:` shell in preview but **blocks Generate** |
| **Program entry** | `events[]` with `role: 'entry'` — same `event_member_define` + `event_define` pattern as custom events; codegen `on_start` **only** when user wired entry on canvas; legacy `event_on_start` → `LIFECYCLE_NODE_DEPRECATED`; **no** transpiler-injected empty `on_start()` |
| **Compile gate** | `analyzeProject` errors block Generate in TopNav when `!analysis.ok`; code preview syncs live analysis via `useLiveProjectValidation` (signature-guarded, no render loops) |
| **Event model** | **Dispatch** supported (direct call); **Bind** prints one registration line on C# / JS / GDScript; Details picker + rename write-through shipped; **Emit** / **Subscribe** blocked — no hidden `_emit` / `_subscribe` runtime; duplicate On without a Bind → `MULTICAST_REQUIRES_SUBSCRIBE` |
| **Strict diagnostics** | `DEFINE_NODE_MISSING`, `DECLARATION_NOT_ON_CANVAS`, `ORPHAN_DEFINE_NODE`, `PROGRAM_ENTRY_MISSING`, `PROGRAM_ENTRY_NOT_ON_CANVAS`, `LIFECYCLE_NODE_DEPRECATED`, `HIDDEN_EVENT_RUNTIME_UNSUPPORTED`, `MULTICAST_REQUIRES_SUBSCRIBE` |
| **sourceMap** | Every emitted declaration and statement maps to a canvas `nodeId` for code-panel highlight. Nested control-flow bodies (If/For/While/Sequence/**Switch**) tag each statement via `appendIrStatements` — no per-`kindId` highlight UI |
| **Imports** | Shared Import Module once at file top on first class chain; flow Import Module for conditional imports; `targetLanguages` gate; optional `ownerClassId` |
| **Event peer order** | Event defines order by canvas **Y** (event→event exec does not force sequence) |

**Open leftovers (August 2026):** ctor/dtor Function role + leftover-construct catalog locks + settings search audit + emit/OOP + **in-page TypeScript agent** + **U89 / U92** + consume-path completeness shipped. U91 dual-consent / MCP Ready are **not** product chrome (`agentAllowWrites` is the real in-page write gate). Open: CL-014 honest `(x)`, U93 long-term, U90/library Phase 3 (`vvs-library` repo + web UI). **U103 locked** as Class (field or Extends; no Component node). Client-first: **no dedicated server**, **no live code execution**. See [roadmap.md](roadmap.md) · [code_panel.md](code_panel.md) · [design/mcp_autonomy_audit.md](design/mcp_autonomy_audit.md).


Simple, Complex, and Advanced pass strict analysis. Environment templates and library import must spawn define nodes or fail analysis.

---

| System | Planned location | Status |
|--------|------------------|--------|
| Macro tabs + `use_macro` | Removed — **Function + Call** only; migration on load ([visual_to_text_fidelity.md](visual_to_text_fidelity.md)) |
| Full IR pipeline (lower/emit split) | **Done** — structured IR v2 + `print/` + `emit/`; see [syntax_pack_architecture.md](syntax_pack_architecture.md) |
| Label-free legacy migration | apps/web + graph-types load | **Done** — `kindId` backfill on load; binding-first `normalizeNodeData` |
| Ambiguous overload resolver UI | Call node details | **Done** — overload dropdown in floating details |
| Syntax pack MCP tools | `server/` Go | **Optional sidecar** — same tools via thin MCP wrappers. Hosted path is the in-page TS agent (no rosetta / validate_parse / propose_syntax_delta there yet) |
| Tree-sitter parse validation | CI | **Done (Python/JS)** — validator-only check on Rosetta outputs; unsupported local runtimes skip gracefully |
| GDScript language profile | `packages/language-profiles/src/profiles.ts` | Done — native static func, extends; overload unsupported |
| Godot environment template | `env.gdscript.godot-game` | Done — Node extends, `_ready` / `_process`, `project.godot` stub |
| `language-profiles/src/packs/*.profile.json` | packages | **Done** — JSON packs load into `LANGUAGE_PROFILES` at init; types + warning copy stay in TypeScript |
| Supabase auth / persistence | Go + self-hosted Supabase (`pgx`) | **In repo / not product** — foundation exists for local experiments; **no dedicated server hosting** as product direction ([roadmap.md](roadmap.md)) |
| MCP server transport | `server/` Go | **Optional local sidecar** — SSE at `/mcp`. No remote hosted MCP URL. Streamable HTTP deferred. Later: thin MCP wrapper over the same TS package for other apps |
| HTTP project REST | `server/` Go | **Done** — `GET/PUT /api/projects`, `POST …/compile`; memory or Postgres via `DATABASE_URL` |
| WebSocket collaboration | `server/` Go | Not started — Go WS (not Supabase Realtime) |
| PWA / offline sync | — | **Out of scope** — prefer folder / `.vvs/` + git; no VVS sync server |
| Community library backend | Separate library git repo | Client Library shipped (templates / git import / token+chips). Auth / upload **frozen**. Read-only static catalog fetching and source links are implemented; robustness and reviewed automatic consumption remain Research |
| **UE6 editor plugin (Verse)** | `plugins/` (planned) | **Open / Research** `ue6-native-plugin` — after a real UE6 release. Not Alpha. [roadmap.md](roadmap.md) |
| **Native VS Code plugin** | Research tab | **Partial** `vscode-native-plugin` — initial native VSIX supports workspace files, Generate, and limited graph editing; full graph editing and extension-host smoke test open; iframe Pages reject |

---

## Backend (`server/`) — API, registry, optional local MCP sidecar

**Phase 2 (redirected):** Client-first local / folder / `.vvs/` is the product path. Self-hosted Postgres + GoTrue code remains in `server/` for reference — **not** an open VPS deploy track. See [roadmap.md](roadmap.md) § No dedicated server · [deployment.md](deployment.md) (legacy banner).

- `internal/core/domain/graph.go` — nodes, `GraphBinding`, `FunctionSymbol`
- `internal/core/domain/snapshot.go` — `ProjectSnapshot` v3 mirror (`classes[]`, `activeClassId`, symbol `classId`)
- `internal/core/domain/migrate_v3.go` — v2→v3 normalize on load/save (synthetic `main-class`)
- `internal/core/registry/` — embedded `core-pack.json`, environments, syntax-packs
- `internal/core/store/` — `ProjectStore` interface; `MemoryStore` (default) + `PostgresStore` (`DATABASE_URL`); migration `001_projects.sql`
- `internal/core/auth/` — JWT middleware (`AUTH_REQUIRED`, `SUPABASE_JWT_SECRET`); dev user when auth off
- `internal/core/services/` — project, graph_edit, compile, **class** (pure functions; user-scoped via `context`)
- `internal/transport/http/` — projects, compile, CORS (`Authorization` header)
- `internal/transport/mcp/` — MCP tools (thin wrappers; pass `ctx` to services); session-scoped user auth via SSE hooks
- `cmd/vvs-server/main.go` — `OpenFromEnv`, auth middleware, health shows `store` + `auth` mode
- `migrations/` — embedded SQL for Postgres bootstrap

**Local dev defaults:** no `DATABASE_URL` → memory store; `AUTH_REQUIRED=false` → `DevUserID`.  
**Frontend:** `NEXT_PUBLIC_API_MODE=http` + `apps/web/src/lib/api/client.ts` sends Bearer token on project APIs; `session.ts` holds access token; `AuthButton` (TopNav) signs in via Supabase GoTrue when env set; `cloudPersistence.ts` prefers Go API save/load when authenticated; **Auto save** toggle debounces full snapshot persist (local + cloud).

---

## Documentation Map

| Document | Use when |
|----------|----------|
| **`docs/history.md`** | Origin story — VVS 1 graduation project → VVS Web |
| **`docs/node_system.md`** | Node registry, ports, pin types, symbols, portability (§13), transpile contract |
| **`docs/syntax_pack_architecture.md`** | Syntax packs, IR v2, Rosetta, agent workflow, Tree-sitter validator-only |
| **`docs/language_profiles.md`** | Per-target native/emulated/unsupported features + warning semantics |
| **`docs/vision.md`** | Product philosophy, UE6/Verse direction, logic/syntax model |
| **`docs/roadmap.md`** | Public roadmap — Active / Next / Recently completed (mirrors in-app Open · Done) |
| **`docs/code_panel.md`** | Code panel navigation, highlight, hover, Files pin |
| **`docs/deployment.md`** | Legacy self-host notes — **not** product direction (client-first; no dedicated server) |
| **`docs/current_state.md`** | What exists today; avoid re-introducing removed UI |
| **`docs/design/interactive_docs_architecture.md`** | Live `/docs` catalog (partial). Overlay + playground still planned |
| **`docs/ui_api_delivery_loop.md`** | Wiring UI to APIs — one slice per iteration |
| `docs/naming_and_product_direction.md` | Vocabulary, product principles, terms to avoid |
| `docs/project_requirements.md` | Full requirements + phased roadmap (planning) |
| `docs/vvs_2_0_tech_stack.md` | Locked technology choices |
| `docs/environment_templates.md` | First-party env packs |
| `docs/visual_to_text_fidelity.md` | Text-shaped graphs |
| `docs/README.md` | Documentation index |
| `.agents/AGENTS.md` | Architecture rules for agents |
| `.agents/skills/vvs_ui_development/SKILL.md` | UI shell layout + design rules |
| `.agents/skills/vvs_progressive_disclosure/SKILL.md` | Show data when needed — collapse, reveal, idle inspector |
| `.agents/skills/vvs_solid_principles/SKILL.md` | SOLID principles for this monorepo |
| `.agents/memory/` | Agentic memory — decisions, loop progress, **incomplete UI backlog** |
| `.agents/skills/vvs_agentic_memory/SKILL.md` | When to read/update agent memory |

**Do not** duplicate `docs/roadmap.md` phase tables elsewhere in the app — the Roadmap view shows Open tracks vs Done only.

---

## UI Revision Decisions (Locked)

These were intentionally removed or relocated during the July 2026 UI revision:

1. **Integrations tab** / **Connect AI** → in-page **Agent** panel (hosted path); optional Go sidecar paste in a collapsed section
2. **Library local node browser** → context menu + `nodeCatalog.ts`
3. **GraphToolbar** → compile/simulation in TopNav; save in File menu
4. **Fake connected status** → honest offline/disconnected chrome
5. **Target language in code panel** → **LanguageExtensionMenu** in code top bar (hover → extension submenu; language-only click → first extension). Secondary emit options (`//`, `(x)`, sync) live in floating **details** when selection type is `code`.
6. **Library view with side panels visible** → full-width Library mode
7. **References in left project panel** → top-level **References** view; tree drives focus via `focusReference()`
8. **Shared React Flow provider for edit + reference** → separate providers; `GraphWorkspaceHost` always mounted for documents
9. **Explorer Symbols/Output tabs** → compact cycle toggle + always-on filter bar; **Ctrl+Space** focuses project filter; class scope row removed (status bar / class list)
10. **Canvas virtualization (U83)** → `onlyRenderVisibleElements` on edit + reference canvases; see `lib/graphVirtualization.ts`

## Experimental source import (30 September 2026)

Start → Import JavaScript source opens a lazy-loaded local review dialog. One supported plain class becomes a fresh project after normal analyzer and structural Generate round-trip checks. The existing `on_start` method requires explicit entry-role mapping. The first subset covers parameters/literals/arithmetic and terminal Return/If/Else; unsupported constructs block acceptance. Full original source/hash/ranges persist on the Class Declare node. General U93, broader standalone/module syntax, other languages and re-import remain open; the closed JavaScript Library-function pilot is described below. See [code_to_visual_import.md](design/code_to_visual_import.md).

The approved stages 0–3 migration is implemented in `@vvs/source-import`: UI-free parser/planner/registry/materializer with a separate validation entry point, public graph binding helpers, full-file Rosetta fixtures and independent Acorn/projection/mutation evidence. Arithmetic requires provably numeric literal operands; terminal if/else requires Boolean literal conditions. Acceptance checks the exact sealed source/config/graph transaction and save/load provenance. [Milestone details and capability gaps](design/reverse_import_milestone.md). Module/function scope design and workers remain later milestones.

The subsequent multilanguage plan has a first foundation slice: eight versioned adapter profiles, separate evidence contracts, a 112-record Rosetta audit inventory and fail-closed translation decisions in `@vvs/language-profiles`; lazy future-adapter contracts and explicit Unicode offset conversion in `@vvs/source-import`. All 56 ordered language pairs have uncertified blocker coverage. This does not enable new import languages or certify translations. Compilation-unit RFC, actual progress and remaining pilots/workers: [bidirectional execution](design/bidirectional_execution.md).

The next slice adds an explicit versioned Program/Library file policy in graph settings. Legacy projects retain required entries; library units can omit them without weakening declaration fidelity. JavaScript class import offers Library mode with ordinary method roles and seals that policy into acceptance. Preview/review/acceptance run in a cancellable worker with hard deadlines, stale-response rejection and worker-owned receipts. The subsequent closed standalone JavaScript pilot is described below; other-language pilots and general standalone syntax remain open. Details and verification are in the execution document above.

The standalone JavaScript Library pilot imports one closed named synchronous script function into visible file-owned Declare/Define nodes in organizational Global scope. No source class or entry is invented. It reuses conservative expression/flow mappings, worker review, immutable provenance and sealed acceptance. Module exports, calls/locals/captures and other-language reverse adapters remain open.


## Roadmap research refresh (30 September 2026)

The existing `/roadmap` Open and Research views now include the post-PR8 recommendations, priorities, dependencies, proposed acceptance gates and pinned/primary sources for all 13 topics. The Open list adds revision-safe persistence and a shared graph-edit contract, and recognizes the implemented JS Library-function pilot, limited VS Code editor and read-only Git catalogs. This is a planning/content update only: it does not implement the recommended reliability, conformance, search, touch or docs fixes. See [roadmap.md#research-follow-through](roadmap.md#research-follow-through).
