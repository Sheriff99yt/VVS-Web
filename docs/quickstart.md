# Quickstart

Get the VVS editor running in a few minutes. First-time machine setup: **[setup.md](setup.md)**.

---

## Start the app

### Windows (recommended)

```powershell
# One-time setup (if you haven't already)
.\tools\setup_env.ps1

# Start frontend + Go server (API + MCP) in new windows
.\tools\start_app.ps1
```

### Manual (any OS)

```bash
# From repository root (installs apps/web + packages/*)
bun install
bun run dev
```

Or from `apps/web`:

```bash
cd apps/web
bun install          # first time only
bun run dev
```

Open **[http://localhost:3000](http://localhost:3000)**.

**Live preview (GitHub Pages):** [https://sheriff99yt.github.io/VVS-Web/](https://sheriff99yt.github.io/VVS-Web/) — static build; projects save to browser `localStorage` only (separate from localhost).

The terminal prints a **Network** URL for LAN access (e.g. `http://192.168.x.x:3000`). Requires `DEV_ALLOWED_ORIGIN` in `apps/web/.env.local` — `setup_env.ps1` creates this on Windows.

---

## First session (2 minutes)

1. **New project** — empty graph with an **On Start** event node  
2. **Examples → Calculator** — interactive demo (user input, To String, functions, events, branch)  
3. **Right-click canvas** — spawn nodes (Action, **Conversion**, Math, Variables, …)  
4. **Connect pins** — same-type wires only; use **To String** before Print for numbers  
5. **Generate** (TopNav) — validation + `@vvs/transpiler` code preview (Python, JS, C++, Verse)  
6. **Functions** — add in Project tree; spawn **Call {name}** from context menu  
7. **File → Save** — persists **ProjectSnapshot v2** to browser **localStorage**

Projects appear under **Recent projects** on the start screen.

---

## URLs & storage

| URL | Notes |
|-----|--------|
| `http://localhost:3000` | Default local dev |
| `http://192.168.x.x:3000` | Same machine or device on Wi‑Fi — needs `.env.local` |

**Important:** Projects saved on `localhost` are **not** visible on the LAN IP URL (and vice versa). Pick one and stick with it.

---

## Build check

```bash
cd apps/web
bun run build
bun run lint
```

---

## What works today vs planned

| Works now | Planned |
|-----------|---------|
| Graph editor, tabs, references view | Cloud sync |
| localStorage save/load | Production MCP auth / remote deploy |
| `@vvs/transpiler` — Python, JS, C++, Verse | JSON graph export as runnable code |
| Conversion nodes, Get User Input, pin validation | String concat, compare, loops |
| Start-screen examples (Hello World, Calculator) | Community library backend |
| Offline honest UI | WebSocket collaboration |
| Local Go API + MCP (`start_app.ps1`) | Supabase-backed persistence |

Details: **[current_state.md](current_state.md)** · Roadmap: **[roadmap.md](roadmap.md)**

---

## Stop dev servers

Close the PowerShell windows opened by `start_app.ps1`, or stop the `bun run dev` process (Ctrl+C).

---

## Going further

| Doc | Topic |
|-----|--------|
| [node_system.md](node_system.md) | Nodes, pins, conversion, property schema |
| [language_profiles.md](language_profiles.md) | Per-target portability |
| [setup.md](setup.md) | Toolchain, `.env.local`, git safety |
| [vision.md](vision.md) | Product direction |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | How to contribute |
| [ui_api_delivery_loop.md](ui_api_delivery_loop.md) | UI ↔ API workflow |
