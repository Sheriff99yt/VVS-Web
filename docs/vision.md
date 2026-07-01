# VVS — Vision & Product Philosophy

Vision Visual Scripting (VVS) is an open visual programming platform that **builds on top of traditional software development** — not against it.

The graph is an authoring surface. **Text code remains the integration layer**: files you can read in any IDE, commit to git, run in CI, and hand to the tools you already use (including AI assistants via MCP).

> **Origin:** VVS began as a [university graduation project](https://github.com/Sheriff99yt/Vision_Visual_Scripting) (2021) — a Python desktop app proving that a visual graph could translate into **any selected programming language**. **VVS Web** continues that mission for the open-system and AI era. See [history.md](history.md).

---

## North star: an open visual scripting language

We are working toward a **portable visual scripting model** — graph schema, intermediate representation, and data-driven emitters — that teams can use across **engines, editors, and workflows**:

- **Web** — author in the browser; share graphs and generated code freely
- **Repos & automation** — JSON graphs + text output; no proprietary runtime required
- **AI tools** — MCP exposes graph operations to assistants you already use
- **Game engines** — UE6 plugin (roadmap) reuses the **v1 Verse emitter** for in-engine authoring
- **Everything else** — education, tooling, scripting glue — via open node packs and syntax profiles

VVS Web exists because that vision needs a **modern, accessible, openly developed foundation** — not a single-vendor desktop app tied to one install path.

---

## The problem we are solving

Visual node systems have proven that **flow + typed data** is one of the fastest ways to reason about program structure — especially for gameplay, simulation, tooling, and glue logic. But most visual tools either:

- Lock logic inside a proprietary runtime, or
- Generate code that is hard to maintain, or
- Stall when the host platform moves on (new languages, new engine APIs, deprecated authoring models).

VVS takes a different path: **decouple logic from syntax**, generate **ordinary source**, and meet developers **where they already work** — browser, repo, IDE, and eventually **inside Unreal Engine 6** with **Verse** as the modern in-engine target.

---

## Three layers, one graph model

```text
┌─────────────────────────────────────────────────────────────────┐
│  Authoring surfaces (same graph schema, different hosts)        │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Web editor   │  │ MCP / AI     │  │ UE6 editor plugin      │ │
│  │ (PWA)        │  │ agents       │  │ (planned)              │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬────────────┘ │
│         └─────────────────┴──────────────────────┘              │
│                           │                                     │
│                    Graph document (JSON)                        │
│                           │                                     │
│         ┌─────────────────┴──────────────────────┐              │
│         │  Transpiler (logic → IR → emitters)   │              │
│         └─────────────────┬──────────────────────┘              │
│                           │                                     │
│    Python · JS/TS · C++ · Verse · … (data-driven syntax)      │
└─────────────────────────────────────────────────────────────────┘
```

### 1. Logic layer (language-agnostic)

Nodes, ports, and wires express **what happens** — control flow, data flow, functions, variables, cross-graph references. This layer does not hardcode Python braces or Verse semantics.

### 2. Syntax layer (swappable emitters)

A data-driven **syntax registry** turns the intermediate representation into readable source for each target. Changing language does not mutate the graph.

### 3. Integration layer (your stack)

Export files, sync projects, connect MCP-capable AI tools, and (roadmap) run graphs **inside UE6** through a first-party-style plugin that emits **Verse** and interoperates with Epic’s direction away from legacy Blueprint-only workflows.

---

## Building on traditional systems

| Traditional strength | How VVS extends it |
|---------------------|-------------------|
| Text code in git | Graphs serialize to JSON; generated code is normal source files |
| IDEs & debuggers | Output is not a black box — use standard tooling on emitted code |
| Code review | Diff generated artifacts or graph JSON depending on team preference |
| AI assistants | MCP exposes graph operations; AI arranges **logic blocks**, not syntax |
| Engine evolution | **Verse in v1** (browser transpiler) + UE6 plugin reuses the same emitter profile |

VVS is **not** “replace your codebase with graphs.” It is **compose visually, integrate as code**, with optional in-engine authoring for Unreal teams.

---

## Unreal Engine 6 & the Blueprint transition

Epic’s platform direction treats **Verse** as the forward path for gameplay logic in UEFN and the broader UE ecosystem, while **Blueprint** enters a long deprecation arc for new greenfield work. Teams still need:

- Familiar **node-based authoring** during the transition
- **Typed, reviewable output** (Verse) rather than opaque bytecode graphs
- **Migration affordances** — not a cliff edge from years of Blueprint investment

**VVS’s UE6 editor plugin (roadmap)** is designed to:

1. **Host the same dynamic, extensible node system** as the web editor — data-driven node definitions, typed ports, execution flow, sub-graphs, and project-level references.
2. **Emit Verse** from the shared transpiler pipeline in **Phase 1** (web editor) — same IR and syntax profile the UE plugin will reuse later.
3. **Smooth the handoff** from legacy visual scripting habits to Verse-first workflows — familiar canvas UX, modern language underneath.
4. **Stay optional** — teams can author in the browser, in-engine, or both; graphs remain portable JSON.

The web editor uses **generic software vocabulary** (graph, function, variable). The UE plugin may surface engine-familiar affordances where appropriate; outward web copy stays engine-neutral. See [naming_and_product_direction.md](naming_and_product_direction.md).

---

## Dynamic, flexible node system

Nodes are **data**, not hardcoded UI-only widgets:

- Categories, port types, and inline properties are schema-driven
- Community **node packs** and project-specific nodes extend the catalog without forked engines
- AI agents (via MCP) choose from **registered** nodes — reducing hallucinated APIs
- Cross-graph **Call Function** and **Import Module** semantics mirror how real multi-file projects are structured

This flexibility is what makes a single graph model viable across **web**, **CLI**, **MCP**, and **UE6**.

---

## Who this is for

- **Learners** — visual structure with real code output they can study
- **Professional developers** — faster glue logic, AI-assisted graph edits, export to repo
- **Unreal teams** — a Verse-oriented path through the Blueprint transition
- **Tool builders** — open graph schema, transpiler packages, MCP integration surface

---

## Related documents

| Document | Purpose |
|----------|---------|
| [history.md](history.md) | Origin story — VVS 1 graduation project → VVS Web |
| [roadmap.md](roadmap.md) | Public phased roadmap (including UE6 plugin) |
| [project_requirements.md](project_requirements.md) | Detailed requirements |
| [current_state.md](current_state.md) | What exists in the repo today |
| [naming_and_product_direction.md](naming_and_product_direction.md) | Vocabulary & UI principles |
| [vvs_2_0_tech_stack.md](vvs_2_0_tech_stack.md) | Technology choices |
