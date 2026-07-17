/** Canonical keyboard shortcuts for the graph editor and related chrome. */

export type GraphShortcutId =
  | 'delete'
  | 'duplicate'
  | 'group-comment'
  | 'ungroup-comment'
  | 'toggle-comment-lock'
  | 'snap-comment-members'
  | 'copy'
  | 'cut'
  | 'paste'
  | 'undo'
  | 'redo'
  | 'focus-selection'
  | 'node-search-from-symbol'
  | 'zoom-fit'
  | 'disconnect'
  | 'spawn-menu'
  | 'pan-viewport'
  | 'additive-select'
  | 'box-select'
  | 'node-search'
  | 'panel-filter'
  | 'toggle-log-pin'
  | 'toggle-minimap'
  | 'extract-function'
  | 'select-all'
  | 'select-similar'
  | 'select-chain-downstream'
  | 'select-chain-full'
  | 'layout-selected-chains'
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
  {
    id: 'select-chain-downstream',
    label: 'Select exec chain downstream (+ data attrs)',
    keysWin: 'S',
    keysMac: 'S',
    section: 'canvas',
  },
  {
    id: 'select-chain-full',
    label: 'Select full exec chain',
    keysWin: 'A',
    keysMac: 'A',
    section: 'canvas',
  },
  {
    id: 'layout-selected-chains',
    label: 'Layout exec chain (second S)',
    keysWin: 'S S',
    keysMac: 'S S',
    section: 'canvas',
  },
  { id: 'group-comment', label: 'Comment selection', keysWin: 'C', keysMac: 'C', section: 'canvas' },
  { id: 'ungroup-comment', label: 'Release from comment', keysWin: 'Ctrl+Shift+U', keysMac: '⌘⇧U', section: 'canvas' },
  {
    id: 'toggle-comment-lock',
    label: 'Lock / unlock comment',
    keysWin: 'L',
    keysMac: 'L',
    section: 'canvas',
  },
  {
    id: 'snap-comment-members',
    label: 'Resize comment to fit members',
    keysWin: 'Ctrl+Shift+M',
    keysMac: '⌘⇧M',
    section: 'canvas',
  },
  { id: 'disconnect', label: 'Disconnect wires', keysWin: 'Alt+D', keysMac: '⌥D', section: 'canvas' },
  { id: 'copy', label: 'Copy', keysWin: 'Ctrl+C', keysMac: '⌘C', section: 'canvas' },
  { id: 'cut', label: 'Cut', keysWin: 'Ctrl+X', keysMac: '⌘X', section: 'canvas' },
  { id: 'paste', label: 'Paste', keysWin: 'Ctrl+V', keysMac: '⌘V', section: 'canvas' },
  { id: 'undo', label: 'Undo', keysWin: 'Ctrl+Z', keysMac: '⌘Z', section: 'canvas' },
  { id: 'redo', label: 'Redo', keysWin: 'Ctrl+Shift+Z', keysMac: '⌘⇧Z', section: 'canvas' },
  { id: 'focus-selection', label: 'Frame selection', keysWin: 'F', section: 'canvas' },
  {
    id: 'node-search-from-symbol',
    label: 'Find selected symbol in this graph',
    keysWin: 'F',
    section: 'project',
  },
  { id: 'zoom-fit', label: 'Zoom to fit all', keysWin: '', section: 'canvas' },
  { id: 'spawn-menu', label: 'Spawn node menu', keysWin: 'Right-click', section: 'canvas' },
  { id: 'pan-viewport', label: 'Pan graph', keysWin: 'Right-drag', keysMac: 'Right-drag', section: 'canvas' },
  {
    id: 'additive-select',
    label: 'Add/toggle node in selection',
    keysWin: 'Left-click',
    keysMac: 'Left-click',
    section: 'canvas',
  },
  {
    id: 'box-select',
    label: 'Box-select nodes',
    keysWin: 'Left-drag (empty)',
    keysMac: 'Left-drag (empty)',
    section: 'canvas',
  },
  {
    id: 'node-search',
    label: 'Find in all graphs',
    keysWin: 'Ctrl+F',
    keysMac: '⌘F',
    section: 'canvas',
  },
  {
    id: 'panel-filter',
    label: 'Filter project tree',
    keysWin: 'Ctrl+Space',
    keysMac: 'Ctrl+Space',
    section: 'project',
  },
  { id: 'toggle-log-pin', label: 'Toggle compiler log', keysWin: '`', section: 'canvas' },
  { id: 'toggle-minimap', label: 'Cycle minimap', keysWin: 'M', section: 'canvas' },
  { id: 'extract-function', label: 'Extract to function', keysWin: 'Ctrl+Shift+E', keysMac: '⌘⇧E', section: 'canvas' },
  { id: 'help', label: 'Canvas help', keysWin: '?', section: 'canvas' },
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

/** Append shortcut to a custom label, e.g. withShortcut('Toggle log', 'toggle-log-pin'). */
export function withShortcut(label: string, id: GraphShortcutId): string {
  const keys = shortcutKeys(id);
  return keys ? `${label} (${keys})` : label;
}

export function shortcutsForSection(section: GraphShortcutDef['section']): GraphShortcutDef[] {
  return GRAPH_SHORTCUTS.filter((s) => s.section === section && Boolean(s.keysWin));
}

export function getShortcutDef(id: GraphShortcutId): GraphShortcutDef | undefined {
  return shortcutById.get(id);
}

export function isTypingTarget(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}
