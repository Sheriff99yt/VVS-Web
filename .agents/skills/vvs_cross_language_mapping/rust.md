# Rust — VVS Cross-Language Mapping

> **Not a skill.** One reference document for **Rust** only.
> Parent skill: [`SKILL.md`](SKILL.md) · Shared (cross-cutting): [`shared/`](shared/)

**Syntax pack:** `packages/syntax-packs/src/packs/rust.base.json`

**Agent rule:** For Rust work, open **this file only** (plus `SKILL.md` for workflow). Do not open other language docs.

> **Issues:** See parent [`SKILL.md`](SKILL.md) Issues (`CL-007`–`CL-010`). Inheritance / `self.Power` / missing `use HashMap` need a system plan — docs below match **shipped** goldens.

## Declare / Define

| Canvas | Rust emit |
|--------|-----------|
| **Declare** `Boot` (non-abstract) | `// (x) Declare Boot` + dim |
| **Declare** `Diagnose` (`isAbstract`) | `// (x) Declare Diagnose` + dim |
| **Define** `Boot` | in-`impl` `pub fn Boot(&mut self) { … }` — **no** out-of-line invent |

```rust
pub struct Machine {
    Power: f32,
    pub Serial: f32,
    pub MaxPower: f32,
    pub Ready: bool,
}
impl Machine {
    // (x) Declare Boot
    pub fn Boot(&mut self) {
        self.Ready = true;
        println!("{}", "Booted");
    }
    // (x) Declare Diagnose
    // (x) Declare Shutdown
    pub async fn Shutdown(&mut self) {
        self.Ready = false;
    }
}
```

Coverage Lab: inheritance is **composition** (`base: Machine` on Sensor); Switch → `if/else if` cascade; GetInput uses `stdin().read_line`; for-each uses `for val in self.Readings.iter()`.

## Concept → emit

| Concept | Representation in VVS | Emit |
| :--- | :--- | :--- |
| **Enum** | `Enum Define` Node | `pub enum Color` |
| **Interface** *(planned)* | `Interface Define` Node | `pub trait IDamageable` |
| **Class** | `Class Define` Node | `pub struct MyClass` + `impl` |
| **Inheritance** | `Class Define` Option: **Extends** | `base: BaseClass` *(composition — see CL-010)* |
| **Implements** | `Class Define` Option: **Implements** | `impl IDamageable for` |
| **Variable** | `Variable Define` Node | `pub A: f32` |
| **Private Var** | `Variable` Option: **Visibility** | `Power: f32` *(no `pub`)* |
| **Constant Var** | `Variable` Option: **Constant** | plain field today *(CL-008)* |
| **Static Var** | `Variable` Option: **Static** | plain field today *(CL-008)* |
| **Array** | `Variable` Pin Type: **Array** | `Vec<T>` |
| **Map/Dictionary** | `Variable` Pin Type: **Map** | `HashMap<K, V>` *(import gap: CL-009)* |
| **Function** | `Function Declare` + `Function Define` | `// (x) Declare` + `fn Func` |
| **Abstract Func** | Declare `isAbstract` (no Define body) | `// (x) Declare Func` |
| **Virtual / Override** | Declare `isVirtual` / `isOverride` | *Implicit* |
| **Free Function** | `Function` Option: **Not in Class** | `pub fn Func()` |
| **Static Function** | `Function` Option: **Static** | `pub fn Func()` *(no self)* |
| **Virtual Func** | `Function` Option: **Virtual** | *Implicit* |
| **Generics** | `Function` Option: **Wildcard Pin** | `pub fn Func<T>()` |
| **Constructor** *(planned)* | `Constructor Define` Node | `pub fn new() -> Self` |
| **Error (Try)** *(planned)* | `Try/Catch` Block Node | `Result<T, E>` *(impl)* |
| **Lambda/Callback** | Pin Type: **Callable** | `F: FnOnce()` |
| **Namespaces** | `Namespace Define` Node | `mod x` |
| **Structs** | `Struct Define` Node | `struct X` |
| **Destructor** | `Destructor Define` Node | `impl Drop` |
| **Async Function** | `Function` Option: **Async** | `async fn` |
| **Await** | `Await` Node | `X.await` |
| **If/Else** | `Branch (If)` Node | `if {} else {}` |
| **Switch/Match** | `Switch` Node | `if/else if` cascade (`_vvs_sel`) — *not* `match` today |
| **For Loop** | `For Loop` Node | `for x in y.iter() {}` |
| **While Loop** | `While Loop` Node | `while x {}` |
| **Break** | `Break` Node | `break;` |
| **Continue** | `Continue` Node | `continue;` |
| **Type Cast** | `Cast` / `Convert` Node | `x as T` / `.to_string()` |

## Declarations, definitions, modifiers

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
// Coverage Lab: const/static field modifiers currently emit plain struct fields (CL-008).
// The shapes below are aspirational, not Code-panel emit today.
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

## Control flow, async, memory, namespaces

```rust
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

        // Switch — Coverage Lab emits if/else if (not match)
        let _vvs_sel = val;
        if _vvs_sel == 1 {
        } else if _vvs_sel == 2 {
        }

        for val in items.iter() {
            if *val == 5 { continue; }
            if *val == 8 { break; }
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
```
