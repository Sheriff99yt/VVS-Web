# VVS — Public Roadmap

Broad phases for Vision Visual Scripting. Timelines are **directional**, not commitments — see [current_state.md](current_state.md) for what is shipped in this repository today.

**Lineage:** The roadmap builds on the original [Vision Visual Scripting](https://github.com/Sheriff99yt/Vision_Visual_Scripting) graduation project (graph → any language). **VVS Web** is the active codebase for an **open visual scripting language** aimed at all engines and workflows — see [history.md](history.md).

**North star:** A portable visual programming system that generates real code, integrates with existing developer workflows, supports the **AI era** via open MCP integration, and **hands the torch from legacy Blueprint-style authoring to Verse-first development inside Unreal Engine 6**.

---

## Phase overview

```text
Phase 1          Phase 2           Phase 3            Phase 4
Web editor   →   Cloud + MCP   →   Community      →   Real-time
+ transpiler     accounts          library            collaboration

Phase 5                              Phase 6
UE6 editor plugin (in-engine)    →   Scale + polish
(reuses v1 Verse emitter)            + more emitters
```

---

## Phase 1 — Web editor & client transpiler *(in progress)*

**Goal:** Prove the graph model and generation pipeline in the browser without backend dependency.

| Track | Deliverables |
|-------|----------------|
| **Editor** | Node canvas, typed wiring, functions/macros, variables, references view, project save/load (local), mock codegen |
| **Transpiler** | Three-stage pipeline in `packages/transpiler`: graph analysis → IR → emitters |
| **Languages v1** | Python, JavaScript/TypeScript, C++, **Verse** syntax profiles (client transpiler + mock codegen in web UI) |
| **Preview** | Live code panel driven by real transpiler output (replace mock templates) |
| **Quality** | Snapshot tests on generated code; graph validation messages in UI |

**Status:** Editor shell is largely built with mock persistence and mock codegen. Transpiler packages are placeholders.

---

## Phase 2 — Accounts, persistence & MCP

**Goal:** Projects sync to the cloud; external AI tools edit graphs via MCP.

| Track | Deliverables |
|-------|----------------|
| **Auth** | Supabase (or self-hosted) accounts, project ownership |
| **API** | Go REST service — projects, graphs, syntax registry |
| **MCP** | `ListNodes`, `GetGraph`, `AddNode`, `ConnectPins`, `GenerateCode`, … |
| **PWA** | Offline graph editing + cached syntax registry (IndexedDB) |
| **Connect AI** | TopNav modal wires to real MCP endpoint (today: honest disconnected state) |

---

## Phase 3 — Community library

**Goal:** Share and discover graphs, node packs, and templates.

- Upload / browse / install visual scripts
- Metadata, tags, versions, ratings
- Semantic search (pgvector) — find by intent, not only keywords
- Import into editor as new project tabs

**Status:** Library UI skeleton exists with mock catalog data.

---

## Phase 4 — Collaboration

**Goal:** Multiple authors on one graph in real time.

- WebSocket sync (Go)
- Presence (cursors, selection)
- Conflict strategy (CRDT / OT / scoped last-write — TBD for v1)

---

## Phase 5 — Unreal Engine 6 editor plugin *(strategic)*

**Goal:** In-engine visual authoring on the **same graph model**, reusing the **Phase 1 Verse emitter** and adding UE-specific integration (types, subsystems, editor canvas) for teams migrating from deprecated Blueprint-centric workflows.

This is a **first-class product surface**, not a side export. It shares the **same graph schema and transpiler IR** as the web editor.

### Plugin capabilities (target)

| Area | Direction |
|------|-----------|
| **Node canvas** | UE6 editor-embedded graph view — dynamic node catalog, typed ports, execution + data wires, reroutes, comments |
| **Verse emission** | Reuses v1 Verse syntax profile from `packages/transpiler`; adds UE API node definitions |
| **Project model** | Align with multi-graph projects (main graph, functions, imports, cross-graph calls) |
| **Engine integration** | Hooks into UE types, subsystems, and Verse APIs via data-driven node definitions |
| **Transition tooling** | Workflows that help teams move from Blueprint habits to Verse — familiar UX, modern output |
| **Round-trip** | Graph JSON as source of truth; generated Verse as reviewable artifact in source control |
| **Parity with web** | Import/export graphs between browser editor and in-engine sessions |

### Why this matters

- **Verse** is Epic’s typed, scalable direction for gameplay logic; Blueprint is not the long-term authoring center.
- Studios need a **bridge** — not a forced rewrite on day one.
- VVS’s **logic/syntax split** means the UE plugin adds a **Verse emitter profile**, not a second visual system.

### Dependencies

- **Verse emitter in Phase 1** — browser editor and transpiler ship Verse alongside Python, JS/TS, and C++
- Stable `packages/graph-types` and transpiler IR (Phase 1)
- Verse syntax profile validated in web before plugin packaging (Phase 1–2)
- UE6 SDK / plugin packaging pipeline (new `plugins/` or separate repo — TBD)

---

## Phase 6 — Polish, scale & emitter expansion

| Track | Examples |
|-------|----------|
| **Performance** | 500+ node graphs at 60fps; worker-based transpile for large graphs |
| **Languages** | GDScript, Rust, C#; Tree-sitter-assisted syntax ingestion (research) |
| **Mobile UX** | Touch gestures, radial menus, magnetic pin snap |
| **Enterprise** | Self-hosted deploy, moderation, audit logs |

---

## Explicit non-goals (for now)

- **Bundled LLM** — users bring Cursor, Claude, Codex, etc. via MCP
- **Proprietary runtime** — generated code must run in standard toolchains
- **In-app roadmap tab** — this document is the public roadmap; the editor stays focused on authoring

---

## How to follow progress

- **Implementation truth:** [current_state.md](current_state.md)
- **Agent / contributor backlog:** `.agents/memory/incomplete-ui.md` (UI gaps)
- **Architecture:** [vision.md](vision.md), [project_requirements.md](project_requirements.md)

Issues and discussions on the public repository are the best place to influence prioritization within each phase.
