/**
 * Paste-ready MCP configs for desktop IDEs (U70).
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
