/**
 * DefaultShortcuts.ts
 * 
 * Default keyboard shortcuts for the application.
 * Used for initializing the KeyboardShortcutService.
 */

import { Shortcut, ShortcutCategory } from './KeyboardShortcutService';

/**
 * Format a key for display
 */
export function formatShortcutKey(key: string): string {
  const keyMappings: { [key: string]: string } = {
    'Control': '⌃',
    'Ctrl': '⌃',
    'Alt': '⌥',
    'Shift': '⇧',
    'Meta': '⌘',
    'Enter': '↵',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Escape': 'Esc',
    'Delete': 'Del',
  };
  
  return keyMappings[key] || key;
}

/**
 * Convert an array of keys to a shortcut key string
 */
function keysToShortcutKey(keys: string[]): string {
  return keys.map(k => k.toLowerCase()).join('+');
}

/**
 * Default keyboard shortcuts for the application
 */
export const DEFAULT_SHORTCUTS = {
  // File operations
  NEW_PROJECT: {
    key: keysToShortcutKey(['Ctrl', 'N']),
    description: 'Create a new project',
    category: 'project' as ShortcutCategory,
    action: () => console.log('New project'),
  },
  OPEN_PROJECT: {
    key: keysToShortcutKey(['Ctrl', 'O']),
    description: 'Open an existing project',
    category: 'project' as ShortcutCategory,
    action: () => console.log('Open project'),
  },
  SAVE_PROJECT: {
    key: keysToShortcutKey(['Ctrl', 'S']),
    description: 'Save the current project',
    category: 'project' as ShortcutCategory,
    action: () => console.log('Save project'),
  },
  SAVE_PROJECT_AS: {
    key: keysToShortcutKey(['Ctrl', 'Shift', 'S']),
    description: 'Save the current project with a new name',
    category: 'project' as ShortcutCategory,
    action: () => console.log('Save project as'),
  },
  EXPORT_PROJECT: {
    key: keysToShortcutKey(['Ctrl', 'E']),
    description: 'Export the current project',
    category: 'project' as ShortcutCategory,
    action: () => console.log('Export project'),
  },
  
  // Edit operations
  DELETE_NODE: {
    key: keysToShortcutKey(['Delete']),
    description: 'Delete the selected node(s)',
    category: 'node' as ShortcutCategory,
    action: () => console.log('Delete node'),
  },
  UNDO: {
    key: keysToShortcutKey(['Ctrl', 'Z']),
    description: 'Undo the last action',
    category: 'general' as ShortcutCategory,
    action: () => console.log('Undo'),
  },
  REDO: {
    key: keysToShortcutKey(['Ctrl', 'Y']),
    description: 'Redo the last undone action',
    category: 'general' as ShortcutCategory,
    action: () => console.log('Redo'),
  },
  CUT: {
    key: keysToShortcutKey(['Ctrl', 'X']),
    description: 'Cut the selected node(s)',
    category: 'node' as ShortcutCategory,
    action: () => console.log('Cut'),
  },
  COPY: {
    key: keysToShortcutKey(['Ctrl', 'C']),
    description: 'Copy the selected node(s)',
    category: 'node' as ShortcutCategory,
    action: () => console.log('Copy'),
  },
  PASTE: {
    key: keysToShortcutKey(['Ctrl', 'V']),
    description: 'Paste the copied/cut node(s)',
    category: 'node' as ShortcutCategory,
    action: () => console.log('Paste'),
  },
  
  // View operations
  ZOOM_IN: {
    key: keysToShortcutKey(['Ctrl', '+']),
    description: 'Zoom in on the canvas',
    category: 'canvas' as ShortcutCategory,
    action: () => console.log('Zoom in'),
  },
  ZOOM_OUT: {
    key: keysToShortcutKey(['Ctrl', '-']),
    description: 'Zoom out on the canvas',
    category: 'canvas' as ShortcutCategory,
    action: () => console.log('Zoom out'),
  },
  ZOOM_RESET: {
    key: keysToShortcutKey(['Ctrl', '0']),
    description: 'Reset the zoom level',
    category: 'canvas' as ShortcutCategory,
    action: () => console.log('Reset zoom'),
  },
  TOGGLE_CODE_PREVIEW: {
    key: keysToShortcutKey(['Ctrl', '`']),
    description: 'Show/hide the code preview panel',
    category: 'editor' as ShortcutCategory,
    action: () => console.log('Toggle code preview'),
  },
  SHOW_SHORTCUTS: {
    key: keysToShortcutKey(['Shift', '?']),
    description: 'Show the keyboard shortcuts help dialog',
    category: 'general' as ShortcutCategory,
    action: () => console.log('Show keyboard shortcuts'),
  }
}; 