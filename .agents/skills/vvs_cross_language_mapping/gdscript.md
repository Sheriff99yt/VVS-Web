# GDScript — VVS Cross-Language Mapping

> **Not a skill.** One reference document for **GDScript** only.
> Parent skill: [`SKILL.md`](SKILL.md) · Shared (cross-cutting): [`shared/`](shared/)

**Syntax pack:** `packages/syntax-packs/src/packs/gdscript.base.json`

**Agent rule:** For GDScript work, open **this file only** (plus `SKILL.md` for workflow). Do not open other language docs.

> **Issues:** See parent [`SKILL.md`](SKILL.md) Issues (`CL-011`–`CL-013`, `CL-018`).

## Declare / Define

| Canvas | GDScript emit |
|--------|---------------|
| **Declare** `Boot` (non-abstract) | `# (x) Declare Boot` + dim |
| **Declare** `Diagnose` (`isAbstract`) | `# (x) Declare Diagnose` + dim |
| **Define** `Boot` | in-class `func Boot() -> void:` + body |

```gdscript
class_name Machine
    var Power = 0
    static var Serial = 0
    # (x) Declare Boot
    func Boot() -> void:
        self.Ready = true
        print("Booted")
    # (x) Declare Diagnose
    # (x) Declare Shutdown
    func Shutdown() -> void:
        self.Ready = false
        print("Shutdown")
```

Coverage Lab: `enum SensorStatus { OK, WARN, FAIL }`, second `class_name Sensor` + `extends Machine`, Switch → **if/elif** (temp `_vvs_sel` currently missing `var` — CL-012), GetInput via `OS.read_string_from_stdin()` without printing the prompt (CL-013). Async modifier is a no-op today (CL-018).

## Concept → emit

| Concept | Representation in VVS | Emit |
| :--- | :--- | :--- |
| **Enum** | `Enum Define` Node | `enum Color { … }` |
| **Interface** *(planned)* | `Interface Define` Node | *Implicit* |
| **Class** | `Class Define` Node | `class_name MyClass` |
| **Inheritance** | `Class Define` Option: **Extends** | `extends BaseClass` |
| **Implements** | `Class Define` Option: **Implements** | *Implicit* |
| **Variable** | `Variable Define` Node | `var A = 0` |
| **Private Var** | `Variable` Option: **Visibility** | `_secretKey` |
| **Constant Var** | `Variable` Option: **Constant** | plain `var` today / `const` when supported |
| **Static Var** | `Variable` Option: **Static** | `static var Serial = 0` |
| **Array** | `Variable` Pin Type: **Array** | `[]` |
| **Map/Dictionary** | `Variable` Pin Type: **Map** | `{}` |
| **Function** | `Function Declare` + `Function Define` | `# (x) Declare` + `func Func() -> void:` |
| **Abstract Func** | Declare `isAbstract` (no Define body) | `# (x) Declare Func` |
| **Virtual / Override** | Declare `isVirtual` / `isOverride` | *Implicit* |
| **Free Function** | `Function` Option: **Not in Class** | `func Func():` |
| **Static Function** | `Function` Option: **Static** | `static func Func():` |
| **Virtual Func** | `Function` Option: **Virtual** | *Implicit* |
| **Generics** | `Function` Option: **Wildcard Pin** | *Implicit* |
| **Constructor** *(planned)* | `Constructor Define` Node | `func _init():` |
| **Error (Try)** *(planned)* | `Try/Catch` Block Node | *Implicit/Asserts* |
| **Lambda/Callback** | Pin Type: **Callable** | `Callable` |
| **Namespaces** | `Namespace Define` Node | `class_name` |
| **Structs** | `Struct Define` Node | *Dictionary* |
| **Destructor** | `Destructor Define` Node | `NOTIFICATION_PREDELETE` |
| **Async Function** | `Function` Option: **Async** | *(ineffective today — CL-018)* |
| **Await** | `Await` Node | `await X` |
| **If/Else** | `Branch (If)` Node | `if: / else:` |
| **Switch/Match** | `Switch` Node | `if/elif` cascade (`_vvs_sel`) — *not* `match` today |
| **For Loop** | `For Loop` Node | `for x in y:` |
| **While Loop** | `While Loop` Node | `while x:` |
| **Break** | `Break` Node | `break` |
| **Continue** | `Continue` Node | `continue` |
| **Type Cast** | `Cast` / `Convert` Node | `str(x)` / `int(x)` |

## Declarations, definitions, modifiers

```gdscript
# --- Enum ---
enum Color { RED, GREEN, BLUE }

# --- Class Declaration (Extends BaseClass) ---
class_name AdvancedClass
extends BaseClass

# --- Constants & Statics ---
const PI = 3.14159
static var OpCount = 0.0

# --- Variables (Visibility & Data Structures) ---
var A: float = 0.0
var _secretKey: String = "" # Private (by convention)
var History: Array = [] # Array
var Scores: Dictionary = {} # Dictionary / Map

# --- Constructors ---
func _init() -> void:
    pass

# --- Getters / Setters ---
var ValueA: float:
    get:
        return A
    set(val):
        A = val

# --- Static Functions ---
static func StaticFunction() -> void:
    pass

# --- Generics (Implicit due to dynamic typing) ---
func Swap(a, b) -> void:
    pass

# --- Function Overloads (Emulated via defaults) ---
func Add(x: float, y = null) -> void:
    pass

# --- Interface Implementation (Duck Typing) ---
func TakeDamage(amount: float) -> void:
    pass

# --- Error Handling & Lambdas (Callables) ---
func ProcessData(callback: Callable) -> void:
    # GDScript doesn't have try/catch, uses error codes or asserts
    callback.call()

# --- Events ---
func on_calculate() -> void:
    pass
```

---

## Control flow, async, memory, namespaces

```gdscript
# --- Namespaces (Inner Classes or Files) ---
class_name FlowAndAsyncDemo

# --- Structs (Emulated via inner classes or Dicts) ---

# --- Destructors ---
func _notification(what):
    if what == NOTIFICATION_PREDELETE:
        pass # Cleanup

# --- Async / Await ---
# Coverage Lab: async modifier is currently a no-op (plain func). await remains valid when used.
func fetch_data():
    await get_tree().create_timer(1.0).timeout

# --- Control Flow ---
func flow_example(val: int):
    if val == 1:
        pass
    elif val == 2:
        pass
    else:
        pass

    # Switch — Coverage Lab emits if/elif (not match)
    _vvs_sel = val
    if _vvs_sel == 1:
        pass
    elif _vvs_sel == 2:
        pass

    for i in range(10):
        if i == 5:
            continue
        if i == 8:
            break

    while val > 0:
        val -= 1

# --- Type Casting ---
func type_cast(val: float) -> int:
    return int(val)
```
