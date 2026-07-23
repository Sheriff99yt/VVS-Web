/**
 * Real-time MCP Activity Event Bus & Store
 * Tracks external AI agent tool invocations (Cursor, Windsurf, Claude Desktop)
 */

export interface McpActivityItem {
  id: string;
  toolName: string;
  kind: 'read' | 'write';
  timestamp: string;
  status: 'executing' | 'success' | 'error' | 'blocked';
  summary?: string;
}

type ActivityListener = (items: McpActivityItem[]) => void;

let activityLog: McpActivityItem[] = [];
const listeners: Set<ActivityListener> = new Set();

export function getMcpActivityLog(): McpActivityItem[] {
  return [...activityLog];
}

export function logMcpActivity(item: Omit<McpActivityItem, 'id' | 'timestamp'>): void {
  const fullItem: McpActivityItem = {
    ...item,
    id: `mcp-act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toLocaleTimeString(),
  };

  activityLog = [fullItem, ...activityLog].slice(0, 50); // Keep last 50
  listeners.forEach((fn) => fn(activityLog));
}

export function subscribeMcpActivity(fn: ActivityListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
