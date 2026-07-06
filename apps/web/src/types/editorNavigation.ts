/** Top-level editor views (TopNav). */
export type EditorViewTab = 'canvas' | 'references' | 'library' | 'roadmap';

export const VVS_NAVIGATION_VERSION = 1 as const;

export type NavigationHistoryMode = 'push' | 'replace' | 'none';

export interface VvsNavigationSelection {
  type: 'node' | 'variable' | 'event' | 'function' | 'graph' | 'class';
  id: string | null;
}

/** Versioned navigation frame stored in browser history and editor state. */
export interface VvsEditorNavigationFrame {
  version: typeof VVS_NAVIGATION_VERSION;
  graphTab: string;
  editorView: EditorViewTab;
  referenceGraphId: string;
  referenceVariableName: string | null;
  selection: VvsNavigationSelection;
  /** Canvas node to focus after the frame is applied (not persisted in codegen). */
  focusedNodeId: string | null;
}

export interface EditorNavigateOptions {
  /** How this navigation is recorded in browser history. Default: `push`. */
  history?: NavigationHistoryMode;
}

export interface EditorNavigateEventDetail {
  frame: Partial<VvsEditorNavigationFrame>;
  options?: EditorNavigateOptions;
}

export const VVS_HISTORY_STATE_KEY = 'vvsEditor';
