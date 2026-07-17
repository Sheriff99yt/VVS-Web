/** Top-level editor views (TopNav). */
export type EditorViewTab = 'canvas' | 'references' | 'library' | 'roadmap';

export const VVS_NAVIGATION_VERSION = 1 as const;

export type NavigationHistoryMode = 'push' | 'replace' | 'none';

export interface VvsNavigationSelection {
  type: 'node' | 'variable' | 'event' | 'function' | 'graph' | 'class' | 'code';
  id: string | null;
}

/** Canvas camera bookmark (React Flow viewport). */
export interface VvsNavigationViewport {
  x: number;
  y: number;
  zoom: number;
}

/**
 * Why a camera bookmark was recorded — used to coalesce dwell updates.
 * - camera: pure pan/zoom with no edits since last bookmark
 * - after-graph-edit: dwell after structural graph history
 * - after-node-options: dwell after inspector / property tweaks
 */
export type VvsNavigationCameraKind = 'camera' | 'after-graph-edit' | 'after-node-options';

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
  /** Optional camera; restored on mouse Back/Forward. */
  viewport?: VvsNavigationViewport | null;
  cameraKind?: VvsNavigationCameraKind | null;
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
