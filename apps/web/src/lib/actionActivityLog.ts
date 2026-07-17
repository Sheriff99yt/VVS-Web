export type ActivityKind =
  | 'save'
  | 'generate'
  | 'import'
  | 'export'
  | 'navigate'
  | 'undo'
  | 'redo'
  | 'settings'
  | 'other';

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  label: string;
  at: number;
}

const MAX_ENTRIES = 80;
let entries: ActivityEntry[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function logActivity(kind: ActivityKind, label: string): void {
  entries = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind,
      label,
      at: Date.now(),
    },
    ...entries,
  ].slice(0, MAX_ENTRIES);
  notify();
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
