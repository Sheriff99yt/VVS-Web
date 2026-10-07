## Subsequent worker/browser admission checkpoint

The bounded scalar source materializer now feeds sealed worker acceptance and verified production/Pages lifecycle checks. [The admission contract](native_scalar_source_admission_contract.md) supersedes the historical worker-closed statements below, only for its explicit scalar Library subset. Wider body/source/context mappings remain open.

# Source-owned ordinary scalar graph modules

`packages/source-import/src/nativeScalarSourceGraphs.ts` connects parsed C++/Rust/GDScript source headers, exact constant expression trees and resolved parameter references to complete visible global function graphs. The API requires a matching flat source filename and explicit library context. It returns an atomic preview with retained original source/hash/full unresolved inventory. A candidate snapshot exists only when the whole module maps and saved-project analysis passes. Worker receipts and browser admission remain closed and separate.

Mapped functions carry authored/native header types, qualifiers/modifiers, stable parameter slots, source/name/type spans and visible definition/entry/return/expression ownership. Function IDs hash language, filename and name rather than source positions/content; case-distinct names produce distinct Windows-safe IDs and body edits retain identity. The snapshot uses the actual v3 project schema, organizational global ownership and a library compilation unit. Code generation reads visible graph data only.

Rust final value expressions retain a visible `nativeReturnStyle: rust-tail` option through ownership validation, IR and the pack-owned `NativeTailReturn` printer. Explicit returns remain explicit. Unknown styles, tail returns on other targets and unit-tail misuse reject. This contract currently permits a single final value return, parameter identity returns, reviewed exact-type constants and empty/bare unit returns. Runtime operators, declarations, multi-statement control/effects and implicit return conversions require further mapping contracts.

Unsupported roots, attributes/declarator contexts, overloads, comments and unsupported bodies prevent a partial candidate. Comments remain in the full inventory until visible comment ownership is implemented. GDScript authored `!` spelling is retained unsupported until its graph/printer option is available; ordinary `not` maps. C++ `main` and GDScript `_init` cannot acquire an ordinary-function role; the grammar recognizes `_init` as a distinct constructor. Rust `main` is ordinary in this explicit library context; program entry validation remains separate.

Native original/regenerated probes exposed a shared C++ emitter defect: required symbol visibility produced a global `public:` label. Access sections now apply only inside class scope. This repair also covers global event declarations while retaining in-class sections.

## Evidence

`nativeScalarSourceFixtures.ts` supplies three four-function modules with case-distinct names, a native parameter read, nested unary constants, Boolean expressions, explicit unit returns and Rust implicit/explicit returns. Independent compiler inputs include each original module, its actual persisted-graph canonical Code-panel output, an undeclared-reference rejection calibration, and five special-name contexts. Fourteen pinned checks pass: twelve matching inputs were retained during the two changed C++ generated-output retries. No programs execute; Godot function bodies are check-only.

Full-file Code-panel goldens cover all three generated modules, definition/return mappings, JSON persistence and invalid return-style edits. Atomic rejection tests preserve unsupported source and exclude partial graphs; IDs persist across constant edits. Combined package4203/web1276/publicAPI/host types, server build/tests, disk goldens and canonical extraction pass. Lint, production build and the full existing JS/Python/Go/C# import/edit/save/reload/reimport browser suite also pass. Two loose test/report lint types were repaired; unchanged web/package/native evidence was retained while lint/build/browser completed. Do not treat these source previews as new-adapter browser import certification.

## Next dependency batch

Connect this materializer to the native source adapter/worker preview and sealed acceptance contracts without bypassing atomic ownership or compiler/context prerequisites. Add visible comment/operator-spelling ownership and context-aware return/signature inspectors, then verify actual import/edit/save/reload/conflict-reimport browser workflows. Runtime values/bindings, branch/loop/call/effect domains, wider types/projects and authoritative Verse/UE6 access remain in the complete eight-language objective.
