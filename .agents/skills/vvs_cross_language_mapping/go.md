# Go — VVS Cross-Language Mapping

> **Not a skill.** One reference document for **Go** only.
> Parent skill: [`SKILL.md`](SKILL.md) · Shared (cross-cutting): [`shared/`](shared/)

**Syntax pack:** `packages/syntax-packs/src/packs/go.base.json`

**Agent rule:** For Go work, open **this file only** (plus `SKILL.md` for workflow). Do not open other language docs.

## Declare / Define

| Canvas | Go emit |
|--------|-----------|
| **Declare** `Boot` (non-abstract) | `// (x) Declare Boot` + dim |
| **Declare** `Diagnose` (`isAbstract`) | `// (x) Declare Diagnose` + dim |
| **Define** `Boot` | `func (self *Machine) Boot() { … }` |

```go
package main

import (
	"fmt"
	"time"
)

type Machine struct {
	Power float64
	Serial float64
	MaxPower float64
	Ready bool
}

// (x) Declare Boot
func (self *Machine) Boot() {
	self.Ready = true
	fmt.Println("Booted")
}

// (x) Declare Shutdown
func (self *Machine) Shutdown() {
	self.Ready = false
}
```

## Concept → emit

| Concept | Representation in VVS | Emit |
| :--- | :--- | :--- |
| **Enum** | `Enum Define` Node | `type Color int` + `const (...)` |
| **Interface** | `Interface Define` Node | `type IDamageable interface` |
| **Class / Struct** | `Class Define` Node | `type MyClass struct` + methods |
| **Inheritance** | `Class Define` Option: **Extends** | Anonymous struct embedding |
| **Variable** | `Variable Define` Node | `VarName float64` |
| **Array** | `Variable` Pin Type: **Array** | `[]T` |
| **Map/Dictionary** | `Variable` Pin Type: **Map** | `map[K]V` |
| **Function** | `Function Declare` + `Function Define` | `func (self *Class) Func()` |
| **Free Function** | `Function` Option: **Not in Class** | `func Func()` |
| **Async Function** | `Function` Option: **Async** | `go Func()` |
| **Await / Sleep** | `Await` / `Wait` Node | `time.Sleep(...)` |
| **If/Else** | `Branch (If)` Node | `if cond { } else { }` |
| **Switch** | `Switch` Node | `switch _vvs_sel { case 1: ... }` |
| **For Loop** | `For Loop` Node | `for _, val := range items { }` |
| **While Loop** | `While Loop` Node | `for cond { }` |
