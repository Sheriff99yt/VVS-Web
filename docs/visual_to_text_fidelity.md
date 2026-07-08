# Text-Shaped Graphs — Visual ↔ Code Fidelity

**Status:** Locked product direction (July 2026).  
**Companion:** [vision.md](vision.md) · [roadmap.md](roadmap.md) · [node_system.md](node_system.md) · [naming_and_product_direction.md](naming_and_product_direction.md)

---

## Summary

VVS follows **text-shaped graphs**: the canvas is a visual editor for **ordinary source structure**. Every node that affects behavior must produce a **visible, locatable artifact** in generated code. The graph teaches and integrates with real toolchains — it does not simulate a proprietary runtime.

> **Fidelity contract:** What you see on the graph is what you could have typed. No compile-time paste, no hidden casts, no latent steps that never appear in text.

This is a **major strategic choice**. It diverges from Unreal Engine Blueprint semantics (macros, latent delays, VM-only execution). That divergence is intentional: Blueprint optimizes for in-engine authoring; VVS optimizes for **export, integration, and third-party adoption**.

---

## Canvas is the source of truth

**The canvas is the source of truth for generated code.** Project panel symbol tables (`variables[]`, `functions[]`, `events[]`) are **indexes and CRUD shortcuts** — they never emit declarations on their own.

| Concept | Role |
|---------|------|
| **Declare** | Define nodes on the class graph: `class_define`, `var_define`, `function_define`, `event_member_define` |
| **Use** | Usage nodes where logic runs: Get/Set, Call Function, event dispatch, flow nodes |
| **Panel row** | Metadata + navigation; dual-writes a define node when creating or renaming a symbol |
| **Generated line** | Must map to a canvas node via `sourceGraphNodeId` / `sourceMap` |

### Panel action → required canvas correlate

| Panel / tree action | Required on canvas |
|---------------------|-------------------|
| + New variable | `var_define` on class home graph (exec chain) |
| + New function | `function_define` on class home graph |
| + New event | `event_member_define` on class home graph |
| Declare from drop menu | Matching define node at drop position |
| Get / Set / Call in flow | Usage nodes only — symbol must already have a define node |
| Class formation | `class_define` on container graph |

If you cannot select a node and highlight the corresponding line in the code panel, the system is wrong.

### Rejected emit paths

| Path | Status |
|------|--------|
| `appendLegacyPreamble` — emit from `ir.variables` / `ir.functions` without define nodes | **Removed** — strict mode only |
| `useLegacyPreamble` fallback when class graph has no define chain | **Removed** |
| Symbol table as codegen source of truth | **Rejected** — canvas define nodes required |
| Hidden event runtime (`_emit`, `_subscribe`, `event_emit`, `event_subscribe`) | **Rejected** — `HIDDEN_EVENT_RUNTIME_UNSUPPORTED` blocks Generate |

Transpiler contract: walk `ir.members` from the define chain via `appendIrMembers` only. Analyzer blocks Generate on `DEFINE_NODE_MISSING`, `DECLARATION_NOT_ON_CANVAS`, and `ORPHAN_DEFINE_NODE`.

**Agent / contributor gate:** Does this PR emit text without a canvas node? If yes — reject.

---

## Core principles

### 1. Text code is the integration layer

- Generated output runs in **standard** Python, JS/TS, C++, Verse, etc. — no VVS runtime required.
- Users read, diff, grep, debug, and review in their **existing IDE and CI**.
- Graph JSON is the **authoring** artifact; text is what teams **ship and integrate**.

### 2. One visual construct → one honest text construct

| Rule | Example (already shipped) |
|------|---------------------------|
| One conversion node → one call | **To String** → `str(x)` |
| One call node → one call site | **Call Function** → `self.Add()` |
| One dispatch → one visible line | **Dispatch calculate** → `self.on_calculate()` |
| One handler → one method body | **Define On calculate** → `def on_calculate(self):` |
| Selection → code highlight | `sourceMap` / `expressionSpans` — no re-transpile on select |

**Anti-patterns (forbidden in transpiler):**

- Folding `str()` into Print when the graph has **To String**
- Macro **inline expansion** that duplicates nodes without labeled regions in text
- **Latent / delay** behavior with no matching `sleep`, `await`, or timer in output
- Auto-cast at wire time in codegen (editor may warn; graph must show **Conversion** nodes)
- Hidden event runtime helpers (`_emit`, `_subscribe`, `event_emit`, `event_subscribe`) — use **Define** + **Dispatch** (direct call) only

### 3. Reuse = functions and modules, not invisible paste

| Need | VVS approach | Avoid |
|------|--------------|-------|
| Shared logic | **Function** graph + **Call Function** | Blueprint-style macro expand |
| Multi-file | **Import module** / export per graph tab | Duplicated AST at compile time |
| “Snippet here” | **Extract to function** (Ctrl+Shift+E) | Tunnel macros with no text boundary |

**Macro tabs** (legacy UI) are **deprecated as a codegen concept**. They may remain as editor UX during migration but must lower to **named function calls** or explicit include blocks — never silent paste.

### 4. Events and functions follow **text** semantics

| Concept | Visual | Generated text (conceptual) |
|---------|--------|----------------------------|
| **Function** | Sub-graph + Call | `def foo(...): ... return ...` + `foo(...)` |
| **Event handler** | Define node | `def on_event(self, ...):` |
| **Program entry** | `role: 'entry'` event + define chain | `def on_start(self):` — **only** when user declared entry on the class graph |
| **Event signal** | Dispatch node | `self.on_event(...)` — direct handler call; no hidden `emit` / `_emit` runtime |
| **Lifecycle tick** | On Update node | `on_update` / tick handler — still a visible method when wired |

Sync vs async rules follow **target language**, not a hidden VM:

- **Wait** / **Await Wait** (future) emit explicit wait calls.
- **Wait inside sync function** → analyzer error (same *user-visible* rule as Blueprint, but the **code shows the wait**).

### 5. Third-party integration is a first-class requirement

VVS must embed cleanly in **any** stack:

- npm/pip/cargo projects importing generated files
- CI running generated tests without a graph engine
- MCP agents editing nodes with predictable text diffs
- Game engines, web apps, automation tools — **no vendor lock-in**

Fidelity is what makes third-party integration possible. Hidden transforms make VVS a **plugin for VVS**, not a plugin for **your** product.

---

## Authoring decision guide

```text
Need reusable logic?
  └─ Returns a value or void?     → Function + Call
  └─ React to a named signal?     → Event Define + Dispatch (explicit line in code)
  └─ Program start (host calls)?  → Entry event (`role: 'entry'`) + event_member_define + event_define on class graph
  └─ Per-frame / tick hook?       → On Update lifecycle node (when target supports it)
  └─ Pause time?                  → Wait / Await Wait node (when shipped) — visible in text
  └─ Copy-paste visual pattern?   → Extract to Function — NOT macro expand
```

---

## Rejected directions

We evaluated paths common in visual tools (especially Unreal). **We did not adopt them** for reasons below.

### A. Unreal Engine / Blueprint-faithful semantics — **rejected**

**What it is:** Macro compile-time expansion, latent Delay nodes, function vs event VM rules, execution wired like Blueprint, graph as bytecode-like artifact.

**Why we rejected it:**

| Limitation | Impact on VVS |
|------------|---------------|
| **Graph ≠ generated code** | Macro paste and latent actions don’t appear in export — **code panel lies**, learners can’t map visual → text |
| **Proprietary runtime** | Blueprint needs UE VM; generated “code” is not self-sufficient — **cannot integrate as a third-party library** in arbitrary software |
| **Broken native toolchain** | grep, diff, IDE step-debug, unit tests on exported files fail or mislead when behavior lives in latent VM |
| **Multi-language fracture** | Latent macros and exec semantics don’t map to Python/JS/C++/Verse the same way — emitters become hacks |
| **MCP / AI fragility** | Agents can’t predict output when transpiler performs invisible transforms |
| **Vendor coupling** | Adopting BP semantics makes VVS a **Blueprint companion**, not an **open visual language** for all engines and workflows |

**Where that path leads:** In-engine visual scripting with **secondary, untrusted text** — fine for Epic’s ecosystem, **incompatible** with our north star (open platform, git-native integration, bring-your-own stack).

**UE6 plugin note:** The planned plugin uses the **same text-shaped emitter** (Verse output). It may offer familiar **canvas** patterns but **does not simulate Blueprint VM**. Familiar UX ≠ hidden semantics.

---

### B. Graph-as-source-of-truth (code is a lossy view) — **rejected**

**What it is:** JSON graph is the real program; text is preview only, rearranged or optimized opaquely.

**Why we rejected it:**

- Users don’t **own** the mental model of their program in text form.
- Git review of generated files is misleading.
- Contradicts README promise: *integrate with IDE, repo, CI*.

**Where it leads:** Scratch-like or proprietary runtime products — not VVS Web.

---

### C. Strict AST-isomorphic IR (every node = one AST node) — **deferred, not primary**

**What it is:** Formal 1:1 mapping to a language AST; possible future round-trip from text to graph.

**Why not primary now:**

- High design cost before we ship teaching-quality emitters.
- AST shapes differ per language — still need a high-level IR.

**Where it leads:** Research-grade language workbench — valuable later, not the Phase 1 gate. Our **fidelity contract** achieves most user value without full round-trip.

---

### D. “Honest macros” (visible duplicate blocks) — **rejected as default**

**What it is:** Macro use emits labeled copy-paste regions in text.

**Why we rejected it as default:**

- Duplication bloat; two reuse models (function + macro) confuse authors.
- Functions + modules already give honest reuse with **one call line**.

**Where it leads:** Acceptable as an **optional export mode** only if ever needed — not core product semantics.

---

### E. Sync-only forever — **rejected as permanent stance; accepted as Phase 1 scope**

**What it is:** No Wait/Delay until async model is designed.

**Why sync-first is OK temporarily:** Simplest fidelity story; Calculator and tutorials ship now.

**Where full model leads:** Explicit **async function** flag + **Await Wait** nodes — still text-shaped, not latent VM.

---

## Comparison matrix

| Direction | Visual ↔ text | Third-party integration | Multi-language | Learner trust | UE migration comfort |
|-----------|---------------|-------------------------|----------------|---------------|----------------------|
| **Text-shaped graphs (chosen)** | ★★★★★ | ★★★★★ | ★★★★ | ★★★★★ | ★★ (UX differs) |
| Blueprint-faithful | ★★ | ★ | ★★ | ★★ | ★★★★★ |
| Graph-as-truth | ★★ | ★★ | ★★★ | ★★★ | ★★ |
| AST-isomorphic | ★★★★★ | ★★★★ | ★★★ | ★★★ | ★★ |
| Honest macro paste | ★★★★ | ★★★ | ★★★ | ★★★★ | ★★★ |

---

## Implementation alignment

**Shipped (text-shaped):**

- Conversion nodes — explicit calls, `sourceMap` spans
- Call Function — visible methods and calls (macro/`use_macro` removed; migration on load)
- Event Define + Dispatch — visible handler methods and direct call lines (`self.on_<name>(…)`)
- No hidden event runtime — `event_emit` / `event_subscribe` blocked (`HIDDEN_EVENT_RUNTIME_UNSUPPORTED`); transpiler does not inject `_emit` / `_subscribe`
- Import Module — hoisted to file top with `sourceMap` on import line
- Wait / Await Wait — explicit sleep/await in export; async function flag
- Pin validation — graph shows type fixes via **Conversion** nodes
- `sourceMap` selection highlight in code panel
- IR pipeline — analyze → lower → emit in `packages/transpiler`

**Canvas-only declarations (strict, July 2026):**

- Define nodes on class home graph are **required** for every symbol — analyzer errors block Generate
- No sidebar preamble — `appendIrMembers` / `ir.members` only
- Panel create paths **dual-write** define nodes (`defineNodeSync`)

**Legacy (migration on load only — not emit fallback):**

| Item | Status |
|------|--------|
| `event_emit` / `event_subscribe` | Legacy graphs may still contain nodes — analyzer blocks Generate; kinds excluded from spawn catalog |
| `event_dispatch` | Supported — lowers to direct handler call |
| Macro tabs in old saves | Migrated to function tabs on load |
| Sidebar preamble (`appendLegacyPreamble`) | **Removed** — strict canvas-only emit |

---

## Agent & contributor checklist

Before adding nodes, transpiler lowering, or UI copy:

- [ ] Does every new behavior node have a **named, highlightable** generated construct?
- [ ] Would a user **grep** the export and find what the graph shows?
- [ ] Does this require a **VVS runtime** to behave as drawn? If yes — redesign.
- [ ] Are we copying Blueprint **semantics** without Blueprint **honesty in text**? If yes — reject.
- [ ] Is reuse implemented as **Call Function**, not invisible expand?
- [ ] Does every emitted declaration or statement originate from a **canvas node** with `sourceMap` coverage? (No sidebar preamble.)

---

## Related documents

| Document | Topic |
|----------|--------|
| [node_system.md](node_system.md) | Nodes, pins, events, functions |
| [language_profiles.md](language_profiles.md) | Per-target portability |
| [naming_and_product_direction.md](naming_and_product_direction.md) | Vocabulary — prefer **Function** over Macro |
| [roadmap.md](roadmap.md) | Phases reframed around fidelity |
| `.agents/memory/decisions.md` | Locked decision record |
