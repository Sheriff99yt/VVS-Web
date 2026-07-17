# Verse (UEFN) — VVS Cross-Language Mapping

> **Not a skill.** One reference document for **Verse (UEFN)** only.
> Parent skill: [`SKILL.md`](SKILL.md) · Shared (cross-cutting): [`shared/`](shared/)

**Syntax pack:** `packages/syntax-packs/src/packs/verse.base.json`

**Agent rule:** For Verse (UEFN) work, open **this file only** (plus `SKILL.md` for workflow). Do not open other language docs.

> **Issues:** See parent [`SKILL.md`](SKILL.md) Issues (`CL-014`–`CL-016`, `CL-018`). GetInput / for-loop emit are **wrong vs Verse** — documented as shipped goldens; do not treat as target language truth until fixed.

## Declare / Define

| Canvas | Verse emit |
|--------|------------|
| **Declare** `Boot` (non-abstract) | `# (x) Declare Boot` + dim |
| **Declare** `Diagnose` (`isAbstract`) | `# (x) Declare Diagnose` + dim |
| **Define** `Boot` | in-class `Boot<public>() : void =` + body |

```verse
<public>Machine := class:
    var Power : float = 0
    var Ready<public> : logic = false
    # (x) Declare Boot
    Boot<public>() : void =
        set Ready = true
        Print("Booted")
    # (x) Declare Diagnose
    # (x) Declare Shutdown
    Shutdown<public>() : void =
        set Ready = false
        Print("Shutdown")
```

Coverage Lab: `<public>Sensor(Machine) := class:`, `SensorStatus := enum:`, Switch → sequential `if` with `# switch` comment, GetInput currently stubs `var _vvs_input_… : float = 0.0` (**CL-014**), for-each currently emits invalid brace form (**CL-015**).

## Concept → emit

| Concept | Representation in VVS | Emit |
| :--- | :--- | :--- |
| **Enum** | `Enum Define` Node | `Color := enum:` |
| **Interface** *(planned)* | `Interface Define` Node | `IDamageable := interface:` |
| **Class** | `Class Define` Node | `<public>MyClass := class:` |
| **Inheritance** | `Class Define` Option: **Extends** | `<public>Child(Base) := class:` |
| **Implements** | `Class Define` Option: **Implements** | `, IDamageable` |
| **Variable** | `Variable Define` Node | `var A : float = 0` / `var A<public> : …` |
| **Private Var** | `Variable` Option: **Visibility** | omit `<public>` |
| **Constant Var** | `Variable` Option: **Constant** | plain `var` today |
| **Static Var** | `Variable` Option: **Static** | plain `var` today *(module static planned)* |
| **Array** | `Variable` Pin Type: **Array** | `[]float = array{}` |
| **Map/Dictionary** | `Variable` Pin Type: **Map** | `[string]string = map{}` |
| **Function** | `Function Declare` + `Function Define` | `# (x) Declare` + `Func<public>() : void =` |
| **Abstract Func** | Declare `isAbstract` (no Define body) | `# (x) Declare Func` |
| **Virtual / Override** | Declare `isVirtual` / `isOverride` | `<override>` |
| **Free Function** | `Function` Option: **Not in Class** | `Func() : void =` |
| **Static Function** | `Function` Option: **Static** | *(Module function)* |
| **Virtual Func** | `Function` Option: **Virtual** | `Func<override>()` |
| **Generics** | `Function` Option: **Wildcard Pin** | `Func(t: type)` |
| **Constructor** *(planned)* | `Constructor Define` Node | `MakeMyClass()` |
| **Error (Try)** *(planned)* | `Try/Catch` Block Node | *(Failure Context)* |
| **Lambda/Callback** | Pin Type: **Callable** | `type {() : void}` |
| **Namespaces** | `Namespace Define` Node | `x := module:` |
| **Structs** | `Struct Define` Node | `X := struct:` |
| **Destructor** | `Destructor Define` Node | *(None)* |
| **Async Function** | `Function` Option: **Async** | *(ineffective today — CL-018; `<suspends>` planned)* |
| **Await** | `Await` Node | `X()` *(implicit)* |
| **If/Else** | `Branch (If)` Node | `if (): / else:` / `if (Ready?):` |
| **Switch/Match** | `Switch` Node | sequential `if` cascade (`# switch` comment) |
| **For Loop** | `For Loop` Node | *broken today — CL-015*; target `for (val : xs):` |
| **While Loop** | `While Loop` Node | `loop: if:` |
| **Break** | `Break` Node | `break` |
| **Continue** | `Continue` Node | *Implicit/Logic* |
| **Type Cast** | `Cast` / `Convert` Node | `ToString(x)` / `T[x]` |

## Declarations, definitions, modifiers

```verse
# --- Enum ---
Color := enum:
    Red
    Green
    Blue

# --- Interface ---
IDamageable := interface:
    TakeDamage(Amount : float) : void

# --- Module / Free Function ---
HelperFunction() : void =
    # empty

# --- Class Declaration (Extends BaseClass & Implements IDamageable) ---
AdvancedClass := class(BaseClass, IDamageable):
    # --- Constants & Variables ---
    PI<public> : float = 3.14159
    var A<public> : float = 0.0
    var secretKey<private> : string = "" # Private
    var History<public> : []float = array{} # Array
    var Scores<public> : [string]int = map{} # Dictionary / Map

    # --- Getters / Setters ---
    GetValueA<public>() : float =
        return A
    SetValueA<public>(val : float) : void =
        set A = val

    # --- Generics (Parametric types) ---
    Swap(t : type, a : t, b : t) : void =
        # empty

    # --- Interface Implementation ---
    TakeDamage(Amount : float) : void =
        # empty

    # --- Function Overloads (Native Support) ---
    Add<public>(x : float) : void =
        # empty
    Add<public>(x : float, y : float) : void =
        # empty

    # --- Error Handling & Lambdas ---
    # Verse uses failure contexts (decides) instead of try/catch
    ProcessData(Callback : type {() : void}) : void =
        Callback()

    # --- Events ---
    on_calculate<public>() : void =
        # empty

# --- Constructors (Verse uses block expressions or factory functions) ---
MakeAdvancedClass() : AdvancedClass =
    return AdvancedClass{}
```

---

## Control flow, async, memory, namespaces

```verse
# --- Namespaces (Modules) ---
core_math := module:
    Calculate() : void = {}

# --- Structs (Value Types) ---
Vector3 := struct:
    X : float
    Y : float
    Z : float

FlowAndAsyncDemo := class():
    # --- Destructors (Not exposed in Verse) ---

    # --- Async / Await ---
    # Coverage Lab: async modifier is currently a no-op (no <suspends> — CL-018).
    FetchData()<suspends> : void =
        Sleep(1.0)

    # --- Control Flow ---
    FlowExample(Val : int) : void =
        if (Val = 1):
            pass
        else if (Val = 2):
            pass
        else:
            pass

        # Switch — Coverage Lab: sequential if cascade with # switch comment

        # For Loop — Coverage Lab currently emits invalid brace form (CL-015).
        # Target shape:
        # for (Val : Readings):
        #     Print(ToString(Val))

        var MutVal : int = Val
        loop:
            if (MutVal > 0):
                set MutVal -= 1
            else:
                break

    # --- Type Casting ---
    TypeCast(Val : float) : int =
        # In Verse, conversions must be explicit and can fail
        if (IntVal := Int[Val]):
            return IntVal
        return 0
```
