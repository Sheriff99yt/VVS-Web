# Bidirectional implementation and compilation-unit RFC

30 September 2026. Implements the first foundation slice of the approved [multilanguage plan](multilanguage_bidirectional_plan.md). The architecture milestone is **not complete**: standalone, Python and static-language pilots, worker-backed review and independent native certification remain open.

## Implemented foundation

`@vvs/language-profiles` now owns a versioned adapter-profile registry, certification contracts, a 112-record audit inventory (14 existing Rosetta seeds for each of eight targets), and a fail-closed translation assessor. Existing portability profiles and generation remain separate. Registry admission is data-driven and tests admit a future profile without adding a language switch.

The initial grammar versions are **proposed investigation contexts**, not claims of parser/toolchain certification. Non-JavaScript parser and toolchain pins are deliberately null until evaluated. Verse's grammar/environment is unresolved; a generic extension cannot select an official environment. Existing JavaScript uses the lockfile's Babel 7.29.9 parser. No profile is currently fully certified under the new contract.

Evidence records separate forward, reverse, independent syntax, types, behavior, persistence, fidelity and translation. A validated label requires positive and negative fixtures, independent expectations, a toolchain/configuration pin and a successful revision. Profile, graph-schema and mapping-version changes invalidate mismatched certificates. A toolchain/parser change must increment the profile version. Missing validators and not-applicable labels cannot silently authorize a mandatory gate.

The translation assessor consumes whole-unit semantic requirements, including dependencies and environment contracts. A missing destination, incompatible context, different semantic variant or absent evidence prevents compatibility. Proposed visible adaptations require their own complete evidence and return a review-required result; the assessor never changes a graph. All 56 ordered target pairs are covered by blocker tests. Synthetic test certificates exercise positive decisions; there are **no certified production pairs** yet.

`@vvs/source-import` adds a lazy adapter-admission contract and explicit UTF-8/code-point/UTF-16 span conversion. Unicode, astral characters, CRLF, malformed ranges and interior-byte boundaries are tested. These contracts do not activate another parser or bypass current sealed JavaScript acceptance.

## Baseline inventory and evidence blockers

| Target | Generation evidence retained | Reverse/context blocker | Independent gate still required |
|---|---|---|---|
| JavaScript ES2022 | Existing pack/body goldens; three full-file class round trips | Standalone/module closure and explicit unit policy; dynamic coercion/truthiness blocked | Trusted behavior, broader scope/effect evidence |
| Python 3.12 proposal | Existing pack/body goldens | No admitted adapter; arbitrary integers, indentation, scope/decorators need review | Exact CPython pin, parse/compile and trusted semantic fixtures |
| C++20 proposal | Existing pack/body goldens | No admitted adapter; translation-unit flags/includes, macros, lifetime and overload closure | Pinned compiler frontend with supplied build context |
| Verse environment-defined | Existing pack/body goldens | Official grammar, failure/effect context and environment unresolved | Official toolchain/environment; absence remains a blocker |
| GDScript 4 proposal | Existing pack/body goldens | No admitted adapter; Variant and Godot lifecycle/resource contracts | Exact Godot pin and explicit environment |
| Rust 2021 proposal | Existing pack/body goldens | No admitted adapter; crate context, ownership, borrow and macro closure | Exact rustc/cargo pin and controlled fixtures |
| C#12 proposal | Existing pack/body goldens | No admitted adapter; reference context, overloads and value/reference semantics | Pinned Roslyn/compiler and supplied references |
| Go1.22 proposal | Existing pack/body goldens | No admitted adapter; package closure, receiver/nil/multiple-result semantics | Exact Go pin, parse/type/build evidence |

All 14 seeds retain explicit unvalidated forward records and blocked reverse/independent gates. Body syntax snapshots are not full-file certification. Existing concrete JavaScript gaps remain in `IMPORT_CAPABILITY_GAPS`; this inventory does not replace them with a support badge. Browser bundle/startup/memory measurement precedes selecting additional parsers. No native toolchain availability is asserted by the registry.

## Compilation-unit decision and implementation obligations

One existing container graph remains one emitted file. A unit is a file/module/package/crate with visible structural declarations and explicit entry policy. Function body tabs remain body editors, not independently emitted files. Symbol tables continue to index visible declarations.

The adapter context records exact files/hashes/encoding/original bytes when provided, selected grammar/mode/environment, local external signatures and build flags. Facts declare stable scope/binding identities before uses and distinguish local, supplied-signature and unresolved dependencies. An unresolved dependency blocks closed-unit materialization. No fetch, build-hook execution, lifecycle inference or artificial wrapper is permitted.

The transient unit contract distinguishes `library`, `explicit-program-entry` and `host-lifecycle`. **This slice does not change persisted graph policy.** The audit found `validateProgramEntry` currently requires an entry for every class with symbols. Adding standalone/library support therefore requires an explicit persisted, visible unit policy and migration preserving the existing program default. Do not suppress `PROGRAM_ENTRY_MISSING` globally or attach a synthetic class/entry to ordinary functions.

Before the next slice can enable library import:

1. Add a versioned graph/unit policy with visible editor controls and conservative migration; retain entry diagnostics for program units.
2. Prove standalone placement, declaration/definition ownership and export/package behavior through the actual generator for all existing targets. Global scope alone is not proof of a faithful file.
3. Materialize direct file-owned Function Define nodes without synthetic classes or lifecycle events. Preserve Declare separately wherever the target has a source declaration.
4. Add handwritten complete files and fixed canonical graphs for JavaScript, Python and an independently available static-language toolchain; run scope, negative, mutation, fidelity and persistence gates in both directions.
5. Add worker termination, cancellation and stale-result rejection before exposing broad/heavy parser adapters. The AbortSignal adapter contract alone does not interrupt synchronous parsing.

No lowering/IR schema or fidelity-rule changes are made in this foundation. This RFC records the necessary design boundary before those later changes. Re-import conflict resolution, opaque-code export and automatic adaptation remain outside this slice.

## Progress

Foundation verification: Bun 1.3.1 frozen-lockfile install; 1,007 package/web library tests passing; web TypeScript check clean; production static build passing; lint has zero errors and 91 pre-existing warnings. The new tests include all eight profile inventories, all 56 ordered blockers, future-adapter admission, stale/missing certificate rejection, semantic/context/dependency failures, Unicode ranges and package boundaries. Existing JavaScript round-trip, mutation, persistence and receipt tests remain green.

- Stage 0: existing generator/import baseline and primary blockers recorded.
- Stage 1: profile, ledger, future-adapter and initial translation contracts implemented and tested.
- Stage 2: compilation-unit RFC and transient facts specified; persisted graph/analyzer/generator/UI prototype remains open.
- Stages 3–7: pilots, adapter expansion, certified translation and worker/browser hardening remain open.
- Stage 8: continuous admission uses the same gates; no complete-language claim is inferred.
