/**
 * Paste-ready MCP configs for desktop IDEs (U70 / thin U91).
 * User runs the Go MCP server locally; no VVS account required.
 */

export function defaultLocalMcpUrl(): string {
  return (
    process.env.NEXT_PUBLIC_MCP_URL?.trim() ||
    `${process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:8080'}/mcp`
  );
}

/** Cursor / VS Code style mcp.json fragment */
export function buildCursorMcpConfig(mcpUrl: string = defaultLocalMcpUrl()): string {
  return JSON.stringify(
    {
      mcpServers: {
        vvs: {
          url: mcpUrl,
        },
      },
    },
    null,
    2
  );
}

/** Windsurf uses the same mcpServers URL shape as Cursor. */
export function buildWindsurfMcpConfig(mcpUrl: string = defaultLocalMcpUrl()): string {
  return buildCursorMcpConfig(mcpUrl);
}

/** Claude Desktop mcpServers entry (same URL shape as Cursor for HTTP MCP). */
export function buildClaudeDesktopMcpConfig(mcpUrl: string = defaultLocalMcpUrl()): string {
  return JSON.stringify(
    {
      mcpServers: {
        vvs: {
          url: mcpUrl,
        },
      },
    },
    null,
    2
  );
}

/** CLI one-liner hint — start Go API+MCP then point the IDE at the URL. */
export function buildLocalMcpCliHint(): string {
  return [
    '# Desktop only — start the Go server (includes /mcp), then paste an IDE config below.',
    '# From repo root (Windows): .\\start_app.ps1',
    '# Or: cd server && go run ./cmd/server',
    `# MCP URL: ${defaultLocalMcpUrl()}`,
  ].join('\n');
}

export type McpToolSafety = 'safe' | 'dangerous';

/** Static inventory aligned with `server/internal/transport/mcp/tools.go` (thin U91). */
export const MCP_TOOL_SUMMARIES: ReadonlyArray<{
  name: string;
  summary: string;
  safety: McpToolSafety;
}> = [
  { name: 'list_available_nodes', summary: 'List spawnable node kinds', safety: 'safe' },
  { name: 'list_syntax_packs', summary: 'List syntax packs', safety: 'safe' },
  { name: 'list_classes', summary: 'List project classes', safety: 'safe' },
  { name: 'get_graph', summary: 'Read a graph document', safety: 'safe' },
  { name: 'generate_code', summary: 'Transpile graph → source', safety: 'safe' },
  { name: 'run_rosetta_suite', summary: 'Run Rosetta pack fixtures', safety: 'safe' },
  { name: 'validate_generated_parse', summary: 'Parse-check generated code', safety: 'safe' },
  { name: 'propose_syntax_delta', summary: 'Propose pack delta', safety: 'safe' },
  { name: 'add_class', summary: 'Create a class symbol', safety: 'dangerous' },
  { name: 'add_node', summary: 'Add a node to a graph', safety: 'dangerous' },
  { name: 'remove_node', summary: 'Delete a graph node', safety: 'dangerous' },
  { name: 'connect_pins', summary: 'Wire two pins', safety: 'dangerous' },
  { name: 'save_project', summary: 'Persist project snapshot', safety: 'dangerous' },
];
