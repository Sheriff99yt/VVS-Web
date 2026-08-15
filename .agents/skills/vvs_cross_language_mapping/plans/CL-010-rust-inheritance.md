# CL-010 — Rust inheritance lowering plan

**Status:** fixed-in-cycle (Option A — composition + projection)  
**Severity:** P0 · **Lang:** Rust · **Source:** `complex/rust` Coverage Lab golden  
**Canonical issue:** [SKILL.md Issues](./SKILL.md) `CL-010`

## Problem (shipped today)

Coverage Lab lowers subclass `Sensor` as composition:

```rust
pub struct Sensor {
    pub base: Machine,
    // …
}
```

But member bodies still emit **UE/C++-shaped** access:

- `self.Power` / `self.Ready` (fields that live on `Machine`, not on `Sensor`)
- `Sensor::new()` / constructors that do not exist for the composition model

Result: **will not compile** as ordinary Rust. Violates text-shaped fidelity (behavioral nodes must map to locatable, real constructs).

## Goals

1. Generated Rust for inheritance graphs must be **importable into `rustc`** without a VVS runtime.
2. Field / method access on a subclass graph must resolve through the chosen lowering (`base.` projection **or** true Rust inheritance when we adopt it).
3. Keep canvas source of truth: every access still maps via `sourceMap` to a node.

## Non-goals (this plan)

- Rewriting all seven language packs
- Introducing a proprietary Rust runtime / Trait object VM
- Changing Coverage Lab graph topology (fix emit, not the fixture story)

## Options

| Option | Shape | Pros | Cons |
|--------|--------|------|------|
| **A. Composition + projection (recommended near-term)** | Keep `base: Parent`; rewrite member access `self.Field` → `self.base.Field` when field is inherited; emit `impl Sensor { fn new() -> Self { … } }` from class define + defaults | Matches current IR; smallest delta | Verbose; not idiomatic OOP Rust |
| **B. Flatten inherited fields** | Copy parent fields onto child struct; drop `base` | Simple access (`self.Power`) | Breaks identity / `as Parent`; larger IR change |
| **C. Trait + inherent impl** | Parent as trait; child implements | Idiomatic | Large IR + pack rewrite; Method override story incomplete |

**Decision for implementation track:** **Option A** first; document B/C as follow-ups if composition proves too ugly in goldens.

## Implementation sketch (when coding)

1. **Analyze / IR:** Mark members that resolve on an ancestor class (`inheritedField`, `inheritedMethod`).
2. **Rust printer:** For inherited instance fields/methods, emit `self.base.<name>` (or chained `base.base` for deeper trees).
3. **Constructors:** From class define defaults + parent defaults, emit `fn new() -> Self` initializing `base: Parent::new()` (or struct literal) and child fields.
4. **Goldens:** Update `complex/rust` after emit; run `validate_test_projects_folder.ts --update-goldens`.
5. **Tests:** Unit test projection for one inherited Get/Set + one constructor.

## Acceptance

- [ ] `complex/rust` `_HOME_GRAPH_PREVIEW.txt` compiles under `rustc` (or `cargo check` smoke) for the Coverage Lab module
- [x] No `self.ParentField` without `base.` when field is inherited
- [x] `sourceMap` still points at Get/Set / Call nodes
- [x] CL-010 status → `fixed-in-cycle` (this plan)

## Related

- CL-008 / CL-009 (static/const + HashMap imports) — fixed-in-cycle; see [CL-008-009-rust-static-const-import.md](CL-008-009-rust-static-const-import.md)
- [`rust.md`](./rust.md) · [`vvs_transpiler_development`](../vvs_transpiler_development/SKILL.md)
