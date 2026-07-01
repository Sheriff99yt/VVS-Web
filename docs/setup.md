# Setup Guide

One-time machine setup for developing VVS Web locally. For day-to-day commands after setup, see **[quickstart.md](quickstart.md)**.

---

## What you need

| Tool | Required | Purpose |
|------|----------|---------|
| [Bun](https://bun.sh) | Yes | Frontend package manager & dev server |
| [Git](https://git-scm.com/) | Yes | Clone, commit, contribute |
| [Go](https://go.dev/) 1.22+ | Optional | `server/` skeleton (`GET /health` only today) |

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
2. Run **`bun install`** in `apps/web`
3. Create **`apps/web/.env.local`** from `.env.example` if missing
4. Auto-detect your **LAN IPv4** and set `DEV_ALLOWED_ORIGIN` (for phone/tablet testing)
5. Run **`go mod download`** in `server/` when Go is available

Restart your terminal if Bun or Go was just installed.

---

## Manual setup (all platforms)

```bash
# 1. Clone
git clone https://github.com/Sheriff99yt/VVS-Web.git
cd VVS-Web/apps/web

# 2. Install JS dependencies
bun install

# 3. Local env (gitignored — copy template)
cp .env.example .env.local
# Edit .env.local — set DEV_ALLOWED_ORIGIN to your LAN IP if you use http://192.168.x.x:3000

# 4. Optional Go server
cd ../../server
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

---

## Verify installation

```powershell
cd apps\web
bun run build
```

Expected: `✓ Compiled successfully` and static routes `/`, `/editor`.

Optional server check:

```powershell
cd server
go build ./...
go run ./cmd/vvs-server
# curl http://localhost:8080/health
```

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
