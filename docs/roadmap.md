# VVS — Public Roadmap

Broad phases for Vision Visual Scripting. Timelines are **directional**, not commitments — see [current_state.md](current_state.md) for what is shipped in this repository today.

**Lineage:** The roadmap builds on the original [Vision Visual Scripting](https://github.com/Sheriff99yt/Vision_Visual_Scripting) graduation project (graph → any language). **VVS Web** is the active codebase for an **open visual scripting language** aimed at all engines and workflows — see [history.md](history.md).

**North star:** **Text-shaped graphs** — a portable visual programming system where every node maps to honest, readable source code; integrates with existing developer workflows (IDE, git, CI); supports the **AI era** via open MCP; and optionally reaches Unreal teams through **Verse emission**, not Blueprint VM simulation. See [visual_to_text_fidelity.md](visual_to_text_fidelity.md).

---

## Phase overview

```text
Phase 1          Phase 2                 Phase 3            Phase 4
Web editor   →   Persistence, auth   →   Community      →   Real-time
 + transpiler      + MCP core            library            collaboration

Phase 5                                Phase 6
UE6 editor plugin (in-engine)      →   Scale + polish
(reuses v1 Verse emitter)              + more emitters
```

---

## Phase 1 — Web editor & client transpiler *(closed)*

**Goal:** Prove the graph model and **text-shaped** generation pipeline in the browser without backend dependency.

**Fidelity:** [visual_to_text_fidelity.md](visual_to_text_fidelity.md) — locked direction; alignment **shipped** July 2026.

| Track | Deliverables |
|-------|----------------|
| **Editor** | Node canvas, typed wiring, **functions** (primary reuse), variables, events, references view, project save/load (browser + **`.vvs/` folder**), client transpiler codegen |
| **Transpiler** | Three-stage pipeline in `packages/transpiler`: graph analysis → structured IR v2 → print (syntax packs) → emitters; **no hidden transforms** |
| **Languages v1** | Python, JavaScript/TypeScript, C++, **Verse** — client transpiler + web code preview |
| **Preview** | Live code panel driven by `@vvs/transpiler` + `sourceMap` selection highlight; multi-file output (module + host entry) |
| **Quality** | Snapshot tests on generated code; **Rosetta golden suite** + fidelity linter in `@vvs/syntax-packs`; graph validation (`PIN_TYPE_MISMATCH`, portability) |
| **Text-shaped alignment** | Macro removal, hoisted imports, Wait/Await Wait, **event Dispatch** (direct call), **explicit program entry** (`role: 'entry'`, no hidden `on_start`) — **shipped**; Emit/Subscribe multicast **rejected** (hidden runtime) |
| **Project environments** | `@vvs/environment-templates` — VS Code–style templates, Environment API browse/spawn, built-in Python/JS packs — **shipped**; [environment_templates.md](environment_templates.md) |
| **On-disk projects** | `.vvs/` overlay in existing repos — split JSON layout, `integration.json` emit paths, File System Access API (Chrome/Edge) — **shipped (browser)**; cloud sync still Phase 2 |

**Status:** Phase 1 is **closed and shipped** for the browser editor, v1 client transpiler, text-shaped graphs, project environments, folder-based `.vvs/` projects, OpenAPI/AsyncAPI import UI, overload picker, syntax pack lock settings, **local Go HTTP API**, and **local MCP**. Remaining cloud and production concerns are tracked in Phase 2 — see [deployment.md](deployment.md).

---

## Phase 2 — Persistence, auth & MCP core

**Goal:** Finish the core software architecture for durable project storage, user-scoped auth, and authenticated MCP access.

**Deployment (locked):** [deployment.md](deployment.md) — self-hosted Supabase on VPS; Go + `pgx`; no PostgREST for app paths.

| Track | Deliverables |
|-------|----------------|
| **Auth** | Self-hosted **GoTrue** — GitHub OAuth + email v1; JWT verified in Go |
| **Database** | Self-hosted **Postgres** — `projects` JSONB snapshots via **`pgx`** in Go |
| **API** | Go REST — same `/api/projects`, compile, registry (replace in-memory store) |
| **MCP** | Production `/mcp` with Bearer JWT; tools scoped per user |
| **Editor sync** | Authenticated mode: Go/Postgres source of truth; localStorage as cache/draft |
| **Connect AI** | TopNav modal — local MCP in dev; HTTPS MCP URL + token in prod |

**Status:** Phase 2 core is **closed and shipped in repo**.

- PostgresStore + migrations via **`pgx`**
- JWT auth middleware + dev user path
- GoTrue docker-compose local stack
- Authenticated cloud save/load
- Production MCP auth propagation
- AuthButton + Bearer token client wiring

### Separate track — Deployment & operations

- Full Supabase Docker deploy on VPS
- GitHub OAuth production configuration
- Backups / health checks / pinned images
- Optional offline sync / PWA follow-through

**Not in Phase 2 core:** PostgREST for CRUD, Supabase Realtime (collab is Phase 4 Go WebSockets), Redis, VPS hosting, TLS, backups, and other service-operational work.

**Roadmap focus:** product phases track **core systems of the software**. Hosting, deployment, backups, and similar service concerns are important, but they do **not** block core phase closure.

---

## Phase 3 — Community library

**Goal:** Share and discover graphs, node packs, templates, and **project environments**.

- Upload / browse / install visual scripts, node packs, templates, and environment manifests
- Metadata, tags, versions, ratings
- Semantic search (pgvector) — find by intent, not only keywords
- Import into editor as new project tabs or linked environments
- **Standards alignment:** OpenAPI + AsyncAPI → environment manifest import **shipped in editor UI**; Backstage scaffolder-compatible skeletons still planned

**Status:** Library UI with **Templates · Community · Installed**, live built-in environment manifests, and mock community catalog; upload/backend still Phase 3.

---

## Phase 4 — Collaboration

**Goal:** Multiple authors on one graph in real time.

- **Go WebSocket** server (not Supabase Realtime for product paths)
- Presence (cursors, selection)
- Conflict strategy (CRDT / OT / scoped last-write — TBD for v1)
- Operation log on top of Postgres document storage (may split graph rows per tab)

---

## Phase 5 — Unreal Engine 6 editor plugin *(strategic)*

**Goal:** In-engine visual authoring on the **same graph model** and **same text-shaped fidelity rules**, reusing the **Phase 1 Verse emitter** — **not** simulating Blueprint VM, latent actions, or macro expansion.

This is a **first-class product surface** for Unreal teams, but output remains **reviewable Verse in source control**, embeddable like any third-party tool output.

### Plugin capabilities (target)

| Area | Direction |
|------|-----------|
| **Node canvas** | UE6 editor-embedded graph view — dynamic node catalog, typed ports, execution + data wires, reroutes, comments |
| **Verse emission** | Reuses v1 Verse syntax profile from `packages/transpiler`; adds UE API node definitions |
| **Project model** | Align with multi-graph projects (main graph, functions, imports, cross-graph calls) |
| **Engine integration** | Hooks into UE types, subsystems, and Verse APIs via **environment manifests** and data-driven node definitions |
| **Transition tooling** | Familiar **canvas** UX; **Verse text** that matches the graph — not Blueprint bytecode semantics |
| **Round-trip** | Graph JSON as source of truth; generated Verse as reviewable artifact in source control |
| **Parity with web** | Import/export graphs between browser editor and in-engine sessions |

### Why this matters

- **Verse** is Epic’s typed direction for gameplay logic; Blueprint is not the long-term authoring center.
- Studios need a **bridge** with **honest code**, not a second proprietary runtime.
- VVS’s **logic/syntax split** + **text-shaped graphs** mean the UE plugin adds engine nodes and a **Verse emitter profile** — same fidelity contract as the web editor ([visual_to_text_fidelity.md](visual_to_text_fidelity.md)).

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
| **Languages** | GDScript, Rust, C#; **syntax packs** + agent-assisted maintenance + optional Tree-sitter parse validation — see [syntax_pack_architecture.md](syntax_pack_architecture.md) |
| **Templates & standards** | OpenAPI/AsyncAPI → environment manifest import; TypeSpec emitter; Backstage catalog; devcontainer linkage |
| **Mobile UX** | Touch gestures, radial menus, magnetic pin snap |
| **Enterprise** | Self-hosted Supabase + Go on VPS ([deployment.md](deployment.md)), moderation, audit logs |

---

## Explicit non-goals (for now)

- **Bundled LLM** — users bring Cursor, Claude, Codex, etc. via MCP
- **Proprietary runtime** — generated code must run in standard toolchains; **no Blueprint VM simulation**
- **Under-the-hood transforms** — no macro inline expansion, latent delays without AST, or folded casts ([visual_to_text_fidelity.md](visual_to_text_fidelity.md))
- **In-app roadmap** — **Development roadmap** view summarizes shipped vs coming soon; this document is the public phase strategy

---

## How to follow progress

- **Implementation truth:** [current_state.md](current_state.md)
- **Deployment & persistence:** [deployment.md](deployment.md)
- **Agent / contributor backlog:** `.agents/memory/incomplete-ui.md` (UI gaps)
- **Architecture:** [vision.md](vision.md), [visual_to_text_fidelity.md](visual_to_text_fidelity.md), [project_requirements.md](project_requirements.md)

Issues and discussions on the public repository are the best place to influence prioritization within each phase.
