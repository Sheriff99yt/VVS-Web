# Unified symbol model (variables, functions, events)

**Status:** Architecture direction (July 2026) — stabilizing canvas-as-source-of-truth for multi-language export.

Companion: [visual_to_text_fidelity.md](../visual_to_text_fidelity.md) · [language_profiles.md](../language_profiles.md) · [node_system.md](../node_system.md)

---

## Goal

One **language-neutral graph** is the single source of truth. Every declaration and use is a **visible node**. Emitters translate the same IR into idiomatic Python, C++, JavaScript, Verse, and future targets — without hidden runtime or sidebar-only symbols.

Cross Over Architecture (COA) — multi-target authoring with effectiveness indicators — builds on this model and is **deferred** until node-level portability UX ships.

---

## Three roles (declare → implement → invoke)

| Role | Meaning | Emits in class / module |
|------|---------|------------------------|
| **Declare** | Symbol exists in scope (member slot on define chain) | Declaration line(s) in member order |
| **Implement** | Body / handler logic | Method body or initializer |
| **Invoke** | Use at a call site | Statement in flow |

### UI label: **Declare** (member chain)

All member-slot nodes on the member chain use **Declare** in user-facing copy — `kindId`s unchanged:

| Symbol kind | UI label (canvas / spawn) | `kindId` | Codegen role |
|-------------|---------------------------|----------|--------------|
| **Variable** | **Declare** `{name}` | `var_define` | member initializer / field |
| **Function** | **Declare** `{name}` | `function_define` | method signature + tab body |
| **Event (member)** | **Declare** `{name}` | `event_member_define` | handler signature slot in member order |
| **Class** | **Declare** `{name}` / **Declare Class** | `class_define` | class declaration slot |
| **Event (handler)** | **On** `{name}` (Handler) | `event_define` | handler body on class graph |
| **Function (invoke)** | **Call** `{name}` | `vvs.project.call_function` | call statement |
| **Event (invoke)** | **Dispatch** `{name}` | `event_dispatch` | direct handler call |

**Declare** covers all member-chain slots (C++-style `int x;` for variables). **On …** for handler flow entry; **Call** / **Dispatch** for invoke sites.

### Per symbol kind

| Kind | Member chain (canvas) | Implement | Invoke (canvas) |
|------|----------------------|-----------|-----------------|
| **Class** | `class_define` | — | — |
| **Variable** | `var_define` (**Declare**) | defaults on define node | `variable_get` / `variable_set` |
| **Function** | `function_define` (**Declare**) | linked function tab graph | `call_function` (**Call**) |
| **Event** | `event_member_define` (**Declare**) | `event_define` (**On** / handler) | `event_dispatch` (**Dispatch**) |

Events split **declare** and **implement** because the handler body wires on the main graph (like an entry point). Functions fold implement into the declare node + function tab.

Program entry uses `events[]` with `role: 'entry'` and the same event pattern; codegen emits `on_start` only from canvas.

---

## Project panel vs canvas

| Layer | Role | Codegen |
|-------|------|---------|
| `variables[]` / `functions[]` / `events[]` | Index, CRUD, navigation | **Never** emits alone |
| Define / use nodes | Authoring truth | **Only** path to `ir.members` and statements |

Panel create **dual-writes** a define node (`defineNodeSync`, `useSymbolLifecycle`). Renames propagate to bound nodes.

---

## Language-neutral IR, language-specific emit

```text
Canvas nodes  →  analyze (fidelity + portability)  →  graphToIr  →  IrModule
                                                                    ↓
                                                          PrinterRegistry + syntax packs
                                                                    ↓
                                                          TargetLanguage file(s)
```

- **IR** — `VariableDecl`, `FunctionDecl`, `EventDecl`, `DispatchEvent`, `CallFunction`, …
- **Language profiles** — native / emulated / unsupported per `PortabilityFeature`
- **Syntax packs** — print templates (`self.foo` vs `this.foo`)

Symbol **flags** (static, async, virtual, readonly, overloads) ride on `FunctionSymbol` / `VariableSymbol` and map to profile features — not separate node kinds unless fidelity requires a visible line.

---

## Portability (shipped)

**Single codegen target** selected in graph settings.

- Warnings from `analyzePortability()` for the active target
- Does **not** block Generate unless paired with fidelity **errors**
- See [language_profiles.md](../language_profiles.md)

---

## Node effectiveness (planned — prerequisite for COA)

Show **all** node kinds in catalog; dim + badge when ineffective for current target (or COA language set).

| Level | UI | Generate |
|-------|-----|----------|
| **Effective** | Normal | Native emit |
| **Emulated** | Amber hint | Emit with profile warning |
| **Ineffective** | Dimmed + `≠ lang` badge | Warn or skip for that target |

Resolver inputs: `kindId`, symbol flags, `targetLanguage`, optional `crossOver.allowedLanguages`.

Registry kinds gain optional `portabilityFeatures[]`; profiles stay authoritative.

---

## Cross Over Architecture (deferred)

**Not shipped:** `COA_SHIPPED = false` in `apps/web/src/lib/coaPolicy.ts`.

When shipped:

1. Node effectiveness UI (above)
2. Optional **multi-target export** (one graph → `App.py`, `App.cpp`, …)
3. COA authoring limits + compile policy (documented warn vs error)
4. Re-enable settings toggle (replaces “Planned” panel)

**Do not** treat COA as “changes codegen for all languages” until multi-emit exists. Until then: switch `targetLanguage` and regenerate.

---

## Rejected patterns

| Pattern | Why |
|---------|-----|
| Symbol table preamble | Hidden declarations — `DEFINE_NODE_MISSING` |
| `event_emit` / `event_subscribe` + `_emit` / `_subscribe` | Hidden runtime — `HIDDEN_EVENT_RUNTIME_UNSUPPORTED` |
| `event_on_start` lifecycle shortcut | Hidden entry — `LIFECYCLE_NODE_DEPRECATED` |
| Macro inline expansion | Not text-shaped |

Future **subscribe** nodes must emit one visible registration line per node (e.g. C# `+=`, JS `.on()`), not a hidden callback list.

---

## Refactor phases (recommended)

| Phase | Focus | Outcome |
|-------|--------|---------|
| **A (done)** | Canvas source of truth, define chain, program entry, event dispatch | Calculator / Hello World fidelity anchors |
| **B (done)** | Defer COA UI; keep single-target portability | Honest product surface |
| **C** | Node effectiveness resolver + catalog/canvas chrome | Show all nodes; dim ineffective |
| **D (in progress)** | Unify spawn UX: **Declare** (all member slots) / **On** (handler) / **Call** / **Dispatch** | Same mental model in catalog, canvas, inspector, project tree |
| **E** | Registry `portabilityFeatures` on kinds; expand profiles for GDScript, C#, Rust | Data-driven indicators |
| **F** | COA + multi-target export | Full cross-over |

---

## Fidelity checklist (every new node or flag)

1. Which canvas node owns each emitted line?
2. Does `sourceMap` cover the full statement (including trailing punctuation)?
3. Which `PortabilityFeature`(s) apply?
4. Is it effective in Python, JS, C++, Verse at minimum?
5. Panel create dual-writes the define correlate?

---

## File map

| Concern | Location |
|---------|----------|
| Symbol types | `packages/graph-types/src/symbols.ts` |
| Define chain analysis | `packages/graph-types/src/classMembers.ts` |
| IR members | `packages/transpiler/src/lower/buildMembers.ts` |
| Language profiles | `packages/language-profiles` |
| COA policy (web) | `apps/web/src/lib/coaPolicy.ts` |
| Dual-write | `apps/web/src/lib/defineNodeSync.ts` |
