# XL-01 shared native syntax inventory

This batch adds lazy Rust, C++ and GDScript syntax inventories to the pure source-import package. Inventories preserve exact source/hash, grammar identity, immutable contiguous trivia/construct regions and authored syntax names. Names are syntax observations, not resolved bindings. Every executable region remains unresolved, with native binding status unvalidated. Inventory objects cannot acquire existing visual acceptance receipts or persisted graph authority.

## Pins and provenance

| Profile | Grammar package | ABI | Artifact source |
|---|---|---|---|
| Rust edition2021 native baseline | tree-sitter-rust0.24.0 | 14 | Published package WASM |
| C++17 native baseline | tree-sitter-cpp0.23.4 | 14 | Published package WASM |
| Godot4.5.2 native baseline | tree-sitter-gdscript6.1.0 | 14 | Reproducible Emscripten4.0.17 build of the published parser/scanner |
| Existing Go/C# | Existing pinned packages | 15 | Existing package WASM, now centrally hash-checked |

`nativeGrammarContracts.ts` owns exact hashes/versions/ABI. A loaded runtime remains immutable while later grammars can be configured independently. Every grammar load checks its bytes before loading, then its own ABI; missing/corrupt assets fail and failed lazy loads can retry with valid pinned bytes. Source size, tree depth/count, syntax error/missing nodes and elapsed parsing limits remain enforced.

All five grammars and MIT licenses are copied into production/Pages assets with identity manifests. Existing Go/C# asset keys remain compatible. Rust/C++ published binaries and GDScript source integrity come from the maintainers' versioned packages, recorded in the lockfile. [Rust upstream](https://github.com/tree-sitter/tree-sitter-rust), [C++ upstream](https://github.com/tree-sitter/tree-sitter-cpp), [GDScript upstream](https://github.com/PrestonKnopp/tree-sitter-gdscript).

The GDScript binary, MIT license and build provenance are in `packages/source-import/vendor/gdscript`. Reproduce with `python tools/build_gdscript_grammar.py` using the pinned locally activated Windows Emscripten toolchain; `VVS_EMSDK` can select its location. The script verifies source/tool hashes and compiler version, builds the side module and requires the reviewed artifact hash. Scanner assertions initially embedded the checkout path; `-ffile-prefix-map=<source>=tree-sitter-gdscript` makes builds from distinct directories identical. This does not modify global configuration. Explicit `native-grammar-build` requires the toolchain; default validation verifies the shipped artifact without certifying a local rebuild.

## Verified consolidated acceptance (October 6, 2026)

The affected batch passes 36 native cases, the reproducible grammar build, 3,393 package +1,159 web tests, C#/Go native checks, lint/type/build, focused production C# plus new parser-asset checks, Pages and exported browser/artifact checks. One recovery fixture initially corrupted an aliased Buffer slice; its repair and the exact-view loader snapshot reran affected checks, retaining unchanged passing evidence. The historical broad browser-import failure remains separate. No new adapter is admitted.

- Thirty-six curated sources across the three new profiles: values/bindings/branches, native-specific references/containers, compiler-invalid binding/type/readonly/scope cases, generics/types, closures/loops, macros/enum-match and Unicode trivia. Twelve compiler-invalid sources deliberately have valid grammar; native compiler expectations remain independent.
- Immutable repeatable inventories, contiguous Unicode/trivia spans, no candidate promotion or forged graph acceptance; malformed input, source/depth budgets and corrupt-grammar recovery.
- Independent compile-only evidence from the [native-readiness gate](native_readiness_contract.md), expanded to 36 cases; no program execution.
- Shared Go/C# regression gates plus production/export asset identity and real browser parsing through the Pages base path, with all new source fixtures and explicit no-acceptance scope.

## Required next wave

These are syntax foundations, not implemented reverse-import adapters. Native declaration/reference identities, lexical/project ownership, value/operators/effects, visible graph/IR mappings, inspector recovery, canonical Code-panel output, persistence and conflict-aware reimport remain required for every admitted feature. C++ preprocessing/templates/compilation contexts, Rust ownership/lifetimes/traits/macros and GDScript resource/engine bindings must be modeled independently. Verse grammar/host/version/native validator access remains an open prerequisite. Continue comparable conditions/control-flow work across JS/Python/C#/Go alongside these native binding contracts; retain the complete eight-language goal.
