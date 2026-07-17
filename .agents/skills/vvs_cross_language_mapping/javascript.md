# JavaScript — VVS Cross-Language Mapping

> **Not a skill.** One reference document for **JavaScript** only.
> Parent skill: [`SKILL.md`](SKILL.md) · Shared (cross-cutting): [`shared/`](shared/)

**Syntax pack:** `packages/syntax-packs/src/packs/javascript.base.json`

**Agent rule:** For JavaScript work, open **this file only** (plus `SKILL.md` for workflow). Do not open other language docs.

> **Issues:** See parent [`SKILL.md`](SKILL.md) Issues (`CL-004`).

## Declare / Define

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
    // (x) Declare Shutdown
    async Shutdown() {
        this.Ready = false;
        console.log("Shutdown");
    }
}
```

Coverage Lab also shows: `const SensorStatus = Object.freeze({…})`, `class Sensor extends Machine`, GetInput via `(prompt("…") ?? "")`, `new Map()` for maps, and `for (const val of …)`.

## Concept → emit

| Concept | Representation in VVS | Emit |
| :--- | :--- | :--- |
| **Enum** | `Enum Define` Node | `const X = Object.freeze({…})` |
| **Interface** *(planned)* | `Interface Define` Node | *Implicit/JSDoc* |
| **Class** | `Class Define` Node | `class MyClass` |
| **Inheritance** | `Class Define` Option: **Extends** | `extends BaseClass` |
| **Implements** | `Class Define` Option: **Implements** | *Implicit* |
| **Variable** | `Variable Define` Node | `A = 0;` |
| **Private Var** | `Variable` Option: **Visibility** | `#secretKey` |
| **Constant Var** | `Variable` Option: **Constant** | `MaxPower = 100` *(no `const` keyword on field today)* |
| **Static Var** | `Variable` Option: **Static** | `static Serial = 0` |
| **Array** | `Variable` Pin Type: **Array** | `[]` |
| **Map/Dictionary** | `Variable` Pin Type: **Map** | `new Map()` |
| **Function** | `Function Declare` + `Function Define` | `// (x) Declare` + `Func()` |
| **Abstract Func** | Declare `isAbstract` (no Define body) | `// (x) Declare Func` |
| **Virtual / Override** | Declare `isVirtual` / `isOverride` | *Implicit* |
| **Free Function** | `Function` Option: **Not in Class** | `export function Func()` |
| **Static Function** | `Function` Option: **Static** | `static Func()` |
| **Virtual Func** | `Function` Option: **Virtual** | *Implicit* |
| **Generics** | `Function` Option: **Wildcard Pin** | *Implicit* |
| **Constructor** *(planned)* | `Constructor Define` Node | `constructor()` |
| **Error (Try)** *(planned)* | `Try/Catch` Block Node | `try { } catch` |
| **Lambda/Callback** | Pin Type: **Callable** | `callback()` |
| **Namespaces** | `Namespace Define` Node | `namespace X` |
| **Structs** | `Struct Define` Node | `interface X` |
| **Destructor** | `Destructor Define` Node | *(None)* |
| **Async Function** | `Function` Option: **Async** | `async Func()` |
| **Await** | `Await` Node | `await X` |
| **If/Else** | `Branch (If)` Node | `if () {} else {}` |
| **Switch/Match** | `Switch` Node | `switch() case:` |
| **For Loop** | `For Loop` Node | `for (const x of xs)` (Coverage Lab) |
| **While Loop** | `While Loop` Node | `while() {}` |
| **Break** | `Break` Node | `break;` |
| **Continue** | `Continue` Node | `continue;` |
| **Type Cast** | `Cast` / `Convert` Node | `String(x)` / `Math.floor` |

## Declarations, definitions, modifiers

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

## Control flow, async, memory, namespaces

```javascript
// --- Module namespace (plain JS) ---
export function Calculate() {}

// --- Struct shape (object typedef via JSDoc / plain object) ---
/** @typedef {{ x: number, y: number, z: number }} Vector3 */

class FlowAndAsyncDemo {
    // --- Destructors (not available in JS — GC) ---

    // --- Async / Await ---
    async FetchData() {
        await new Promise((r) => setTimeout(r, 1000));
    }

    // --- Control Flow ---
    FlowExample(val) {
        if (val === 1) {
        } else if (val === 2) {
        } else {
        }

        switch (val) {
            case 1: break;
            default: break;
        }

        for (const item of items) {
            if (item === 5) continue;
            if (item === 8) break;
        }

        while (val > 0) {
            val--;
        }
    }

    // --- Type Casting ---
    TypeCast(val) {
        return Math.floor(val);
    }
}
```
