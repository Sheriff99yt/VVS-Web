# C++ — VVS Cross-Language Mapping

> **Not a skill.** One reference document for **C++** only.
> Parent skill: [`SKILL.md`](SKILL.md) · Shared (cross-cutting): [`shared/`](shared/)

**Syntax pack:** `packages/syntax-packs/src/packs/cpp.base.json`

**Agent rule:** For C++ work, open **this file only** (plus `SKILL.md` for workflow). Do not open other language docs.

## Declare / Define

**One rule (no dual path):**

| Canvas | C++ emit |
|--------|----------|
| **Declare** `Boot` (non-abstract) | `virtual void Boot();` prototype inside the class |
| **Declare** `Diagnose` (`isAbstract`) | `virtual void Diagnose() = 0;` |
| **Define** `Boot` | `void Machine::Boot() { … }` **after** `};` (same graph) **or** on a separate `.cpp` graph |
| **Call** `Boot` | `Boot();` at the use site only |

Out-of-line definitions omit `virtual` / `static` / `override` — those belong on the Declare prototype only.
Return type comes from Declare / overload (`void`, `float`, …) — not hardcoded.

> **Issues:** See parent [`SKILL.md`](SKILL.md) Issues log (`CL-001`, `CL-002`). Teaching shapes below match Coverage Lab / First Graph goldens.

#### Teaching example — one file (Coverage Lab shape)

Events stay **inside** the class; Declare prototypes stay inside; Define bodies are `Class::Method` **after** `};`. Ineffective imports keep `(x)` comments.

```cpp
#include <iostream>
// (x) Import System
#include <string>
#include <vector>
#include <unordered_map>

class Machine {
protected:
    float Power = 0;
public:
    inline static float Serial = 0;
    const float MaxPower = 100;
    bool Ready = false;
    virtual void Boot();              // Declare Boot
protected:
    virtual void Diagnose() = 0;      // Declare Diagnose (abstract)
public:
    void Shutdown();                  // Declare Shutdown
    void on_start() {                 // Event — inside class
        std::cout << "Operator name?";
        std::string _vvs_input_lab_get_input;
        std::getline(std::cin, _vvs_input_lab_get_input);
        Boot();
    }
};

void Machine::Boot() {                // Define Boot
    Ready = true;
    std::cout << "Booted" << std::endl;
}

void Machine::Shutdown() {            // Define Shutdown
    Ready = false;
}
```

#### First Graph (Declare · GetInput · Call)

```cpp
class FirstGraph {
public:
    std::string VisitorName = "";
    void SayHello();
    void on_start() {
        std::cout << "What is your name?";
        std::string _vvs_input_fg_get_input;
        std::getline(std::cin, _vvs_input_fg_get_input);
        std::cout << _vvs_input_fg_get_input << std::endl;
        SayHello();
    }
};
void FirstGraph::SayHello() {
    std::cout << "Hello from SayHello!" << std::endl;
}
```

#### Teaching example — two files (user-authored graphs only)

**Graph A** — extension `.h` (Declares + fields only; **no** Define nodes):

```cpp
#pragma once

class Machine {
public:
    void Boot();
    int Add(int a, int b);
};
```

**Graph B** — extension `.cpp` (Import Module + Defines):

```cpp
#include "Machine.h"          // Import Module — user placed
#include <iostream>

void Machine::Boot() {        // Define Boot
    std::cout << "booting" << std::endl;
}

int Machine::Add(int a, int b) {  // Define Add
    return a + b;
}
```

**Forbidden:** auto-generate `.h` from `.cpp`; invent `#include` / `#pragma once`; fold Declare into Define; emit stub body without Define.

**Other languages:** non-abstract Declare is **ineffective** → U66 `(x) Declare Name` + U67 dim (toggleable); method body remains at Define (no out-of-line split). Abstract is native only on C++ / C#; elsewhere abstract Declare also uses U66 `(x)` + dim — never emit `# abstract` without `(x)`. Details: [`shared/declare-define-rules.md`](shared/declare-define-rules.md).

**Coverage Lab C++ golden** proves Machine+Sensor one-file shape: prototypes inside each class, `Class::Method` bodies after each `};`.

## Concept → emit

| Concept | Representation in VVS | Emit |
| :--- | :--- | :--- |
| **Enum** | `Enum Define` Node | `enum class Color` |
| **Interface** *(planned)* | `Interface Define` Node | `class IDamageable` |
| **Class** | `Class Define` Node | `class MyClass` |
| **Inheritance** | `Class Define` Option: **Extends** | `: public BaseClass` |
| **Implements** | `Class Define` Option: **Implements** | `, public IDamageable` |
| **Variable** | `Variable Define` Node | `float A = 0;` |
| **Private Var** | `Variable` Option: **Visibility** | `private:` / `protected:` sections |
| **Constant Var** | `Variable` Option: **Constant** | `const float MaxPower = 100` |
| **Static Var** | `Variable` Option: **Static** | `inline static float Serial = 0` |
| **Array** | `Variable` Pin Type: **Array** | `std::vector<T>` |
| **Map/Dictionary** | `Variable` Pin Type: **Map** | `std::unordered_map` |
| **Function** | `Function Declare` + `Function Define` | prototype + `Class::Func` (U82) |
| **Abstract Func** | Declare `isAbstract` (no Define body) | `virtual void Func() = 0;` |
| **Virtual / Override** | Declare `isVirtual` / `isOverride` | `virtual` / `override` postfix |
| **Free Function** | `Function` Option: **Not in Class** | `void Func()` |
| **Static Function** | `Function` Option: **Static** | `static void Func()` |
| **Virtual Func** | `Function` Option: **Virtual** | `virtual void Func()` |
| **Generics** | `Function` Option: **Wildcard Pin** | `template <typename T>` |
| **Constructor** *(planned)* | `Constructor Define` Node | `MyClass()` |
| **Error (Try)** *(planned)* | `Try/Catch` Block Node | `try { } catch` |
| **Lambda/Callback** | Pin Type: **Callable** | `std::function<void()>` |
| **Namespaces** | `Namespace Define` Node | `namespace X` |
| **Structs** | `Struct Define` Node | `struct X` |
| **Destructor** | `Destructor Define` Node | `~X()` |
| **Async Function** | `Function` Option: **Async** | *(ineffective — disable chip)* |
| **Await** | `Await` Node | *(ineffective with Async)* |
| **If/Else** | `Branch (If)` Node | `if () {} else {}` |
| **Switch/Match** | `Switch` Node | `switch() case:` |
| **For Loop** | `For Loop` Node | `for (T x : xs)` (Coverage Lab) |
| **While Loop** | `While Loop` Node | `while() {}` |
| **Break** | `Break` Node | `break;` |
| **Continue** | `Continue` Node | `continue;` |
| **Type Cast** | `Cast` / `Convert` Node | `static_cast<T>` |

## Declarations, definitions, modifiers

```cpp
#include <vector>
#include <string>
#include <unordered_map>
#include <functional>

// --- Enum ---
enum class Color {
    Red,
    Green,
    Blue
};

// --- Interface ---
class IDamageable {
public:
    virtual void TakeDamage(float amount) = 0;
};

// --- Module / Free Function ---
void HelperFunction() {
    // empty
}

// --- Class Declaration (Extends BaseClass & Implements IDamageable) ---
class AdvancedClass : public BaseClass, public IDamageable {
public:
    // --- Constructors ---
    AdvancedClass() : BaseClass() {}

    // --- Constants & Static Variables ---
    static const float PI = 3.14159f;
    inline static float OpCount = 0;

    // --- Getters / Setters ---
    float GetValueA() const { return A; }
    void SetValueA(float val) { A = val; }

    // --- Static Functions ---
    static void StaticFunction() {}

    // --- Generics (Templates) ---
    template <typename T>
    void Swap(T& a, T& b) {}

    // --- Function Overloads (Native) ---
    void Add(float x) {}
    void Add(float x, float y) {}

    // --- Interface Implementation ---
    void TakeDamage(float amount) override {}

    // --- Error Handling & Lambdas ---
    void ProcessData(std::function<void()> callback) {
        try {
            callback(); // Lambda execution
        } catch (const std::exception& e) {
            // Catch block
        }
    }

    // --- Events ---
    void on_calculate() {}

protected:
    // --- Instance Variables & Data Structures ---
    float A = 0;
    std::vector<float> History; // Array
    std::unordered_map<std::string, int> Scores; // Dictionary / Map

private:
    // --- Visibility (Private) ---
    std::string secretKey = "";
};
```

---

## Control flow, async, memory, namespaces

```cpp
#include <coroutine>

// --- Namespaces ---
namespace CoreMath {
    void Calculate() {}
}

// --- Structs (Value Types) ---
struct Vector3 {
    float x, y, z;
};

class FlowAndAsyncDemo {
public:
    // --- Destructors ---
    ~FlowAndAsyncDemo() {
        // Cleanup
    }

    // --- Async / Await (ineffective for C++ — chip disabled; no coroutine emit) ---
    // FetchData would not emit from isAsync today.

    // --- Control Flow ---
    void FlowExample(int val) {
        if (val == 1) {
        } else if (val == 2) {
        } else {
        }

        switch(val) {
            case 1: break;
            default: break;
        }

        for (float item : items) {
            if (item == 5) continue;
            if (item == 8) break;
        }

        while (val > 0) {
            val--;
        }
    }

    // --- Type Casting ---
    int TypeCast(float val) {
        return static_cast<int>(val);
    }
};
```

## Support matrix (Coverage Lab baseline)

| Feature / Modifier | Graph & UI Support | C++ Transpiler Support | Backend / Save | Dual Class Lab Accuracy | Code Highlighting (SourceMap) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Visibility** (public, protected, private) | ✅ Supported | ✅ Access sections from define-node visibility | ✅ Supported | ✅ | ✅ Works |
| **Static** (`binding: static`) | ✅ Supported | ✅ Supported (`inline static`) | ✅ Supported | ✅ Accurate | ✅ Works |
| **Virtual** (`isVirtual`) | ✅ Supported | ✅ Supported (`virtual`) | ✅ Supported | ✅ Accurate | ✅ Works |
| **Abstract / Pure** (`isAbstract`) | ✅ Supported | ✅ Supported (`= 0`) | ✅ Supported | ✅ Accurate | ✅ Works |
| **Override** (`isOverride`) | ✅ Supported | ✅ When set on define node | ✅ Supported | ✅ | ✅ Works |
| **Async** (`isAsync`) | ✅ Supported | ❌ **Ineffective for C++** — no-op emit; **disable chip** | ✅ Supported | N/A | N/A |
| **Constant** (`isConst`) | ✅ Supported | ✅ Supported (`const`) | ✅ Supported | ✅ | ✅ Works |
