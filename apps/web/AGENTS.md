<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# In-page agent (hosted path)

The product agent is the TypeScript runtime in `src/lib/agent/`. `EditorLayout` mounts `AgentHost` (Worker starts with the editor). TopNav Bot button (tooltip **Agent**) opens `AgentPanel`. Writes use `agentAllowWrites` (default false). Do not treat Go MCP, Connect AI, or `localhost:8080` as the hosted path. Other apps / Cursor: later thin MCP wrapper over the same package; today optional local Go sidecar. See `docs/design/mcp_autonomy_audit.md` and `../../.agents/AGENTS.md`.
