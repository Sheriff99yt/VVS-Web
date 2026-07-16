/** Canonical keyboard shortcuts for the graph editor and related chrome. */

export type GraphShortcutId =
  | 'delete'
  | 'duplicate'
  | 'group-comment'
  | 'ungroup-comment'
  | 'copy'
  | 'cut'
  | 'paste'
  | 'undo'
  | 'redo'
  | 'focus-selection'
  | 'zoom-fit'
  | 'disconnect'
  | 'spawn-menu'
  | 'node-search'
  | 'toggle-log-pin'
  | 'extract-function'
  | 'select-all'
  | 'select-similar'
  | 'save-project'
  | 'compile'
  | 'sync-preview'
  | 'help';

export interface GraphShortcutDef {
  id: GraphShortcutId;
  label: string;
  /** Windows / Linux display */
  keysWin: string;
  /** macOS display (optional override) */
  keysMac?: string;
  /** Shown in canvas help sheet */
  section: 'canvas' | 'project';
}

export const GRAPH_SHORTCUTS: GraphShortcutDef[] = [
  { id: 'delete', label: 'Delete selection', keysWin: 'Delete', section: 'canvas' },
  { id: 'duplicate', label: 'Duplicate selection', keysWin: 'Ctrl+D', keysMac: '⌘D', section: 'canvas' },
  { id: 'select-all', label: 'Select all nodes', keysWin: 'Ctrl+A', keysMac: '⌘A', section: 'canvas' },
  {
    id: 'select-similar',
    label: 'Select similar nodes',
    keysWin: 'Ctrl+Shift+A',
    keysMac: '⌘⇧A',
    section: 'canvas',
  },
  { id: 'group-comment', label: 'Group in comment', keysWin: 'Ctrl+Shift+G', keysMac: '⌘⇧G', section: 'canvas' },
  { id: 'ungroup-comment', label: 'Ungroup from comment', keysWin: 'Ctrl+Shift+U', keysMac: '⌘⇧U', section: 'canvas' },
  { id: 'disconnect', label: 'Disconnect wires', keysWin: 'Alt+D', keysMac: '⌥D', section: 'canvas' },
  { id: 'copy', label: 'Copy', keysWin: 'Ctrl+C', keysMac: '⌘C', section: 'canvas' },
  { id: 'cut', label: 'Cut', keysWin: 'Ctrl+X', keysMac: '⌘X', section: 'canvas' },
  { id: 'paste', label: 'Paste', keysWin: 'Ctrl+V', keysMac: '⌘V', section: 'canvas' },
  { id: 'undo', label: 'Undo', keysWin: 'Ctrl+Z', keysMac: '⌘Z', section: 'canvas' },
  { id: 'redo', label: 'Redo', keysWin: 'Ctrl+Shift+Z', keysMac: '⌘⇧Z', section: 'canvas' },
  { id: 'focus-selection', label: 'Frame selection / fit all', keysWin: 'F', section: 'canvas' },
  { id: 'zoom-fit', label: 'Zoom to fit all', keysWin: '', section: 'canvas' },
  { id: 'spawn-menu', label: 'Spawn node menu', keysWin: 'Right-click', section: 'canvas' },
  { id: 'node-search', label: 'Search nodes', keysWin: 'Space', keysMac: 'Space', section: 'canvas' },
  { id: 'toggle-log-pin', label: 'Pin / unpin log', keysWin: '`', section: 'canvas' },
  { id: 'extract-function', label: 'Extract to function', keysWin: 'Ctrl+Shift+E', keysMac: '⌘⇧E', section: 'canvas' },
  { id: 'help', label: 'Keyboard shortcuts', keysWin: '?', section: 'canvas' },
  { id: 'save-project', label: 'Save project', keysWin: 'Ctrl+S', keysMac: '⌘S', section: 'project' },
  { id: 'compile', label: 'Generate', keysWin: 'Ctrl+G', keysMac: '⌘G', section: 'project' },
  { id: 'sync-preview', label: 'Sync code preview', keysWin: 'Ctrl+Shift+S', keysMac: '⌘⇧S', section: 'project' },
];

const shortcutById = new Map(GRAPH_SHORTCUTS.map((s) => [s.id, s]));

export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

/** Platform-aware key chord, e.g. "Ctrl+D" or "⌘D". */
export function shortcutKeys(id: GraphShortcutId): string {
  const def = shortcutById.get(id);
  if (!def) return '';
  return isMacPlatform() ? (def.keysMac ?? def.keysWin.replace(/Ctrl\+/g, '⌘')) : def.keysWin;
}

/** Tooltip / menu label, e.g. "Duplicate (Ctrl+D)" */
export function shortcutTitle(id: GraphShortcutId): string {
  const def = shortcutById.get(id);
  if (!def) return '';
  const keys = shortcutKeys(id);
  return keys ? `${def.label} (${keys})` : def.label;
}

/** Append shortcut to a custom label, e.g. withShortcut('Pin log', 'toggle-log-pin'). */
export function withShortcut(label: string, id: GraphShortcutId): string {
  const keys = shortcutKeys(id);
  return keys ? `${label} (${keys})` : label;
}

export function shortcutsForSection(section: GraphShortcutDef['section']): GraphShortcutDef[] {
  return GRAPH_SHORTCUTS.filter((s) => s.section === section && Boolean(s.keysWin));
}

export function isTypingTarget(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}
