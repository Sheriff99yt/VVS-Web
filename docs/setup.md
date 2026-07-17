# Setup Guide

One-time machine setup for developing VVS Web locally. For day-to-day commands after setup, see **[quickstart.md](quickstart.md)**.

---

## What you need

| Tool | Required | Purpose |
|------|----------|---------|
| [Bun](https://bun.sh) | Yes | Frontend package manager & dev server |
| [Git](https://git-scm.com/) | Yes | Clone, commit, contribute |
| [Go](https://go.dev/) 1.22+ | Optional | `server/` — project API, compile, registry, local MCP (`/mcp`) |

**OS:** Windows scripts live in `tools/`; macOS/Linux users can run the equivalent `bun` commands from `apps/web` (see [Quick start](#manual-setup-all-platforms)).

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
3. Create **`apps/web/.env.local`** from `.env.example` if missing (includes `NEXT_PUBLIC_API_MODE=http` for Go + MCP)
4. Auto-detect your **LAN IPv4** and set `DEV_ALLOWED_ORIGIN` (for phone/tablet testing)
5. Run **`go mod download`** in `server/` when Go is available

Restart your terminal if Bun or Go was just installed.

---

## Manual setup (all platforms)

```bash
# 1. Clone
git clone https://github.com/Sheriff99yt/VVS-Web.git
cd VVS-Web

# 2. Install JS dependencies (root workspaces — web + packages)
bun install

# 3. Local env (gitignored — copy template; includes http API + MCP defaults)
cp apps/web/.env.example apps/web/.env.local
# Edit DEV_ALLOWED_ORIGIN in .env.local if you use http://192.168.x.x:3000 on LAN

# 4. Go server (API + MCP — start_app.ps1 launches this on Windows)
cd server
go mod download
```

---

## Local environment files

| File | Committed? | Purpose |
|------|------------|---------|
| `apps/web/.env.example` | Yes | Template — safe placeholders only |
| `apps/web/.env.local` | **Never** | Your LAN IP, API URLs, local overrides |
| Root `.env.example` | Yes | Pointer / shared notes |

**Rule:** Never commit `.env.local` or real IP addresses. It is listed in `.gitignore`.

### LAN access (optional)

If you open the app via `http://YOUR_LAN_IP:3000` instead of `localhost`:

```env
# apps/web/.env.local
DEV_ALLOWED_ORIGIN=192.168.x.x
```

Restart `bun run dev` after changing env. Use **one URL consistently** — browser `localStorage` is per-origin (`localhost` ≠ LAN IP).

---

## Files excluded from Git

These must **not** be pushed to a public repo:

| Pattern | Why |
|---------|-----|
| `**/.env.local`, `.env.*` (except `.env.example`) | Machine-specific secrets & LAN IPs |
| `apps/web/.next/`, `node_modules/` | Build & install artifacts |
| `*.local.md`, `AGENTS.local.md` | Personal agent overrides |
| `.cursor/` | Local IDE state |
| `*.pem`, `*.log` | Certs & debug logs |

Before your first push:

```powershell
git status   # confirm .env.local is NOT listed
```

**Nested git repos:** If `apps/web` was initialized with its own `git init` (e.g. from `create-next-app`), remove `apps/web/.git` before the monorepo first commit. Otherwise Git records `apps/web` as a submodule gitlink and most web source files will **not** be uploaded.

---

## Publish to GitHub (maintainers)

Create a new public repo named **VVS-Web**, then from this project root:

```powershell
git remote remove origin   # only if origin points to a deleted or wrong repo
git remote add origin https://github.com/Sheriff99yt/VVS-Web.git
git push -u origin main
```

Or with GitHub CLI:

```powershell
gh repo create Sheriff99yt/VVS-Web --public --source=. --remote=origin --push
```

### Release channels (locked)

| Channel | How it updates | Artifact |
|---------|----------------|----------|
| **Live Pages** | Every green `main` push → `.github/workflows/pages.yml` | https://sheriff99yt.github.io/VVS-Web/ |
| **Current preview** | Same workflow, after deploy → floating tag `pre-release` | Showcase link in Releases + `vvs-web-pre-release.zip` |
| **Stable** | Push `v*` tag → `.github/workflows/release.yml` | Full GitHub Release + `vvs-web-vX.Y.Z.zip` |

**Cycle on every `main` push:** install (Bun **1.3.1** pinned) → `GITHUB_PAGES=true` static export → upload Pages artifact → deploy → force-move `pre-release` tag → create/edit the floating pre-release (CLI + retries; GitHub API 503s must not leave the sidebar stale forever).

**One-time Pages setup** (or deploy fails with **404 Not Found**):

1. **Settings → Pages → Build and deployment → Source:** **GitHub Actions**
2. Or via CLI: `gh api -X POST repos/Sheriff99yt/VVS-Web/pages -f build_type=workflow`

### Verify Pages build locally (before push)

Local `next build` can pass while CI fails when a package is only a **transitive** dependency (Turbopack resolves differently). Catch that before push:

```powershell
# From repository root — mirrors pages.yml build + dep lint
bun run pages:verify
```

That runs frozen install → web lint (`import/no-extraneous-dependencies`) → `GITHUB_PAGES=true` static export. Prefer a clean `node_modules` if you suspect hoisting hid a miss.

### GitHub Releases (versioned static zip)

CI runs on every push/PR (`.github/workflows/ci.yml`). **Stable** versioned downloads are separate: push a `v*` tag after `main` is green.

```powershell
git tag v0.2.0
git push origin v0.2.0
```

That runs `.github/workflows/release.yml`: full verify suite → Pages-compatible static build → **full** (non-pre) GitHub Release with `vvs-web-v0.2.0.zip`. You can also run **Actions → Release → Run workflow** and pass an existing tag.

No npm package required.

---

## Verify installation

```powershell
# From repository root
bun install
bun run build
bun test packages
```

Or from `apps/web` only:

```powershell
cd apps\web
bun run build
```

Expected: `✓ Compiled successfully` and static routes `/`, `/editor`.

Optional server check:

```powershell
cd server
go test ./...
go run ./cmd/vvs-server
# curl http://localhost:8080/health
# curl http://localhost:8080/registry/nodes
```

### Phase 2 — Postgres persistence (optional)

Local dev defaults to an **in-memory** project store (no database). To test **Postgres** persistence:

```powershell
# From repository root — Postgres + GoTrue auth gateway
docker compose up -d postgres gotrue auth-gateway
```

Set these env vars when starting the Go server (PowerShell example):

```powershell
$env:DATABASE_URL = "postgres://vvs:vvs_dev_password@localhost:5432/vvs?sslmode=disable"
$env:SUPABASE_JWT_SECRET = "super-secret-jwt-token-with-at-least-32-characters-long"
$env:AUTH_REQUIRED = "false"   # dev mode — uses DEV_USER_ID when no Bearer token
cd server
go run ./cmd/vvs-server
```

`GET /health` reports `"store": "postgres"` and `"auth": "dev"` when configured correctly.

To test **auth-required** mode (rejects unauthenticated API/MCP calls):

```powershell
$env:AUTH_REQUIRED = "true"
$env:SUPABASE_JWT_SECRET = "super-secret-jwt-token-with-at-least-32-characters-long"
# Bearer token must match GoTrue JWT secret above
```

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | No | Postgres connection string; omit for in-memory store |
| `AUTH_REQUIRED` | No | `true` = reject requests without valid JWT; default `false` |
| `SUPABASE_JWT_SECRET` | When `AUTH_REQUIRED=true` or Bearer tokens present | HS256 secret — **must match** GoTrue `GOTRUE_JWT_SECRET` in docker-compose |
| `DEV_USER_ID` | No | UUID used when `AUTH_REQUIRED=false` and no Bearer token (default: fixed dev UUID) |

### Phase 2 — Supabase Auth (GoTrue, optional)

Minimal self-hosted auth for local/VPS dev (Postgres + GoTrue + nginx `/auth/v1` gateway):

```powershell
docker compose up -d postgres gotrue auth-gateway
```

Add to `apps/web/.env.local` (see `.env.example` for the standard dev anon key):

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

GoTrue dev settings (in `docker-compose.yml`):

- `GOTRUE_MAILER_AUTOCONFIRM=true` — email sign-up works without SMTP
- `GOTRUE_JWT_SECRET` — must match Go server `SUPABASE_JWT_SECRET`

**GitHub OAuth (optional v1):** create a GitHub OAuth app with callback `http://localhost:54321/auth/v1/callback`, then:

```powershell
$env:GOTRUE_EXTERNAL_GITHUB_ENABLED = "true"
$env:GOTRUE_GITHUB_CLIENT_ID = "your-client-id"
$env:GOTRUE_GITHUB_CLIENT_SECRET = "your-client-secret"
docker compose up -d gotrue auth-gateway
```

In `apps/web/.env.local`: `NEXT_PUBLIC_GITHUB_OAUTH_ENABLED=true`

Without GitHub env vars, **email/password auth works** for v1.

Frontend: set `NEXT_PUBLIC_API_MODE=http` in `apps/web/.env.local`. Sign in via **AuthButton** (TopNav); the access token is stored in `session.ts` and sent as `Authorization: Bearer …` on project APIs and MCP probe. When signed in, the editor loads/saves via Go API first (Postgres) with localStorage as cache.

Production MCP: set `NEXT_PUBLIC_MCP_URL=https://api.your-domain/mcp` and pass the same Bearer token in your IDE MCP config when `AUTH_REQUIRED=true`.

### Connect Cursor (or Claude) to local MCP

1. Start the Go server: `.\tools\start_app.ps1` (or `go run ./cmd/vvs-server` from `server/`)
2. Copy `tools/mcp.cursor.example.json` to `.cursor/mcp.json` in the repo root (or merge the `VVS` entry into `%USERPROFILE%\.cursor\mcp.json`)
3. Reload Cursor (**Settings → MCP** or restart the IDE)
4. MCP URL: `http://localhost:8080/mcp` — no auth token for local Phase 1 dev

Available tools: `list_available_nodes`, `list_syntax_packs`, `get_graph`, `add_node`, `remove_node`, `connect_pins`, `generate_code`, `save_project`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| WebSocket HMR errors on LAN IP | Set `DEV_ALLOWED_ORIGIN` in `.env.local`, restart dev server |
| Clicks do nothing on LAN URL | Same as above; hard-refresh browser |
| No projects on LAN URL | Create projects on that URL — storage is separate from `localhost` |
| `bun` not found after install | Restart terminal; ensure `~/.bun/bin` is on PATH |
| Port 3000 in use | Stop other `next dev` processes or use another port |

---

## Next

→ **[quickstart.md](quickstart.md)** — start the app and open your first graph  
→ **[deployment.md](deployment.md)** — legacy self-host notes (not product direction; client-first / no dedicated server)
