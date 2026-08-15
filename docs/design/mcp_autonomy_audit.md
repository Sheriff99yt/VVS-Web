# MCP autonomy audit (U91)

Local MCP only. No VVS account. Client-first: the editor pastes an IDE config; the Go process on this machine is the server.

## Dual consent

| Layer | What it is | What it is not |
|-------|------------|----------------|
| UI `mcpAllowDangerousTools` | Editor intent (Connect AI checkbox, off by default) | A server switch |
| Server `VVS_MCP_ALLOW_WRITE` | The real gate (`EnsureWritePermission` in `consent.go`) | Optional once the checkbox is on |

Accepted env values: `1`, `true`, `yes` (case-insensitive `TRUE` also accepted). Writes fail without the env even if the checkbox is on.

## Safe vs dangerous

- **Safe** — read / generate / validate. No graph mutate, no persist.
- **Dangerous** — `add_class`, `add_node`, `remove_node`, `connect_pins`, `save_project`.
- **Generate is emit, not execute.** Agents cannot run generated code. `generate_code` returns transpiled source from the stored snapshot.

`propose_syntax_delta` is classified **safe** in the UI inventory (propose / format). The Go handler also calls `EnsureWritePermission` today.

## Inventory

Aligned with `MCP_TOOL_SUMMARIES` and `server/internal/transport/mcp/tools.go`. Regression: `apps/web/src/lib/mcpPasteConfig.test.ts`.

| Tool | Safety | Summary |
|------|--------|---------|
| `list_available_nodes` | safe | List spawnable node kinds |
| `list_syntax_packs` | safe | List syntax packs |
| `list_classes` | safe | List project classes |
| `get_graph` | safe | Read a graph document |
| `generate_code` | safe | Transpile graph → source |
| `run_rosetta_suite` | safe | Run Rosetta pack fixtures |
| `validate_generated_parse` | safe | Parse-check generated code |
| `propose_syntax_delta` | safe | Propose pack delta |
| `add_class` | dangerous | Create a class symbol |
| `add_node` | dangerous | Add a node to a graph |
| `remove_node` | dangerous | Delete a graph node |
| `connect_pins` | dangerous | Wire two pins |
| `save_project` | dangerous | Persist project snapshot |

## How to start

1. From repo root: `.\start_app.ps1` (see `tools/start_app.ps1`).
2. Or: `cd server && go run ./cmd/server`.
3. Open **Connect AI (MCP)** in the editor and paste Cursor / VS Code / Windsurf / Claude Desktop config (same `mcpServers.vvs.url` JSON).

Default MCP URL: `http://localhost:8080/mcp`.

## Not in scope

- Hosted MCP as a product
- Live Play / runner from MCP
- Silent writes (no env, no prompt, no checkbox)
