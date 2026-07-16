---
name: VVS Cross Language Mapping Guide
description: Triggers when generating code, editing syntax packs, or determining how VVS visual nodes and settings translate into code across Python, C++, JS, C#, Rust, GDScript, and Verse.
---

# VVS Cross Language Mapping Guide (AI Agent Reference)

This skill document acts as the definitive AI Agent development examples helping guide. It dictates exactly how visual nodes, settings, and modifiers in VVS translate into code across all 7 supported target languages.

Whenever you are tasked with extending the transpiler, creating new nodes, or updating syntax packs, refer to these mappings to ensure 100% visual-to-code fidelity.


This document analyzes each segment of code in a comprehensive application and breaks down whether it is represented as a **distinct node** on the visual canvas, or an **option/setting/pin** on an existing node.

It also serves as a cross-language reference table showing exactly how each graphical concept translates into our 7 target languages.

## Verify as the user sees (locked)

Validate mappings against **Code | Files** output for StartScreen Test Projects — especially Coverage Lab — via `bun apps/web/scripts/extract_test_project_outputs.ts` / `useProjectTranspileResult`. Do not ship pack or emit changes proven only with raw `transpileGraph` when multi-class file naming or scoped imports matter.

## 1. Node vs. Setting Analysis

When designing the transpiler, we must distinguish between *structural elements* that deserve their own defining node, and *modifiers* that alter how an existing node behaves.

### Distinct Nodes (Structural Elements)
These elements represent the core scaffolding of the program. The user must drag these onto the canvas to define existence.
* **`Class Declare` Node** (`class_define`): Creates the class shell.
* **`Function Declare` Node** (`function_define`): Existence / signature only (modifiers live here). Does **not** invent a body.
* **`Function Define` Node** (`function_implement`): Places the method body at this member-chain position (U81). Body authored in the Edit function body tab.
* **`Event Declare` Node** (`event_member_define`): Event slot on the class; **On** handler + **Dispatch** for use.
* **`Variable Declare` Node** (`var_define`): Declares a property/variable.
* **`Enum Declare` Node** (`enum_define`): Declares a fixed set of constants.
* **`Import Module` Node:** Emits language import / include / from-import (`import_module`).
* **`Get Enum Member` Node:** Reads an enum case (`expr_enum_member`).
* **`Interface Define` Node:** Declares a structural contract.
* **`Constructor Define` Node:** Special initialization block (or handled via `on_init` Event).
* **`Try/Catch Block` Node:** Special execution node that splits the flow line into `Try`, `Catch`, and `Finally` paths.

### Settings / Options (Modifiers)
These elements modify how a Distinct Node is generated. They are found in the Node Inspector/Settings panel or determined by Pin connections.
* **`Extends` & `Implements`:** Settings on the `Class Declare` node (or handled via connecting class nodes to a parent pin).
* **`Visibility` (Public/Private/Protected):** A dropdown setting on `Variable Declare` and **Function Declare** nodes (Define inherits signature modifiers).
* **`Is Static`:** A toggle setting on `Variable` and `Function` nodes.
* **`Is Constant`:** A toggle setting on `Variable Declare` nodes.
* **`Is Virtual` / `Is Abstract` / `Is Override`:** Toggles on **Function Declare** (C++ maps these to `virtual` / `= 0` / `override`).
* **`Enum Type` (`enumType`):** On variable / switch — names the enum type; cases use **member names** (`OK`), not `Enum::OK`. Pack slot `EnumMemberAccess` (`.` vs `::`).
* **Import Module props:** `modulePath`, `importStyle` (`module` / `from` / `include_system`), `importNames`, **`targetLanguages`**. Place shared imports **once at file top**; flow Import Module inside branches for conditional imports (Python `import json`). Optional **`ownerClassId`** when an import must scope to one class on a multi-class graph.
* **`Data Type` (Float, Array, Map, Callable):** Driven by the type of the Data Pin on `Variable Declare` or function argument pins.
* **`Generic Type Parameters` (<T>):** Driven by adding a "Wildcard" pin to a `Function Declare` node.
* **`Is Free/Module Function`:** A toggle indicating the function doesn't belong to a class.

---

## 2. Language Translation Matrix

The following table demonstrates how each Node and Setting combinations transpile into code.

| Concept | Representation in VVS | Python | C++ | JavaScript | C# | Rust | GDScript | Verse |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Enum** | `Enum Define` Node | `class Color(Enum):` | `enum class Color` | `const Color = freeze({...})` | `public enum Color` | `pub enum Color` | `enum Color` | `Color := enum:` |
| **Interface** | `Interface Define` Node | `class IDamageable:` | `class IDamageable` | *Implicit/JSDoc* | `interface IDamageable` | `pub trait IDamageable` | *Implicit* | `IDamageable := interface:` |
| **Class** | `Class Define` Node | `class MyClass:` | `class MyClass` | `class MyClass` | `public class MyClass` | `pub struct MyClass` | `class_name MyClass` | `MyClass := class():` |
| **Inheritance** | `Class Define` Option: **Extends** | `(BaseClass)` | `: public BaseClass` | `extends BaseClass` | `: BaseClass` | `base: BaseClass` *(comp)* | `extends BaseClass` | `(BaseClass)` |
| **Implements** | `Class Define` Option: **Implements** | `(IDamageable)` | `, public IDamageable` | *Implicit* | `, IDamageable` | `impl IDamageable for` | *Implicit* | `, IDamageable` |
| **Variable** | `Variable Define` Node | `A = 0.0` | `float A;` | `A = 0.0;` | `public float A;` | `pub A: f32` | `var A: float = 0.0` | `var A: float = 0.0` |
| **Private Var** | `Variable` Option: **Visibility** | `_secretKey` | `private:` block | `#secretKey` | `private float A;` | `secretKey: String` *(no pub)* | `_secretKey` | `var secretKey<private>` |
| **Constant Var** | `Variable` Option: **Constant** | `PI = 3.14` | `const float PI` | `static get PI()` | `public const float PI` | `pub const PI: f32` | `const PI` | `PI : float` |
| **Static Var** | `Variable` Option: **Static** | `OpCount = 0` | `static float OpCount` | `static OpCount = 0` | `public static float` | `thread_local! static` | `static var OpCount` | *(Module var)* |
| **Array** | `Variable` Pin Type: **Array** | `[]` | `std::vector<T>` | `[]` | `List<T>` | `Vec<T>` | `Array` | `[]type` |
| **Map/Dictionary**| `Variable` Pin Type: **Map** | `Dict[K, V]` | `std::unordered_map`| `new Map()` | `Dictionary<K, V>` | `HashMap<K, V>` | `Dictionary` | `[type]type` |
| **Function** | `Function Declare` + `Function Define` | `# (x) Declare` + `def Func(self):` | prototype + `Class::Func` (U82) | `// (x) Declare` + `Func()` | `// (x) Declare` + `void Func()` | `// (x) Declare` + `fn Func` | `# (x) Declare` + `func Func():` | `# (x) Declare` + `Func() : void =` |
| **Abstract Func** | Declare `isAbstract` (no Define body) | `# abstract Func` | `virtual void Func() = 0;` | `// abstract Func` | `public abstract void Func();` | `// abstract Func` | `# abstract Func` | `# abstract Func` |
| **Virtual / Override** | Declare `isVirtual` / `isOverride` | *Implicit* | `virtual` / `override` postfix | *Implicit* | `virtual` / `override` | *Implicit* | *Implicit* | `<override>` |
| **Free Function** | `Function` Option: **Not in Class**| `def Func():` | `void Func()` | `export function Func()`| `static void Func()` | `pub fn Func()` | `func Func():` | `Func() : void =` |
| **Static Function** | `Function` Option: **Static** | `@staticmethod` | `static void Func()` | `static Func()` | `public static void Func` | `pub fn Func()` *(no self)* | `static func Func():` | *(Module function)* |
| **Virtual Func** | `Function` Option: **Virtual** | *Implicit* | `virtual void Func()` | *Implicit* | `public virtual void Func`| *Implicit* | *Implicit* | `Func<override>()` |
| **Generics** | `Function` Option: **Wildcard Pin**| `TypeVar('T')` | `template <typename T>`| *Implicit* | `void Func<T>()` | `pub fn Func<T>()` | *Implicit* | `Func(t: type)` |
| **Constructor** | `Constructor Define` Node | `def __init__(self):`| `MyClass()` | `constructor()` | `public MyClass()` | `pub fn new() -> Self` | `func _init():` | `MakeMyClass()` |
| **Error (Try)** | `Try/Catch` Block Node | `try: / except:` | `try { } catch` | `try { } catch` | `try { } catch` | `Result<T, E>` *(impl)* | *Implicit/Asserts* | *(Failure Context)* |
| **Lambda/Callback**| Pin Type: **Callable** | `callback()` | `std::function<void()>` | `callback()` | `Action callback` | `F: FnOnce()` | `Callable` | `type {() : void}` |

| **Namespaces** | `Namespace Define` Node | `module.py` | `namespace X` | `namespace X` | `namespace X` | `mod x` | `class_name` | `x := module:` |
| **Structs** | `Struct Define` Node | `@dataclass` | `struct X` | `interface X` | `struct X` | `struct X` | *Dictionary* | `X := struct:` |
| **Destructor** | `Destructor Define` Node | `__del__` | `~X()` | *(None)* | `~X()` | `impl Drop` | `NOTIFICATION_PREDELETE` | *(None)* |
| **Async Function** | `Function` Option: **Async** | `async def` | `std::future` | `async func` | `async Task` | `async fn` | `await` | `<suspends>` |
| **Await** | `Await` Node | `await X` | `co_await X` | `await X` | `await X` | `X.await` | `await X` | `X()` *(implicit)* |
| **If/Else** | `Branch (If)` Node | `if: / else:` | `if () {} else {}` | `if () {} else {}` | `if () {} else {}` | `if {} else {}` | `if: / else:` | `if (): / else:` |
| **Switch/Match**| `Switch` Node | `match:` | `switch() case:` | `switch() case:`| `switch() case:`| `match {}` | `match:` | *(Logic cascade)* |
| **For Loop** | `For Loop` Node | `for x in y:` | `for(;;)` | `for(;;)` | `for(;;)` | `for x in y {}` | `for x in y:` | `for (x..y):` |
| **While Loop** | `While Loop` Node | `while x:` | `while() {}` | `while() {}` | `while() {}` | `while x {}` | `while x:` | `loop: if:` |
| **Break** | `Break` Node | `break` | `break;` | `break;` | `break;` | `break;` | `break` | `break` |
| **Continue** | `Continue` Node | `continue` | `continue;` | `continue;` | `continue;` | `continue;` | `continue` | *Implicit/Logic* |
| **Type Cast** | `Cast` / `Convert` Node | `int(x)` | `static_cast<T>` | `Math.floor` | `(T)x` | `x as T` | `int(x)` | `T[x]` |

---

## 3. Language Declarations, Definitions, and Modifiers (Comprehensive Examples)

This document catalogs how VVS transpiles a comprehensive set of programming constructs across all supported languages. 

To demonstrate exactly how the VVS Transpiler handles **Modifiers**, **Setups**, **Visibility**, and **Advanced Concepts**, this document shows how the following are emitted:

1. **Module (Free) Function:** A standalone function outside a class.
2. **Enums & Interfaces:** Fixed constants and implementation contracts.
3. **Class Declaration:** Inheriting from a `BaseClass` and implementing an Interface.
4. **Visibility & Properties:** Public vs. Private variables.
5. **Constants:** Read-only values (`PI`).
6. **Data Structures:** Arrays/Lists and Dictionaries/Maps.
7. **Generics / Templates:** Functions that operate on arbitrary types (`<T>`).
8. **Constructors:** Object initialization functions.
9. **Getters / Setters:** Computed properties.
10. **Static Variables / Functions:** Class-level logic.
11. **Function Overloads:** Methods with the same name but different signatures.
12. **Error Handling & Lambdas:** `try/catch/finally` blocks and passing callbacks.
13. **Events:** Handler functions triggered via dispatch.

*Note: **U81 Function Declare ≠ Define.** Canvas **Declare** owns existence/signature; **Define** (`function_implement`) places the body. **C++ is the reference language** for this split (U82: real prototypes / out-of-line). On languages without a separate prototype (Python, JS, C#, Rust, GDScript, Verse), non-abstract Declare is **ineffective**: U66 `# (x) Declare Name` / `// (x) Declare Name` + U67 canvas dim — never invent a forward-decl and never silent-skip. **Abstract** is native only on C++ / C#; elsewhere abstract Declare also uses U66 `(x)` + dim (Coverage Lab **Declare Diagnose**). Do **not** emit stub `# Declare` / `// Declare` / `# abstract` placeholders without `(x)` on non-native langs. **sourceMap:** Declare maps only to what it emits (prototype or `(x)`); Define maps to the method/`def` header + body — never dual-tag the Define line onto Declare.*

**File boundaries (locked — no magic):** one container graph → one file. Want `.h` + `.cpp` → **two graphs** + user-picked extensions + explicit **Import Module**. Never auto-split one graph into header/source.

### C++ Declare / Define (U82 — shipped)

**One rule (no dual path):**

| Canvas | C++ emit |
|--------|----------|
| **Declare** `Boot` (non-abstract) | `virtual void Boot();` prototype inside the class |
| **Declare** `Diagnose` (`isAbstract`) | `virtual void Diagnose() = 0;` |
| **Define** `Boot` | `void Machine::Boot() { … }` **after** `};` (same graph) **or** on a separate `.cpp` graph |
| **Call** `Boot` | `Boot();` at the use site only |

Out-of-line definitions omit `virtual` / `static` / `override` — those belong on the Declare prototype only.
Return type comes from Declare / overload (`void`, `float`, …) — not hardcoded.

#### Teaching example — one file (out-of-line, no magic)

```cpp
#include <iostream>

class Machine {
public:
    void Boot();              // Declare Boot
    int Add(int a, int b);    // Declare Add
};

void Machine::Boot() {        // Define Boot
    std::cout << "booting" << std::endl;
}

int Machine::Add(int a, int b) {  // Define Add
    return a + b;
}

void Machine::on_start() {
    Boot();                   // Call Boot
    int sum = Add(2, 3);      // Call Add
    std::cout << sum << std::endl;
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

**Other languages:** non-abstract Declare is **ineffective** → U66 `(x) Declare Name` + U67 dim (toggleable); method body remains at Define (no out-of-line split). Abstract still emits (`# abstract` / language abstract form).

**Coverage Lab C++ golden** proves Machine+Sensor one-file shape: prototypes inside each class, `Class::Method` bodies after each `};`.

### Python Declare / Define (U66 — shipped)

| Canvas | Python emit |
|--------|-------------|
| **Declare** `Boot` (non-abstract) | `# (x) Declare Boot` + dim (ineffective — no forward-decl invent) |
| **Declare** `Diagnose` (`isAbstract`) | `# (x) Declare Diagnose` + dim |
| **Define** `Boot` | in-class `def Boot(self):` + body |

```python
class Machine:
    # (x) Declare Boot
    def Boot(self):
        print("Booted")
    # (x) Declare Diagnose
```

**sourceMap:** Declare → `(x)` / abstract line only; Define → `def` header + body.

---

### Python
```python
from enum import Enum
from typing import Dict, TypeVar, Callable

# --- Enum ---
class Color(Enum):
    RED = 1
    GREEN = 2
    BLUE = 3

# --- Interface (Emulated via Protocol or ABC) ---
class IDamageable:
    def TakeDamage(self, amount: float):
        pass

# --- Module / Free Function ---
def HelperFunction():
    # empty

# --- Class Declaration (Extends BaseClass & Implements IDamageable) ---
class AdvancedClass(BaseClass, IDamageable):
    # --- Constants ---
    PI = 3.14159

    # --- Variables (Visibility & Data Structures) ---
    A = 0.0
    _secretKey = "" # Private (by convention)
    History = [] # Array
    Scores: Dict[str, int] = {} # Dictionary / Map
    OpCount = 0.0 # Static Variable

    # --- Constructors ---
    def __init__(self):
        super().__init__()

    # --- Getters / Setters ---
    @property
    def ValueA(self):
        return self.A

    @ValueA.setter
    def ValueA(self, val):
        self.A = val

    # --- Static Functions ---
    @staticmethod
    def StaticFunction():
        # empty

    # --- Generics (Emulated via Type Hints) ---
    T = TypeVar('T')
    def Swap(self, a: T, b: T):
        pass

    # --- Function Overloads (Emulated via Defaults) ---
    def Add(self, x, y=None):
        pass

    # --- Interface Implementation ---
    def TakeDamage(self, amount: float):
        pass

    # --- Error Handling & Lambdas ---
    def ProcessData(self, callback: Callable):
        try:
            # Lambda execution
            callback()
        except Exception as e:
            # Catch block
            print(e)
        finally:
            # Finally block
            pass

    # --- Events ---
    def on_calculate(self):
        # empty
```

---

### C++
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

### JavaScript
#### Declare / Define (same table as Python)

| Canvas | JavaScript emit |
|--------|-----------------|
| **Declare** `Boot` (non-abstract) | `// (x) Declare Boot` + dim |
| **Declare** `Diagnose` (`isAbstract`) | `// (x) Declare Diagnose` + dim |
| **Define** `Boot` | in-class `Boot() { … }` |

```javascript
class Machine {
    // (x) Declare Boot
    Boot() {
        console.log("Booted");
    }
    // (x) Declare Diagnose
}
```

```javascript
// --- Enum (Emulated via Object freeze) ---
const Color = Object.freeze({ RED: 1, GREEN: 2, BLUE: 3 });

// --- Interface (Implicit via Duck Typing in JS) ---
// class AdvancedClass extends BaseClass implements IDamageable (in TypeScript)

// --- Module / Free Function ---
export function HelperFunction() {}

// --- Class Declaration ---
class AdvancedClass extends BaseClass {
    // --- Variables (Visibility & Data Structures) ---
    A = 0.0;
    #secretKey = ""; // Private (ECMAScript Private Field)
    History = []; // Array
    Scores = new Map(); // Dictionary / Map
    static OpCount = 0.0; // Static Variable

    // --- Constants (Emulated via static getter) ---
    static get PI() { return 3.14159; }

    // --- Constructors ---
    constructor() {
        super();
    }

    // --- Getters / Setters ---
    get ValueA() { return this.A; }
    set ValueA(val) { this.A = val; }

    // --- Static Functions ---
    static StaticFunction() {}

    // --- Generics (Implicit due to dynamic typing) ---
    Swap(a, b) {}

    // --- Function Overloads (Emulated via arguments/defaults) ---
    Add(x, y = undefined) {}

    // --- Interface Implementation ---
    TakeDamage(amount) {}

    // --- Error Handling & Lambdas ---
    ProcessData(callback) {
        try {
            callback(); // Lambda execution
        } catch (e) {
            // Catch block
        } finally {
            // Finally block
        }
    }

    // --- Events ---
    on_calculate() {}
}
```

---

### C# (C-Sharp)
#### Declare / Define

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
}
```

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

### Rust
#### Declare / Define

| Canvas | Rust emit |
|--------|-----------|
| **Declare** `Boot` (non-abstract) | `// (x) Declare Boot` + dim |
| **Declare** `Diagnose` (`isAbstract`) | `// (x) Declare Diagnose` + dim |
| **Define** `Boot` | in-`impl` `pub fn Boot(&mut self) { … }` — **no** out-of-line invent |

```rust
impl Machine {
    // (x) Declare Boot
    pub fn Boot(&mut self) {
        println!("{}", "Booted");
    }
    // (x) Declare Diagnose
}
```

```rust
// --- Enum ---
pub enum Color { Red, Green, Blue }

// --- Interface (Trait) ---
pub trait IDamageable {
    fn take_damage(&mut self, amount: f32);
}

// --- Module / Free Function ---
pub fn HelperFunction() {}

// --- Class Declaration ---
pub struct AdvancedClass {
    pub base: BaseClass, // Inheritance via composition
    pub A: f32,
    pub History: Vec<f32>, // Array
    pub Scores: std::collections::HashMap<String, i32>, // Dictionary / Map
    secretKey: String, // Private (no pub)
}

// --- Constants & Statics ---
pub const PI: f32 = 3.14159;

thread_local! {
    pub static OpCount: std::cell::RefCell<f32> = std::cell::RefCell::new(0.0);
}

// --- Interface Implementation ---
impl IDamageable for AdvancedClass {
    fn take_damage(&mut self, amount: f32) {}
}

impl AdvancedClass {
    // --- Constructors ---
    pub fn new() -> Self {
        Self {
            base: BaseClass::new(),
            A: 0.0,
            History: Vec::new(),
            Scores: std::collections::HashMap::new(),
            secretKey: String::new(),
        }
    }

    // --- Getters / Setters ---
    pub fn get_value_a(&self) -> f32 { self.A }
    pub fn set_value_a(&mut self, val: f32) { self.A = val; }

    // --- Static Functions (No self parameter) ---
    pub fn StaticFunction() {}

    // --- Generics ---
    pub fn swap<T>(&mut self, a: &mut T, b: &mut T) {}

    // --- Function Overloads (Emulated via unique names) ---
    pub fn add_single(&mut self, x: f32) {}
    pub fn add_double(&mut self, x: f32, y: f32) {}

    // --- Error Handling (Result) & Lambdas (Closures) ---
    pub fn process_data<F>(&mut self, callback: F) -> Result<(), String>
    where F: FnOnce() {
        // Rust uses Result instead of try/catch
        callback();
        Ok(())
    }

    // --- Events ---
    pub fn on_calculate(&mut self) {}
}
```

---

### GDScript
#### Declare / Define

| Canvas | GDScript emit |
|--------|---------------|
| **Declare** `Boot` (non-abstract) | `# (x) Declare Boot` + dim |
| **Declare** `Diagnose` (`isAbstract`) | `# (x) Declare Diagnose` + dim |
| **Define** `Boot` | in-class `func Boot() -> void:` + body |

```gdscript
class_name Machine
    # (x) Declare Boot
    func Boot() -> void:
        print("Booted")
    # (x) Declare Diagnose
```

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

### Verse (UEFN)
#### Declare / Define

| Canvas | Verse emit |
|--------|------------|
| **Declare** `Boot` (non-abstract) | `# (x) Declare Boot` + dim |
| **Declare** `Diagnose` (`isAbstract`) | `# (x) Declare Diagnose` + dim |
| **Define** `Boot` | in-class `Boot<public>() : void =` + body |

```verse
Machine := class:
    # (x) Declare Boot
    Boot<public>() : void =
        Print("Booted")
    # (x) Declare Diagnose
```

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

## Part 2: Control Flow, Async, Memory, and Namespaces

In addition to the core declarations, the Transpiler models these structural and behavioral segments.

### Python
`python
import asyncio

# --- Namespaces (Emulated via Modules) ---
# Python uses files for namespaces, e.g., math_utils.py

# --- Structs (Value Types) ---
from dataclasses import dataclass
@dataclass
class Vector3:
    x: float
    y: float
    z: float

class FlowAndAsyncDemo:
    # --- Destructors (Finalizers) ---
    def __del__(self):
        pass # Cleanup

    # --- Async / Await ---
    async def FetchData(self):
        await asyncio.sleep(1)

    # --- Control Flow (If, For, While, Switch) ---
    def FlowExample(self, val: int):
        # Conditionals
        if val == 1:
            pass
        elif val == 2:
            pass
        else:
            pass

        # Switch (Match in Python 3.10+)
        match val:
            case 1:
                pass
            case _:
                pass

        # Loops
        for i in range(10):
            if i == 5:
                continue
            if i == 8:
                break

        while val > 0:
            val -= 1

    # --- Type Casting ---
    def TypeCast(self, val: float) -> int:
        return int(val)
`

### C++
`cpp
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

    // --- Async / Await (C++20 Coroutines / std::future) ---
    /* std::future<void> FetchData() { co_await ... } */

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

        for (int i = 0; i < 10; ++i) {
            if (i == 5) continue;
            if (i == 8) break;
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
`

### JavaScript / TypeScript
`	ypescript
// --- Namespaces (TypeScript) ---
namespace CoreMath {
    export function Calculate() {}
}

// --- Structs (Interfaces in TS, Object Literals in JS) ---
interface Vector3 {
    x: number; y: number; z: number;
}

class FlowAndAsyncDemo {
    // --- Destructors (Not available in JS, relies on GC) ---

    // --- Async / Await ---
    async FetchData() {
        await new Promise(r => setTimeout(r, 1000));
    }

    // --- Control Flow ---
    FlowExample(val: number) {
        if (val === 1) {
        } else if (val === 2) {
        } else {
        }

        switch(val) {
            case 1: break;
            default: break;
        }

        for (let i = 0; i < 10; i++) {
            if (i === 5) continue;
            if (i === 8) break;
        }

        while (val > 0) {
            val--;
        }
    }

    // --- Type Casting ---
    TypeCast(val: number): number {
        return Math.floor(val); // JS coercion
        // TS: return val as unknown as int;
    }
}
`

### C#
`csharp
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
    public async Task FetchData() {
        await Task.Delay(1000);
    }

    // --- Control Flow ---
    public void FlowExample(int val) {
        if (val == 1) {
        } else if (val == 2) {
        } else {
        }

        switch(val) {
            case 1: break;
            default: break;
        }

        for (int i = 0; i < 10; i++) {
            if (i == 5) continue;
            if (i == 8) break;
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
`

### Rust
`
ust
// --- Namespaces (Modules) ---
pub mod core_math {
    pub fn calculate() {}
}

// --- Structs (Value Types) ---
pub struct Vector3 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

pub struct FlowAndAsyncDemo {}

// --- Destructors (Drop trait) ---
impl Drop for FlowAndAsyncDemo {
    fn drop(&mut self) {
        // Cleanup
    }
}

impl FlowAndAsyncDemo {
    // --- Async / Await ---
    pub async fn fetch_data(&self) {
        // await!
    }

    // --- Control Flow ---
    pub fn flow_example(&self, mut val: i32) {
        if val == 1 {
        } else if val == 2 {
        } else {
        }

        match val {
            1 => {},
            _ => {},
        }

        for i in 0..10 {
            if i == 5 { continue; }
            if i == 8 { break; }
        }

        while val > 0 {
            val -= 1;
        }
    }

    // --- Type Casting ---
    pub fn type_cast(&self, val: f32) -> i32 {
        val as i32
    }
}
`

### GDScript
`gdscript
# --- Namespaces (Inner Classes or Files) ---
class_name FlowAndAsyncDemo

# --- Structs (Emulated via inner classes or Dicts) ---

# --- Destructors ---
func _notification(what):
    if what == NOTIFICATION_PREDELETE:
        pass # Cleanup

# --- Async / Await ---
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

    match val:
        1:
            pass
        _:
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
`

### Verse
`
erse
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

        # Match / Switch (Supported via enumerations/logic)
        
        # For Loop
        for (I := 0..9):
            # break/continue not natively in the same way, requires helper logic

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
`

---

## 4. Feature Support & Progressive Multi-Stage Confirmation

When extending or verifying transpiler support across languages, AI agents must perform the following **Progressive Multi-Stage Confirmation** before marking a feature as supported:

1. **Check Graph and UI Support:** Verify that the properties exist in @vvs/graph-types (symbols.ts) and that the UI exposes the relevant controls (e.g., NodeModifiers.tsx).
2. **Check Language Syntax Pack Support:** Verify that the target language syntax pack (e.g., cpp.base.json) natively supports the required keywords or concepts. If the target language cannot support the feature, mark it as **Not yet supported** / **ineffective** (disable the chip — do not invent emit).
3. **Check Backend Implementation:** Ensure the AST parser handles the data and the Go backend safely stores the schema (this is mostly JSON passthrough).
4. **Check Coverage Lab code output:** Generate for the Coverage Lab graph and verify Machine/Sensor modules match goldens (not Calculator-era shortcuts).
5. **Check Source Mapping (Code Highlighting):** Extract the sourceMap generated by the AST engine and ensure that every node ID corresponds accurately to the line of code it generated, enabling the UI to highlight code when a user clicks the node.

**Canonical pilot plan:** `docs/design/fidelity_streamline.md` · `docs/design/language_capability_catalog.md` § Coverage Lab · § Modifier effectiveness · § Emit anti-patterns.

### Active track: Coverage Lab + fidelity streamline

1. Lock **Coverage Lab → C++** Machine golden (1:1 modifiers + access sections + sourceMap).
2. Strip emit magic per `fidelity_streamline.md` — no inferred class abstract, invented Default/override/public, hardcoded param types, silent class shells.
3. Wire **modifierEffectiveness** so `NodeModifiers` disables ineffective chips for the current language.
4. Same property → IR slot → syntax-pack flow across C# → Python → JS → Rust → GDScript → Verse.
5. Do **not** prescribe `# Declare` placeholders or Calculator as the primary golden.

### Current Support Matrix (C++ Baseline — Dual Class Lab)

| Feature / Modifier | Graph & UI Support | C++ Transpiler Support | Backend / Save | Dual Class Lab Accuracy | Code Highlighting (SourceMap) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Visibility** (public, protected, private) | ✅ Supported | ✅ Access sections from define-node visibility | ✅ Supported | ✅ | ✅ Works |
| **Static** (`binding: static`) | ✅ Supported | ✅ Supported (`inline static`) | ✅ Supported | ✅ Accurate | ✅ Works |
| **Virtual** (`isVirtual`) | ✅ Supported | ✅ Supported (`virtual`) | ✅ Supported | ✅ Accurate | ✅ Works |
| **Abstract / Pure** (`isAbstract`) | ✅ Supported | ✅ Supported (`= 0`) | ✅ Supported | ✅ Accurate | ✅ Works |
| **Override** (`isOverride`) | ✅ Supported | ✅ When set on define node | ✅ Supported | ✅ | ✅ Works |
| **Async** (`isAsync`) | ✅ Supported | ❌ **Ineffective for C++** — no-op emit; **disable chip** | ✅ Supported | N/A | N/A |
| **Constant** (`isConst`) | ✅ Supported | ✅ Supported (`const`) | ✅ Supported | ✅ | ✅ Works |

### 5. Scientific Calculator (superseded)

**Status:** Superseded by Coverage Lab (`coverageLabUsabilityTest.ts`) for enum/array/switch/for/inheritance coverage. Keep historical notes below only as design reference — do not treat Calculator as the primary golden.

This section serves as the target blueprint for a more advanced VVS calculator graph (`ScientificCalculator`). It is designed to test VVS features that were not fully utilized in the base `AdvancedCalculator`, such as inheritance, enumerations, arrays, constants, loops, and switch statements.

#### Pseudo Code
```pseudo
Enum OperationType { ADD, SUB, MUL, DIV }

Class ScientificCalculator extends AdvancedCalculator {
    // New variables
    const float PI = 3.14159;
    Array<float> History;
    OperationType CurrentOp = OperationType.ADD;

    // Overriding the abstract method from AdvancedCalculator
    override void LogOperation() {
        History.push(Result);
        print("Logged: " + Result);
    }

    // Additional Math operations
    void Multiply() {
        Result = A * B;
    }

    // Overriding the environment event or base method
    void on_calculate() {
        // Switch node logic
        switch (CurrentOp) {
            case ADD: 
                Add(); 
                break;
            case MUL: 
                Multiply(); 
                break;
            default:
                break;
        }
        LogOperation();
    }

    // Loop node logic
    void PrintHistory() {
        print("--- History ---");
        for (float val in History) {
            print(val);
        }
    }
}
```

#### Target C++ Code
The VVS AST engine should generate the following C++ code when transpiling the graph:

```cpp
enum class OperationType {
    ADD,
    SUB,
    MUL,
    DIV
};

class ScientificCalculator : public AdvancedCalculator {
public:
    const float PI = 3.14159f;
    std::vector<float> History;
    OperationType CurrentOp = OperationType::ADD;

protected:
    virtual void LogOperation() override {
        History.push_back(Result);
        std::cout << "Logged: " << std::to_string(Result) << std::endl;
    }

    virtual void Multiply() {
        Result = (A * B);
    }

    void on_calculate() {
        switch (CurrentOp) {
            case OperationType::ADD:
                Add();
                break;
            case OperationType::MUL:
                Multiply();
                break;
            default:
                break;
        }
        LogOperation();
    }

    void PrintHistory() {
        std::cout << "--- History ---" << std::endl;
        for (float val : History) {
            std::cout << std::to_string(val) << std::endl;
        }
    }
};
```

#### Actual C++ Code Generated (Current Engine Output)
The transpiler currently generates the following C++ code from the `ScientificCalculator` graph snapshot. Use this as a reference of current system limitations:

```cpp
class ScientificCalculator : public AdvancedCalculator {
public:
        const float PI = 3.14159;
        auto History = 0;
        auto CurrentOp = "OperationType::ADD";
    void Multiply() {
        // Multiply
        Result = "/* Multiply.result */";
    }
    void PrintHistory() {
        // PrintHistory
        std::cout << "--- History ---" << std::endl;
        for (int _vvs_i_sci_for = nullptr; _vvs_i_sci_for <= nullptr; _vvs_i_sci_for++) {
            // empty
        }
        std::cout << std::to_string(nullptr) << std::endl;
    }

    void on_calculate() {
        switch (nullptr) {
        }
        AdvancedCalculator().Add();
        Multiply();
        on_logoperation();
    }

    void on_logoperation() {
        // Array Push
        std::cout << "/* Concat Strings.result */" << std::endl;
    }
};
```

### Progressive Multi-Stage Confirmation

The progressive multi-stage confirmation process ensures full fidelity across the stack before marking a node/feature as fully supported:

1. **Check software for graph and UI support.**
2. **Check what languages support it.**
3. **Check if the back end implements it correctly.**
4. **Check if the generated code is accurate to what should be presented from the graph.**
5. **Check whether the selected node correctly highlights the generated code in the code panel.**

---

### Feature Support Table

> Verified against `core-pack.json` node registry, `variableTypes.ts`, `typeNaming.ts`, `ProjectTree.tsx` symbols panel, node `propertySchema` fields, and `graphToIr.ts` transpiler lowering.

#### Define Nodes (Structural — dragged from Project Tree / Side Panel)

| Feature | Where Supported | C++ Codegen | Notes |
| --- | --- | --- | --- |
| Class | Node (`class_define`), Symbols Panel (ProjectTree) | ✅ Yes | `ClassDecl` IR member, generates `class X { }` shell |
| Inheritance | Node Setting (`class_define` → `extendsType` property) | ✅ Yes | Generates `: public BaseClass` |
| Variable | Node (`var_define`), Symbols Panel (ProjectTree) | ✅ Yes | `VariableDecl` IR member, generates typed declarations |
| Function **Declare** | Node (`function_define`), Symbols Panel | ✅ Yes | Signature / abstract only — modifiers on Declare |
| Function **Define** | Node (`function_implement`) on member chain | ✅ Yes | Body placement; inherits Declare modifiers (virtual / override) |
| Event (Custom) | Node (`event_member_define`), Symbols Panel (ProjectTree) | ✅ Yes | `EventDecl` IR member, generates handler functions |
| Enum Define | ❌ Not in registry | ❌ None | No `enum_define` node exists anywhere |
| Interface Define | ❌ Not in registry | ❌ None | No `interface_define` node exists |
| Constructor Define | ❌ Not in registry | ❌ None | Handled via `on_init` event pattern only |
| Try/Catch | ❌ Not in registry | ❌ None | No `flow_try_catch` node exists |

#### Node Settings / Modifiers (Inspector Panel — `propertySchema` fields)

| Modifier | Available On | C++ Codegen | Notes |
| --- | --- | --- | --- |
| Visibility (public/protected/private) | `class_define`, `var_define`, `function_define`, `event_member_define` | ✅ Yes | Emits C++ `public:` / `protected:` / `private:` access blocks |
| Binding (instance/static/module) | `var_define`, `function_define`, `event_member_define` | ✅ Yes | `static` keyword emitted for static binding |
| Const / Readonly | `var_define` | ✅ Yes | Emits `const` keyword |
| Abstract | `class_define`, `var_define`, `function_define`, `event_member_define` | ✅ Yes | Emits `virtual ... = 0` for pure virtual |
| Virtual | `var_define`, `function_define`, `event_member_define` | ✅ Yes | Emits `virtual` keyword |
| Override | `var_define`, `function_define`, `event_member_define` | ✅ Yes | Emits `override` keyword |
| Return Type | `function_define` | ✅ Yes | Emits typed return (`void`, `float`, etc.) |
| Extends | `class_define` | ✅ Yes | Emits `: public BaseClass` |

#### Variable Data Types (Sidebar dropdown — `variableTypes.ts` / `typeNaming.ts`)

| Type | Available in UI | C++ Codegen | Notes |
| --- | --- | --- | --- |
| `data_string` | ✅ Variable type dropdown, function params/returns | ✅ `std::string` | Full support |
| `data_number` | ✅ Variable type dropdown, function params/returns | ✅ `float` | Full support |
| `data_boolean` | ✅ Variable type dropdown, function params/returns | ✅ `bool` | Full support |
| `data_object` | ✅ Variable type dropdown, function params/returns | ⚠️ `auto` | Fallback type, no struct support |
| `data_array` | ✅ Variable type dropdown, function params/returns | ❌ Emits `auto` | Should emit `std::vector<T>` but lacks element-type info |
| `data_any` | ✅ Variable type dropdown, function params/returns | ⚠️ `auto` | Fallback type |
| `data_enum` | ❌ Does not exist | ❌ None | No enum variable type in registry |

> **Note:** `data_object` and `data_array` are excluded from **Event parameter** types in `EventPropertiesPanel.tsx`.

#### Flow Control Nodes (Canvas — dragged from Node Catalog)

| Node | Registry (`core-pack.json`) | C++ Codegen | Notes |
| --- | --- | --- | --- |
| If/Branch | ✅ `flow_branch` | ✅ `IfBranch` IR | Generates `if (cond) { } else { }` |
| For Loop | ✅ `flow_for` | ⚠️ `ForLoop` IR | IR exists but pin resolution emits `nullptr` for start/end/step |
| While Loop | ✅ `flow_while` | ⚠️ `WhileLoop` IR | IR exists but condition pin resolution may emit `nullptr` |
| Switch | ✅ `flow_switch` | ⚠️ `Switch` IR | IR exists but condition pin resolution emits `nullptr`, cases empty |
| Sequence | ✅ `flow_sequence` | ✅ `Sequence` IR | Emits sequential blocks correctly |

#### Action Nodes (Canvas — dragged from Node Catalog)

| Node | Registry (`core-pack.json`) | C++ Codegen | Notes |
| --- | --- | --- | --- |
| Print | ✅ `action_print` | ✅ `Print` IR | Generates `std::cout << ... << std::endl` |
| Get Input | ✅ `action_get_input` | ✅ `AssignVariable` IR | Generates `std::cin >> tempVar` pattern |
| Wait | ✅ `action_wait` | ✅ `AwaitWait` IR | Generates sleep/delay |
| Await Wait | ✅ `action_await_wait` | ✅ `AwaitWait` IR | Same as Wait |

#### Expression / Data Nodes (Canvas — pure data, no exec pins)

| Node | Registry (`core-pack.json`) | C++ Codegen | Notes |
| --- | --- | --- | --- |
| Variable Get | ✅ `variable_get` | ✅ Expression | Resolves to variable name reference |
| Variable Set | ✅ `variable_set` | ✅ `AssignVariable` IR | Generates `varName = value` |
| Math Add | ✅ `math_add` | ✅ `BinaryOp(+)` | Inline expression `(a + b)` |
| Math Subtract | ✅ `math_subtract` | ✅ `BinaryOp(-)` | Inline expression `(a - b)` |
| Math Multiply | ✅ `math_multiply` | ✅ `BinaryOp(*)` | Inline expression `(a * b)` |
| Math Divide | ✅ `math_divide` | ✅ `BinaryOp(/)` | Inline expression `(a / b)` |
| Convert to String | ✅ `convert_to_string` | ✅ `ToString` IR | `std::to_string(...)` |
| Convert to Number | ✅ `convert_to_number` | ✅ `ToNumber` IR | `std::stof(...)` |
| String Concat | ❌ Not in registry | ❌ None | No `string_concat` node |
| Comparison (>, <, ==) | ❌ Not in registry | ❌ None | No comparison operator nodes |

#### Event System Nodes

| Node | Registry (`core-pack.json`) | C++ Codegen | Notes |
| --- | --- | --- | --- |
| On Start | ✅ `event_on_start` | ✅ Yes | Entry-point event handler |
| On Update | ✅ `event_on_update` | ✅ Yes | Frame-tick event handler |
| On Event (implement) | ✅ `event_define` | ✅ Yes | Custom event handler body |
| Dispatch Event | ✅ `event_dispatch` | ✅ Yes | Calls event handler |
| Emit Event | ✅ `event_emit` | ⚠️ Partial | Event emission statement |
| Subscribe Event | ✅ `event_subscribe` | ⚠️ Partial | Event subscription |

#### Reference / Cross-Graph Nodes

| Node | Registry (`core-pack.json`) | C++ Codegen | Notes |
| --- | --- | --- | --- |
| Graph Reference | ✅ `graph_ref` | ❌ Skipped | Used for UI navigation only, not emitted |
| Call Function | ✅ `vvs.project.call_function` | ✅ Yes | Generates function call statements |
| Import Module | ✅ `vvs.project.import_module` | ⚠️ Partial | Module import resolution |
| Import Class | ✅ `import_class` | ⚠️ Partial | Class import/instantiation |

#### Environment Nodes

| Node | Registry (`core-pack.json`) | C++ Codegen | Notes |
| --- | --- | --- | --- |
| Call Native | ✅ `env.call_native` | ⚠️ Partial | Environment-specific native call |
| Event Handler | ✅ `env.event_handler` | ⚠️ Partial | Environment-specific event binding |

