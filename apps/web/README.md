# VVS Web App

Next.js frontend for Vision Visual Scripting. See **[../../docs/current_state.md](../../docs/current_state.md)** for what is implemented.

Part of the public **[VVS monorepo](../../README.md)** — vision and roadmap: [docs/vision.md](../../docs/vision.md), [docs/roadmap.md](../../docs/roadmap.md).

## Prerequisites

- [Bun](https://bun.sh) (package manager)
- Run `../../tools/setup_env.ps1` on Windows to install Bun/Go/Git

## Development

From the repo root:

```powershell
.\tools\start_app.ps1
```

Or from this directory:

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

**LAN access** (phone/tablet on same network): use the `Network:` URL printed by `bun run dev`. Set your machine IP in `apps/web/.env.local`:

```env
DEV_ALLOWED_ORIGIN=192.168.x.x
```

Restart the dev server after changing env. Use the IP URL consistently — `localStorage` is separate from `localhost`.

## Project layout (`src/`)

```text
src/
├── app/              # Next.js App Router (start screen + editor)
├── components/
│   ├── graph/        # React Flow nodes, edges, context menu
│   ├── layout/       # Editor shell (TopNav, AgentHost, AgentPanel, sidebars)
│   ├── start/        # Project start screen
│   └── views/        # LibraryView, ReferencesView
├── contexts/         # Project, graph edit, navigation, panels
├── hooks/            # Graph state, documents, tab sync, useAgentHost
├── lib/              # nodeCatalog, graphWiring, api, examples, agent/
├── styles/           # graph design tokens
└── types/            # graph, project, UI types (until packages/graph-types)
```

## UI shell

- **Canvas** — graph editor (default)
- **References** — read-only cross-graph reference viewer
- **Library** — templates, environments, and git imports (`/library` browse; editor Library tab on an open project)
- **Agent** — in-page TypeScript agent (`AgentHost` starts with the editor; TopNav Bot button opens `AgentPanel`). Live canvas is source of truth. Writes gated by `agentAllowWrites` (default false). Optional Go MCP sidecar paste is a collapsed section — not the hosted path.
- Persistence: `lib/api/` → `localStorage` (mock mode by default)

Agent rules: `AGENTS.md` and `../../.agents/skills/vvs_ui_development/SKILL.md`.

## Build

```bash
bun run build
bun run lint
```
