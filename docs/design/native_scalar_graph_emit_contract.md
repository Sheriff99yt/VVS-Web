# Native scalar function graph emission

Rust/C++/GDScript native scalar signatures now participate in graph analysis and IR/member emission for ordinary global module functions. The reviewed bodies are parameter-identity returns and empty void/unit bodies. Graph-owned constants have separate analysis evidence; their actual native expression admission/emission remains required. Source reverse-import adapters for these three languages remain unenabled.

The definition owns authored header properties, stable parameter slots and the selected body document. Project validation checks the home/global owner, unique definition, selected overload, neutral/native parameter and return type agreement, body language and exact entry/return wiring. Unknown bodies, hidden inline values, orphan constructs, missing bodies and invalid ownership block generation. Project emit checks this before choosing files, so a malformed home cannot silently produce an empty result.

Global graphs containing only visible Function Define nodes now enter the normal one-graph/one-file path. C++ module functions do not acquire an invented Global qualification or out-of-line class placement. Rust/GDScript do not require a synthetic class shell. Library compilation-unit metadata explicitly permits omission of a program entry; reviewed native module definitions satisfy the visible declaration requirement without a synthetic prototype. Ordinary class/member declaration errors remain blocking.

Parameter reads preserve authored names through LocalRef IR, and pack-owned native header printers retain explicit type spelling. Each complete saved module has an exact Code-panel golden. Definition and return spans are checked; JSON save/reload emission remains identical.

`native-scalar-graphs` in `tools/validate_batch.ts` persists three projects, reloads them, analyzes them and emits through `emitProjectLikeCodePanel`. Independent pinned Clang/rustc/Godot compile or check the exact emitted file bytes for 29 identity/unit functions. Three deliberately undeclared-reference inputs calibrate native rejection. The driver records hashes, commands, pins and complete emitted artifacts in `scratch/native-scalar-graphs`. No source bodies are substituted and no fixture programs execute.

## Remaining acceptance

Complete native identifier/keyword/reserved-name contracts, expression result pins/settings/IR/packs, runtime parameter operators, conversions, assignments, conditions/control/effects, wider types and project contexts remain required. Draft inspector controls do not establish live new-language workflow acceptance. Source-to-graph worker preview/acceptance, browser editing, persistence and conflict-aware reimport require independent new-adapter verification. Existing-adapter browser checks are regression evidence only. Verse/UE6 remains part of the full active objective with authoritative native-validator access unresolved.

## Subsequent constant integration checkpoint

Typed integer/Boolean constant bodies now have actual graph/settings/IR/pack generation,104 exact Code-panel goldens and107 independent generated-graph compiler assertions/rejections. Native keyword/context guards have470 compiler contrasts. Earlier expression-admission/keyword prerequisites above remain historical; special entry/constructor and Unicode/raw/reserved names, inspector/live source lifecycle and wider contexts remain required. See [the constant emission contract](native_constant_graph_emit_contract.md).
