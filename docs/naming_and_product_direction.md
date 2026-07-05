# VVS — Naming & Product Direction

Canonical vocabulary and product principles. **Do not use Unreal Engine Blueprint terminology** in user-facing UI, docs, or generated code labels — even though the interaction model is inspired by node-based visual programming.

Companion: [vision.md](vision.md) · [visual_to_text_fidelity.md](visual_to_text_fidelity.md) · [roadmap.md](roadmap.md) · [project_requirements.md](project_requirements.md) · [current_state.md](current_state.md)

---

## Product principles

### 1. Visual layer on top of code — not a replacement

VVS is a **visual way to compose logic** that **generates ordinary source code** with **text-shaped fidelity** — every behavioral node maps to visible text ([visual_to_text_fidelity.md](visual_to_text_fidelity.md)).

- The graph is the authoring view; **text code remains the integration layer** for git, IDE, CI, and third-party embedding.
- No proprietary runtime required to use exported code.
- Generated output should look like a human wrote it in the target language — **and match what the graph shows**.

### 2. Beginner-friendly, professional depth

- Labels use **plain programming words** (variable, function, if, loop) — not engine jargon.
- Progressive disclosure: simple defaults first; advanced options in properties panels.
- Errors should read like compiler messages, not graph-engine internals.

### 3. Integrates with existing systems

- Export to standard files (`.py`, `.js`, `.ts`, `.cpp`, JSON graph).
- Embed in **any** product — generated modules import like hand-written code; no VVS VM.
- **Bring your own AI** (Cursor, Claude, Codex, etc.) via MCP — predictable text diffs when graphs change.
- **Bring your own backend** later (Supabase, self-hosted) — graphs are data, not a walled garden.

### 4. Familiar to anyone who has seen node editors

The UX borrows **canvas patterns** from node editors (wires, typed ports, flow) but **semantics follow text code** — functions, calls, handlers — not Unreal Blueprint VM rules (macro expand, latent delay).

---

## Official vocabulary

Use the **Preferred term** in UI, docs, and agent prompts. **Avoid** Unreal-specific or misleading terms.

| Concept | Preferred term | Avoid | Notes |
|---------|----------------|-------|-------|
| Whole visual program | **Graph** | Blueprint, Asset | One canvas of nodes + wires |
| Workspace / file | **Project** | Blueprint, Level | Container for graphs, variables, settings |
| Left symbol tree | **Project** panel | My Blueprint | Variables, functions, node list |
| Sub-canvas | **Graph tab** | Blueprint tab | e.g. Main graph, function graphs |
| Node catalog spawn | **Add node** / context menu | — | From `nodeCatalog` |
| Connection point | **Port** (or pin in code types) | — | `execution` = **flow** port in UI copy when helpful |
| Execution wire | **Flow** connection | Exec wire | **Linear** — one in / one out per handle; rewire breaks chain (see [node_system.md](node_system.md) §5) |
| Data wire | **Data** connection | — | Typed by value (string, number, …) |
| Run entry hook | **On Start** | BeginPlay, Event BeginPlay | Program / graph entry |
| Per-frame hook | **On Update** | Event Tick, Tick | Optional; name for loop/frame |
| User-defined entry | **Custom event** | — | |
| Local state | **Variable** | — | Standard CS term |
| Reusable subgraph | **Function** | Macro, Blueprint Macro | Opens as graph tab; **Call Function** in generated text |
| Macro (legacy UI tab) | **Function** *(migrate)* | Macro | Deprecated as codegen concept — see [visual_to_text_fidelity.md](visual_to_text_fidelity.md) |
| Build graph → code | **Generate code** | Compile (OK in toolbar shorthand) | Button may say **Generate**; logs say "generation" |
| Generated artifact name | **Module name** | Class name, BP_* | Maps to class/module in target language |
| Optional base type | **Extends** | Parent class, Super | Optional; OOP languages only |
| Community item (full graph) | **Script** | Blueprint | Library filter category |
| Community item (single node) | **Node pack** | — | Library filter |
| Community template | **Template** | — | Library filter |
| AI connection | **Connect AI** | Integrations page | MCP URL modal only |

### Library categories (community)

| Filter | Meaning |
|--------|---------|
| **All** | Everything |
| **Scripts** | Full graph / visual program shared by community |
| **Node packs** | Reusable node definitions |
| **Templates** | Starter graphs |

---

## Code-generation field names (internal / API)

Use language-neutral names in project metadata:

| Field | Type | UI label |
|-------|------|----------|
| `moduleName` | string | Module name |
| `extendsType` | string | Extends (optional) |
| `description` | string | Description |
| `targetLanguage` | enum | Target language |

Do not use `BP_` prefixes, `BeginPlay`, or `AActor` in defaults or examples unless documenting a **game** sample explicitly.

**Default demo values:** `PlayerController`, `On Start`, `playerHealth` — not `BP_PlayerCharacter`, `BeginPlay`.

---

## Node naming conventions

| Category | Pattern | Examples |
|----------|---------|----------|
| Entry events | `On …` | On Start, On Update, Custom event |
| Flow control | Plain English | Branch, Sequence, Loop |
| Data | Verb or noun | Get variable, Set variable, Add |
| Actions | Verb phrase | Print message, Call function |

Node `type` ids stay snake_case (`event_on_start`); **labels** are user-facing.

---

## Messaging snippets (for README, onboarding)

**One-liner:**  
*VVS is visual programming that generates real code — use your editor, your repo, and your AI tools.*

**With history:**  
*From a university graduation project to an open web platform — one graph, many languages, every workflow.*

**Not:**  
*A Blueprint system for the web* / *Replace your codebase with graphs*

**Integration:**  
*Connect Cursor or Claude via MCP to edit graphs with the AI you already pay for.*

---

## What stays Unreal-adjacent (internal only)

- Early design notes may mention Unreal as inspiration — describe outward-facing copy in **compiler/graph** terms.
- Pin type `execution` in TypeScript types is fine; prefer **flow** in beginner-facing copy where space allows.

---

## Unreal Engine 6 plugin (roadmap — separate surface)

The **web editor** stays engine-neutral in user-facing copy. The planned **UE6 editor plugin** is a different authoring surface for the **same graph schema**, with **Verse** as the primary codegen target.

| Context | Vocabulary |
|---------|------------|
| Web app UI | Graph, function, variable, flow — per table above |
| UE plugin (in-engine) | Same **text-shaped** Verse output; canvas may feel familiar — **not** Blueprint VM semantics |
| Generated Verse | Normal Verse idioms; not web UI labels |
| Public messaging | “UE6 integration”, “Verse output”, “Blueprint transition” — see [vision.md](vision.md) |

Do not describe the **web product** as “a Blueprint system for the browser.” Do describe the **roadmap** as **Verse-oriented output with honest visual↔text mapping** — not Blueprint simulation.

---

## Agent checklist

Before adding UI or docs:

- [ ] No "Blueprint", "BeginPlay", "BP_", or engine jargon in user-facing strings — see `docs/naming_and_product_direction.md`
- [ ] Generated code examples use normal language idioms
- [ ] No Blueprint VM semantics (macro expand, latent delay without text) in transpiler or docs
- [ ] New nodes pass fidelity checklist in [visual_to_text_fidelity.md](visual_to_text_fidelity.md)
- [ ] AI features framed as **Connect AI (MCP)**, not built-in chatbot
