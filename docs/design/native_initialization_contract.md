# Shared native scalar-local initialization

This XL-02 packet adds immutable initialization facts to the existing ordinary local identities for Rust, C++ and GDScript. The public `analyzeNativeInitialization` API records parameter/explicit/deferred/native-default declaration origins and exact identifier read spans. Live branch exits merge definite and possible assignment separately; returning arms do not contribute to later joins. Assignment RHS reads precede the write, compound/update operations read before writing, and ordered declarations retain independent identities.

| Profile | Initialization policy | Independent evidence |
|---|---|---|
| rustc1.99, edition2021, Windows MSVC | Parameters and explicit initializers are initialized; deferred locals require a write on every live path before a read. An immutable binding permits its first assignment, but possible prior assignment blocks another. | Compile-only definite-initialization and immutable-assignment diagnostics |
| Clang19.1.5, C++17, Windows MSVC | Ordinary scalar deferred locals have no supplied value; own-initializer and possible-uninitialized reads are unsafe. Const scalars need an initializer and cannot be assigned later. | Explicit `-Werror=uninitialized -Werror=sometimes-uninitialized` contrast profile; warning rejection is not a claim that ordinary compilation must reject the source |
| Godot4.5.2 | Ordinary native local defaults supply initialization; parameters remain assignable, while constants reject assignment. Active shadowing retains the preceding binding contract. | Isolated check-only compiler contrasts; no runtime default-value or expression-result observation |

Native documentation: [Rust declaration statements](https://doc.rust-lang.org/reference/statements.html), [C++ initialization](https://eel.is/c++draft/dcl.init), [GDScript variables](https://docs.godotengine.org/en/4.5/tutorials/scripting/gdscript/gdscript_basics.html).

`tools/native_initialization_cases.json` contains 15 corresponding cases per language, authored by the checked-in fixture writer rather than generated from analyzer output. Inputs retain Unicode and exact UTF-8/LF bytes. The explicit `native-initialization` batch stage pins the existing compilers, runs all trusted cases, retains raw diagnostics/commands/source hashes, and compares the analyzer's read states and diagnostics. No source programs execute. This stage is excluded from the default runner pending portable tool provisioning, like the existing native-readiness stage.

C++ discarded ordinary scalar identifiers, including parenthesized forms, do not perform a value read; Rust does require initialization for those expressions. [C++ discarded-value contexts](https://eel.is/c++draft/expr.context) explain the distinction. Volatile reads remain unsupported rather than being silently treated as ordinary scalar reads.

The API is analysis-only. `nativeValueStatus` remains unvalidated and `graphAdmission` blocked: literal/type/operator/conversion correctness, native runtime defaults, ownership/aliasing/effects, loop fixed points, calls, cleanup, exception paths, unreachable source ownership, projects, inspector/lifecycle and saved-graph Code-panel proof remain required. Unsupported constructs retain diagnostics rather than being promoted through initialization facts. The broader eight-language objective remains unchanged.

## Acceptance batch

Run `bun tools/validate_batch.ts --only=packages,source-import-types,native-initialization`. This analysis-only packet does not change graph mappings, emitters, UI or assets, so it retains the preceding production/browser/Pages evidence rather than repeating those gates. Record observed failures and focused repairs before claiming the packet verified.

October 6 acceptance: 45 independent exact-input compiler contrasts (28 accepted/17 rejected under their explicit profiles), matching source read states/diagnostics, 3,471 package tests and pure source-import types pass. Original failures exposed missing Rust explicit-return traversal and GDScript augmented-assignment binding traversal; both are repaired. The preceding 30-case binding gate still passes with 23 direct Clang matches. Compiler evidence was retained during the first traversal repair; the expanded discarded-value fixtures then justified one fresh combined compiler/package run. No repeated application/browser gate was needed. A focused consumer retry can use `validate-native-initialization.ts --reuse-native`; it still requires a complete matching fixture count, hashes and native acceptance report.
