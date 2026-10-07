# Visible source-owned runtime expression graphs

`packages/source-import/src/nativeRuntimeMaterialize.ts` builds visible scalar/operator/group/conversion nodes from immutable source-owned Rust/C++/GDScript runtime trees. Parameter reads wire actual reviewed entry output slots; operand order remains explicit. Every expression node and operand edge retains its exact source origin/hash. The entry document is cloned, never mutated by materialization. Node IDs are deterministic within the supplied graph/prefix, and collisions/budgets/cycles reject.

Entry ownership, native language, authored/canonical parameter types and exact ports are checked before construction. No inline expression operands, guessed parameter values, serialized literal type hints or hidden conversions are introduced. Actual saved-node/edge runtime reconstruction validates the resulting expression, including constant islands and Rust visible-context inference. Conversion spellings that need an authored alias option and unsupported Godot logical-not spellings remain unresolved rather than silently normalized.

Definition-owned scalar function analysis now selects the runtime reader when parameter edges feed expression nodes. It preserves direct identity and constant body checks, exact Return type/wiring, orphan rejection and whole-function edge ownership. Whole-project signature validation converts runtime graph/type failures into blocking native body diagnostics. This connects rooted expression analysis to function ownership; it does not certify full module materialization or Code-panel/browser admission.

## Evidence

All nine functions from the three composed source fixtures materialize visible graphs, survive JSON serialization and pass runtime result reconstruction plus definition-owned Return validation. Tests check source hashes/spans, no frozen literal inference, unchanged input documents, parameter wiring corruption and mismatched/forged entry contexts. Combined4320 package tests,1280 web tests and public source-import types pass.

The75 native runtime/source contrasts and21 established scalar source/Code-panel checks are retained after exact source/expectation/file/command/toolchain matching, with zero recompilation. These retained inputs do not contain newly generated runtime graph output. No new runtime graph Code-panel compiler or browser certification is claimed; the existing scalar admission boundary remains in place. Application builds/browser suites were not repeated for this pure construction/ownership dependency packet.

## Next integration and outstanding gaps

Atomic complete source-module materialization must consume these trees and connect definitions, symbols, registry kind versions and result/Return ports. Add reviewed logical operator settings and authored spelling support, then verify the complete runtime graph IR/pack emission path and exact Code-panel source maps. Compile original/generated/edited runtime outputs and verify affected production/Pages import/edit/save/reload/conflict-reimport before expanding worker admission. Coordinated type-domain inspector transactions, assigned-return conversions, broader calls/declarations/control/effects/types/projects and Verse authoritative access remain required. See [the coordinated batch](native_runtime_expression_batch.md).
