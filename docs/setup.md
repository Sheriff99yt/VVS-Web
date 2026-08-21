# Setup Guide

One-time machine setup for developing VVS Web locally. For day-to-day commands after setup, see **[quickstart.md](quickstart.md)**.

**Product path:** GitHub Pages plus a local folder / `.vvs/` / git. No VVS account. No dedicated app server. Postgres, GoTrue, and library upload are a **frozen experiment**, not a first-time step. Skip them.

---

## Try it without installing

**Live editor:** [https://sheriff99yt.github.io/VVS-Web/](https://sheriff99yt.github.io/VVS-Web/)

Static GitHub Pages build. Projects save to browser `localStorage` only. Versioned zips live on [Releases](https://github.com/Sheriff99yt/VVS-Web/releases).

---

## What you need (local)

| Tool | Required | Purpose |
|------|----------|---------|
| [Bun](https://bun.sh) | Yes | Frontend package manager and dev server |
| [Git](https://git-scm.com/) | Yes | Clone, commit, contribute |
| [Go](https://go.dev/) 1.22+ | Optional | `server/` - local MCP sidecar only. Hosted agent is in-page TypeScript. Go is not required |

**OS:** Windows scripts live in `tools/`. macOS/Linux users can run the equivalent `bun` commands from `apps/web` (see [Manual setup](#manual-setup-all-platforms)).

---

## Automated setup (Windows)

From the repository root:

```powershell
git clone https://github.com/Sheriff99yt/VVS-Web.git
cd VVS-Web
.\tools\setup_env.ps1
```

The script will:

1. Install or verify **Bun**, **Go** (optional), and **Git**
2. Run **`bun install`** at the **repository root** (Bun workspaces: `apps/web` + `packages/*`)
3. Create **`apps/web/.env.local`** from `.env.example` if missing (includes optional `NEXT_PUBLIC_API_MODE=http` for Go sidecar experiments)
4. Auto-detect your **LAN IPv4** and set `DEV_ALLOWED_ORIGIN` (for phone/tablet testing)
5. Run **`go mod download`** in `server/` when Go is available

Restart your terminal if Bun or Go was just installed.

Then start the editor: `.\tools\start_app.ps1`. Open [http://localhost:3000](http://localhost:3000). Create a project in the browser or in a folder (`.vvs/`).

---

## Manual setup (all platforms)

```bash
# 1. Clone
git clone https://github.com/Sheriff99yt/VVS-Web.git
cd VVS-Web

# 2. Install JS dependencies (root workspaces - web + packages)
bun install

# 3. Local env (gitignored - copy template)
cp apps/web/.env.example apps/web/.env.local
# Edit DEV_ALLOWED_ORIGIN in .env.local if you use http://192.168.x.x:3000 on LAN

# 4. Optional Go sidecar (API + local MCP - start_app.ps1 launches this on Windows)
cd server
go mod download
```

---

## Local environment files

| File | Committed? | Purpose |
|------|------------|---------|
| `apps/web/.env.example` | Yes | Template - safe placeholders only |
| `apps/web/.env.local` | **Never** | Your LAN IP, optional sidecar URLs, local overrides |
| Root `.env.example` | Yes | Pointer / shared notes |

**Rule:** Never commit `.env.local` or real IP addresses. It is listed in `.gitignore`.

Supabase / GoTrue keys in `.env.example` belong to the **frozen experiment** below. Leave them unset for normal product work.

### LAN access (optional)

If you open the app via `http://YOUR_LAN_IP:3000` instead of `localhost`:

```env
# apps/web/.env.local
DEV_ALLOWED_ORIGIN=192.168.x.x
```

Restart `bun run dev` after changing env. Use **one URL consistently** - browser `localStorage` is per-origin (`localhost` is not the LAN IP).

---
## Files excluded from Git

These must **not** appear in a public repo:

| Pattern | Why |
|---------|-----|
| `**/.env.local`, `.env.*` (except `.env.example`) | Machine-specific secrets and LAN IPs |
| `apps/web/.next/`, `node_modules/` | Build and install artifacts |
| `*.local.md`, `AGENTS.local.md` | Personal agent overrides |
| `.cursor/` | Local IDE state |
| `*.pem`, `*.log` | Certs and debug logs |

Before your first contribution, run `git status` and confirm `.env.local` is not listed.

**Nested git repos:** If `apps/web` was initialized with its own `git init` (for example from `create-next-app`), remove `apps/web/.git` before the monorepo first commit. Otherwise Git records `apps/web` as a submodule gitlink and most web source files will **not** be uploaded.

---

## Publish to GitHub (maintainers)

Maintainers publish this repo as a public GitHub project. The live site and zips come from workflows, not from a first-time contributor step.

### Release channels (locked)

| Channel | How it updates | Artifact |
|---------|----------------|----------|
| **Live Pages** | Green main build via `.github/workflows/pages.yml` | https://sheriff99yt.github.io/VVS-Web/ |
| **Current preview** | Same workflow, floating tag `pre-release` | Showcase link in Releases plus zip |
| **Stable** | SemVer `v*` tag via `.github/workflows/release.yml` | Full GitHub Release zip |

Cycle on a green main build: install (Bun **1.3.1** pinned), `GITHUB_PAGES=true` static export, upload Pages artifact, deploy, move `pre-release` tag, edit the floating pre-release.

One-time Pages setup if deploy returns 404: Settings, Pages, Build and deployment, Source = GitHub Actions.

### Verify the static export locally

From the repository root, the `pages:verify` script mirrors the Pages workflow (frozen install, web lint, static export).

## Verify installation

From the repository root run the workspace install, then the web build, then the package tests. From apps/web you can run the web build alone. Expect a successful compile and the `/` and `/editor` routes.

---

## In-page agent (hosted path)

The GitHub Pages / editor agent is the in-page TypeScript runtime. Open a project, then the TopNav Bot button (tooltip Agent). No Go install is required.

- Prompt plus optional local LLM key / base / model in localStorage key `vvs:agent-llm` (default OpenAI-compatible base plus `gpt-4o-mini`)
- `/tool name json` works without a key
- Writes gated by Allow agent writes (`agentAllowWrites`, default false)
- StatusBar: Agent ready / Agent error
- Tools: `list_available_nodes`, `list_syntax_packs`, `list_classes`, `get_graph`, `generate_code`, `add_class`, `add_node`, `remove_node`, `connect_pins` (`add_node` refuses leftover kinds)
- `window.vvs.agent` / `window.vvs.tools`: `listTools()`, `callTool(name, args)`

No remote hosted MCP URL. No Chrome DevTools bridge. No in-page chat on the start screen.

---

## Optional Go MCP sidecar

Not the hosted path. Local experiment only. The Agent panel keeps a collapsed sidecar section for paste-config. The in-page write checkbox does not reach the Go server; set `VVS_MCP_ALLOW_WRITE` on that process.

There is no product hosted MCP URL. Library auth / upload is frozen. Do not treat AuthButton, GoTrue, or an upload form as current setup.

Start the optional sidecar with the Windows start script, or run the server command from `server/`. Copy `tools/mcp.cursor.example.json` into a local Cursor MCP config. Sidecar URL is localhost port 8080 path `/mcp`.

Sidecar tools include the same graph tools as the TS runtime, plus pack tools that are not in the hosted agent (`propose_syntax_delta`, `run_rosetta_suite`, `validate_generated_parse`). Frontend HTTP experiments use `NEXT_PUBLIC_API_MODE=http` in `.env.local`. That is not a product account.

---

## Frozen experiment (not product)

Postgres persistence, GoTrue / Supabase Auth, GitHub OAuth, and library upload were a Phase 2 experiment. They are not the product path and not a first-time step. Library auth / upload stays frozen. Leave `DATABASE_URL`, `AUTH_REQUIRED`, `SUPABASE_JWT_SECRET`, and `NEXT_PUBLIC_SUPABASE_*` unset unless you are deliberately opening that leftover.

The compose file can still start those leftover services for a local experiment. That is not product setup. A health response that reports a postgres store means the experiment store is on, not that VVS has accounts. See [deployment.md](deployment.md) for leftover self-host notes.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| WebSocket HMR errors on LAN IP | Set `DEV_ALLOWED_ORIGIN` in `.env.local`, restart the dev server |
| Clicks do nothing on LAN URL | Same as above; hard-refresh the browser |
| No projects on LAN URL | Create projects on that URL. Storage is separate from localhost |
| `bun` not found after install | Restart the terminal; ensure the Bun bin directory is on PATH |
| Port 3000 in use | Stop other Next dev processes or use another port |

---

## Next

- **[quickstart.md](quickstart.md)** - start the app and open your first graph
- **[deployment.md](deployment.md)** - leftover self-host notes (not product direction; client-first / no dedicated server)
