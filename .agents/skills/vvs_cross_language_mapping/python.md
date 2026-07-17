# Python — VVS Cross-Language Mapping

> **Not a skill.** One reference document for **Python** only.
> Parent skill: [`SKILL.md`](SKILL.md) · Shared (cross-cutting): [`shared/`](shared/)

**Syntax pack:** `packages/syntax-packs/src/packs/python.base.json`

**Agent rule:** For Python work, open **this file only** (plus `SKILL.md` for workflow). Do not open other language docs.

> **Issues:** See parent [`SKILL.md`](SKILL.md) Issues (`CL-003`, `CL-017`).

## Declare / Define

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
    # (x) Declare Shutdown
    async def Shutdown(self):
        self.Ready = False
        print("Shutdown")
```

Coverage Lab also shows: `from enum import Enum`, `class SensorStatus(Enum):`, inheritance `class Sensor(Machine):`, GetInput via `input("…")`, Switch as **if/elif** (not `match`), and conditional `import json` inside a branch.

## Concept → emit

| Concept | Representation in VVS | Emit |
| :--- | :--- | :--- |
| **Enum** | `Enum Define` Node | `class Color(Enum):` (+ `from enum import Enum`) |
| **Interface** *(planned)* | `Interface Define` Node | `class IDamageable:` |
| **Class** | `Class Define` Node | `class MyClass:` |
| **Inheritance** | `Class Define` Option: **Extends** | `(BaseClass)` |
| **Implements** | `Class Define` Option: **Implements** | `(IDamageable)` |
| **Variable** | `Variable Define` Node | `A = 0` |
| **Private Var** | `Variable` Option: **Visibility** | `_secretKey` |
| **Constant Var** | `Variable` Option: **Constant** | `MaxPower = 100` *(no special keyword today)* |
| **Static Var** | `Variable` Option: **Static** | `Serial = 0` *(class attr; no `@staticmethod` field)* |
| **Array** | `Variable` Pin Type: **Array** | `[]` |
| **Map/Dictionary** | `Variable` Pin Type: **Map** | `{}` |
| **Function** | `Function Declare` + `Function Define` | `# (x) Declare` + `def Func(self):` |
| **Abstract Func** | Declare `isAbstract` (no Define body) | `# (x) Declare Func` |
| **Virtual / Override** | Declare `isVirtual` / `isOverride` | *Implicit* |
| **Free Function** | `Function` Option: **Not in Class** | `def Func():` |
| **Static Function** | `Function` Option: **Static** | `@staticmethod` |
| **Virtual Func** | `Function` Option: **Virtual** | *Implicit* |
| **Generics** | `Function` Option: **Wildcard Pin** | `TypeVar('T')` |
| **Constructor** *(planned)* | `Constructor Define` Node | `def __init__(self):` |
| **Error (Try)** *(planned)* | `Try/Catch` Block Node | `try: / except:` |
| **Lambda/Callback** | Pin Type: **Callable** | `callback()` |
| **Namespaces** | `Namespace Define` Node | `module.py` |
| **Structs** | `Struct Define` Node | `@dataclass` |
| **Destructor** | `Destructor Define` Node | `__del__` |
| **Async Function** | `Function` Option: **Async** | `async def` |
| **Await** | `Await` Node | `await X` |
| **If/Else** | `Branch (If)` Node | `if: / else:` |
| **Switch/Match** | `Switch` Node | `if/elif` cascade (`_vvs_sel`) — *not* `match` today |
| **For Loop** | `For Loop` Node | `for x in y:` |
| **While Loop** | `While Loop` Node | `while x:` |
| **Break** | `Break` Node | `break` |
| **Continue** | `Continue` Node | `continue` |
| **Type Cast** | `Cast` / `Convert` Node | `int(x)` / `str(x)` |

## Declarations, definitions, modifiers

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

## Control flow, async, memory, namespaces

```python
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

        # Switch — Coverage Lab emits if/elif (not match) via _vvs_sel
        _vvs_sel = val
        if _vvs_sel == 1:
            pass
        elif _vvs_sel == 2:
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
```
