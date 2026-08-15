import { describe, expect, it } from 'bun:test';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { MCP_TOOL_SUMMARIES } from './mcpPasteConfig';

const REL = join('server', 'internal', 'transport', 'mcp', 'tools.go');

function resolveToolsGo(): string {
  const candidates = [
    join(import.meta.dir, '..', '..', '..', '..', REL),
    join(process.cwd(), REL),
    join(process.cwd(), '..', '..', REL),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`tools.go not found; tried: ${candidates.join(', ')}`);
}

function extractToolNames(source: string): string[] {
  const names: string[] = [];
  const re = /mcp\.NewTool\("([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    names.push(match[1]);
  }
  return names;
}

describe('MCP_TOOL_SUMMARIES inventory lock (U91)', () => {
  it('matches every mcp.NewTool name in tools.go', () => {
    const source = readFileSync(resolveToolsGo(), 'utf8');
    const goNames = new Set(extractToolNames(source));
    const uiNames = new Set(MCP_TOOL_SUMMARIES.map((tool) => tool.name));

    const missingInUi = [...goNames].filter((name) => !uiNames.has(name)).sort();
    const extraInUi = [...uiNames].filter((name) => !goNames.has(name)).sort();

    expect(missingInUi, 'tools.go names missing from MCP_TOOL_SUMMARIES').toEqual([]);
    expect(extraInUi, 'MCP_TOOL_SUMMARIES names not registered in tools.go').toEqual([]);
    expect(goNames.size).toBeGreaterThan(0);
  });
});
