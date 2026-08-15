# CL-008 / CL-009 — Rust static/const items + HashMap import

**Status:** fixed-in-cycle  
**Severity:** P1 · **Lang:** Rust · **Source:** `complex/rust` Coverage Lab golden  
**Canonical issues:** [SKILL.md Issues](../SKILL.md) `CL-008`, `CL-009`

## Problem (before)

Coverage Lab Machine has **Static** `Serial` and **Constant** `MaxPower`. Rust emit ignored both and printed plain struct fields:

```rust
pub struct Machine {
    pub Serial: f32,
    pub MaxPower: f32,
}
```

That is not how Rust writes `static` / `const`. Inventing `// static` on a field would also be wrong (U66/U67: dim or emit a real construct).

Sensor.Tags is `HashMap<String, String>` with no `use std::collections::HashMap;` (Import Module nodes on the graph are gated to other languages and become `(x)` comments).

## Decision

- **Static** (not const) → real module item: `pub static Serial: f32 = 0;` (Rust has no associated `static`).
- **Constant** → real associated item in `impl`: `pub const MaxPower: f32 = 100;`.
- Neither stays a struct field; `fn new()` does not initialize them.
- Do **not** emit `// static` / `// const`. Binding / `isConst` stay effective in the modifier table because they change emit.
- **HashMap** → generated Import Module line at file top: `use std::collections::HashMap;`, same pack template as `from` imports, tagged to the map field (`lab-var-tags`). No VVS HashMap runtime.

## Acceptance

- [x] Coverage Lab rust golden emits `pub static Serial` and `pub const MaxPower`
- [x] No `// static` invented comment
- [x] `use std::collections::HashMap;` visible at file top and locatable
- [x] `packages/transpiler` tests for CL-008 / CL-009
- [x] SKILL.md / rust.md / roadmap.md updated

## Leftover

Get/Set of a rust static/const still emit `self.Name` (Coverage Lab does not read Serial/MaxPower). Access should be `Serial` / `Self::MaxPower` if those Gets appear later.
