# Feature Support & Progressive Confirmation

Parent: [`../SKILL.md`](../SKILL.md). C++ Coverage Lab modifier matrix: [`../cpp.md`](../cpp.md) § Support matrix.

## Progressive multi-stage confirmation

Before marking a feature supported, confirm all five:

1. **Graph / UI** — properties in `@vvs/graph-types` and controls exposed (e.g. `NodeModifiers.tsx`).
2. **Syntax pack** — target pack can express the keyword/concept; else mark **ineffective** and disable the chip (do not invent emit).
3. **Backend** — schema stores safely (mostly JSON passthrough).
4. **Coverage Lab output** — Machine/Sensor modules match goldens via Code | Files (`extract_test_project_outputs.ts` / `useProjectTranspileResult`). Do **not** use Calculator-era goldens.
5. **sourceMap** — every emitted line maps to a canvas node ID for Code-panel highlight.

**Canonical plans:** `docs/design/fidelity_streamline.md` · `docs/design/language_capability_catalog.md`.

## Active track: Coverage Lab + fidelity streamline

1. Lock **Coverage Lab → C++** Machine golden (modifiers + access sections + sourceMap).
2. Strip emit magic per `fidelity_streamline.md` — no inferred abstract, invented Default/override/public, hardcoded param types, silent class shells.
3. Wire **modifierEffectiveness** so ineffective chips disable for the current language.
4. Same property → IR slot → syntax-pack flow across C# → Python → JS → Rust → GDScript → Verse.
5. Do **not** prescribe `# Declare` placeholders without `(x)` on non-native langs.

## Feature support table

> Verified against `core-pack.json`, `variableTypes.ts`, `typeNaming.ts`, Project Tree symbols, `propertySchema`, and `graphToIr.ts`. Prefer [`language_capability_catalog.md`](../../../../docs/design/language_capability_catalog.md) when this table drifts.

### Define nodes (structural)

| Feature | Where Supported | C++ Codegen | Notes |
| --- | --- | --- | --- |
| Class | `class_define`, Symbols Panel | ✅ | `ClassDecl` shell |
| Inheritance | `class_define` → `extendsType` | ✅ | `: public BaseClass` |
| Variable | `var_define`, Symbols Panel | ✅ | Typed declarations |
| Function **Declare** | `function_define`, Symbols Panel | ✅ | Signature / abstract / modifiers |
| Function **Define** | `function_implement` | ✅ | Body placement; inherits Declare modifiers |
| Event (Custom) | `event_member_define`, Symbols Panel | ✅ | Handler + dispatch pattern |
| Enum Define | `enum_define` | ✅ | Shipped; Coverage Lab / Dual Class Lab |
| Interface Define | ❌ Not in registry | ❌ | Planned (`implements_define`) |
| Constructor Define | ❌ Not in registry | ❌ | Use `on_init` / entry pattern today |
| Try/Catch | ❌ Not in registry | ❌ | Planned flow node |

### Node settings / modifiers

| Modifier | Available On | C++ Codegen | Notes |
| --- | --- | --- | --- |
| Visibility | class / var / function / event Declare | ✅ | `public:` / `protected:` / `private:` blocks |
| Binding (instance/static/module) | var / function / event | ✅ | `static` when binding is static |
| Const / Readonly | `var_define` | ✅ | `const` |
| Abstract | function Declare (also class in schema) | ✅ | `virtual … = 0` |
| Virtual | function Declare | ✅ | `virtual` |
| Override | function Declare | ✅ | `override` |
| Return Type | `function_define` | ✅ | Typed return |
| Extends | `class_define` | ✅ | `: public BaseClass` |
| Async | function Declare | ❌ Ineffective for C++ | Disable chip — see [`../cpp.md`](../cpp.md) Support matrix |

### Variable data types

| Type | UI | C++ Codegen | Notes |
| --- | --- | --- | --- |
| `data_string` | ✅ | ✅ `std::string` | |
| `data_number` | ✅ | ✅ `float` | |
| `data_boolean` | ✅ | ✅ `bool` | |
| `data_object` | ✅ | ⚠️ `auto` | No struct emit yet |
| `data_array` | ✅ | ⚠️ often `auto` | Prefer `std::vector<T>` when element type known |
| `data_any` | ✅ | ⚠️ `auto` | Fallback |
| `data_enum` | via enum type on var / switch | ✅ with `enum_define` | Case labels are member names |

### Flow / action / expression (summary)

Shipped flow: `flow_branch`, `flow_for`, `flow_while`, `flow_switch`, `flow_sequence`. Shipped actions: `action_print`, `action_get_input`, Wait / Await Wait. Math + convert nodes ship; string-concat / comparison operator nodes are still gaps.

### Events

| Node | Status | Notes |
| --- | --- | --- |
| Program entry | ✅ via `event_member_define` + `event_define` (`role: entry`) | Emits `on_start` from canvas only |
| Custom On / Dispatch | ✅ `event_define` / `event_dispatch` | |
| Legacy `event_on_start` | ❌ Errors on load/analysis | Do not reintroduce |
| `event_emit` / `event_subscribe` | ❌ Blocked | `HIDDEN_EVENT_RUNTIME_UNSUPPORTED` — no hidden multicast |

### Cross-graph / environment

| Node | Status | Notes |
| --- | --- | --- |
| Call Function | ✅ | |
| Import Module | ⚠️ Partial | `targetLanguages`, file-top vs conditional |
| Graph Reference | UI only | Not emitted |
| Call Native / env handlers | ⚠️ Partial | Environment-specific |
