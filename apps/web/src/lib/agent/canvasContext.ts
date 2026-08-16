import type { ProjectSnapshot } from '@vvs/graph-types';
import type { AgentTranscriptItem } from './agentStatusStore';
import type { AgentChatMessage } from './protocol';

const MAX_HISTORY_TURNS = 10;
const MAX_CONTEXT_NODES = 48;

export interface CanvasContextOptions {
  allowWrites?: boolean;
}

function nodeTitle(node: { data?: { label?: string; kindId?: string } }): string {
  const label = typeof node.data?.label === 'string' ? node.data.label.trim() : '';
  const kind = typeof node.data?.kindId === 'string' ? node.data.kindId : '';
  if (label && kind && label !== kind) return `${kind} "${label}"`;
  return kind || label || 'node';
}

/** Compact live-canvas summary for the worker system prompt (every run). */
export function buildCanvasContext(
  snapshot: ProjectSnapshot,
  options?: CanvasContextOptions
): string {
  const allowWrites = options?.allowWrites === true;
  const activeTab = snapshot.activeGraphTab || '(none)';
  const openTabs =
    snapshot.openTabs.length > 0
      ? snapshot.openTabs.map((tab) => `${tab.id}${tab.name ? ` (${tab.name})` : ''}`).join(', ')
      : '(none)';
  const classes =
    snapshot.classes.length > 0
      ? snapshot.classes.map((cls) => cls.name || cls.id).join(', ')
      : '(none)';
  const doc = snapshot.documents[snapshot.activeGraphTab];
  const nodes = doc?.nodes ?? [];
  const nodeLines = nodes.slice(0, MAX_CONTEXT_NODES).map((node) => `- ${node.id} ${nodeTitle(node)}`);
  if (nodes.length > MAX_CONTEXT_NODES) {
    nodeLines.push(`- … ${nodes.length - MAX_CONTEXT_NODES} more`);
  }

  return [
    'Live canvas context (source of truth for this run):',
    `module: ${snapshot.projectDetails.moduleName || '(unnamed)'}`,
    `language: ${snapshot.targetLanguage}`,
    `activeTab: ${activeTab}`,
    `openTabs: ${openTabs}`,
    `classes: ${classes}`,
    `writes: ${allowWrites ? 'on' : 'off'}`,
    nodes.length > 0
      ? `activeGraphNodes (${nodes.length}):`
      : 'activeGraphNodes: (none)',
    ...nodeLines,
  ].join('\n');
}

/**
 * Last ~10 user/assistant transcript turns for follow-ups.
 * Skips tool rows (raw JSON). Callers that include a tool breadcrumb should
 * truncate that text to 500 chars before appending.
 */
export function buildAgentHistory(
  items: AgentTranscriptItem[],
  options?: { limit?: number }
): AgentChatMessage[] {
  const limit = options?.limit ?? MAX_HISTORY_TURNS;
  const history: AgentChatMessage[] = [];
  let turns = 0;
  for (let i = items.length - 1; i >= 0 && turns < limit; i -= 1) {
    const item = items[i];
    if (!item) continue;
    if (item.role === 'user' || item.role === 'assistant') {
      history.push({ role: item.role, content: item.text });
      turns += 1;
    }
  }
  return history.reverse();
}
