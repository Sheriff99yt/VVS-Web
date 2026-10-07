# U93 reverse-import expansion and feedback loop

Broader language and project coverage is planned in [the code ↔ visual master plan](code_visual_master_plan.md). This document retains the implemented RI-A–G contracts.

Authorized October 3, 2026. Extend the existing reviewed import workflow, keeping canvas nodes as the sole editable authority. UE6 remains deferred. Arbitrary source is never executed, guessed, or silently discarded.

## Delivery batches

| Batch | Scope | Acceptance |
|---|---|---|
| RI-A | Scoped locals, initialized declarations, assignments, multi-statement bodies | JS/Python source → ordinary nodes → exact regenerated syntax; shadowing, reassignment and use-before-declaration negatives |
| RI-B | Multiple file-owned functions and resolved local calls | Two-pass signatures; exact arity and binding; ordered effects; no duplicate call evaluation |
| RI-C | Comparisons, dynamic branches, loops, early returns | Explicit semantic operators; join/dominance and mutation handling; source maps on each construct |
| RI-D | Class fields, constructor, receiver, inheritance | Visible declarations; no invented initialization/host lifecycle; resolved owning class and parent contracts |
| RI-E | Modules, imports/exports, multiple files | One container graph per file; explicit module bindings, dependency inventory and collision-safe paths |
| RI-F | Comments/directives and targeted re-import | Visible trivia ownership; source/graph hashes; read-only three-way conflict preview before replacement |
| RI-G | Other target languages | Lazy parser adapters and pinned grammar/toolchain evidence; one supported subset per target, unknown capabilities fail closed |

Each batch adds progressively more complex handwritten fixtures and mutation cases. A rejected fixture records the diagnostic, smallest reproducer, missing visual/IR/emit semantics, existing components that can be reused, implementation readiness and roadmap ID. Easy, architecture-supported fixes are part of the same batch. Harder gaps stay explicitly open; an unsupported fixture is evidence of the boundary, never an accepted import.

## RI-A architecture amendment

Existing `DeclareLocal` IR already models scoped declarations but drops its initializer. Extend it with optional structured initializer and declaration keyword. Existing graph `var_define` gains an initializer value pin and explicit local declaration settings; the emitter reads these only for scoped symbols. Member declaration semantics remain unchanged. Declaration/Get/Set all retain source ownership. Scoped variables must be checked for declarations on their owning body graph, rather than incorrectly requiring a class-member declaration. IR version remains 3 because existing documents/IR retain their behavior and new fields are optional.

Validation includes independent parsers, exact graph bindings/control order, mutation rejection, JSON persistence and the actual Code-panel emit path. Run `bun run test:batch` after implementation, collecting every stage; repair failures and rerun affected checks. Build-time trusted fixtures are permitted; product execution remains out of scope.

## RI-B explicit-conversion amendment

Reuse visible conversion nodes for explicit unshadowed JS `String`, `Number`, `parseFloat` and Python `str`, `float` calls. Add optional `numberMode` to `ConvertToNumber` IR and the existing node: the legacy default remains `parseFloat`; explicit `Number` uses a separate syntax-pack template. These operations are never inferred from numeric pins. JS conversion requires a closed selected unit with no outside executable bindings. Inventory lexical locals before mapping their initializers; Python inventories function-wide assignment bindings. A later binding, parameter, class or same-file function must never be mistaken for a native conversion. Persistence and independent AST comparison must preserve the selected mode. IR version remains 3 with the new optional field.

## RI-C approved control-flow contract (October 4)

Add a visible Comparison expression with explicit operator and semantic mode: JS strict identity allows unknown operands; ordered and scalar comparisons require proven operand types. No loose equality or implicit truthiness. Comparison IR is structured and packs own syntax. Unsupported target/variant combinations block generation rather than substituting an operator.

Branch gains a separate After execution output; true/false bodies never wire to the continuation. Early return terminates its own body. While retains Body/After and re-evaluates its condition each iteration. Calls in loop conditions are rejected until their repeated evaluation has an explicit effect contract.

Counted For has an optional structured header mode with visible Initializer and Update execution outputs and Condition input. Header Declare/Set nodes retain normal symbol identity and source spans, but print inside the header exactly once. Set gains explicit assignment/update operator settings, including postfix/prefix increment; these never synthesize a hidden arithmetic node. Existing range For and ordinary Set keep their defaults. Optional IR header/assignment fields preserve version 3 compatibility. Import checks initialized loop-local scope, readonly writes, type stability and unreachable statements; branch/loop-local escapes remain blocked. JS/Python comparisons, continuations and While are in scope; C-style counted For and compound/update syntax are JS-specific. Validate increasingly complex source, persisted graph, exact independent ASTs, source-map spans, Code-panel output and production-browser import in one batch.

## Approved RI-C/D/E/F continuation (October 4)

All three follow-up batches are authorized. Loop control carries an explicit nearest-loop target; repeated-condition calls belong to a visible Condition evaluation execution port and emit only within that condition. Lexical declarations retain owning block/branch scope, with dominance validation for persisted edits. Class fields use visible Declare nodes, receiver reads/writes bind exact symbols, constructors retain their explicit role, and inheritance never guesses an external parent. Module imports/exports and directives must be visible constructs, one container graph per source file. Re-import reviews source and graph changes against a sealed baseline; conflicts block replacement until explicitly resolved. Optional graph/IR fields preserve existing defaults and version 3. Each newly supported construct requires exact source regeneration, persistence, spans, independent parsing and Code-panel evidence.

## Native integer, class and module contracts

Python arithmetic carries an explicit `python-integer` number domain on visible Math/Declare nodes. Native integer locals and integer-only +/−/* preserve unbounded Python operations; float/unknown operands and other-target generation are blocked. Range retains its original one/two/three arguments, exclusive stop and step; a visible index Declare owns the header binding. Fresh indices cannot escape a possibly empty loop.

JS fields currently require literal initializers; member chain order is retained. Receiver Get/Set/Call use exact symbols and native numeric updates. Constructors use the existing Function Define role. Complete same-file class sets resolve declared parents and explicit parent constructor/method signatures. Python constructor-owned fields have visible ineffective Declare nodes and explicit constructor Set statements; no member default or constructor is injected. Effectful initializers, accessors, external parents and Python inheritance stay blocked.

The module subset is a closed set of 1–16 flat JS/mjs paths, named exported functions and named imports/aliases. Signature inventory precedes body planning. Each file owns a container, explicit editable output name and ordinary import/Define nodes. Parser source mode, exported modifiers, dependency closure, arity, collisions and all output ASTs are reviewed atomically; no file is accepted alone when a required signature is missing.

Leading comments attach to their following visible construct; trailing/expression trivia is rejected. A visible Language Directive retains a file/function prologue. Re-import compares baseline source, current generated graph and incoming source without mutation, seals the live graph/source/review, retains graph-only changes and requires an explicit reviewed version for simultaneous changes. Closed module transactions retain graph-only edits in unchanged files when bindings remain valid. Per-construct merges, mixed authored units and broader trivia remain roadmap feedback.
