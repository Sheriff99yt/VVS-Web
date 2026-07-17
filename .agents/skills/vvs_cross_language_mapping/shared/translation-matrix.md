# Language Translation Matrix

Parent: [`../SKILL.md`](../SKILL.md). Per-language (self-contained): [`../cpp.md`](../cpp.md) · [`../python.md`](../python.md) · [`../javascript.md`](../javascript.md) · [`../csharp.md`](../csharp.md) · [`../rust.md`](../rust.md) · [`../gdscript.md`](../gdscript.md) · [`../verse.md`](../verse.md).

Each language doc embeds **only its own Emit column** under Concept → emit. Rows marked *planned* are aspirational shapes — see [`feature-support.md`](feature-support.md) for registry truth.

**Synced to Code-panel goldens (2026-07-17):** cells below follow `test_project_goldens/{simple,complex}/<lang>/_HOME_GRAPH_PREVIEW.txt`. Open issues: parent [`SKILL.md`](../SKILL.md) `CL-*`.

| Concept | Representation in VVS | Python | C++ | JavaScript | C# | Rust | GDScript | Verse |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Enum** | `Enum Define` Node | `class Color(Enum):` | `enum class Color` | `Object.freeze({...})` | `public enum Color` | `pub enum Color` | `enum Color` | `Color := enum:` |
| **Interface** *(planned)* | `Interface Define` Node | `class IDamageable:` | `class IDamageable` | *Implicit/JSDoc* | `interface IDamageable` | `pub trait IDamageable` | *Implicit* | `IDamageable := interface:` |
| **Class** | `Class Define` Node | `class MyClass:` | `class MyClass` | `class MyClass` | `public class MyClass` | `pub struct MyClass` + `impl` | `class_name MyClass` | `<public>MyClass := class:` |
| **Inheritance** | `Class Define` Option: **Extends** | `(BaseClass)` | `: public BaseClass` | `extends BaseClass` | `: BaseClass` | `base: BaseClass` *(comp)* | `extends BaseClass` | `<public>Child(Base) := class:` |
| **Implements** | `Class Define` Option: **Implements** | `(IDamageable)` | `, public IDamageable` | *Implicit* | `, IDamageable` | `impl IDamageable for` | *Implicit* | `, IDamageable` |
| **Variable** | `Variable Define` Node | `A = 0` | `float A = 0;` | `A = 0;` | `public float A = 0;` | `pub A: f32` | `var A = 0` | `var A : float = 0` |
| **Private Var** | `Variable` Option: **Visibility** | `_secretKey` | `private:` / `protected:` | `#secretKey` | `protected` / `private float A;` | `secretKey: String` *(no pub)* | `_secretKey` | omit `<public>` |
| **Constant Var** | `Variable` Option: **Constant** | `MaxPower = 100` | `const float MaxPower` | `MaxPower = 100` | `public readonly float` | plain field today | plain `var` / `const` | plain `var` today |
| **Static Var** | `Variable` Option: **Static** | `Serial = 0` | `inline static float` | `static Serial = 0` | `public static float` | plain field today | `static var Serial` | plain `var` today |
| **Array** | `Variable` Pin Type: **Array** | `[]` | `std::vector<T>` | `[]` | `List<T>` | `Vec<T>` | `[]` | `[]type = array{}` |
| **Map/Dictionary** | `Variable` Pin Type: **Map** | `{}` | `std::unordered_map` | `new Map()` | `Dictionary<K, V>` | `HashMap<K, V>` | `{}` | `[type]type = map{}` |
| **Function** | `Function Declare` + `Function Define` | `# (x) Declare` + `def Func(self):` | prototype + `Class::Func` (U82) | `// (x) Declare` + `Func()` | `// (x) Declare` + `void Func()` | `// (x) Declare` + `fn Func` | `# (x) Declare` + `func Func():` | `# (x) Declare` + `Func() : void =` |
| **Abstract Func** | Declare `isAbstract` (no Define body) | `# (x) Declare Func` | `virtual void Func() = 0;` | `// (x) Declare Func` | `protected abstract void Func();` | `// (x) Declare Func` | `# (x) Declare Func` | `# (x) Declare Func` |
| **Virtual / Override** | Declare `isVirtual` / `isOverride` | *Implicit* | `virtual` / `override` postfix | *Implicit* | `virtual` / `override` | *Implicit* | *Implicit* | `<override>` |
| **Free Function** | `Function` Option: **Not in Class** | `def Func():` | `void Func()` | `export function Func()` | `static void Func()` | `pub fn Func()` | `func Func():` | `Func() : void =` |
| **Static Function** | `Function` Option: **Static** | `@staticmethod` | `static void Func()` | `static Func()` | `public static void Func` | `pub fn Func()` *(no self)* | `static func Func():` | *(Module function)* |
| **Virtual Func** | `Function` Option: **Virtual** | *Implicit* | `virtual void Func()` | *Implicit* | `public virtual void Func` | *Implicit* | *Implicit* | `Func<override>()` |
| **Generics** | `Function` Option: **Wildcard Pin** | `TypeVar('T')` | `template <typename T>` | *Implicit* | `void Func<T>()` | `pub fn Func<T>()` | *Implicit* | `Func(t: type)` |
| **Constructor** *(planned)* | `Constructor Define` Node | `def __init__(self):` | `MyClass()` | `constructor()` | `public MyClass()` | `pub fn new() -> Self` | `func _init():` | `MakeMyClass()` |
| **Error (Try)** *(planned)* | `Try/Catch` Block Node | `try: / except:` | `try { } catch` | `try { } catch` | `try { } catch` | `Result<T, E>` *(impl)* | *Implicit/Asserts* | *(Failure Context)* |
| **Lambda/Callback** | Pin Type: **Callable** | `callback()` | `std::function<void()>` | `callback()` | `Action callback` | `F: FnOnce()` | `Callable` | `type {() : void}` |
| **Namespaces** | `Namespace Define` Node | `module.py` | `namespace X` | `namespace X` | `namespace X` | `mod x` | `class_name` | `x := module:` |
| **Structs** | `Struct Define` Node | `@dataclass` | `struct X` | `interface X` | `struct X` | `struct X` | *Dictionary* | `X := struct:` |
| **Destructor** | `Destructor Define` Node | `__del__` | `~X()` | *(None)* | `~X()` | `impl Drop` | `NOTIFICATION_PREDELETE` | *(None)* |
| **Async Function** | `Function` Option: **Async** | `async def` | *(ineffective — disable chip)* | `async Func()` | `async void` today | `async fn` | *(ineffective today)* | *(ineffective today)* |
| **Await** | `Await` Node | `await X` | *(ineffective with Async)* | `await X` | `await X` | `X.await` | `await X` | `X()` *(implicit)* |
| **If/Else** | `Branch (If)` Node | `if: / else:` | `if () {} else {}` | `if () {} else {}` | `if () {} else {}` | `if {} else {}` | `if: / else:` | `if (): / else:` |
| **Switch/Match** | `Switch` Node | `if/elif` (`_vvs_sel`) | `switch() case:` | `switch() case:` | `switch() case:` | `if/else if` (`_vvs_sel`) | `if/elif` (`_vvs_sel`) | sequential `if` cascade |
| **For Loop** | `For Loop` Node | `for x in y:` | `for (T x : xs)` | `for (const x of xs)` | `foreach (var x in xs)` | `for x in y.iter() {}` | `for x in y:` | *broken — see CL-015* |
| **While Loop** | `While Loop` Node | `while x:` | `while() {}` | `while() {}` | `while() {}` | `while x {}` | `while x:` | `loop: if:` |
| **Break** | `Break` Node | `break` | `break;` | `break;` | `break;` | `break;` | `break` | `break` |
| **Continue** | `Continue` Node | `continue` | `continue;` | `continue;` | `continue;` | `continue;` | `continue` | *Implicit/Logic* |
| **Type Cast** | `Cast` / `Convert` Node | `int(x)` | `static_cast<T>` | `Math.floor` | `(T)x` | `x as T` | `int(x)` | `T[x]` |
