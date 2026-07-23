# Vision Visual Scripting (VVS)

> **Early public development** — try the live editor below, or run locally. See [Where we are now](#where-we-are-now) · **Origin:** [Vision Visual Scripting (2021)](https://github.com/Sheriff99yt/Vision_Visual_Scripting)

**Visual programming that generates real code** — compose logic on a graph, export ordinary source, and integrate with the tools you already use: your IDE, git, CI, and AI assistants (via MCP). **Canvas is the source of truth for generated code** — every export line maps to a graph node; symbol tables index only.

VVS builds **on top of traditional development**, not instead of it. The graph is the authoring view; **text code stays the integration layer** — with **text-shaped fidelity** (what you draw is what you could type). See [docs/visual_to_text_fidelity.md](docs/visual_to_text_fidelity.md).

---

## Try it (live)

**Open the editor now:** [https://sheriff99yt.github.io/VVS-Web/](https://sheriff99yt.github.io/VVS-Web/)

That is the latest successful **GitHub Pages** deployment — same fast showcase link as Deployments → `github-pages`. Browser storage only (no cloud account required).

| Channel | Where | What |
|---------|--------|------|
| **Live preview** | [sheriff99yt.github.io/VVS-Web](https://sheriff99yt.github.io/VVS-Web/) | Always tracks `main` after a green Pages deploy |
| **Current pre-release** | [Releases](https://github.com/Sheriff99yt/VVS-Web/releases) → *Try it — …* (tag `pre-release`) | Same site link + `vvs-web-pre-release.zip` |
| **Versioned downloads** | [Releases](https://github.com/Sheriff99yt/VVS-Web/releases) → SemVer tags (`v0.1.0`, …) | Frozen static zips for a specific version |

Details: [docs/setup.md](docs/setup.md) § GitHub Pages / Releases.

---

## Where we are now

**Phase 1 — web editor & client transpiler** is in progress. The **editor shell is real and usable**; the **engine underneath is still mostly planned**.

| Layer | Today | Not yet |
|-------|--------|---------|
| **Web editor** (`apps/web`) | Start screen, graph canvas, tabs, references view, wiring, variables/functions, local project save, **real** codegen preview (`@vvs/transpiler`), Hello World + **Calculator** examples | Cloud sync, MCP connect |
| **Transpiler** (`packages/transpiler`) | Client-side codegen (Python, JS, C++, Verse, GDScript, Rust, C#, Go), conversion nodes, snapshot tests | Full analyze → IR → per-language emitter split |
| **Backend** (`server/`) | Go skeleton — `GET /health` only | REST API, MCP server, WebSockets |
| **UE6 plugin** (`plugins/`) | Roadmap doc only | In-engine canvas (reuses v1 Verse emitter) |

**What you can do today:** run the app locally, create projects, edit graphs, explore multi-graph examples (e.g. **Calculator**), save to browser storage, and preview **real** generated code (Python, JavaScript, C++, Verse, GDScript, Rust, C#, Go) via `@vvs/transpiler`. Status chrome is honest — **offline / disconnected**, not fake “synced” or “MCP connected.”

**Canonical detail:** [docs/current_state.md](docs/current_state.md) · **Direction:** [docs/visual_to_text_fidelity.md](docs/visual_to_text_fidelity.md) · **Phases:** [docs/roadmap.md](docs/roadmap.md)

---

## Text-shaped graphs

VVS does **not** simulate Unreal Blueprint (macro expansion, latent delays, VM-only behavior). Generated code must be **honest, grep-able, and embeddable** in any third-party product. Rationale and rejected alternatives: [docs/visual_to_text_fidelity.md](docs/visual_to_text_fidelity.md).

---

## UI-first approach (why we build this way)

We are deliberately building the **visual editor and data contracts first**, with **mock persistence** (localStorage) while the **client transpiler** (`@vvs/transpiler`) matures in parallel. Cloud database and MCP server remain planned. This is not “UI only forever” — it is how we **de-risk** a system that spans a browser editor, a codegen engine, AI tools, and eventually an Unreal plugin.

**What UI-first means here**

1. **Shape the product in the canvas** — tabs, references, wiring rules, project tree, properties, and navigation must feel right before we lock backend APIs.
2. **Define interfaces while building UI** — `ProjectSnapshot`, graph documents, `VvsApi`, validation messages, and target-language selection are **contracts** the transpiler and server will implement later, not afterthoughts.
3. **Mock honestly** — `localStorage` save/load stands in for cloud sync; codegen uses **`@vvs/transpiler`** (facade: `mockCodegen.ts`); the UI says **offline** until MCP and cloud sync exist.
4. **Wire one vertical slice at a time** — when backend work starts, UI → facade → API → Go handler → storage, without rewriting the shell. See [docs/ui_api_delivery_loop.md](docs/ui_api_delivery_loop.md).

**What this helps us avoid**

| Bad decision | UI-first guardrail |
|--------------|-------------------|
| Transpiler or API designed without a proven graph UX | Editor and graph schema come first; emitters target a stable IR |
| UI coupled to unfinished backend | Components call **`VvsApi`**, not raw `fetch` or ad-hoc mocks scattered in views |
| Fake “connected” or “synced” states | Status bar and Connect AI show **disconnected** until real endpoints exist |
| Big-bang integration | One feature slice per iteration (save, health, compile, …) with shared types |
| Engine jargon leaking into a portable web product | Web copy stays engine-neutral; Verse/UE integration is a **target**, not the whole identity |

**Rule of thumb for contributors:** if it is not in [current_state.md](docs/current_state.md), treat it as **planned** — local MCP and Go HTTP API work in dev; cloud persistence is Phase 2 ([deployment.md](docs/deployment.md)). Extend the UI and types first; plug in `PostgresStore` when the contract is clear.

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

Prefer not to install? Use the **[live preview](https://sheriff99yt.github.io/VVS-Web/)** or grab a zip from **[Releases](https://github.com/Sheriff99yt/VVS-Web/releases)** (see [Try it (live)](#try-it-live)).

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
| **[setup.md](docs/setup.md)** | Install, Pages preview, pre-release + SemVer releases |
| **[history.md](docs/history.md)** | Origin story — graduation project → VVS Web, open systems & AI era |
| **[vision.md](docs/vision.md)** | Product philosophy, UE6/Verse direction, logic/syntax model |
| **[roadmap.md](docs/roadmap.md)** | Public roadmap (Active / Next / shipped waves) |
| **[current_state.md](docs/current_state.md)** | What is implemented in this repo |
| **[code_panel.md](docs/code_panel.md)** | Code panel usability — selection highlight, hover, double-click → node, Files pin |
| **[naming_and_product_direction.md](docs/naming_and_product_direction.md)** | UI vocabulary (web stays engine-neutral) |
| **[project_requirements.md](docs/project_requirements.md)** | Full requirements spec |
| **[vvs_2_0_tech_stack.md](docs/vvs_2_0_tech_stack.md)** | Technology choices |
| **[ui_api_delivery_loop.md](docs/ui_api_delivery_loop.md)** | Wiring UI to APIs incrementally |

---

## License

[MIT](LICENSE) — see [CONTRIBUTING.md](CONTRIBUTING.md) for how to participate.
