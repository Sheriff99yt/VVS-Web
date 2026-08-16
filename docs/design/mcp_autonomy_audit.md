# Agent autonomy audit (U91 follow-on)

**Hosted path (GitHub Pages / editor):** in-page TypeScript agent. Live canvas is the source of truth. No Cursor, Go, or extra install required. The Worker starts with the editor (`AgentHost` in `EditorLayout`).

**Other apps / Cursor:** later thin MCP wrapper over the same TS package. Today: optional localhost Go sidecar (`vvs-server` on `:8080`). Not the hosted product path. No remote hosted MCP URL.

## Write gates (honest)

| Layer | What it is | What it is not |
|-------|------------|----------------|
| UI `agentAllowWrites` | Real in-page write gate (Agent panel, default **false**) | A Go/MCP switch |
| UI `mcpAllowDangerousTools` | Sidecar paste-config checkbox only | A server switch — **does not** reach Go |
| Server `VVS_MCP_ALLOW_WRITE` | Real gate for optional Go sidecar writes (`EnsureWritePermission`) | Wired to the in-page checkbox |

Do **not** treat U91 `mcpActivityStore` or the Go checkbox as working dual consent. StatusBar shows **Agent ready** / **Agent error** / **Agent…** from `agentStatusStore`, not fake **MCP Ready**.

## In-page tools (shipped)

Same names as Go MCP where they map. Runtime: `apps/web/src/lib/agent/`.

| Tool | Safety | Summary |
|------|--------|---------|
| `list_available_nodes` | safe | List spawnable node kinds (leftover kinds hidden) |
| `list_syntax_packs` | safe | List syntax pack catalog |
| `list_classes` | safe | List project classes |
| `get_graph` | safe | Read a live canvas graph |
| `generate_code` | safe | Transpile live snapshot (emit, not execute) |
| `add_class` | write | Create a class with entry bootstrap |
| `add_node` | write | Spawn a registry kind; leftover kinds refused |
| `remove_node` | write | Delete a graph node |
| `connect_pins` | write | Wire two pins |

`add_node` refuses leftover kinds (`SPAWN_EXCLUDED_KINDS` / `LEFTOVER_UNSPAWNABLE_KINDS`).
`/tool name json` works without an LLM key.
Optional chat: local LLM key/base/model in `localStorage` key `vvs:agent-llm` (default `https://api.openai.com/v1` + `gpt-4o-mini`).
`window.vvs.agent` / `window.vvs.tools`: `listTools()`, `callTool(name, args)`.

## Not in the TypeScript runtime (deferred — do not invent as shipped)

- `save_project`, `run_rosetta_suite`, `validate_generated_parse`, `propose_syntax_delta`
- Streamable HTTP
- MCP wrapper for other apps over the same TS package
- Live-tab control without the editor open
- Chrome DevTools bridge
- In-page chat on StartScreen
- Product accounts / Community library

## Optional Go sidecar

`server/` still exposes SSE `/mcp` for local experiments.

1. From repo root: `.\tools\start_app.ps1`
2. Or: `cd server && go run ./cmd/vvs-server`
3. Agent panel → collapsed **sidecar** section — paste Cursor / VS Code / Windsurf / Claude Desktop config.

Default sidecar URL: `http://localhost:8080/mcp`. Writes still require `VVS_MCP_ALLOW_WRITE`. The in-page `mcpAllowDangerousTools` checkbox does **not** set that env.

## Not in scope

- Hosted MCP URL as a product
- Live Play / runner from the agent
- Silent writes (`agentAllowWrites` default false)
