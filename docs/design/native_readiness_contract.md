# XL-01 native-readiness contract

The shared prerequisite batch establishes independent compile-only evidence for C++, Rust and GDScript. JavaScript, Python, C# and Go retain their existing native gates. Verse remains in scope with an explicit authoritative host/version/validator prerequisite. This packet does not enable a browser parser, graph acceptance or full-language completion.

October 6 evidence: the explicit combined native-readiness stage passes all 24 cases (12 accepted, 12 rejected) with pinned tool/version checks. The updated coverage-ledger stage passes separately after the evidence records were finalized. Existing application/native gates were retained rather than rerun for unchanged mappings and UI.

The following [syntax inventory batch](native_syntax_inventory_contract.md) expands this gate to 36 cases (24 accepted/12 rejected), adding native-verified types/generics, closures/loops, macros/enum-match and Unicode trivia. All 36 pass with matching syntax inventories and production/Pages grammar assets; binding and graph admission remain unvalidated.

## Pinned profiles

| Language | Native baseline | Evidence boundary |
|---|---|---|
| C++ | Clang 19.1.5, C++17, x86_64-pc-windows-msvc | Syntax-only JSON AST with declaration names, types and ranges; no includes or standard-library/preprocessor project closure |
| Rust | rustc 1.99.0, edition2021, x86_64-pc-windows-msvc | Metadata-only compilation and JSON diagnostic codes/spans; no Cargo, build scripts, procedural macros or program execution |
| GDScript | Godot 4.5.2 stable, Windows x64 | Isolated trusted project, `--headless --check-only --script`; native acceptance/diagnostics, not a typed semantic API or resource project closure |
| Verse | Version and host unestablished | Installed UE5.6/5.7 inspections did not establish a callable authoritative Verse validator; UEFN access and supported version remain required |

[Godot documents check-only parsing](https://docs.godotengine.org/en/4.5/tutorials/editor/command_line_tutorial.html). [rustc documents metadata output, edition and JSON diagnostics](https://doc.rust-lang.org/rustc/command-line-arguments.html). [The official Verse workflow uses UEFN](https://dev.epicgames.com/documentation/en-us/fortnite/programming-with-verse-in-unreal-editor-for-fortnite). UE installations alone do not establish Verse validation access.

## Shared fixture matrix and setup

`tools/native_readiness_cases.json` contains twelve trusted cases per compiler: eight accepted and four rejected. Values/comparisons, lexical bindings and branches are comparable across profiles; references/borrowing and typed containers deliberately retain native differences. Missing names, readonly writes, incompatible types and out-of-scope reads must produce native errors. Types/generics, closures/loops, macros/enum-match and Unicode trivia extend the original eight-case preflight. C++ acceptance also checks native declaration facts; Rust errors retain JSON diagnostic codes and spans. Raw source hashes, commands, toolchain/version hashes and logs are retained in ignored `scratch/native-readiness`.

Prepare the two Rust components and Godot archive with `python tools/setup_native_readiness.py`. Official archive SHA256 pins are fixed in `tools/validate_native_readiness.py`; setup keeps tools under ignored scratch and does not change PATH or global installations. Validation compares installed compiler/library files against the pinned archives, checks versions, and verifies the installed Clang executable hash. `VVS_CLANGXX` can select the same pinned Clang binary at another path.

If the Godot full-response transfer stalls, use setup's explicit `--range-download` fallback. Each bounded request must match the expected byte range and the complete archive still must match its pinned SHA256 before extraction.

Run the complete new gate once with `bun tools/validate_batch.ts --only=native-readiness`. It is explicitly selected while CI provisioning is pending. Missing or mismatched tools fail this stage; the ordinary default batch therefore does not certify these new prerequisites. Native checks use only the committed curated sources; they never accept imported user source and never run resulting programs.

## Next shared work

Pin compatible browser grammars, then establish native declaration/reference identity, value/operator policies and source ownership before admitting visible mappings. Extend increasingly complex comparable fixtures across all eight profiles. Standard libraries, resource resolution, Rust ownership/lifetime/trait/macro contexts, C++ preprocessing/templates/compile databases and Verse failure/effect/concurrency contracts remain separate roadmap requirements. Saved graph mutation, inspector recovery, persistence/reimport and Code-panel/browser proof are still required for each implemented mapping.
