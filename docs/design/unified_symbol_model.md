# Unified symbol model (variables, functions, events)

**Status:** Architecture direction (July 2026) — stabilizing canvas-as-source-of-truth for multi-language export.

Companion: [visual_to_text_fidelity.md](../visual_to_text_fidelity.md) · [language_profiles.md](../language_profiles.md) · [node_system.md](../node_system.md)

---

## Goal

One **language-neutral graph** is the single source of truth. Every declaration and use is a **visible node**. Emitters translate the same IR into idiomatic Python, JavaScript, C++, Verse, GDScript, Rust, C#, and Go — without hidden runtime or sidebar-only symbols.

Cross Over Architecture (COA) — multi-target authoring with effectiveness indicators — builds on this model and is **deferred** until node-level portability UX ships.

---

## Three roles (declare → implement → invoke)

| Role | Meaning | Emits in class / module |
|------|---------|------------------------|
| **Declare** | Symbol exists in scope (member slot on define chain) | Declaration line(s) in member order |
| **Implement** | Body / handler logic | Method body or initializer |
| **Invoke** | Use at a call site | Statement in flow |

### UI labels: **Declare** / **Define** / **Call** (functions)

Member-slot **existence** uses **Declare** — including functions. Function **body placement** uses **Define**. Invoke uses **Call**.

| Symbol kind | UI label (canvas / spawn) | `kindId` (today) | Codegen role |
|-------------|---------------------------|------------------|--------------|
| **Variable** | **Declare** `{name}` | `var_define` | member initializer / field |
| **Function (exists)** | **Declare** `{name}` | `function_define` | signature / there is a function |
| **Function (body place)** | **Define** `{name}` | `function_implement` | insert body at this position |
| **Event (member)** | **Declare** `{name}` | `event_member_define` | handler signature slot in member order |
| **Class** | **Declare** `{name}` / **Declare Class** | `class_define` | class declaration slot |
| **Event (handler)** | **Define** `{name}` | `event_define` | handler body on class graph |
| **Function (invoke)** | **Call** `{name}` | `vvs.project.call_function` | call statement |
| **Event (invoke)** | **Call** `{name}` | `event_dispatch` | direct handler call |

Release menus: variables **Get** / **Set** / **Declare**; functions & events **Call** / **Declare** / **Define**. Not about header/impl file splits.

### Per symbol kind

| Kind | Declare (member chain) | Define / Implement | Invoke (canvas) |
|------|------------------------|--------------------|-----------------|
| **Class** | `class_define` | — | — |
| **Variable** | `var_define` (**Declare**) | defaults on declare node | `variable_get` / `variable_set` |
| **Function** | **Declare** (existence) | **Define** (body place) + **Edit function body** tab | `call_function` (**Call**) |
| **Event** | `event_member_define` (**Declare**) | `event_define` (**On** / handler) | `event_dispatch` (**Dispatch**) |

**Component** is not a kind: game-talk components are **Class** (`class_define`) used as a field or via Extends ([catalog](language_capability_catalog.md#component--class)).

**Class Extends** is a list on `class_define`. Generate prints all Extends rows for python/cpp; others first parent. Extra bases are more Extends rows, not a new node ([catalog](language_capability_catalog.md#multiple-inheritance-locked-visual)).

Events and functions both split declare and implement (**U81 shipped**). Declare and Define stay two nodes so a prototype / abstract signature can sit in a different place than the body.

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

Symbol **flags** (static, async, virtual, readonly, overloads, constructor/destructor **role**) ride on `FunctionSymbol` / `VariableSymbol` and map to profile features — not separate node kinds unless fidelity requires a visible line. Constructor is a function role, not a kind ([catalog leftover lock](language_capability_catalog.md#leftover-constructs-locked-roles)).

---

## Portability (shipped)

**Single codegen target** selected in graph settings.

- Warnings from `analyzePortability()` for the active target
- Does **not** block Generate unless paired with fidelity **errors**
- See [language_profiles.md](../language_profiles.md)

---

## Node effectiveness (shipped U66/U67 — prerequisite for COA)

Show **all** node kinds in catalog; dim when ineffective for current target (or COA language set).

**Chrome (July 2026 — shipped):**

| Surface | Behavior | Toggle |
|---------|----------|--------|
| Generated code | Comment line whose body starts with `(x)` + node label (pack comment prefix) | Button **left of Code panel language selector** (`showUnsupportedComments`) |
| Canvas | Unsupported nodes **dimmed / grey** for current target; restore when language supports them | Top bar **left of Autosave** (`dimUnsupportedNodes`) |

Toggles are independent. Resolver: `@vvs/language-profiles` `nodeEffectiveness` — v1 Import Module `targetLanguages` gate (registry `portabilityFeatures` later).

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

**Bind** (`event_bind`) prints one visible registration line (C# `+=`, JS `.on()`, GDScript `.connect`); other langs unspawned. Hidden subscribe/emit stay blocked.

---

## Refactor phases (recommended)

| Phase | Focus | Outcome |
|-------|--------|---------|
| **A (done)** | Canvas source of truth, define chain, program entry, event dispatch | Simple / Complex / Advanced fidelity anchors |
| **B (done)** | Defer COA UI; keep single-target portability | Honest product surface |
| **C (done)** | Node effectiveness resolver + catalog/canvas chrome | Show all nodes; dim ineffective (U66/U67 shipped) |
| **D (done)** | Unify spawn UX: **Declare** (all member slots) / **On** (handler) / **Call** / **Dispatch** | Same mental model in catalog, canvas, inspector, project tree |
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
