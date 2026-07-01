# Contributing to Vision Visual Scripting (VVS)

Thank you for your interest in VVS. This repository is open for community collaboration as we build a modern visual programming platform that generates real code and integrates with traditional development workflows — including a planned **Unreal Engine 6 editor plugin** with **Verse** as the in-engine target.

**Background:** VVS began as a [university graduation project](https://github.com/Sheriff99yt/Vision_Visual_Scripting) (graph → any language). **VVS Web** is the active continuation — an open platform for the AI era and a portable visual scripting model across engines and workflows. See [docs/history.md](docs/history.md).

## Before you start

1. Read **[docs/vision.md](docs/vision.md)** — why VVS exists and how it relates to text code and engine tooling.
2. Read **[docs/current_state.md](docs/current_state.md)** — what is implemented today vs planned (avoid re-building removed UI or duplicate systems).
3. Read **[docs/naming_and_product_direction.md](docs/naming_and_product_direction.md)** — vocabulary for the web editor (engine-specific terms belong in the UE plugin docs, not generic web UI copy).

## Development setup

See **[docs/setup.md](docs/setup.md)** (one-time) and **[docs/quickstart.md](docs/quickstart.md)** (daily commands).

**Prerequisites:** [Bun](https://bun.sh), [Go](https://go.dev) 1.22+ (optional for server work), Git.

```powershell
# Windows — install toolchain + create gitignored .env.local
.\tools\setup_env.ps1

# Start the web app
.\tools\start_app.ps1
```

Or from `apps/web`:

```bash
bun install
bun run dev
```

**Before pushing to a public repo:**

```powershell
git status   # .env.local must NOT appear
```

## Agent assets (`.agents/` — public)

The **`.agents/`** directory is **intentionally committed** — skills, rules, and memory for Cursor/Codex contributors. Do not gitignore it. Personal overrides belong in gitignored `*.local.md` / `AGENTS.local.md` only.

**Build checks:**

```bash
cd apps/web && bun run build && bun run lint
cd server && go build ./...
```

## Architecture boundaries

Contributions must respect monorepo separation:

| Package | Role | Rules |
|---------|------|-------|
| `apps/web` | Next.js UI, React Flow editor | No transpiler logic embedded in components — call packages |
| `packages/transpiler` | Pure TS code generation | Zero React deps; snapshot tests for output |
| `packages/graph-types` | Shared graph schema | No UI or server imports |
| `server/` | Go API, MCP, WebSockets | Hexagonal architecture; MCP tools wrap pure functions |

See **[.agents/AGENTS.md](.agents/AGENTS.md)** and **[docs/vvs_2_0_tech_stack.md](docs/vvs_2_0_tech_stack.md)**.

## How to contribute

1. **Open an issue** for large features (UE plugin, transpiler stages, MCP tools) before a big PR — align on scope first.
2. **Keep PRs focused** — one slice per change (UI panel, wiring rule, API endpoint, doc update).
3. **Match existing style** — read surrounding code; minimal diffs over drive-by refactors.
4. **Update docs** when you change user-visible behavior or integration boundaries (`docs/current_state.md`, relevant skill in `.agents/skills/`).
5. **Do not commit secrets** — never commit `.env.local`, API keys, or LAN IPs. Template: `apps/web/.env.example`.

## UI contributions

The editor follows a **UI-first skeleton** phase: mock data and honest offline chrome until backend contracts land. See **[docs/ui_api_delivery_loop.md](docs/ui_api_delivery_loop.md)** for wiring UI to APIs incrementally.

**Do not re-add** in-app Roadmap or Integrations tabs — roadmap lives in `docs/roadmap.md`; MCP is **Connect AI** in TopNav only.

## Questions

Use GitHub Issues for bugs and feature discussion. For design direction, reference **[docs/roadmap.md](docs/roadmap.md)** and **[docs/project_requirements.md](docs/project_requirements.md)**.
