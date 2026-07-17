# Node vs Setting Analysis

Parent: [`../SKILL.md`](../SKILL.md).

Distinguish **structural nodes** (existence on the canvas) from **inspector modifiers** (how that node emits).

### Distinct nodes (structural)

| UI label | Node kind | Role |
|----------|-----------|------|
| **Class Declare** | `class_define` | Class shell |
| **Function Declare** | `function_define` | Existence / signature / modifiers — no body |
| **Function Define** | `function_implement` | Body placement on the member chain (U81) |
| **Event Declare** | `event_member_define` | Event slot; **On** + **Dispatch** for use |
| **Variable Declare** | `var_define` | Property / variable |
| **Enum Declare** | `enum_define` | Fixed set of constants (shipped) |
| **Import Module** | `import_module` | Language import / include / from-import |
| **Get Enum Member** | `expr_enum_member` | Read an enum case |

**Planned (not yet in registry):** Interface Define, Constructor Define, Try/Catch block — appear in Concept → emit tables as aspirational shapes only.

### Settings / options (modifiers)

| Setting | On | Notes |
|---------|-----|--------|
| **Extends** / **Implements** | Class Declare | Parent / interface list |
| **Visibility** | Variable / Function Declare | Public / private / protected |
| **Is Static** (`binding`) | Variable / Function | Class-level emit |
| **Is Constant** | Variable Declare | `const` / readonly |
| **Is Virtual** / **Is Abstract** / **Is Override** | Function Declare | C++: `virtual` / `= 0` / `override`; see [`declare-define-rules.md`](declare-define-rules.md) |
| **Enum Type** (`enumType`) | Variable / Switch | Case labels are **member names**; pack slot `EnumMemberAccess` |
| **Import Module props** | Import Module | `modulePath`, `importStyle`, `importNames`, `targetLanguages`; optional `ownerClassId` |
| **Data type** | Variable / pins | Float, Array, Map, Callable, … |
| **Generic / Wildcard pin** | Function Declare | `<T>` / TypeVar |
| **Is Free / Module Function** | Function | Not a class member |
