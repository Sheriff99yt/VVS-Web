# C# — VVS Cross-Language Mapping

> **Not a skill.** One reference document for **C#** only.
> Parent skill: [`SKILL.md`](SKILL.md) · Shared (cross-cutting): [`shared/`](shared/)

**Syntax pack:** `packages/syntax-packs/src/packs/csharp.base.json`

**Agent rule:** For C# work, open **this file only** (plus `SKILL.md` for workflow). Do not open other language docs.

> **Issues:** See parent [`SKILL.md`](SKILL.md) Issues (`CL-005`, `CL-006`).

## Declare / Define

| Canvas | C# emit |
|--------|---------|
| **Declare** `Boot` (non-abstract) | `// (x) Declare Boot` + dim — **not** a real prototype |
| **Declare** `Diagnose` (`isAbstract`) | real `protected abstract void Diagnose();` (via `FunctionDeclPrototype`) |
| **Define** `Boot` | in-class `public virtual void Boot() { … }` — **no** out-of-line emit |

```csharp
public class Machine {
    // (x) Declare Boot
    public virtual void Boot() {
        Console.WriteLine("Booted");
    }
    protected abstract void Diagnose();
    // (x) Declare Shutdown
    public async void Shutdown() {
        this.Ready = false;
        Console.WriteLine("Shutdown");
    }
}
```

Coverage Lab also shows: `using System;` / `using System.Collections.Generic;`, `public enum SensorStatus`, `public class Sensor : Machine`, `readonly` on const fields, GetInput via `Console.ReadLine()`, `foreach`, and `override` on Report.

## Concept → emit

| Concept | Representation in VVS | Emit |
| :--- | :--- | :--- |
| **Enum** | `Enum Define` Node | `public enum Color` |
| **Interface** *(planned)* | `Interface Define` Node | `interface IDamageable` |
| **Class** | `Class Define` Node | `public class MyClass` |
| **Inheritance** | `Class Define` Option: **Extends** | `: BaseClass` |
| **Implements** | `Class Define` Option: **Implements** | `, IDamageable` |
| **Variable** | `Variable Define` Node | `public float A = 0;` |
| **Private Var** | `Variable` Option: **Visibility** | `protected` / `private float A;` |
| **Constant Var** | `Variable` Option: **Constant** | `public readonly float MaxPower = 100` |
| **Static Var** | `Variable` Option: **Static** | `public static float Serial = 0` |
| **Array** | `Variable` Pin Type: **Array** | `List<T>` |
| **Map/Dictionary** | `Variable` Pin Type: **Map** | `Dictionary<K, V>` |
| **Function** | `Function Declare` + `Function Define` | `// (x) Declare` + `void Func()` |
| **Abstract Func** | Declare `isAbstract` (no Define body) | `protected abstract void Func();` |
| **Virtual / Override** | Declare `isVirtual` / `isOverride` | `virtual` / `override` |
| **Free Function** | `Function` Option: **Not in Class** | `static void Func()` |
| **Static Function** | `Function` Option: **Static** | `public static void Func` |
| **Virtual Func** | `Function` Option: **Virtual** | `public virtual void Func` |
| **Generics** | `Function` Option: **Wildcard Pin** | `void Func<T>()` |
| **Constructor** *(planned)* | `Constructor Define` Node | `public MyClass()` |
| **Error (Try)** *(planned)* | `Try/Catch` Block Node | `try { } catch` |
| **Lambda/Callback** | Pin Type: **Callable** | `Action callback` |
| **Namespaces** | `Namespace Define` Node | `namespace X` |
| **Structs** | `Struct Define` Node | `struct X` |
| **Destructor** | `Destructor Define` Node | `~X()` |
| **Async Function** | `Function` Option: **Async** | `async void` today (void methods) — see CL-006 for `async Task` |
| **Await** | `Await` Node | `await X` |
| **If/Else** | `Branch (If)` Node | `if () {} else {}` |
| **Switch/Match** | `Switch` Node | `switch() case:` |
| **For Loop** | `For Loop` Node | `foreach (var x in xs)` (Coverage Lab) |
| **While Loop** | `While Loop` Node | `while() {}` |
| **Break** | `Break` Node | `break;` |
| **Continue** | `Continue` Node | `continue;` |
| **Type Cast** | `Cast` / `Convert` Node | `(T)x` / `.ToString()` |

## Declarations, definitions, modifiers

```csharp
using System;
using System.Collections.Generic;

// --- Enum ---
public enum Color { Red, Green, Blue }

// --- Interface ---
public interface IDamageable {
    void TakeDamage(float amount);
}

// --- Class Declaration ---
public class AdvancedClass : BaseClass, IDamageable {
    // --- Constants & Static Variables ---
    public const float PI = 3.14159f;
    public static float OpCount = 0.0f;

    // --- Variables (Visibility & Data Structures) ---
    public float A = 0.0f;
    private string secretKey = ""; // Private
    public List<float> History = new List<float>(); // Array
    public Dictionary<string, int> Scores = new Dictionary<string, int>(); // Dictionary / Map

    // --- Constructors ---
    public AdvancedClass() : base() {}

    // --- Getters / Setters (Properties) ---
    public float ValueA {
        get { return A; }
        set { A = value; }
    }

    // --- Static Functions ---
    public static void StaticFunction() {}

    // --- Generics ---
    public void Swap<T>(ref T a, ref T b) {}

    // --- Function Overloads (Native) ---
    public void Add(float x) {}
    public void Add(float x, float y) {}

    // --- Interface Implementation ---
    public void TakeDamage(float amount) {}

    // --- Error Handling & Lambdas ---
    public void ProcessData(Action callback) {
        try {
            callback(); // Lambda execution
        } catch (Exception e) {
            // Catch block
        } finally {
            // Finally block
        }
    }

    // --- Events ---
    public void on_calculate() {}
}
```

---

## Control flow, async, memory, namespaces

```csharp
using System.Threading.Tasks;

// --- Namespaces ---
namespace CoreMath {
    public class MathUtils {}
}

// --- Structs (Value Types) ---
public struct Vector3 {
    public float x, y, z;
}

public class FlowAndAsyncDemo {
    // --- Destructors / Finalizers ---
    ~FlowAndAsyncDemo() {
        // Cleanup
    }

    // --- Async / Await ---
    // Coverage Lab void+async methods emit `async void` today (CL-006), not Task.
    public async Task FetchData() {
        await Task.Delay(1000);
    }

    // --- Control Flow ---
    public void FlowExample(int val, List<int> items) {
        if (val == 1) {
        } else if (val == 2) {
        } else {
        }

        switch(val) {
            case 1: break;
            default: break;
        }

        foreach (var item in items) {
            if (item == 5) continue;
            if (item == 8) break;
        }

        while (val > 0) {
            val--;
        }
    }

    // --- Type Casting ---
    public int TypeCast(float val) {
        return (int)val;
    }
}
```
