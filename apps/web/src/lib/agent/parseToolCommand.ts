export interface ParsedToolCommand {
  name: string;
  args: Record<string, unknown>;
}

export function parseToolCommand(input: string): ParsedToolCommand | { error: string } | null {
  const trimmed = input.trim();
  const match = trimmed.match(/^\/tool\s+(\S+)(?:\s+([\s\S]+))?$/);
  if (!match) return null;
  const name = match[1] ?? '';
  const rawArgs = match[2]?.trim();
  if (!name) return { error: 'Usage: /tool <name> {json}' };
  if (!rawArgs) return { name, args: {} };
  try {
    const parsed = JSON.parse(rawArgs) as unknown;
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { error: 'Tool arguments must be a JSON object' };
    }
    return { name, args: parsed as Record<string, unknown> };
  } catch {
    return { error: 'Invalid JSON after /tool name' };
  }
}
