# Vision Visual Scripting (VVS)

> **Early public development (v0.1 skeleton)** — the graph editor is usable locally; transpiler, MCP, and cloud sync are planned. See [Where we are now](#where-we-are-now) · **Origin:** [Vision Visual Scripting (2021)](https://github.com/Sheriff99yt/Vision_Visual_Scripting)

**Visual programming that generates real code** — compose logic on a graph, export ordinary source, and integrate with the tools you already use: your IDE, git, CI, and AI assistants (via MCP).

VVS builds **on top of traditional development**, not instead of it. The graph is the authoring view; **text code stays the integration layer**.

---

## Where we are now

**Phase 1 — web editor & client transpiler** is in progress. The **editor shell is real and usable**; the **engine underneath is still mostly planned**.

| Layer | Today | Not yet |
|-------|--------|---------|
| **Web editor** (`apps/web`) | Start screen, graph canvas, tabs, references view, wiring, variables/functions, local project save, mock code preview, simple + complex examples | Real transpiler output, cloud sync, MCP connect |
| **Transpiler** (`packages/transpiler`) | Empty placeholder; types live in `apps/web/src/types/` for now | Three-stage pipeline, v1 emitters (Python, JS/TS, C++, **Verse**) |
| **Backend** (`server/`) | Go skeleton — `GET /health` only | REST API, MCP server, WebSockets |
| **UE6 plugin** (`plugins/`) | Roadmap doc only | In-engine canvas (reuses v1 Verse emitter) |

**What you can do today:** run the app locally, create projects, edit graphs, explore multi-graph examples (e.g. Game Session), save to browser storage, and preview **mock** generated code. Status chrome is honest — **offline / disconnected**, not fake “synced” or “MCP connected.”

**Canonical detail:** [docs/current_state.md](docs/current_state.md) · **Phases:** [docs/roadmap.md](docs/roadmap.md)

---

## UI-first approach (why we build this way)

We are deliberately building the **visual editor and data contracts first**, with **mock persistence and mock codegen**, before the transpiler, database, or MCP server. This is not “UI only forever” — it is how we **de-risk** a system that spans a browser editor, a codegen engine, AI tools, and eventually an Unreal plugin.

**What UI-first means here**

1. **Shape the product in the canvas** — tabs, references, wiring rules, project tree, properties, and navigation must feel right before we lock backend APIs.
2. **Define interfaces while building UI** — `ProjectSnapshot`, graph documents, `VvsApi`, validation messages, and target-language selection are **contracts** the transpiler and server will implement later, not afterthoughts.
3. **Mock honestly** — `localStorage` save/load and template codegen stand in for real services; the UI says **offline** until MCP and cloud sync exist.
4. **Wire one vertical slice at a time** — when backend work starts, UI → facade → API → Go handler → storage, without rewriting the shell. See [docs/ui_api_delivery_loop.md](docs/ui_api_delivery_loop.md).

**What this helps us avoid**

| Bad decision | UI-first guardrail |
|--------------|-------------------|
| Transpiler or API designed without a proven graph UX | Editor and graph schema come first; emitters target a stable IR |
| UI coupled to unfinished backend | Components call **`VvsApi`**, not raw `fetch` or ad-hoc mocks scattered in views |
| Fake “connected” or “synced” states | Status bar and Connect AI show **disconnected** until real endpoints exist |
| Big-bang integration | One feature slice per iteration (save, health, compile, …) with shared types |
| Engine jargon leaking into a portable web product | Web copy stays engine-neutral; Verse/UE integration is a **target**, not the whole identity |

**Rule of thumb for contributors:** if it is not in [current_state.md](docs/current_state.md), treat it as **planned** — do not assume MCP, Supabase, or real codegen are live. Extend the UI and types first; plug in backend when the contract is clear.

---

## Where VVS started

Vision Visual Scripting began as a **[university graduation project](https://github.com/Sheriff99yt/Vision_Visual_Scripting)** (2021): an open-source Python desktop app where anyone could **hop in and program with visual nodes**, and the graph would **translate into whatever programming language syntax you selected** — the same logic/syntax split that defines VVS today.

**VVS Web** is the next chapter: a browser-native, open monorepo built for the **AI era** (MCP, bring-your-own assistants) and a long-term goal — an **open visual scripting language** portable across **all engines and all workflows**, not locked to one tool or runtime.

Read the full origin story: **[docs/history.md](docs/history.md)** · **[Vision & philosophy](docs/vision.md)** · **[Public roadmap](docs/roadmap.md)**

---

## Highlights

| Principle | What it means |
|-----------|----------------|
| **Born open** | Started as a MIT graduation project; VVS Web continues as a public open platform |
| **Real code out** | Export readable source files — no proprietary VM required |
| **Logic ↔ syntax split** | One graph; v1 targets include **Verse**, Python, JS/TS, and C++ |
| **Open visual scripting** | Portable graph schema aimed at **all engines and workflows** |
| **Bring your own AI** | MCP server (planned) — connect Cursor, Claude, Codex; no bundled LLM |
| **Offline-capable** | Client-side transpiler (planned) — edit and generate without a server |
| **Verse in v1** | Phase 1 transpiler + web editor — not deferred to UE plugin alone |
| **UE6 plugin (roadmap)** | In-engine canvas reuses v1 Verse emitter; Blueprint-era transition workflows |

---

## Repository structure

```text
vvs-web/
├── apps/web/              # Next.js graph editor (implemented — UI-first skeleton)
├── packages/              # Shared packages (planned)
│   ├── transpiler/        # Pure TS: graph → IR → code
│   ├── graph-types/       # Shared graph schema
│   └── syntax-registry/   # Data-driven language profiles
├── server/                # Go API + MCP + WebSockets (skeleton)
├── plugins/               # (future) UE6 editor plugin
├── docs/                  # Vision, roadmap, architecture
├── tools/                 # setup_env.ps1, start_app.ps1
└── .agents/               # Public contributor agent skills & memory (kept in repo)
```

Graph types currently live in `apps/web/src/types/` until `packages/graph-types` is extracted.

---

## Quick start

**First time:** [docs/setup.md](docs/setup.md) · **Daily use:** [docs/quickstart.md](docs/quickstart.md)

**Prerequisites:** [Bun](https://bun.sh), Git. Go 1.22+ optional (server work).

```powershell
# Windows
.\tools\setup_env.ps1
.\tools\start_app.ps1
```

```bash
cd apps/web
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) — create or open a project from the start screen.

Before pushing: confirm `apps/web/.env.local` does **not** appear in `git status`.

**Build:**

```bash
cd apps/web && bun run build
cd server && go build ./...
```

---

## Architecture (locked — implementation follows UI-first)

1. **Transpiler** — pure TypeScript, zero React deps; three-stage pipeline (analyze → IR → emit).
2. **Syntax registry** — data-driven language constructs (JSON), not hardcoded per-language hacks.
3. **MCP tools** — thin Go wrappers over testable pure functions.
4. **Monorepo boundaries** — UI, transpiler, and server communicate only via typed contracts.

Contributor rules: **[CONTRIBUTING.md](CONTRIBUTING.md)** · **[.agents/AGENTS.md](.agents/AGENTS.md)**

---

## Documentation

| Document | Use when |
|----------|----------|
| **[history.md](docs/history.md)** | Origin story — graduation project → VVS Web, open systems & AI era |
| **[vision.md](docs/vision.md)** | Product philosophy, UE6/Verse direction, logic/syntax model |
| **[roadmap.md](docs/roadmap.md)** | Public phased roadmap |
| **[current_state.md](docs/current_state.md)** | What is implemented in this repo |
| **[naming_and_product_direction.md](docs/naming_and_product_direction.md)** | UI vocabulary (web stays engine-neutral) |
| **[project_requirements.md](docs/project_requirements.md)** | Full requirements spec |
| **[vvs_2_0_tech_stack.md](docs/vvs_2_0_tech_stack.md)** | Technology choices |
| **[ui_api_delivery_loop.md](docs/ui_api_delivery_loop.md)** | Wiring UI to APIs incrementally |

---

## License

[MIT](LICENSE) — see [CONTRIBUTING.md](CONTRIBUTING.md) for how to participate.
