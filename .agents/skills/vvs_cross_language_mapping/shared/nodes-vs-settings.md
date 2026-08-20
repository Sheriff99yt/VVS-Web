# Node vs option vs pin

Parent: [../SKILL.md](../SKILL.md).
Canonical concept: [docs/visual_to_text_fidelity.md](../../../../docs/visual_to_text_fidelity.md) → Core principles.

## Locked test

If it is something you would type as its own construct, it is a **node**.
If it only changes how that construct is written, it is an **option**.
If it is a value that could come from another expression, it is a **pin**.

Two canvas positions, or existence without a body, are two nodes. An option cannot have its own position.

## Catalog lock (August 2026)

### Keep as nodes

| UI label | kindId | Why it is a node |
|----------|--------|------------------|
| Declare Class | class_define | Class shell is its own construct |
| Declare Variable | ar_define | Field / variable declaration |
| Declare Function | unction_define | Signature / prototype / abstract — existence, no body |
| Define Function | unction_implement | Body placement — may sit in a different place than Declare |
| Declare Event | event_member_define | Event slot |
| On (handler) | event_define | Handler method. **role** (entry / 	ick / custom) is an option, not a kind |
| Dispatch | event_dispatch | Direct handler call |
| Bind | event_bind | One visible registration line (C# += / JS .on / GDScript .connect). Partial -- other langs unspawned |
| Declare Enum | enum_define | Enum type |
| Get Enum Member | expr_enum_member | Member access expression |
| Import Module | vs.project.import_module | Import / include line |
| Import Class | import_class | From-import / using type |
| Get / Set Variable | ariable_get / ariable_set | Read / write |
| Call Function | vs.project.call_function | Call site |
| Branch / For / While / Switch / Return / Break / Continue | low_* | Control-flow constructs |
| Print String | ction_print | Statement |
| Wait | ction_wait | Sleep / wait call. **Async is an option** (or follows the function async flag) |
| Get User Input | ction_get_input | Blocking read where the target has stdin; Verse is honest (x). **inputKind** is an option; **prompt** is a pin |
| To String / To Number | convert_* | One conversion = one call. Do not collapse |
| Math Add / Subtract / Multiply / Divide | math_* | One operator = one node. Do not collapse to a dropdown |
| Concat Strings | string_concat | Operator / call |
| Array Push | rray_push | Statement / call |
| Function Entry | unction_entry | Flow start of a function body graph (not a second file) |
| Call Native / Env handler | env.* | Environment-bound calls |

**Declare vs Define stay two nodes.** C++ prototype vs out-of-line, and abstract / interface signatures, need two positions or existence without a body. When the current language has no separate declare, Declare is ineffective ((x) + dim). Do not fold Declare into an option on Define. Do not require both on every new function — spawn **Define** for a normal function; spawn **Declare** when the target has a prototype or the function is abstract / signature-only.

### Options (inspector) — not nodes

Visibility, binding (static), const / readonly, abstract, virtual, override, async, extends / implements, name, type, enum type, import path / style / names / target languages, Get User Input inputKind, Wait **async** flag, Call / Dispatch **Super** (how the call is written — not a Super node).

These only change how that node’s line is written.

### Pins — not options

| Value | On | Was wrong as |
|-------|----|--------------|
| Wait **seconds** | ction_wait | property |
| Switch **case values** | low_switch | properties case0 / case1 |
| Get User Input **prompt** | ction_get_input | already a pin — keep it a pin |

If it can be wired from another expression, it is a pin.

### Fold (legacy kinds — do not spawn)

| kindId | Becomes |
|--------|---------|
| event_on_start | event_define + 
ole: entry (already deprecated) |
| event_on_update | event_define + 
ole: tick |
| ction_await_wait | ction_wait + async option |

Old graphs may still contain these. Analyzer / migration keep working. Spawn catalog must not offer them.

### Drop from spawn (not a typed construct)

| kindId | Why |
|--------|-----|
| event_emit / event_subscribe | Hidden runtime — already blocked. Stay out of spawn |
| low_sequence | Not a text construct. The exec chain already is sequence |
| graph_ref | Navigation / project-map, not a statement. Must not appear in the spawn catalog |

### Leftover kinds (do not add)

Do **not** add `constructor_define` / `implements_define` / `property_define` / `closure_define` / `flow_match`. Constructor is Function `role`. Interface/trait is Class `form` + Implements option. Try/catch is a shipped flow node (`flow_try`; catch/finally pins) — not in Go or Rust. Lambda is a shipped expression node (`lambda_define`); capture is an option. See catalog leftover-constructs lock.

## Settings that stay on Declare / Import

| Setting | On |
|---------|-----|
| Extends / Implements | Class Declare |
| Visibility | Variable / Function / Event Declare |
| Is Static (inding) | Variable / Function |
| Is Constant | Variable Declare |
| Is Virtual / Abstract / Override / Async | Function Declare |
| Enum Type | Variable / Switch |
| Import Module props | Import Module |
| Data type | Variable / pins |
| Generic / Wildcard pin | Function Declare |
| Is Free / Module Function | Function |
