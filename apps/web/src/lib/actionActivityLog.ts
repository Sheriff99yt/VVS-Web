/**
 * Project / canvas activity feed for Output → Activity and compact action lines.
 * Rapid same-group actions coalesce into one updating entry.
 */

export type ActivityKind =
  | 'save'
  | 'generate'
  | 'import'
  | 'export'
  | 'navigate'
  | 'undo'
  | 'redo'
  | 'select'
  | 'settings'
  | 'other';

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  label: string;
  at: number;
  /** Coalesce key — same group within the window updates this entry. */
  group?: string;
  /** How many actions were merged into this row (1 = single). */
  count: number;
}

export interface LogActivityOptions {
  /**
   * When the newest entry shares this group and is still within `coalesceMs`,
   * replace its label / bump count instead of pushing a new row.
   */
  group?: string;
  /** Default 1600ms. */
  coalesceMs?: number;
}

/** Shared groups for small / repeated canvas actions. */
export const ACTIVITY_GROUP = {
  selection: 'selection',
  wire: 'wire',
  clipboard: 'clipboard',
  undo: 'undo',
  redo: 'redo',
} as const;

const MAX_ENTRIES = 80;
const DEFAULT_COALESCE_MS = 1600;

let entries: ActivityEntry[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function logActivity(
  kind: ActivityKind,
  label: string,
  options?: LogActivityOptions
): void {
  const now = Date.now();
  const group = options?.group;
  const coalesceMs = options?.coalesceMs ?? DEFAULT_COALESCE_MS;
  const head = entries[0];

  if (
    group &&
    head?.group === group &&
    now - head.at <= coalesceMs
  ) {
    entries = [
      {
        ...head,
        kind,
        label,
        at: now,
        count: head.count + 1,
      },
      ...entries.slice(1),
    ];
    notify();
    return;
  }

  entries = [
    {
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      kind,
      label,
      at: now,
      group,
      count: 1,
    },
    ...entries,
  ].slice(0, MAX_ENTRIES);
  notify();
}

export function formatActivityLabel(entry: ActivityEntry): string {
  // Selection labels already carry the live node count — skip ×N.
  if (entry.count <= 1 || entry.kind === 'select') return entry.label;
  return `${entry.label} · ×${entry.count}`;
}

export function getActivityEntries(): readonly ActivityEntry[] {
  return entries;
}

export function subscribeActivity(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clearActivityLog(): void {
  entries = [];
  notify();
}

export function selectionActivityLabel(nodeCount: number): string {
  if (nodeCount <= 0) return 'Cleared selection';
  if (nodeCount === 1) return 'Selected 1 node';
  return `Selected ${nodeCount} nodes`;
}
