## Visible inferred graph/IR checkpoint (October 7, 2026)

Opt-in C++/Rust/GDScript inferred source graphs now retain visible authored inference modes and exact spelling instead of substituted explicit types. Saved function analysis recomputes initializer types without the declaration cache as an inference hint, checks mirrored types/ports, and shares bounded Rust fixed-initializer constraints with source analysis. C++ auto groups preserve one ordered owner and common deduction; IR v21 and language packs preserve auto/unannotated let/:= output. Ten composed disk-backed Code-panel fixtures cover chains, Boolean shadowing, C++ unsigned-char promotion and inferred groups; exact full-file goldens, node spans, normalized reload, individual renames, stale same-domain widths/foreign modes and unsupported Rust unsuffixed edits pass. Combined4,371 package/1,322 web tests, public API types, lint99, production build, existing usability goldens and canonical disk extraction pass. Native source/Code-panel85 checks pass:22 fresh inferred generated/renamed and new C++ original inputs,63 exact retained inputs. Inference28/local-body18/initialization45 are verified exact retained evidence. Initial failures were TypeScript union narrowing, wrong Rust/Godot fixture extensions and a Boolean mutation that left the type unchanged; focused repairs passed affected gates while retaining unchanged checks. No fixture execution. Public previews require inferredLocals:true; worker/sealed reviews remain unchanged and do not admit inference yet. Complete mode/deduction reconciliation, inspectors, sealed lifecycle/production/Pages workflows, forward/default/deferred contexts, broader all-eight-language scope/projects and authoritative Verse access remain open. Full goal stays active.

- Shared predicate: graph-types/nativeInferredExpressions.ts; binding nativeInferenceMode; source preview inferredLocals; IR21 NativeScalarInferenceMode and pack DeclareNativeInferredLocal templates. Actual inferred fields are graph owned; stored nativeType is a checked mirror, not initializer inference context.
- Last runner49966 terminated successfully; no live runner. Continue [mode/deduction transactions, inspector and admission](../../docs/design/native_inferred_initialization_batch.md).

## Inferred-local source-analysis checkpoint (October 7, 2026)

The shared source-analysis prerequisite now distinguishes C++ auto, fixed-type Rust inferred lets and GDScript := from authored scalar types through explicit inferredLocals opt-in. Ordered bindings/references, native result types, authored inference modes, exact spans and unknown runtime values are retained. Mixed C++ auto-group deductions reject; Rust unconstrained numeric locals with later i8/i64 constraints remain unsupported rather than becoming fabricated i32 locals. GDScript initialization now recognizes := as an inference marker, while dynamic = and native defaults retain separate boundaries. Sixteen source fixtures and28 independent pinned compiler inputs pass, including C++ decltype/Rust fixed-type positive and false-type calibrations. Godot evidence covers native validity/applicability, not independent exact inferred-type or runtime-default observations. Combined4,371 package tests and public API types pass. Exact unchanged native evidence is retained:63 saved Code-panel inputs,18 local-body contrasts and45 initialization cases; no fixture execution. The initial failure exposed the GDScript initialization marker, then a diagnostic expectation was corrected to the actual BINARY_DOMAIN code. Affected retries pass. Production/Pages builds,1,312 web tests,lint99 and established group/local browser evidence remain retained; no new inferred graph/UI/worker/browser acceptance is claimed. Visible inferred declaration modes, saved recomputation, IR/packs/inspectors/lifecycle, forward constraints, deferred/default contexts, wider language semantics/projects and Verse access remain required. Full goal stays active.

- Paths: source-import/nativeLocalInference.ts and nativeLocalSourceBodies.ts; test/native-inferred-local-cases.json; explicit native-local-inference runner stage. Private/worker graph options remain unchanged; materializeNativeLocalBody explicitly rejects inferenceMode until visible mappings exist.
- Last runner27462 terminated successfully. No live runner remains. Continue [the full dependency packet](../../docs/design/native_inferred_initialization_batch.md).

## C++ declaration-group checkpoint (October 7, 2026)

C++ typed initialized comma declarations now import as a visible group owner with ordered declaration children, exact binding identities and separate group/child source spans. Saved readers reconstruct actual order and initialization; IR v20 and C++ pack templates preserve authored grouping while retaining the C# contract. Coordinated group and child type/mutability edits update indexes/ports together and retain incompatible wiring for blocking diagnostics and recovery. Sealed worker acceptance, invalid-type save/reload/recovery, individual rename, valid persistence, unchanged reimport and both conflict choices pass in production and Pages. Shared typed-local workflows also pass for C++/Rust/GDScript in both artifacts. Combined 4,355 package tests, 1,312 web tests, public API types, lint (99 existing warnings), production and Pages builds pass. Native source/Code-panel checks pass all63 inputs:6 fresh C++ composed original/generated/renamed/alias/incoming/const-write-rejection checks and57 exact retained inputs. Earlier foundation compiled4 group inputs while retaining53; initial goldens/canonical disk extraction passed and remain retained. No fixture source executes. This closes only the supported C++ group packet; inferred/deferred/default bindings, membership/split/merge, conversions, broader control/effects/types/projects, existing-adapter audits and authoritative Verse access remain open. The full eight-language goal remains active.

- Contract: [group packet](../../docs/design/native_declaration_groups_batch.md). Next: [shared inferred/deferred initialization](../../docs/design/native_inferred_initialization_batch.md).
- Paths: graph-types/nativeScalarDeclarationGroups.ts; IR v20; native_declaration_group registry; NativeDeclarationGroupPanel; focused native-group-browser/native-group-pages-browser runner stages. Last combined runner1870 terminated successfully; no live validation job remains.

## Shared variable binding identity audit (October 7, 2026)

- Shared lookup/core symbol refs reject ambiguous legacy names and preserve missing/empty/foreign explicit bindings. Synchronization cannot overwrite a foreign same-name reference. Existing exact-ID document lifecycle remains unchanged.
- Verified4,354 package/1,309 web/API/production build,53 exact retained native inputs and all3 production local lifecycle workflows; lint99 retained from initial audit. Prior Pages evidence is bounded; no Pages rebuild in this packet.
- Contract: [binding audit](../../docs/design/reverse_import_binding_identity_audit.md). Next ready construct: [C++ declaration groups with shared readiness/IR audit](../../docs/design/native_declaration_groups_batch.md). Full scope/capture/type/project and Verse work remains open.

## Native local worker admission and lifecycle verified (October 7, 2026)

- Native sealed review/worker previews enable localStatements:true; ordinary typed local Library modules now pass actual production/Pages rename, readonly/type recovery, invalid-type reload/recovery, save/reload and reimport conflicts. Public analysis previews remain explicit opt-in; unsupported groups/contexts reject atomically.
- Shared UI declaration lookup resolves symbolId (seven adapter regressions); native local transactions synchronize structured typeRef/domain mirrors. Verified4,353 package/1,307 web/API/lint99/production+Pages builds; native53 (3 fresh incoming/50 retained, then all53 retained on final repair). No fixture execution or full-language certification.
- Contract: [local admission/lifecycle](../../docs/design/native_local_source_admission_contract.md); explicit focused stages native-local-browser/native-local-pages-browser. Remaining declaration groups/inference/control/effects/types/projects and Verse access stay open.

## Native local inspector transaction checkpoint (October 7, 2026)

- API: graph-types/nativeScalarLocalTransactions.ts; lifecycle: useSymbolLifecycle.updateNativeScalarLocal; UI: NativeLocalPanel replaces generic native declaration/index controls. Stable owned symbols/ports update together; incompatible wires remain for diagnostics and recovery.
- Verified4,347 package/1,297 web/public types/lint99/production build; native-source-graphs50 (3 fresh renamed modules/47 exact retained). Initial host checks retained; focused pin-type/panel repair passes affected gates. No local worker or browser certification.
- Contract: [native local transactions](../../docs/design/native_local_transaction_contract.md). Next: sealed local worker admission and production/Pages lifecycle; wider all-eight-language audit/scope remains open.

## Native local graphs and Code-panel checkpoint (October 7, 2026)

- Opt-in typed scalar locals now connect source ownership, visible graph analysis, IR v19 and canonical Code-panel output for Rust/C++/GDScript. Actual snapshot normalization preserves files/maps; optional false readonly index flags use existing loader semantics.
- Verified4347 package/1294 web/public types/production build; native source/graph47 inputs include8 new local modules and39 established inputs, all47 exactly retained on the final loader repair. Runtime75/local-source18/initialization45 unchanged evidence remains retained. No local worker/browser acceptance claim.
- Contract: [native local graph/Code-panel](../../docs/design/native_local_graph_code_panel_contract.md); continue [local inspector and admission batch](../../docs/design/native_local_graph_batch.md). All-eight-language audit and wider scope remain open.

## Native local source-body ownership verified (October 7, 2026)

- Rust/C++/GDScript source analysis now retains immutable ordered typed local declarations, local assignments and final explicit/Rust-tail returns, with exact parameter/local declaration identities, expression spans, canonical native types and unknown runtime values. Three composed modules/nine functions cover successive initializers, mutable writes, Boolean conditions and explicit conversions; contrasts cover C++ grouped/own-initializer policy, Rust shadowing/discarded returns and Godot constants/shadowing. The shared AST decoder/inference also backs established runtime imports. Initialization traversal now retains reviewed conversion and Godot not operand reads. Combined 4,343 package tests, 1,289 web tests, public source-import types and lint (99 existing warnings) pass. Native validation compiled 18 fresh body contrasts and retained 75 runtime, 39 saved-graph Code-panel and 45 initialization inputs. Initialization reuse now verifies actual files/hashes/commands/profiles/current pins and diagnostic logs; the focused verification follow-up retained 18+45 inputs with zero recompilation. No fixture programs execute. This source sequencing dependency does not admit local graphs: visible declaration/read/write settings, saved order/type/initialization analysis, IR/packs/Code-panel, inspectors and worker/browser lifecycle remain next. Broader all-eight-language control/effects/types/projects, existing-adapter audit and authoritative Verse access remain open.
- Paths: source-import/nativeLocalSourceBodies.ts and nativeScalarSourceExpression.ts; docs/design/native_local_source_body_contract.md. Native-local-source is an explicit combined-runner gate, with exact retained inputs via --retry-native-local-source=. Do not enable local worker acceptance from source analysis alone.

## Native runtime worker admission and lifecycle verified (October 7, 2026)

- Rust/C++/GDScript ordinary Library modules now admit source-owned parameter arithmetic, comparisons, logical conditions, grouping and reviewed explicit conversions through sealed worker review/acceptance. Three composed modules/nine functions pass single-use receipts, private seals, JSON persistence and unchanged/conflicting reimport tests. Actual production and Pages runtime browser workflows pass all three languages: return-type invalid/recovery, invalid literal recovery, literal/operator edits, save/reload and both conflict choices. The overlay repair adds accessible panel close controls; browser selectors close the current inspector and use the actual searchable operator menu. Combined4323 package/1289 web/public-host types/lint(99 existing warnings)/production+Pages builds pass. Native source/Code-panel39 inputs pass:6 fresh operator/incoming modules and33 exact retained inputs; no programs execute. Final focused native-runtime-browser/native-runtime-pages-browser passes retain the verified Pages export and unchanged native/unit/build evidence. Historical broader native-browser/native-pages-browser failures remain failures and are not relabeled. Wider locals/control/effects/types/projects, existing-adapter gaps and authoritative Verse access remain open; no full-language or overall completion claim.
- Paths: docs/design/native_runtime_source_admission_contract.md and docs/design/native_local_graph_batch.md. Runtime-only browser repairs use native-runtime-browser/native-runtime-pages-browser; preserve historical broader failures and exact retained native inputs. Public analysis previews still require runtimeExpressions:true; actual worker/sealed reviews enable the verified subset.

## Native signature transaction checkpoint (October 7, 2026)

- Rust/C++/GDScript native definition inspectors now apply immutable coordinated symbol/definition/entry/Return/call-port edits through the project lifecycle. Wires/provenance persist; incompatible edits block, matching Boolean parameter/return edits recover, and unrelated malformed edge metadata is retained. Selection/view loss was repaired; persistence checks respect active-function Code-panel scope. Combined4320 package/1286 web/API-host types/lint(99 warnings)/production+Pages builds pass. Native source-graph33 checks include3 fresh actual Boolean edited modules and30 exact retained inputs. Focused production/Pages all3 imports, Boolean signature/output/port save-reload, literal recovery and both reimport choices pass. Final missing-overload/duplicate-owner guard repair reran affected package/web/API/build gates with unchanged valid native/browser evidence retained; broad historical suites are not relabeled. Runtime worker acceptance, wider language semantics/projects/effects and Verse access remain open.
- API: graph-types/nativeScalarSignatureTransactions.ts; UI: useSymbolLifecycle.updateNativeScalarSignature and GraphFloatingDetails NativeSignaturePanel callback; contract docs/design/native_scalar_signature_transaction_contract.md. Preserve selection/view and refresh only changed output-type edges; do not erase incompatible links or guess missing overloads.

## Runtime Code-panel checkpoint (October 7, 2026)

- Rust/C++/GDScript complete ordinary runtime modules now materialize through explicit runtimeExpressions analysis previews into registry-versioned visible projects and canonical Code-panel output. Nine functions retain authored headers, stable IDs, parameter/operator/group/conversion wiring, Return/expression source maps and JSON persistence. Exact full-file goldens and literal invalid/edit checks pass. Combined4320 package/1283 web/public-host types/lint(99 existing warnings)/production build pass. Native source-graph30 checks pass:9 fresh original/generated/edited runtime modules and21 exact retained scalar/calibration/role cases. No fixture execution. Default sealed source/worker review remains scalar-only; runtime lifecycle admission and coordinated native symbol/body/port edits remain next. Broader eight-language semantic/project/effect scope and Verse access remain required.
- Analysis option: previewNativeScalarSourceGraphs runtimeExpressions:true; goldens test/nativeRuntimeSourceGoldens.json; web nativeRuntimeSourceCodePanel.test.ts; contract docs/design/native_runtime_code_panel_contract.md. Do not set the runtime preview flag in sealed worker review before actual admission/lifecycle proof.

## Runtime materialization checkpoint (October 7, 2026)

- Rust/C++/GDScript source-owned runtime trees now construct visible expression graphs with actual parameter slot wiring, ordered operands, exact node/edge origins and cloned entry documents. Entry ownership/types/ports, collisions/budgets/cycles and saved runtime reconstruction are checked; no parameter values or frozen literal hints are invented. Definition-owned scalar function analysis now integrates runtime parameter expressions and blocking project diagnostics while preserving constant/identity/orphan checks. Nine composed functions pass graph/JSON/Return ownership tests. Combined4320 package/1280 web/API types pass;75 runtime/source native contrasts and21 established scalar Code-panel checks are retained by exact inputs/commands/toolchain pins with zero recompilation. Newly generated runtime Code-panel output and browser admission are not yet verified. Complete module/registry/IR/packs/Code-panel/native edited output, coordinated inspectors and lifecycle remain next; broader eight-language/project/effect/Verse scope stays active.
- API: packages/source-import/src/nativeRuntimeMaterialize.ts; contract docs/design/native_runtime_materialization_contract.md. Graph fragments remain admission-blocked; runtime/native failure classes are handled by nativeScalarSignatureValidation. Do not mistake retained native source/type probes for newly generated runtime Code-panel proof.

## Runtime source checkpoint (October 7, 2026)

- Rust/C++/GDScript now expose immutable source-owned runtime expression trees with exact spans, resolved parameter declaration slots, authored grouping/operators/conversions, unknown values and native result typing. Shared binding inventories now traverse reviewed Rust as/C++ static_cast/Godot int-bool conversions rather than losing operand references; arbitrary calls and shadowed Godot conversion names remain unresolved. Three composed modules/nine functions and unbound edits pass source tests. Combined4317 package/API types and75 native checks pass:6 new original/unbound compiler fixtures,69 matching retained contrasts. Missing public pure-context export and conversion traversal were repaired together. Source graph materialization, definition/project/IR/pack/Code-panel and coordinated inspectors/browser lifecycle remain required before runtime acceptance; full eight-language control/effects/types/projects/Verse scope stays active.
- API: packages/source-import/src/nativeRuntimeSource.ts; fixtures: test/nativeRuntimeSourceFixtures.ts; contract docs/design/native_runtime_source_contract.md. Pure nativeRustConstantContext is public graph-types API. Runtime source observations do not certify return conversion or a whole module.

## Native runtime graph checkpoint (October 7, 2026)

- Rust/C++/GDScript saved runtime scalar expressions now reconstruct native types from actual entry parameter slots and operand edges, without dummy parameter values. The pure reader verifies ownership/ports/domains/hidden operands/cycles/budgets, retains nested short-circuit facts, and checks real constant islands with visible Rust peer inference.44 native-case graph checks plus ownership/value-edit mutations pass; combined4313 package tests/public API types pass.69 unchanged native contrasts are retained after exact byte/expectation/command/toolchain verification with zero recompilation. This is a graph-reader prerequisite, not new source/runtime admission. Definition/project integration, source materialization, IR/packs/Code-panel, coordinated signature transactions and actual browser lifecycle remain next; broader eight-language control/effects/types/projects and Verse access stay required.
- API: packages/graph-types/src/nativeRuntimeGraphs.ts; contract docs/design/native_runtime_graph_contract.md. Context must come from reviewed definition/project ownership before acceptance; this rooted reader does not certify the whole function.

## Unknown-parameter scalar type checkpoint (October 7, 2026)

- Rust/C++/GDScript now have pure unknown-parameter scalar operator result typing, preserving native C++ promotions/LLP64 signedness, Rust matching operands/heterogeneous shifts/Boolean bitwise rules and Godot logical/Boolean-order behavior. No runtime values are invented. Combined4264 package tests/public API types and69 independent compiler applicability/result contrasts pass. Native repair compiled9 changed cases and retained60 exact source/expectation/file/command/pin matches; initial Godot Boolean-order policy was corrected from native evidence. This is a prerequisite, not source/runtime graph admission. Saved runtime wiring, source mapping, visible inference, coordinated signature transactions, Code-panel/native edited graphs and browser lifecycle remain next; wider eight-language flow/effects/types/projects and Verse access remain required.
- API: packages/graph-types/src/nativeRuntimeTypes.ts; handwritten corpus nativeRuntimeTypeCases.ts; runner stage native-runtime-types; contract docs/design/native_runtime_type_contract.md. Do not replace unknown runtime operands with dummy constant values.

## Native scalar admission checkpoint (October 7, 2026)

- Rust/C++/GDScript ordinary scalar Library modules now have sealed worker review/acceptance and verified production/Pages browser import, signature/literal invalid-edit recovery, Code-panel edits, save/reload and both reimport conflict choices. Final focused runner77069 is terminal green:4218 package/1280 web tests, public source-import types, native-source-graphs21, production/Pages builds and native3 browser stages. The native gate verified matching source/expectation/file/command/toolchain evidence and retained all21 unchanged compiler inputs; the initial expanded gate compiled7 new inputs and retained14. Earlier existing JS/Python/Go/C# browser prefix checks passed; historical full browser-import/docs-artifacts failures remain recorded separately from the focused native3 repair. Native signature domain changes still need coordinated symbol/body/port transactions. Runtime operations, declarations/control/effects, comments/operator spelling, wider types/projects and authoritative Verse access remain open.
- Contract: docs/design/native_scalar_source_admission_contract.md; next coordinated scope: docs/design/native_runtime_expression_batch.md. Source paths validate in graph-types/sourceFileValidation.ts and direct transpilation preflight. Source-import constants derive Rust types from visible context rather than serialized literal hints.

## Native scalar source graph checkpoint (October 7, 2026)

- Atomic parsed Rust/C++/GDScript ordinary modules now produce complete visible-v3 global graph previews from native headers, exact constants and resolved parameter references. IDs hash filename/language/name and survive body edits; authored Rust tail returns survive graph/IR/pack emission. Source worker/sealed acceptance is still closed.
- Combined4203 packages/1276 web/public-host types/native14 original-generated-calibration-role inputs/server build-tests/goldens/extraction/lint/production build pass. Native retry compiled2 changed C++ outputs, retained12 exact matches. Native evidence exposed global C++ public: emission; class-only access sections repaired. Full existing JS/Python/Go/C# browser suite passes. Runner21236 is terminal green; no live validation remains. README restored to its originally clean content.
- Next worker/adapters/sealed acceptance, comments/operator spelling/context-aware editing, actual new3 import/edit/save/reload/reimport, then wider runtime/control/types/projects. Full eight-language including Verse objective remains active. Contract: docs/design/native_scalar_source_graph_contract.md; optional stage native-source-graphs; source materializer packages/source-import/src/nativeScalarSourceGraphs.ts.

## Native constant emit/name checkpoint (October 7, 2026)

- Rust/C++/GDScript typed constant graph/settings/context/IR/packs now generate exact Code-panel expressions; Godot direct/grouped negation and unary token boundaries preserved. Rust context derives from visible signatures/suffixes/peers, rejecting hidden hint changes. Header keyword/type-shadow guards follow pinned native contexts.
- Combined4187 packages/1273 web/types/native constant107+identifier470/path tests3/server/lint/build/full existing JS/Python/Go/C# browser suite pass.104 full-file goldens and final108 focused Code-panel/mutation tests pass after broad gates. Identifier filenames repaired to unique indices; shared compiler harness rejects case-folding collisions. Generated README restored. No fixture execution; Godot functions check-only.
- Next special entry/constructor/Unicode/raw/reserved name contexts, inspector edits, actual source worker materialization/acceptance and broader runtime/control/types/projects/new3 persistence/reimport. Full eight-language/Verse goal active. Contract: docs/design/native_constant_graph_emit_contract.md; optional stages: native-constant-graphs,native-scalar-names; native-fixture-paths is cheap/default.

## Native scalar graph emit checkpoint (October 7, 2026)

- Native signature/project/body validation and IR/pack emit now generate Rust/C++/GDScript global identity/unit saved graphs through canonical Code-panel output; explicit library metadata, exact goldens and source maps retained. Early ownership preflight prevents missing-home silent omission.
- Combined4182 packages/API-host types/native6 inputs (29 functions+3 rejection calibrations)/lint/build/full existing JS/Python/Go/C# browser suite pass. Initial web1165/goldens/extraction retained; final3 focused exact golden/save-reload tests pass. Generated output README restored. No native program execution or original-source body substitution.
- Next identifier/keyword and native expression/result/IR/pack mappings, runtime/control/types/projects and actual new-adapter import/edit/save/reimport. Source adapters remain closed; full eight-language including Verse/UE6 objective active. Contract: docs/design/native_scalar_graph_emit_contract.md; runner stage: native-scalar-graphs.

## Native signature edit checkpoint (October 7, 2026)

- graph-types nativeScalarSignatureEdits powers Rust/C++/GDScript draft inspector controls; NativeParameter carries optional authoredType/mutable. applyFunctionImplementBinding preserves native identity by slot, refreshes names and invalidates additions/mismatched pins instead of falling back to Go float64. Prior snapshots remain unchanged by edit helpers.
- Combined4152 packages/1162 web/types/lint/production/full JS/Python/Go/C# browser suite pass. Initial web ES2017 build rejected shared BigInt literals;26 small literals now use BigInt constructors like Go/C#. Repair retained web/lint and reran affected package/types/build/browser. Native scalar89/constant121/source121 comparisons consume matching retained compiler facts and pass. No compiler inputs/profiles changed.
- New3 inspector evidence is component markup/pure edit actions only. Actual registry/IR/body/native Code-panel/new3 browser lifecycle/project/effect/Verse scopes remain open; admission stays closed. Contract: docs/design/native_scalar_signature_edit_contract.md.

## Native scalar print checkpoint (October 7, 2026)

- transpiler print/nativeScalarSignature and three base-pack templates retain authored native types/const/mut/modifiers/unit spelling; emit/shell renderFunctionDefHeader consumes reviewed native contexts and rejects roles/async/virtual/override/abstract/hidden defaults. Definition spans retained. Public native signature admission remains closed for new3.
- Combined4148 packages/types/native printed headers33/disk goldens/Code-panel regressions pass. Final guard28 focused tests and host types rechecked. Compiler composition uses trusted source bodies only in fixtures; not whole saved-graph/new-adapter admission proof. App/browser assets unchanged, prior evidence retained. Generated output README restored after extraction.
- Next actual registry/inspector/signature-refresh/body/IR mapping and Code-panel/native/browser/save/reimport proof across the feature matrix. Full eight-language goal active. Contract: docs/design/native_scalar_signature_print_contract.md.

## Scalar function graph checkpoint (October 7, 2026)

- graph-types nativeScalarFunctionGraphs validates Function Define header properties, entry symbol/parameter slots and identity/constant/empty return/flow ownership. Exact edge roles/types, missing/duplicate IDs/slots, inline operands and orphans reject. Native runtime operators/conversions/mutation/control/effects and actual mapping admission remain required.
- One combined4121-package/API-type batch passes; native-signature consumer verifies38 matching retained compiler/header cases (5 unsupported). Saved32 identity/empty cases exclude the Rust assignment fixture. Missing type/name and inherited alias-table keys now reject. Emit/UI/registry/browser unchanged, prior evidence retained.
- Next registry/IR/packs/emit/inspectors, Code-panel/native and browser/save/reimport proof. Full eight-language/project/Verse scope active. Contract: docs/design/native_scalar_function_graph_contract.md.

## Source-owned scalar signature checkpoint (October 7, 2026)

- graph-types nativeScalarSignatures owns native scalar type identities/pin domains/header checks; source-import nativeSourceSignatures retains frozen exact authored name/parameter/type/return/body spans, mutability/modifiers and full unresolved source inventory. No emitter/admission enabled.
- Combined4085 packages/API types/native-signatures38 pass, with5 native-valid unsupported headers. Initial13 Clang extension-argument browser parse failures repaired in standard typed function-pointer fixtures;13 changed inputs recompiled and25 exact matching reports retained. Grammar gap remains open. Native models/emit/UI/browser unchanged, evidence retained.
- Next validated native body ownership and actual registry/IR/emit/inspector/Code-panel/lifecycle/projects across the feature matrix. Full eight-language/Verse scope stays active. Contract: docs/design/native_scalar_signature_contract.md.

## Saved constant graph checkpoint (October 7, 2026)

- graph-types nativeConstantGraphs.ts reconstructs Rust/C++/GDScript constant trees from saved nodes/edges, conservative data-any ports and explicit token/type/operator/conversion properties. Cached facts and directLiteral flags are ignored; actual groups/unary nodes determine Godot semantics. Inline/duplicate/missing operands, targets, IDs, cycles and budgets reject.
- Combined package4044/source-import types/source-native121 pass; exact semantic rejection strengthening passes123 focused saved-graph tests. Matching native reports retained; no emit/UI/registry/browser changes. Whole-source validity and adapter admission remain blocked.
- Next signatures/declarations and registry/result-pin/IR/pack/inspector mapping, canonical Code-panel/native and browser/save/reimport evidence. Full eight-language/project/effect/Verse scope stays active. Contract: docs/design/native_constant_graph_contract.md.

## Shared scalar core checkpoint (October 7, 2026)

- graph-types owns nativeScalarContracts/nativeScalarLiterals/nativeConstantExpressions; source-import wrappers translate NativeScalarFailure into the existing ImportFailure identity without duplicating message prefixes. No importer/parser dependency enters graph analysis or transpiler.
- One combined batch passes3921 packages, pure source-import types and121 source/compiler comparisons with matching retained native reports. Tree edits recompute facts; this is not saved-graph mutation or adapter admission evidence. App/emit/registry unchanged; existing browser/Code-panel/native profile evidence retained.
- Next visible reconstruction/signatures/IR/emit/inspectors/lifecycle/project closure across the feature matrix. Full eight-language scope stays active. Contract: docs/design/native_scalar_shared_core_contract.md.

## Latest shared local-binding checkpoint (October 6, 2026)

- `nativeLocalBindings.ts` reports frozen ordinary-function local/parameter scope identities and read/write targets for Rust/C++/GDScript. Rust lets enter scope after initializers; C++ declarators before them; Godot rejects active ancestor/parameter shadowing but accepts siblings/later parent declarations. Values/effects/initialization and graph admission remain unvalidated/blocked.
- Native corpus66 (42 valid/24 rejected), lexical30 and direct Clang23 target/span checks pass with package3425. `source-import-types` now checks the pure public API independently of VS Code host types, using ES2023 libs for existing Go toReversed.
- Fixes: fixture JSON reads UTF8 and actual compiler files preserve LF; all66 actual source hashes match curated input. Prior three Unicode hashes/newline-dependent offsets were weaker evidence. Bun1.3.1 erased standalone calls to a helper named declare and crashed on a nested callback; addBinding/helper extraction avoids it. C++ condition_clause and Rust expression-statement if wrappers now retain lexical scopes.
- Contract: `docs/design/native_local_binding_contract.md`. New adapters remain researched; native values/effects, actual graph/worker/inspector/lifecycle/project/host scope and Verse authoritative validation stay open. Previous UI/native gates retained for unchanged mappings; broad historical browser-import failure remains distinct.

## Latest shared syntax-foundation checkpoint (October 6, 2026)

- `nativeGrammarContracts.ts` owns five grammar versions/hashes/ABI. Go/C# retain ABI15; Rust0.24/C++0.23.4/GDScript6.1 are ABI14. `nativeSyntaxInventory.ts` retains exact immutable Unicode/trivia regions with binding status unvalidated and executable regions unresolved; graph admission stays blocked.
- `tools/build_gdscript_grammar.py` reproduces the MIT vendored grammar with pinned Emscripten4.0.17/tool/source hashes. File-prefix mapping removes checkout-path assertions. Native loader snapshots exact byte views to avoid backing-buffer/async mutation drift; corrupt grammar and offset-view recovery tests pass.
- Fresh native36 (24 valid/12 rejected), GDScript rebuild, 3393 package+1159 web tests, C#2672/Go134 compiler-pair checks and production/Pages asset/browser gates pass. Initial recovery fixture used an aliased Buffer slice; focused repair retained unchanged web/lint/Go/new-native/provenance evidence. Broad historical browser-import failure remains distinct.
- New adapters remain researched. Next native binding/value/source ownership and actual worker/graph/inspector/lifecycle/project closure, alongside shared JS/Python/C#/Go conditions/control-flow. Verse host/validator stays open. Contract: `docs/design/native_syntax_inventory_contract.md`.

## Latest shared native-readiness checkpoint (October 6, 2026)

- `tools/setup_native_readiness.py` prepares hash-pinned portable Rust1.99/Godot4.5.2 in ignored scratch; `--range-download` addresses observed Godot full-response stalls. Clang19.1.5 is installed outside PATH in Visual Studio; `VVS_CLANGXX` selects its pinned binary.
- Explicit `native-readiness` batch gate passes 24 trusted cases (12 valid/12 rejected), with C++ AST declaration/type/range facts and Rust JSON diagnostics. No fixture programs execute; full-tool/stdlib archives and installed files are verified. Raw logs/results: `scratch/native-readiness`.
- Default batch excludes this explicit stage pending CI provisioning and does not certify it. All three new adapters remain researched; browser grammars/bindings/graphs/lifecycle/project evidence and authoritative Verse host/validator stay open. See `docs/design/native_readiness_contract.md`. Existing native/application evidence is retained; broad historical browser-import failure remains distinct.

## Source-owned native expression checkpoint (October 7, 2026)

- Public analyzeNativeConstantSource rebuilds Rust/C++/GDScript initializer/return trees with immutable source spans/grouping/context and complete source/hash inventory. Native values are expression facts before assigned conversions; new graph admission remains blocked. Rust implicit returns/peer/minimum context and C++ signed-token/unary ownership are handled; closures cannot borrow enclosing return ownership.
- Native121/source spans, package3800 and API types pass; final closure guard passes124 focused source tests. Native inputs used2/3-case retries retaining matching reports. No programs execute; Godot method context is check-only, not function-value execution. Prior initialization/binding and app/Pages/browser evidence retained. New explicit native-source-expressions consumes native-constants evidence. See `docs/design/native_source_expression_contract.md`; named values/effects/graphs/lifecycle/projects/Verse and full existing-adapter scope stay open.

## Shared constant operator/conversion checkpoint (October 7, 2026)

- Public `evaluateNativeConstant` supplies pure integer/Boolean constant-tree facts with distinct native promotions/ranks/narrowing/overflow/division/shifts. Godot rejects negative shift operands; Rust grouped negative minima preserve their literal exception. Dynamic/conditional effects, source/graph ownership and graph admission remain required.
- Explicit native-constants116 (113 comparisons/3 false assertions), package3672 and pure API types pass; the shared harness also passed native-scalars89. Final retry compiled one failed case and retained115 matching source/expectation/toolchain packets. `--retry-native-constants=<language>/<case-id>` preserves unrelated failures. No programs execute. Prior initialization/binding and app/Pages/browser evidence retained. See `docs/design/native_constant_expression_contract.md`; full eight-language scope stays open.

## Shared scalar literal checkpoint (October 7, 2026)

- Public `nativeScalarLiteral` supplies exact decimal-string integers/Boolean facts for pinned Rust/C++/GDScript profiles, retaining spelling/native types/negative context/warning tags. Graph admission remains blocked. Godot saturation/19-digit wrap and Clang unsigned decimal extension follow independent native evidence.
- Explicit native-scalars89 (86 comparisons/3 false native assertions), package3558 and pure API types pass. Initial native failures corrected four Godot wide values and added composed boundary spellings. No programs execute: Rust/C++ compile-time assertions and Godot check-only constant zero-division/type assertions. Prior initialization/binding and app/browser/Pages evidence retained. See `docs/design/native_scalar_literal_contract.md`; all broader values/effects/graphs/lifecycle/projects/Verse scope stays open.

## Shared initialization checkpoint (October 6, 2026)

- `analyzeNativeInitialization` records ordinary scalar-local declaration origins and read states for Rust/C++/GDScript. Live branch joins and readonly/deferred/default/discarded-read policies are native-specific. Rust explicit returns and GDScript augmented assignments now traverse local bindings correctly.
- Explicit `native-initialization`:45 exact-source compiler contrasts (28 accepted/17 rejected), package3471 and source-import types pass; binding30/Clang23 retained pass. C++ warnings are an unsafe-read profile, not general compiler validity. Godot runtime values, native types/effects and graph admission remain unvalidated. Prior production/Pages evidence retained. See `docs/design/native_initialization_contract.md`; full eight-language scope remains open.

## Broad integration checkpoint and next coordinated wave (October 6, 2026)

- Normal production build and full existing browser-import stage pass, including JS/Python/Go persistence/reimport and C# locals/groups/scopes/Boolean/inspector/conflict flows. This supersedes the historical broad C# local-initializer failure; it does not certify every default gate or new-adapter graphs.
- Cross-language plan now reflects the 66 native cases, 30 binding probes and 23 direct Clang targets, with a next values/declarations/initialization/conditions matrix. Shared graph/IR/lifecycle fixes apply to affected adapters together; native semantics are verified independently. Unchanged package/native/types/Pages evidence retained. Full eight-language objective remains open.

# Workspace Facts

Stable facts agents should assume without re-exploring the tree.

## Latest checkpoint: C# Boolean graphs and eight-language waves (October 6, 2026)

- IR18 `csharp-bool` native expressions and bool-return methods with existing integral bindings now have source/graph/compiler/lifecycle proof. `inferCSharpGraphValueExpression` validates Boolean or integral facts; numeric consumers retain the strict wrapper. Generic C# eager-read scans delegate reviewed bodies to the native short-circuit walker.
- Native 2,672 (1,834 valid/838 rejected), 3,353 package +1,159 web tests and affected production/Pages gates pass. Twelve-method browser fixture verifies bool output and operator invalid/recovery/save-reload. The numeric-only result-index guard was repaired with focused retries; historical broad browser-import failure remains distinct.
- The user's next delivery order is feature waves across all eight languages: `docs/design/reverse_import_cross_language_batches.md`, with ready shared fixes and each adapter's native prerequisites in the same wave. Branch/unreachable mapping, Boolean bindings/parameters/calls, loops/effects/types/projects and remaining native adapters stay open; this is not a full-language completion claim.

## Previous C# checkpoint: native branch-flow prerequisite (October 6, 2026)

- `csharpBooleanSemantics.ts` supplies transient predefined comparison/Boolean facts; `csharpBindings.ts` reports immutable per-statement reachability/assignment evidence, isolates alternatives and intersects reachable exits. Return/dead-tail and missing-return-path behavior is analysis evidence; branch graph admission remains blocked.
- Native 2,656 observations (1,818 valid/838 rejected), including 582 Boolean/comparison probes and 31 branch cases; 3,343 package +1,159 web tests, lint and host types pass. Boolean expectation casing repair retried only native/packages; mapping/build/browser/Pages evidence was not repeated or extended to branches. Broad historical browser-import failure remains distinct.
- Next visible branch/condition/unreachable ownership, inspector and lifecycle batch: `docs/design/csharp_branch_flow_contract.md`. Boolean bindings/signatures, loops/effects/exceptions/ref-out/external binding closure and full eight-language scope remain required.

## Previous C# checkpoint: definite assignment (October 6, 2026)

- IR17 retains absent typed-local initializers, including mixed groups. Source/graph facts distinguish declared and initialized bindings; plain assignments initialize after RHS checks, and lexical scopes propagate ancestor writes. Conditional/loop/exception/ref-out/unreachable contracts remain open.
- `packages/graph-types/src/csharpLocalInitializer.ts` supplies the pure initializer projection; the inspector uses one lifecycle transaction and the matching visible method signature for parameter-dependent style inference. Production/Pages verify empty-pin rejection/recovery and saved/reloaded Code-panel output.
- Fresh selected batch: 2,043 native observations (1,274 valid/769 rejected), 2,727 package +1,159 web tests and affected build/Code-panel/browser/Pages gates pass. Historical broad browser-import failure remains distinct. See `docs/current_state.md` and `docs/design/csharp_definite_assignment_contract.md`; full C# and all eight-language scope remain open.

## Historical checkpoints and stable paths

Older checkpoint counts and then-open items below describe their dated subsets; the latest checkpoint and `docs/current_state.md` take precedence.

- C# initialized groups: `csharp_declaration_group` / IR16 own one comma statement with visible declarator children and precise ranges; groupOwnerId is independent of lexical scopeOwnerId. Pure `editCSharpDeclarationGroup` plus lifecycle transaction updates shared type/style/readonly indexes for group and child inspectors. Generic flow validation now carries group initialization into continuation and traverses C# scope bodies without provenance. Five group compiler pairs, four rejections, saved mutation/range checks and production/Pages edit/reload pass (2021 native,3867 package/web tests). Uninitialized/definite assignment/unreachable regions/membership/split-merge/trivia and wider scope stay open.

- C# visible lexical scopes: `csharp_scope` owns body/continuation; IR15 ScopeBlock prints authored braces/context with nested source maps. Recursive local inference reserves declaration spaces, isolates child bindings and validates scopeOwnerId/scopedNodeId/context/terminal return. Five composed scope pairs, fixed saved graph, sealed reload/reimport and production/Pages context-edit invalid/recovery/reload pass (2007 native,3859 package/web tests). Groups, definite assignment, unreachable regions and wider scope remain required; see newest current_state.

- C# lexical scope prerequisite: `csharpBindings.ts` reports immutable parent/method/overflow/declaration ownership and resolved read/write occurrences. Fifteen compiler/binder cases pass; bare integral-result returns are now invalid. Fresh evidence: 1997 native,2693 package+1159 web tests and host type checks. Nested graph/IR/inspector/lifecycle mapping remains open under `docs/design/csharp_lexical_scope_contract.md`; this analysis does not admit nested imports.

- C# by-value parameter writes: `parameter_set` / `parameter_ref` bind function/overload/parameter IDs; `applyParameterSetBinding` preserves RHS/operator through retargeting and signature renames, while removed/crossed slots block generation. Scoped spawn rows and menu keys distinguish slots; compound C# nodes are now effective. Five composed native/source cases plus fixed saved graph and actual production/Pages edit/reload proof pass (1982 native,3835 package/web tests). Groups/nested/checked scopes/definite assignment/unreachable regions/cross-arity/effectful expressions/ref-out-in and wider scope remain open; see newest current_state.

- C# compound/update statements: `csharpIntegralMutation` shares native operator/RHS applicability across source/graph checks; IR14 includes `>>>=`, pack rows retain compound/prefix/postfix syntax, updates have execution pins only, and prefix uses the Boolean inspector schema. Fixed saved graph and seven composed assignment sources,1260 native mutation pairs (1962 total),3825 package/web tests and actual production/Pages operator/RHS/prefix/save-reload workflows pass. Groups/nested/checked scopes/parameter writes/definite assignment/cross-arity rewiring/effectful expressions and wider scope remain open. See newest current_state.

- C# plain local assignments: graph-owned implicit assignment, typed Set pins and existing-local pack printing now preserve ordered mutation and mutable nonconstant reads. Fixed saved graph plus four original/regenerated source pairs, four native rejection cases, sealed reimport and actual production/Pages RHS invalid/recovery checks pass (690 native cases, 2662 package tests; preceding web/lint evidence reused). Groups/nested scopes/compound-update/parameter writes/assignment expressions and wider scope remain open. Combined runner skips consumers of fresh failed selected prerequisites. See newest current_state entry.

- C# void local completion: `inferCSharpLinearLocals` allows graph-owned fallthrough only for void signatures; planner preserves no-return statement sequences and never inserts a hidden return. Sealed acceptance/reimport, three native original/regenerated pairs and focused production/Pages Code-panel/reload checks pass (670 native cases/3813 package+web tests). Groups/nested declarations/assignments/unreachable regions remain in the open declaration/scopes batch. See newest current_state entry.

- Project-wide batch workflow: `docs/agentic_batch_workflow.md`; rules in root/web `AGENTS.md`, `.agents/AGENTS.md` and `.cursor/rules/batched-development.mdc`; project skills link the policy and `vvs-batched-delivery` provides the shared skill. Reverse-import batch plan: `docs/design/reverse_import_batch_delivery.md`. Implement dependency groups before one consolidated validation; diagnose failures and retry affected gates only. Optional combined runner `csharp-browser` stage is excluded from default full suites and retains full-suite failures separately. C# style transactions now preserve inferred width, readonly index, native pins and selection; focused production/Pages proof is in the newest current_state entry.

- C# local source integration (October 6): `csharpPlan.ts` maps initialized single typed/var/const declarations before explicit return; `csharpSyntax.ts` preserves declaration style/name/order. Sealed review/acceptance and reimport retain graph changes and require concurrent conflict resolution; 658 native cases, 2654 package +1156 web tests pass. Production and Pages verify actual local import, nine native type choices, invalid widening/recovery, exact Code panel, save/reload and grouped-source rejection. Style conversion and groups/nested scopes/assignments/calls/project scope remain next. See the newest `docs/current_state.md` entry; older counts/status below are historical.

- C# local IR/printing (October 6): IR_VERSION13 extends IrDeclareLocal with csharp-typed/var/const styles and native predefined types/var; C# pack templates render exact initializers. csharpSignatureValidation + controlFlowValidation now permit verified straight-line local graphs with native body/index/readonly/pin/return ownership. Getter variableName must match the visible declaration binding (stale rename blocks). `packages/transpiler/test/csharpLocalGraphs.ts` and fixed csharp-local.fixture.json:4native graph/compiler pairs +4read probes;650native/485valid/165rejected;2648package+1156web/native/lint/build pass; fixed project normalization/class/function-tab/maps verified. Source planning/comparison, inspector and local browser workflows remain next; grouping/nesting/assignment/calls/overloads/native domains/projects remain open. IR amendment:docs/design/native_local_ir_rfc.md.

- C# locals groundwork (October 6): `packages/graph-types/src/csharpLocalSemantics.ts` owns shared typed/var/const initializer/readonly facts; `csharpBindings.ts` delegates source policy to it. `inferCSharpLinearLocals` derives visible declaration-order facts and passes bindings to `inferCSharpGraphExpression` for Variable Get. Tests cover mutable constant loss, recomputation/reload, self/forward reads/shadowing, malformed readonly/types/inputs/pins, cycles and overflow. Native642/494source-binding pairs unchanged. Browser local admission is still blocked pending native local IR/printing, source planning/materialization and body/index validation. Required sequence in `docs/design/csharp_local_binding_graph_contract.md`; current evidence in current_state.

- C# worker/browser subset (October 6): worker returns source inventory + separate whole-class eligibility region, replans async review with real file/options and owns sealed receipts. SourceImportDialog now offers C# integral class candidates; SourceReimportDialog file picker includes .go/.cs. `apps/web/scripts/source_import_csharp_checks.py` verifies production/Pages actual source import, inspector invalid-edit/recovery, save/reload, function-tab fidelity, graph-only reimport, both conflict choices and unsupported additions. Shared `packages/source-import/test/csharp-import-browser.fixture.json` original/generated classes compile in native oracle:642cases/477valid/165rejected;2638package+1156web pass. Roadmap profile implemented-subset; coverage-family completion remains unproven. Next C# locals/constants/scopes/calls/overloads and broader types/effects/projects; all-language goal remains open. Current verification details in `docs/current_state.md`.

- C# core review/reimport (October 6): `reviewCSharpImportGraph` in `packages/source-import/src/validation.ts` issues the shared sealed receipt after whole-unit planning/graph validation and `csharpSyntax.ts` structural comparison. `reviewSourceReimport` now routes C# directly through that async gate, retains context and detects graph comments/conflicts. `csharpReview.test.ts` and C# cases in `reimportContext.test.ts` cover mutation/stale/context/persistence; native validator compiles all 25 source-graph pairs after acceptance/reimport. Native640cases; core batch2638package+1153web/native/lint/build passes. Browser C# admission remains disabled pending worker/dialog integration. See `docs/current_state.md` and `docs/design/csharp_source_graph_plan.md`; no complete adapter claim.

- Reverse-import expansion plan: `docs/design/reverse_import_expansion.md`; executable corpus: `packages/source-import/src/expansionCorpus.ts`; generated gap/readiness report: `docs/design/reverse_import_feedback.json`. `bun run test:batch` includes report validation and all 17 checks (including Go build/tests and target-scoped Rosetta parsing); see `docs/development_worklist.md` for verified October 4 coverage and open semantic work.

- Reverse-import follow-up scope: nearest-loop Break/Continue, repeated-condition call ownership, JS lexical dominance, Python native integers/range, JS fields/constructors/receivers/resolved same-file parents, Python plain classes, closed named JS module sets and three-way source re-import. UI entry: `apps/web/src/components/start/SourceReimportDialog.tsx`; sealed coordinators: `packages/source-import/src/validation.ts`; regression tests: `packages/source-import/src/followupBatches.test.ts`. Feedback corpus: 85 examples, 62 supported, 23 gaps. UE6 remains deferred.

- All-language code ↔ visual master plan: `docs/design/code_visual_master_plan.md` (proposed MP-01–MP-15 delivery waves, coverage ledger, native semantics, project fidelity and combined evidence gates). MP-01 inventory is implemented: canonical `packages/source-import/planning/coverage-plan.json`, generated `docs/design/code_visual_coverage.json`, research/backlog `docs/design/code_visual_adapter_research.md`; generator `packages/source-import/scripts/report-coverage.ts`. Planned rows never enable adapters. MP-07a context retention is implemented: `packages/source-import/src/reimportContext.test.ts` and `apps/web/src/lib/reimportContext.test.ts` cover retained settings, saved Code-panel emission, stale/conflict review and persistence; production browser covers single-file/module acceptance/save/reload. MP-02a native-value inventory is implemented in `packages/source-import/src/nativeValues.ts`, with six mixed gap probes in `nativeValueCorpus.ts` and generated ledger observations; see `docs/design/native_value_contract.md`. MP-02b implements all four bounded scope items: four visible native registry families, structured IR v4, ordered collection/access/operator semantics, exact scalar payloads and combined mutation/round-trip/Code-panel/browser evidence. Seventeen native probes remain separate from the 85-example syntax denominator. Next is MP-03 callable/signature closure. Inventory alone never enables source acceptance. Broader targeted merges remain open.

## Repository

- Monorepo root: `VVS Web/` — **public MIT repo** (see `CONTRIBUTING.md`)
- Implemented packages: `packages/graph-types`, `packages/syntax-registry`, `packages/language-profiles`, `packages/syntax-packs`, `packages/transpiler`, `packages/environment-templates`, `packages/source-import`
- Go server: `server/` — registry HTTP, project REST, compile, **optional** local MCP sidecar SSE. Hosted agent is `apps/web/src/lib/agent/`. **Phase 2 experiments:** `ProjectStore` (`MemoryStore` | `PostgresStore` via `pgx`), JWT middleware ([deployment.md](../../docs/deployment.md))

## Frontend entry points

- App shell: `apps/web/src/components/layout/EditorLayout.tsx` — mounts `GraphWorkspaceHost`, `EnvironmentImportModal`, `AgentHost` (in-page agent Worker starts with the editor)
- Start screen: `apps/web/src/components/start/StartScreen.tsx` — usability tests, explore (`/library` `/roadmap`), recents. Auth is TopNav only.
- Graph edit canvas: `apps/web/src/components/graph/GraphCanvas.tsx` — includes `GraphSelectionToolbar`
- Floating inspector: `apps/web/src/components/layout/GraphFloatingDetails.tsx` — includes `CallNodeOverloadPanel`
- Project tree: function **double-click / open icon = Edit function body**; badges **Declare** (exists) / **Define** (body place) per locked vocab; docs survive tab close (`shouldRetainGraphDocument`); same-file emit = U80; Declare≠Define split = **U81**
- Vocabulary: `docs/design/language_neutral_vocabulary.md` — functions **Call** / **Declare** / **Define** (not header-file focus)- Graph settings: `GraphSettingsModal.tsx` — codegen target, portability summary, COA (planned), syntax pack lock, environment link
- Unified symbol architecture: `docs/design/unified_symbol_model.md` — declare/implement/invoke; COA deferred (`apps/web/src/lib/coaPolicy.ts`)
- Project state: `apps/web/src/contexts/ProjectContext.tsx` — includes `syntaxPackLock`
- API facade: `apps/web/src/lib/api/` — mock + HTTP via `NEXT_PUBLIC_API_MODE`

## Key libs (apps/web/src/lib)

| File | Role |
|------|------|
| `nodeCatalog.ts` | Spawn categories from `@vvs/syntax-registry` |
| `graphWiring.ts` | Pin compatibility (imports `@vvs/graph-types`), wire apply |
| `graphExecChains.ts` | Exec-chain queries (S/A): downstream-from-selection, full undirected expand |
| `graphChainLayout.ts` | Selected-chain layout (`lane-topo-v1`); double-tap window constant |
| `mockCodegen.ts` | Facade to `@vvs/transpiler` |
| `nodeKind.ts` | `normalizeNodeData`, display titles, binding-first kindId |
| `functionHelpers.ts` | Call binding, overload sync, `applyFunctionCallBinding` |
| `projectFolder/handleStore.ts` | `folderKeyFromHandleName()` stable folder keys |
| `environmentCatalog.ts` | Bootstrap built-in + imported environment manifests |
| `typePickerOptions.ts` | Type picker options from built-ins + canvas enum/class TypeRefs |
| `usabilityExampleTests/coverageLabUsabilityTest.ts` | Coverage Lab — primary fidelity golden |
| `usabilityExampleTests/firstGraphUsabilityTest.ts` | First Graph — simple StartScreen test |
| `usabilityExampleProjects.ts` | StartScreen `USABILITY_EXAMPLE_TESTS` cards |
| `apps/web/scripts/extract_test_project_outputs.ts` | Dump Code-panel-identical Test Project outputs |
| `apps/web/src/hooks/useProjectTranspileResult.ts` | Project-wide emit (what Code panel uses) |
| `editorFocus.ts` | Tree/canvas focus frames; class home graph resolution |
| `projectSelection.ts` | Tree symbol selection invariants |
| `symbolCodegenLink.ts` | Selection → codegen tab + sourceMap node ids |
| `codeHoverHighlightStore.ts` | Code hover → yellow node/tab outline (no select) |
| `sourceMapReverse.ts` | Line/col → nodeId; owning tab for reverse-nav |
| Docs: [code_panel.md](../../docs/code_panel.md) | Full Code panel UX |
| `recentProjectsSubscribe.ts` | Deferred localStorage recents (`useSyncExternalStore`) |

## Key packages

| Package | Notable modules |
|---------|-----------------|
| `graph-types` | `analyze.ts`, `codegenTarget.ts`, `fidelityMigration.ts` (kindId backfill), `projectFolder.ts` |
| `environment-templates` | `import/fromOpenApi.ts`, `fromAsyncApi.ts`, `buildEnvironmentManifest.ts` |
| `syntax-packs` | `resolve.ts`, `render.ts`, `packCoverage.test.ts`, `rosetta/` |
| `transpiler` | `lower/graphToIr.ts`, `print/` (all v1 families pack-first), `emit/classModule.ts`, `emit/sinkStatements.ts`, `emit/members.ts` |

## Syntax pack print migration (July 2026)

- **python + cpp:** pack-driven leaf + block print is authoritative — no silent fallback to hardcoded emitters.
- **javascript + verse:** legacy hardcoded branches in `print/stmt.ts` / `print/expr.ts` remain until milestone 2 (same pipeline, expand base packs, delete branches).
- **Member declare:** `VarDefine` template + pack `layout.varDeclIndent` for python/cpp variable declarations.
- **Indent:** `bodyIndent` / `handlerBodyIndent` read from pack `layout` (with JS/Verse fallbacks in `graphToIr.ts`).

## Agent, MCP & HTTP

- **Hosted path:** in-page TypeScript agent (`apps/web/src/lib/agent/`, `AgentHost`, `AgentPanel`). Live canvas is source of truth. No extra install.
- **Write gate:** `agentAllowWrites` (default false). StatusBar from `agentStatusStore` (**Agent ready** / **Agent error** / **Agent…**).
- **Other apps / Cursor:** later thin MCP wrapper over the same package. Today: optional localhost Go sidecar — paste config in the Agent panel collapsed sidecar section, not Connect AI.
- Product default: **client-only** editor; **no dedicated server**; **no remote hosted MCP URL**
- `server/` Go + Postgres/Auth remain in-repo for experiments; hide HTTP/cloud chrome by default
- Persistence product path: folder / `.vvs/` / git — **not** `pgx` on a VPS
- Optional local experiment env (not product): `NEXT_PUBLIC_API_MODE=http`, `DATABASE_URL`, GoTrue — see legacy [deployment.md](../../docs/deployment.md)

## Codegen fidelity (strict)

**Canvas is the source of truth** — see `docs/visual_to_text_fidelity.md` § Canvas is the source of truth.

| Diagnostic | Level | Meaning |
|------------|-------|---------|
| `DEFINE_NODE_MISSING` | error | Symbol in table without matching define node on `classHomeGraphId` |
| `DECLARATION_NOT_ON_CANVAS` | error | Symbols exist but class graph has no define chain |
| `ORPHAN_DEFINE_NODE` | error | Define node on canvas with `symbolId` not in symbol table |
| `HIDDEN_EVENT_RUNTIME_UNSUPPORTED` | error | `event_emit` or `event_subscribe` node — hidden runtime helper; use Define + Dispatch |
| `MULTICAST_REQUIRES_SUBSCRIBE` | error | Multiple `event_define` handlers for same event without visible multicast pattern |

**Event model (enforced):** `event_dispatch` → direct handler call; no `_emit` / `_subscribe` injection; `event_emit` / `event_subscribe` excluded from spawn catalog (`SPAWN_EXCLUDED_KINDS` in `@vvs/syntax-registry`).

- Transpiler emit: `appendIrMembers` / `ir.members` from define chain only — **no** `appendLegacyPreamble`
- Panel dual-write: `defineNodeSync`, `useSymbolLifecycle`, `add*WithDefine` in `ProjectTree.tsx` / `GraphCanvas.tsx`
- Compile gate: TopNav blocks Generate when `!analyzeProject(...).ok`

**Active pilot (July 2026):** Coverage Lab (Machine+Sensor). **Verify as Code panel shows.** **Locked:** one graph → one file; **no live code execution** (logical checks/warnings only); **U83 canvas virtualization**, **U77 Go pack**, + **U78 Pack Manager view** shipped. Modifier chips disable when ineffective. Next: target-language emit fidelity (CL backlog). Do not invent keywords / includes / Default / file layout / Play runners.


**U66/U67 (shipped):** `packages/language-profiles/src/nodeEffectiveness.ts` — gated Import Module **and** non-abstract Function Declare (non-C++) → `(x)` comments (Code panel toggle) + canvas dim (TopNav Dim). Prefs `showUnsupportedComments` / `dimUnsupportedNodes` default on.

## Agent assets

- Rules: `.agents/AGENTS.md`
- Skills: `.agents/skills/*/SKILL.md` — fidelity, usability (**panel-first**), transpiler, cross-language (`vvs_cross_language_mapping/SKILL.md` → one of `cpp.md` / `python.md` / …)
- Memory: `.agents/memory/` — `decisions.md`, `workspace-facts.md`, `incomplete-ui.md`
- Canonical UI/codegen state: `docs/current_state.md`

## Build / test commands

```powershell
cd apps/web; bun run build
cd packages/transpiler; bun test
cd packages/syntax-packs; bun test
cd packages/graph-types; bun test
cd server; go build ./...
```

## Naming (user-facing)

Follow `docs/naming_and_product_direction.md` — use **module name**, **extends**, **Generate** (not Compile in user copy).

- Reverse import: `packages/source-import/src/index.ts` = UI-free core; `src/validation.ts` = analyzer/generator coordinator. Generator never imports it. `packages/syntax-packs/rosetta/full-file/` = explicit reverse corpus; existing body goldens unchanged. Public pure function/event bindings now live in graph-types. Details: `docs/design/reverse_import_milestone.md`.
## October 3, 2026 batch delta

See `docs/development_worklist.md` for the persistence/native/import batch and remaining gates. `bun run test:batch` collects results in ignored `scratch/batch-validation`; production import smoke is `apps/web/scripts/verify-source-import-browser.py`. Shared connection commands live in `packages/graph-types/src/graphCommands.ts`; browser folder recovery lives in `apps/web/src/lib/projectFolder/transaction.ts`. UE6 is deferred; COA remains off.

- October 4 MP-03 foundation in progress: JS file functions default/rest signature graph records and supplied call pins, Python branch-intersection assignment; 848 package/444 web tests plus native types/host/build/Code-panel/strict parse pass. Full MP-03 and MP-04–12/14–15 remain incomplete and authorized; UE6 MP-13 deferred. See current_state and callable_binding_ir_rfc. Preserve all accumulated workspace edits.

- Active user goal now includes all eight reverse-input targets, including previously deferred Verse/UE6. Translation is separate; earlier deferral notes are historical and superseded. MP-03 file-owned JS/Python default/rest signatures, Python named arguments, signature/argument inspector and branch initialization are implemented as a subset. Corpus 91 (68 supported/23 rejected); fixed fixture `packages/source-import/test/native-callable.fixture.json`. See current_state; closures/destructuring and full new-adapter coverage remain open; Go has a bounded native library-unit stage.

- October 5 Go native unit stage: pinned WASM assets (`write-source-parser-assets.ts`), visible `source_package`/IR v5, typed scalar library signatures/calls/branches/returns. Fixed `native-go.fixture.json`, Go parser/types validator and nine reproduced gaps in `goUnitCorpus.ts`; generated `nativeAdapterProbes` has a separate denominator. All 18 combined stages pass (885 package + 466 web tests); Pages artifact smoke verifies the real Go worker JS/WASM base-path requests and acceptance/reload. Full MP-09 and the all-complete goal remain active; see current_state for latest validation and remaining language work.

- October 5 Go locals/loops: IR v6 structured native local style/type; initialized var/short declarations, scope/shadowing, assignments/updates, counted/condition loops, Break/Continue and void calls. Set pack assignment corrected. Native corpus 23 positives/9 gaps; All 18 grouped stages pass with 898 package + 481 web tests, 23 native Go AST/type pairs and browser/Pages evidence. Full goal/MP-09 remain active; current_state has authoritative evidence.

- Go integer foundation: `packages/graph-types/src/goIntegerSemantics.ts`; 147 independent native type/constant probes on explicit 32/64-bit contexts; integration requirements in `docs/design/go_integer_domain_contract.md`. This does not enable integer imports yet. Keep MP-09 and the full goal active; wire visible records/IR/editor/context re-import next, preserving exact tokens and type evidence.

Go fixed-width dynamic integer binding integration: nativeSignatures.ts exports GO_SCALAR_PINS/GoScalarType/sameGoScalarType; goScalarValidation.ts validates native body operand identities independently of pin categories. IR v7 widens native scalar fields, binding refresh retains compatible authored width/aliases, and NativeSignaturePanel exposes parameter/result type editing. GO_UNIT_FIXTURES now36 pairs; exact integer literals and word-sized target architecture remain next required integration.

Verified integer-binding batch: all18 combined validation stages green;915 package+495 web=1410 tests,36 independent native Go AST/type pairs,147 constant/type observations,24 browser single-file imports plus module/re-import, exported Pages Go worker/assets/save/reload. Exact Go integer literals and architecture context remain open next; all-language goal stays active.

Go integer integration IR v8: goValueSemantics.ts shares native integer/float-evidence assignment/operator checks with importer and goScalarValidation. NativeExpressions Go supports go-integer tokens and unary/binary operators; package source node has goWordBits string32/64 chosen in SourceImportDialog and carried through worker review/accept. Re-import retains the existing package bit setting and rejects snapshot-context changes after receipt. GO_UNIT_FIXTURES50 + GO_WORD_FIXTURES4;10 gaps now include contextual variable shift and floating-constant rational evidence. Next numeric prerequisites are context-sensitive shifts, rational/float/complex, casts/defined types/iota and larger shift budgets.

Verified exact-integer/word-context batch: all18 stages pass;935 package+515 web=1450 tests;50 ordinary+4 word-context Go AST/type pairs;147 integer observations;27 browser imports+2 rejection workflows; module/re-import and exported Pages checks. goScalarValidation resolves word context from the owning Function Define file, validates Set val pins (not value), and controlFlowValidation rejects function-body Package Clause nodes. SourceGo numeric constants now use visible payload nodes, so authored/re-import tests edit payloads via their edges. Pure floating constant arithmetic remains blocked pending exact rational evidence.

Go shift/update batch IR v9: destination/peer contextual shifts and simple nested untyped counts now preserve native types via transient GoValueFact context frames. Nested count literal storage uses pinned compiler int64/uint64 bounds independently of target architecture; compound count contexts remain feedback gap. Go assignments now include %= &= |= ^= &^= <<= >>=. Constant shift cap1074/result precision512; runtime large counts remain unevaluated. Corpus65 ordinary+4 words,251 independent integer observations,10 gaps; compiler checks curated fixtures only and retains four typechecker/compiler divergence guards. Verified all18 combined stages;953 package+531 web=1484 tests;32 production browser imports+2 rejection workflows;69 AST/type pairs;251 observations;73 compiler pairs;4 divergence guards;Pages worker/assets/accept/reload. All-language goal active.

Go rational integration: goRationalSemantics.ts holds transient exact fractions, decimal/hex tokens and ties-even float32/64 rounding. Visible go-float payloads/go-number operators preserve spelling through native printer; goValueSemantics shares exact inference/assignment/arithmetic/compare rules with source/graph validation. Float32 kernel evidence is not float32 graph support. Outside4096-bit rational components, big.Float fallback remains reproduced native-valid gap. Corpus78 ordinary+4 word contexts,251 integer+75 rational observations;87 compiler pairs;36 browser examples. Verified all18 stages:971 package+545 web=1516;82 AST/type pairs;251 integer+75 rational observations;87 compiler pairs;4 divergence guards;36 browser imports+2 guards;Pages worker/assets/accept/reload. Full eight-language goal remains active. Next ready numeric integrations:float32 bindings, explicit casts and constant declarations;big.Float/complex contracts and composed count typing remain open.

Go float32/conversion IR v10: GO_SCALAR_PINS includesfloat32; NativeExpression conversion owns visible nativeTargetType and one operand, with syntax-pack NativeNumericConversion. goValueConvert shares exact constant and native runtime target checks; goScalarValidation blocks shadowed type names in casts. Inspector conditional fields/derived target label support editing. Corpus92+4 words;251 integer+75 rational+271 conversion observations;101 compiler pairs;40 browser examples. Final combined ledger all18 PASS:987 package+565 web=1552;96 AST/type pairs,597 numeric observations,101 compiler pairs,40 browser imports+2 guards, inspector alias edit/reload, modules/reimport and Pages actual editor/reload. Function-tab native signature now resolves owning visible Define props and maps header/body to that definition. Harness awaits editor/canvas before reload; one intermittent exported navigation failure remains a reliability investigation after two repeat checks passed, with richer console/network diagnostics. Next numeric contracts:const declarations,defined types/aliases,string-rune,complex/big.Float and remaining count contexts.

Go constant follow-on (all 18 stages verified; 1,609 package/web tests, 741 native observations and 44 browser imports): IR v11 go-const/untyped visible declarations use goValueConstant/goValueCompare and UTF-8 string ordering. Source/graph facts retain declaration rounding and readonly identity. Fixed saved graph:packages/source-import/test/native-go-constant.fixture.json;native observations:goConstantCases.ts (144). Corpus116 ordinary+4word fixtures and16gaps. Native lowering must honor all blocking control-flow errors, including LOCAL_NOT_INITIALIZED, and Go dominance must survive sourceOrigin removal. CodePreviewPanel/useProjectTranspileResult handle rejected jobs without unhandled promises; current errors remain blocking UI diagnostics, cancelled results are discarded. See docs/current_state.md for final gates and remaining scope.

Go-informed delivery sequence: docs/design/reverse_import_go_lessons.md records source/graph semantic reuse boundaries, native-oracle-first readiness packets, evaluation-region/package-type prerequisites and composed fixture plans for all eight languages. Canonical coverage profile pinRequirements link this gate. No adapter capability is enabled by the planning update.

Shared expression preflight: packages/source-import/src/expressionEvaluation.ts inventories distinct call paths, argument dependencies and conditional ownership; Go source planning and materialization consume it. Existing IrCallExpr emission can be reused for upcoming visible conditional regions; preflight does not enable conditional calls. See docs/current_state.md for current validation. Native tool recheck: Go1.26.4 and dotnetSDK6.0.428/9.0.310 available; C# harness not integrated.

Expression-preflight verification: all18 stages pass;1026 package+590 web=1616 tests;741 nativeGo observations;120 AST/type and125 compilerpairs;44browserimports plus Pages workflows. No new conditional-call acceptance or language adapter is claimed.

Go expression-call integration: visible callPlacement=expression has no execution pins and one reachable statement/header owner path. expressionCallValidation blocks fan-out/cycles/orphans/eager edges and dependencies; binding refresh and inspector transitions preserve placement. Native CallExpr reused; Go RHS logical calls now supported. Corpus124+4words,15gaps;all18verified:1033package+610web=1643,128AST/type,134compilerpairs,741nativeobservations,48browserimports,5native-validgaps,4divergenceguards. Fixed native-go-expression.fixture.json plus sourceImportGoExpression.test.ts cover mutations, source maps and conflict-aware worker reimport. Next remaining package/group/type and other language contracts are open.

C# native preflight: packages/source-import/test/native-csharp/ holds SDK9.0.310 global.json, offline Roslyn harness, 41case corpus and164SHA-pinned .NET9.0.12 refs plus2Roslyn assemblies. validate-csharp-native.ts is combined stage19; CI SDKpin configured, not remotely observed. C#12 x64 nullable-enabled syntax/binding/emit-only oracle records declared/expression/converted types, constants, nullability/flow, overloads and conditional implicit getter/conversion effects; no fixture execution. Native evidence and next contracts: docs/design/code_visual_csharp_native_evidence.json and csharp_reverse_import_preflight.md. Browser grammar/graph acceptance remains open.

C# grammar inventory: nativeParser.ts shares one runtime with separate lazy Go/C# caches; csharp.ts returns immutable analysis-only full-source/declaration inventory, not an acceptance receipt. Grammar0.23.5/runtime0.27.0/ABI15 and fixed WASM SHA are checked by asset/export scripts. All41 native cases parse;1078package tests, native oracle, lint and production/Pages/browser-runtime smoke pass. C# worker/UI and graph acceptance remain open; see docs/current_state.md.

C# worker/UI analysis: protocol distinguishes CSharpSourceInventory from graph previews/receipts; service rejects C# review/acceptance and invalidates retired receipts. UI generation guards suppress cancelled/stale results. Shared source_import_csharp_checks.py verifies cold-load cancel/deadline/recovery, Unicode retention, malformed/native-invalid syntax, .cs upload and Go switching in normal/Pages browsers. 1079package+655web tests; all19 ledger gates green with unchanged preceding native/host/server/golden evidence. Semantic contracts and graph mappings remain next; see docs/current_state.md.

C# integral policy: graph-types/csharpIntegerSemantics.ts is predefined fixed-width policy only, not Go numeric reuse or source acceptance. Native case descriptors are checked against pinned Roslyn types/constants/compiler results (499cases,458integralpairs); internal exceptions fail evidence. Default constant overflow differs from runtime context; UInt64 overflow is a retained grammar/native lexical distinction. 2000package+1113web tests, native/lint/build pass. Binding/graph integration and remaining domains are open; see docs/design/csharp_integral_value_contract.md.

C# source binding subset: csharpBindings.ts checks integral method params/locals/consts, declaration spaces, supported overload selection, call order and checked contexts against494 Roslyn source pairs. Native539cases (374valid/165rejected), four compiler-valid unsupported domains retained. Dialog shows subset diagnostics; graph acceptance disabled. 2540package+1153web, normal/Pages browsers/build/artifacts pass; all19ledgergreen with unchanged earlier evidence. Next visible graph/IR/printing/inspector and full native/project/reimport scope; see csharp_source_binding_contract.md.

C# signature graph foundation: CSHARP_INTEGRAL_PINS/nativeSignature records preserve nine native widths. Static class identity methods validate direct parameter returns with C# assignment policy; other body domains blocked until contracts integrated. C# parameter reads preserve case/escaped spelling only on explicit native entry markers. Fixed transpiler/test/csharp-signature.fixture.json compiles in pinned Roslyn; native540 (375valid/165invalid), 2545package+1153web, type/lint/build and normal/Pages workflows pass. Inspector controls implemented, dedicated signature browser editing remains open. Full source/graph/project/reimport scope stays active.

C# IR v12 graph expressions: nativeExpressions supports exact C# integral scalar/operator/cast/parentheses/overflow forms; csharpGraphExpressions.ts transiently infers graph-owned facts and lexical direct-min negation. Signature body validator admits native return trees, blocks cycles/orphans/hidden substitutions and missing reviewed signature ownership. 25 graph/native type/constant pairs + original-class compilations; native590cases(425valid/165invalid), 2573package+1153web, native/type/lint/build pass. Shared browser helper verifies signatures and checked-overflow invalid-edit/recovery/save/reload in normal/Pages. Broader inspector variants, source acceptance, locals/calls and full scope stay open. See csharp_graph_integral_contract.md.

C# source graph planner: csharpPlan.ts returns typed ordinary-class static integral/void method plans; shared materializer sets native signatures/entry markers and operator forms. Graph regeneration works after provenance removal. 25source/graph/native pairs and actual regenerated-class compilations; native640(475valid/165invalid),2602package+1153web;all19fresh batch gates pass. normalizeClassSymbols now retains supported visibility/omission; classVisibility plan field preserves omitted source keyword via explicit empty visible property. Browser C# receipts/acceptance and reimport remain disabled/open, alongside full native/project scope. See csharp_source_graph_plan.md.


## Latest authored native mode checkpoint

Typed/Inferred local/group transactions, inspectors and production/Pages active inferred-mode persistence are verified. See [canonical implementation evidence](../../docs/current_state.md) and [remaining reconciliation/admission dependencies](../../docs/design/native_inferred_initialization_batch.md). The full eight-language goal remains active.


## Native inference recovery flow

`inspectNativeScalarFunctionFlow` is editing-only structural evidence; generation retains `analyzeNativeScalarFunctionGraph`. Mode transactions independently recheck preceding inferred mirrors and selected initializer deductions. Actual invalid-mode reload/recovery passes production and Pages for C++/Rust; shared GDScript recovery and all-three native local workflows remain verified. See [current state](../../docs/current_state.md). Automatic deduction reconciliation and inferred worker admission remain next.


## Native deduction editing boundary

`reconcileNativeScalarInferences` owns function-scoped inferred deduction/mirror/port coordination. `deriveNativeConstantGraphForEdit` and `deriveNativeRuntimeGraphForEdit` derive output domains for editing; strict analyzers remain the generation gate. Native signature and authored expression property inspectors use these transactions. Production/Pages nine-case inferred editing/reload/reimport matrices pass. Central wire/typed-local triggers and inferred source worker admission remain next; see [current state](../../docs/current_state.md).
