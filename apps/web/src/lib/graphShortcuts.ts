/** Canonical keyboard shortcuts for the graph editor and related chrome. */

import { readUiPreference } from '@/lib/uiPreferences';
import { isMacPlatform, matchKeyChord } from '@/lib/chordMatching';

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
  | 'redo-alternate'
  | 'focus-selection'
  | 'zoom-fit'
  | 'disconnect'
  | 'spawn-menu'
  | 'pan-viewport'
  | 'pan-middle'
  | 'zoom-scroll'
  | 'additive-select'
  | 'chain-range-select'
  | 'box-select'
  | 'node-search'
  | 'node-search-all'
  | 'focus-node-search'
  | 'focus-node-search-palette'
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
  | 'help'
  | 'rename-symbol';

/** Settings panel grouping (ordered). */
export type ShortcutSettingsGroup =
  | 'edit'
  | 'selection'
  | 'comments'
  | 'find'
  | 'view'
  | 'project'
  | 'pointer';

export const SHORTCUT_SETTINGS_GROUPS: {
  id: ShortcutSettingsGroup;
  label: string;
  description: string;
}[] = [
  {
    id: 'edit',
    label: 'Edit',
    description: 'Clipboard, undo, and destructive actions',
  },
  {
    id: 'selection',
    label: 'Selection & layout',
    description: 'Select, frame, and chain layout (S / A / S S)',
  },
  {
    id: 'comments',
    label: 'Comments',
    description: 'Comment boxes and membership',
  },
  {
    id: 'find',
    label: 'Find & filter',
    description: 'Node search and project tree filter',
  },
  {
    id: 'view',
    label: 'View & help',
    description: 'Canvas chrome and help',
  },
  {
    id: 'project',
    label: 'Project',
    description: 'Save, generate, and rename',
  },
  {
    id: 'pointer',
    label: 'Pointer & gestures',
    description: 'Mouse and trackpad — display only, not rebindable',
  },
];

export interface GraphShortcutDef {
  id: GraphShortcutId;
  label: string;
  /** Windows / Linux display */
  keysWin: string;
  /** macOS display (optional override) */
  keysMac?: string;
  /** Canvas help sheet bucket */
  section: 'canvas' | 'project';
  /** Settings panel category */
  group: ShortcutSettingsGroup;
  /** Extra line under the label in Settings */
  hint?: string;
}

export const GRAPH_SHORTCUTS: GraphShortcutDef[] = [
  // —— Edit ——
  { id: 'undo', label: 'Undo', keysWin: 'Ctrl+Z', keysMac: '⌘Z', section: 'canvas', group: 'edit' },
  {
    id: 'redo',
    label: 'Redo',
    keysWin: 'Ctrl+Shift+Z',
    keysMac: '⌘⇧Z',
    section: 'canvas',
    group: 'edit',
  },
  {
    id: 'redo-alternate',
    label: 'Redo (alternate)',
    keysWin: 'Ctrl+Y',
    keysMac: '⌘Y',
    section: 'canvas',
    group: 'edit',
    hint: 'Same as Redo — also accepted',
  },
  { id: 'cut', label: 'Cut', keysWin: 'Ctrl+X', keysMac: '⌘X', section: 'canvas', group: 'edit' },
  { id: 'copy', label: 'Copy', keysWin: 'Ctrl+C', keysMac: '⌘C', section: 'canvas', group: 'edit' },
  { id: 'paste', label: 'Paste', keysWin: 'Ctrl+V', keysMac: '⌘V', section: 'canvas', group: 'edit' },
  {
    id: 'duplicate',
    label: 'Duplicate selection',
    keysWin: 'Ctrl+D',
    keysMac: '⌘D',
    section: 'canvas',
    group: 'edit',
  },
  {
    id: 'delete',
    label: 'Delete selection',
    keysWin: 'Delete',
    section: 'canvas',
    group: 'edit',
    hint: 'Backspace also deletes',
  },
  {
    id: 'extract-function',
    label: 'Extract to function',
    keysWin: 'Ctrl+Shift+E',
    keysMac: '⌘⇧E',
    section: 'canvas',
    group: 'edit',
  },
  {
    id: 'disconnect',
    label: 'Disconnect wires',
    keysWin: 'Alt+D',
    keysMac: '⌥D',
    section: 'canvas',
    group: 'edit',
  },

  // —— Selection & layout ——
  {
    id: 'select-all',
    label: 'Select all nodes',
    keysWin: 'Ctrl+A',
    keysMac: '⌘A',
    section: 'canvas',
    group: 'selection',
  },
  {
    id: 'select-similar',
    label: 'Select similar nodes',
    keysWin: 'Ctrl+Shift+A',
    keysMac: '⌘⇧A',
    section: 'canvas',
    group: 'selection',
  },
  {
    id: 'select-chain-downstream',
    label: 'Select exec chain downstream',
    keysWin: 'S',
    keysMac: 'S',
    section: 'canvas',
    group: 'selection',
    hint: 'Includes data attributes on the chain',
  },
  {
    id: 'select-chain-full',
    label: 'Select full exec chain',
    keysWin: 'A',
    keysMac: 'A',
    section: 'canvas',
    group: 'selection',
  },
  {
    id: 'layout-selected-chains',
    label: 'Layout exec chain',
    keysWin: 'S S',
    keysMac: 'S S',
    section: 'canvas',
    group: 'selection',
    hint: 'Press S twice on a chain selection — sequence, not rebindable',
  },
  {
    id: 'focus-selection',
    label: 'Frame selection',
    keysWin: 'F',
    section: 'canvas',
    group: 'selection',
    hint: 'Frame selected nodes on the canvas. Ctrl+F finds by name.',
  },
  {
    id: 'zoom-fit',
    label: 'Zoom to fit all',
    keysWin: 'View menu',
    section: 'canvas',
    group: 'selection',
    hint: 'No default key — use View or frame with F',
  },

  // —— Comments ——
  {
    id: 'group-comment',
    label: 'Comment selection',
    keysWin: 'C',
    keysMac: 'C',
    section: 'canvas',
    group: 'comments',
  },
  {
    id: 'ungroup-comment',
    label: 'Release from comment',
    keysWin: 'Ctrl+Shift+U',
    keysMac: '⌘⇧U',
    section: 'canvas',
    group: 'comments',
  },
  {
    id: 'toggle-comment-lock',
    label: 'Lock / unlock comment',
    keysWin: 'L',
    keysMac: 'L',
    section: 'canvas',
    group: 'comments',
  },
  {
    id: 'snap-comment-members',
    label: 'Resize comment to fit members',
    keysWin: 'Ctrl+Shift+M',
    keysMac: '⌘⇧M',
    section: 'canvas',
    group: 'comments',
  },

  // —— Find ——
  {
    id: 'node-search',
    label: 'Find in this graph',
    keysWin: 'Ctrl+F',
    keysMac: '⌘F',
    section: 'canvas',
    group: 'find',
    hint: 'Prefills from selected nodes or symbols; comma = OR',
  },
  {
    id: 'node-search-all',
    label: 'Find in all graphs',
    keysWin: 'Ctrl+Shift+F',
    keysMac: '⌘⇧F',
    section: 'canvas',
    group: 'find',
  },
  {
    id: 'focus-node-search',
    label: 'Open node search',
    keysWin: 'Space',
    section: 'canvas',
    group: 'find',
  },
  {
    id: 'focus-node-search-palette',
    label: 'Open node search (palette)',
    keysWin: 'Ctrl+K',
    keysMac: '⌘K',
    section: 'canvas',
    group: 'find',
  },
  {
    id: 'panel-filter',
    label: 'Filter project tree',
    keysWin: 'Ctrl+Space',
    keysMac: 'Ctrl+Space',
    section: 'project',
    group: 'find',
  },

  // —— View ——
  {
    id: 'toggle-log-pin',
    label: 'Cycle Output panel',
    keysWin: '`',
    section: 'canvas',
    group: 'view',
    hint: 'Log → History → Activity → off',
  },
  {
    id: 'toggle-minimap',
    label: 'Cycle minimap',
    keysWin: 'M',
    section: 'canvas',
    group: 'view',
    hint: 'Map → map+controls → hidden',
  },
  { id: 'help', label: 'Canvas help', keysWin: '?', section: 'canvas', group: 'view' },

  // —— Project ——
  {
    id: 'save-project',
    label: 'Save project',
    keysWin: 'Ctrl+S',
    keysMac: '⌘S',
    section: 'project',
    group: 'project',
  },
  {
    id: 'compile',
    label: 'Generate',
    keysWin: 'Ctrl+G',
    keysMac: '⌘G',
    section: 'project',
    group: 'project',
  },
  {
    id: 'sync-preview',
    label: 'Sync code preview',
    keysWin: 'Ctrl+Shift+S',
    keysMac: '⌘⇧S',
    section: 'project',
    group: 'project',
  },
  {
    id: 'rename-symbol',
    label: 'Rename symbol',
    keysWin: 'F2',
    section: 'project',
    group: 'project',
  },

  // —— Pointer / gestures (display only) ——
  {
    id: 'spawn-menu',
    label: 'Spawn node menu',
    keysWin: 'Right-click',
    section: 'canvas',
    group: 'pointer',
    hint: 'Empty canvas or node — no drag',
  },
  {
    id: 'pan-viewport',
    label: 'Pan graph',
    keysWin: 'Right-drag',
    keysMac: 'Right-drag',
    section: 'canvas',
    group: 'pointer',
  },
  {
    id: 'pan-middle',
    label: 'Pan graph (middle)',
    keysWin: 'Middle-drag',
    section: 'canvas',
    group: 'pointer',
  },
  {
    id: 'zoom-scroll',
    label: 'Zoom canvas',
    keysWin: 'Scroll wheel',
    keysMac: 'Scroll / pinch',
    section: 'canvas',
    group: 'pointer',
  },
  {
    id: 'additive-select',
    label: 'Add/toggle in selection',
    keysWin: 'Ctrl+click',
    keysMac: '⌘+click',
    section: 'canvas',
    group: 'pointer',
  },
  {
    id: 'chain-range-select',
    label: 'Select chain between nodes',
    keysWin: 'Shift+click',
    keysMac: 'Shift+click',
    section: 'canvas',
    group: 'pointer',
    hint: 'Exec chain including attributes',
  },
  {
    id: 'box-select',
    label: 'Box-select nodes',
    keysWin: 'Left-drag (empty)',
    keysMac: 'Left-drag (empty)',
    section: 'canvas',
    group: 'pointer',
  },
];

const shortcutById = new Map(GRAPH_SHORTCUTS.map((s) => [s.id, s]));

export { isMacPlatform } from '@/lib/chordMatching';

/** True when the binding is a single rebindable key chord (not a gesture or sequence). */
export function isShortcutRebindable(def: GraphShortcutDef): boolean {
  const k = def.keysWin;
  if (!k) return false;
  if (k.includes(' ') || k.includes('click') || k.includes('drag') || k.includes('Right-')) {
    return false;
  }
  if (k.includes('Middle-') || k.includes('Left-') || k.includes('Scroll') || k.includes('pinch')) {
    return false;
  }
  if (k === 'View menu') return false;
  // Alternate redo mirrors primary — keep display-only to avoid double bindings
  if (def.id === 'redo-alternate') return false;
  return true;
}

/** Platform-aware key chord, e.g. "Ctrl+D" or "⌘D". Respects user overrides from Settings. */
export function shortcutKeys(id: GraphShortcutId): string {
  const def = shortcutById.get(id);
  if (!def) return '';
  if (!isShortcutRebindable(def)) {
    return isMacPlatform() ? (def.keysMac ?? def.keysWin.replace(/Ctrl\+/g, '⌘')) : def.keysWin;
  }
  const overrides = readUiPreference('shortcutOverrides');
  const override = overrides[id];
  if (override) return override;
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

export function shortcutsForSettingsGroup(group: ShortcutSettingsGroup): GraphShortcutDef[] {
  return GRAPH_SHORTCUTS.filter((s) => s.group === group);
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

/** True when `e` matches the effective binding for `id`. */
export function matchesGraphShortcut(e: KeyboardEvent, id: GraphShortcutId): boolean {
  const keys = shortcutKeys(id);
  if (!keys || keys.includes(' ')) return false;
  return matchKeyChord(e, keys);
}
