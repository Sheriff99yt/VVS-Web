# Coordinated native signature editing

`transactNativeScalarSignature` in graph-types updates the visible native definition, its single global function overload, entry parameter ports, body Return ports and visible bound call ports as one immutable edit. Parameter IDs/names, source provenance, body ownership and existing wiring are retained. Return/parameter native identities stay authored choices; the transaction does not infer a different return type or insert conversions.

An incompatible parameter-only edit remains visible and blocks generation. A matching user-authored return edit can recover an identity body across integer/Boolean pin domains. Outgoing edge metadata follows actual changed source-port types. Unchanged output types retain their metadata, so unrelated malformed wiring is not silently repaired. Missing ports, incompatible operands and unit/value return conflicts remain diagnostic obligations rather than deleted links.

The transaction rejects foreign bindings, missing explicit overloads, duplicate definitions, unsupported owner/overload shapes and altered parameter slot/name inventories. It preserves the caller's graph-document subtype and clones documents rather than mutating the source project. Broader overload/member/call-context editing remains separate required scope.

## Editor integration

The existing collapsed Native signature inspector uses the project symbol lifecycle for Rust/C++/GDScript definition edits. History is recorded before updating functions/documents; selection/view are preserved while applying the complete document patch. Failed ownership edits show the existing local inspector alert. Existing Go/C# inspector paths retain their own contracts.

Browser evidence exposed selection loss after the first signature edit. The lifecycle patch now keeps the selected definition and active graph view. The persistence check reads the stored symbol/definition/entry/Return types because a reloaded Code panel correctly shows its active function rather than unrelated module functions.

## Evidence and repair scope

Combined4320 package tests,1286 web tests and public source-import types pass. Tests cover parameter-only invalidation, matching Boolean return recovery, canonical Code-panel output, save/reload, immutable inputs, foreign/changed slots, duplicate definitions, missing overloads and retained unrelated malformed edge metadata. Host types and lint pass, with99 existing warnings; production and Pages builds pass.

Independent native source/graph checks total33:3 fresh actual Boolean parameter/return-edited modules plus30 exact unchanged scalar/runtime/calibration inputs retained after hash/profile/command/file verification. No fixture programs execute.

Focused production and Pages browser workflows pass all three languages: actual source review/acceptance, typed invalid-edit recovery, valid Boolean signature output, preserved symbols/body ports through save/reload, literal edits and both conflict reimport choices. Earlier build/selection/test-view failures remain historical failures. The final invalid-owner guard strengthening reran affected package/web/API/build checks; unchanged valid browser/native inputs retain their preceding passing evidence. This does not certify full historical browser-import/docs-artifacts suites or new runtime worker acceptance.

## Next batch

Enable ready runtime source modules through sealed worker review only after extending actual production/Pages runtime imports, parameter/operator edits, persistence and conflict reimport checks. Native original/generated/edited outputs and structural source normalization must participate. Wider assigned-return conversions, declarations/control/calls/effects/types/projects, existing-adapter gaps and authoritative Verse access remain in the full objective. See [the coordinated dependency plan](native_runtime_expression_batch.md).
