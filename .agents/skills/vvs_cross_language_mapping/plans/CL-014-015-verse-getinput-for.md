# CL-014 / CL-015 — Verse GetInput + for-loop plan

**Status:** plan only (no emit code in this slice)  
**Severity:** P0 · **Lang:** Verse · **Source:** `simple/verse`, `complex/verse`  
**Canonical issues:** [SKILL.md Issues](./SKILL.md) `CL-014`, `CL-015`

## Problems (shipped today)

### CL-014 — Get User Input

Node asks for a **string** (prompt + text kind), but Verse emit stubs:

```verse
var _vvs_input_… : float = 0.0
```

Not a locatable string input. Breaks visual↔text fidelity.

### CL-015 — For Loop

For-each over an array emits an invalid hybrid:

```verse
for (float val : Readings) {
```

C++-like header + braces; not Verse `for (val : Readings):` indent blocks. Unclosed / wrong shape vs Fortnite Verse.

## Goals

1. GetInput → **real Verse string (or typed) input** construct that a Verse project can host (or an honest `(x)` + dim if Verse has no stdin equivalent — prefer real API).
2. For Loop → **Verse `for` comprehension / `for (x : xs):`** matching current Verse docs used by the product.
3. Keep canvas mapping: GetInput node and For Loop node remain the source of each emitted span.

## Non-goals

- Inventing a VVS Verse runtime
- Changing Coverage Lab to remove For / GetInput (fix emit)

## Research notes (implementation must confirm against current Verse)

| Topic | Direction to verify |
|-------|---------------------|
| Player / device input | Verse often uses device APIs / UI, not `stdin`. If no sync stdin exists, prefer **explicit stub comment + dim** OR an environment-native read that goldens document — never a silent `float = 0.0`. |
| For syntax | Target shape: `for (val : Readings):` with indented body (see `verse.md` teaching table). |

## Implementation sketch

### CL-014 GetInput

1. Inventory Verse packs: `GetInput` / print templates in `packages/syntax-packs` Verse base.
2. Choose emit:
   - **Preferred:** print prompt + assign from a Verse-legal read API used in UEFN docs the product targets.
   - **Fallback (honest):** `(x) Get User Input` comment + leave no fake `float` temp; mark node ineffective for Verse (`modifierEffectiveness` / language profile).
3. Update `simple/verse` + `complex/verse` goldens; add pack Rosetta fixture if needed.

### CL-015 For Loop

1. Fix Verse for-loop pack template / printer to emit `for (val : <array>):` + indented body (no C++ `for (T x : xs) {`).
2. Ensure loop variable type is omitted or Verse-legal (no `float val` C declarator).
3. Golden + Rosetta `for` fixture for Verse.

## Acceptance

- [ ] No `_vvs_input_… : float = 0.0` stub for text GetInput on Verse goldens
- [ ] For-each golden uses Verse `for (… : …):` form; validates structurally vs teaching docs
- [ ] CL-014 / CL-015 Issues log → `synced` / `fixed-in-cycle`
- [ ] `validate_test_projects_folder.ts` green for verse simple+complex

## Related

- CL-016 Verse class field defaults (P1) — separate
- [`verse.md`](./verse.md) · packs skill · transpiler emit/for printers
