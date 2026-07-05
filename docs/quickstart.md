# Quickstart

Get the VVS editor running in a few minutes. First-time machine setup: **[setup.md](setup.md)**.

---

## Start the app

### Windows (recommended)

```powershell
# One-time setup (if you haven't already)
.\tools\setup_env.ps1

# Start frontend + optional Go server in new windows
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
2. **Examples → Game Session** — multi-graph demo (variables, functions, branching)  
3. **Right-click canvas** — spawn nodes from the context menu  
4. **Connect pins** — drag from output to input (execution + data wires)  
5. **Generate** (TopNav) — runs validation + `@vvs/transpiler` code preview  
6. **Functions** — add in Project tree; inspect overloads; spawn **Call {name}** from context menu  
7. **File → Save** — persists **ProjectSnapshot v2** to browser **localStorage** (offline mock mode)

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
| Graph editor, tabs, references view | Real transpiler output |
| localStorage save/load | Cloud sync |
| Mock codegen preview | Python, JS, C++, Verse emitters |
| Offline honest UI | MCP connect, Go API |

Details: **[current_state.md](current_state.md)** · Roadmap: **[roadmap.md](roadmap.md)**

---

## Stop dev servers

Close the PowerShell windows opened by `start_app.ps1`, or stop the `bun run dev` process (Ctrl+C).

---

## Going further

| Doc | Topic |
|-----|--------|
| [setup.md](setup.md) | Toolchain, `.env.local`, git safety |
| [vision.md](vision.md) | Product direction |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | How to contribute |
| [ui_api_delivery_loop.md](ui_api_delivery_loop.md) | UI ↔ API workflow |
