# Declare / Define Rules (Locked)

Parent: [`../SKILL.md`](../SKILL.md). C++ reference: [`../cpp.md`](../cpp.md).

## U81 — Declare ≠ Define

| Canvas | Owns |
|--------|------|
| **Declare** (`function_define`) | Existence / signature / modifiers (`isVirtual`, `isAbstract`, `isOverride`, visibility, …) |
| **Define** (`function_implement`) | Body placement on the member chain (authored in Edit function body) |

Never invent a body from Declare alone. Never fold Declare into Define.

## U82 — C++ is the reference

- Non-abstract Declare → in-class prototype (`virtual void Boot();`).
- Abstract Declare → pure virtual (`virtual void Diagnose() = 0;`).
- Define → out-of-line `void Machine::Boot() { … }` after `};` (same graph) **or** on a separate `.cpp` graph.
- Out-of-line definitions omit `virtual` / `static` / `override` — those belong on Declare only.

Full teaching examples: [`../cpp.md`](../cpp.md).

## U66 / U67 — Non-native prototype langs

Python, JavaScript, C#, Rust, GDScript, Verse have **no** separate prototype split:

- Non-abstract Declare → **ineffective**: `# (x) Declare Name` / `// (x) Declare Name` + canvas dim (toggleable).
- Abstract Declare → native only on **C++** and **C#**; elsewhere also U66 `(x)` + dim.
- Do **not** emit stub `# Declare` / `// Declare` / `# abstract` **without** `(x)` on non-native langs.
- Never invent a forward-decl; never silent-skip.
- Method body remains at Define (no out-of-line invent for C#/Rust).

## File boundaries

One container graph → one file. Want `.h` + `.cpp` → **two graphs** + user-picked extensions + explicit **Import Module**. Never auto-split one graph into header/source.

## sourceMap

- Declare maps only to what it emits (prototype or `(x)` line).
- Define maps to the method / `def` header + body.
- Never dual-tag the Define line onto Declare.
