const UI_PREFERENCES_KEY = 'vvs:ui-preferences';
const LEGACY_DETAILS_KEY = 'vvs:details-panel-expanded';

export interface UiPreferences {
  graphNavOpen: boolean;
  graphChromeOpen: boolean;
  codeOpen: boolean;
  compilerLogOpen: boolean;
  /** Log panel pin — stay expanded without hover. */
  compilerLogPinned: boolean;
  compilerLogExpandedHeight: number;
  compilerLogExpandedWidth: number;
  /** Distance from canvas right edge (px). */
  compilerLogOffsetRight: number;
  /** Distance from canvas bottom edge (px). */
  compilerLogOffsetBottom: number;
  /**
   * Details panel pin — when true, stay expanded without hover.
   * Replaces legacy `detailsPanelExpanded` (migrated on read).
   */
  detailsPanelPinned: boolean;
  detailsPanelExpandedHeight: number;
  detailsPanelExpandedWidth: number;
  detailsPanelCompactHeight: number;
  /** Distance from canvas right edge (px). */
  detailsPanelOffsetRight: number;
  /** Distance from canvas top edge (px). */
  detailsPanelOffsetTop: number;
  /** U66: emit `(x)` comment lines for language-ineffective nodes (default on). */
  showUnsupportedComments: boolean;
  /** U67: dim language-ineffective nodes on the canvas (default on). */
  dimUnsupportedNodes: boolean;
  /** U70: allow MCP tools that can mutate/delete graphs (default off). */
  mcpAllowDangerousTools: boolean;
}

export const DEFAULT_UI_PREFERENCES: UiPreferences = {
  graphNavOpen: true,
  graphChromeOpen: true,
  codeOpen: true,
  compilerLogOpen: false,
  compilerLogPinned: false,
  compilerLogExpandedHeight: 240,
  compilerLogExpandedWidth: 260,
  compilerLogOffsetRight: 10,
  compilerLogOffsetBottom: 10,
  detailsPanelPinned: false,
  detailsPanelExpandedHeight: 360,
  detailsPanelExpandedWidth: 232,
  detailsPanelCompactHeight: 148,
  detailsPanelOffsetRight: 10,
  detailsPanelOffsetTop: 10,
  showUnsupportedComments: true,
  dimUnsupportedNodes: true,
  mcpAllowDangerousTools: false,
};

export const DETAILS_PANEL_HEIGHT = {
  expandedDefault: DEFAULT_UI_PREFERENCES.detailsPanelExpandedHeight,
  compactDefault: DEFAULT_UI_PREFERENCES.detailsPanelCompactHeight,
  min: 120,
  maxVh: 0.85,
} as const;

export function clampDetailsPanelHeight(px: number): number {
  const max =
    typeof window !== 'undefined'
      ? Math.floor(window.innerHeight * DETAILS_PANEL_HEIGHT.maxVh)
      : 720;
  return Math.min(max, Math.max(DETAILS_PANEL_HEIGHT.min, Math.round(px)));
}

export const FLOATING_PANEL_WIDTH = {
  min: 200,
  maxVw: 0.7,
  defaultLog: DEFAULT_UI_PREFERENCES.compilerLogExpandedWidth,
} as const;

export function clampFloatingPanelWidth(px: number): number {
  const max =
    typeof window !== 'undefined'
      ? Math.floor(window.innerWidth * FLOATING_PANEL_WIDTH.maxVw)
      : 720;
  return Math.min(max, Math.max(FLOATING_PANEL_WIDTH.min, Math.round(px)));
}

const PANEL_EDGE_MARGIN = 8;

/** Keep a bottom-right–anchored panel inside its offset parent. */
export function clampFloatingPanelOffsets(
  right: number,
  bottom: number,
  panelWidth: number,
  panelHeight: number,
  parentWidth: number,
  parentHeight: number
): { right: number; bottom: number } {
  const maxRight = Math.max(PANEL_EDGE_MARGIN, parentWidth - panelWidth - PANEL_EDGE_MARGIN);
  const maxBottom = Math.max(PANEL_EDGE_MARGIN, parentHeight - panelHeight - PANEL_EDGE_MARGIN);
  return {
    right: Math.min(maxRight, Math.max(PANEL_EDGE_MARGIN, Math.round(right))),
    bottom: Math.min(maxBottom, Math.max(PANEL_EDGE_MARGIN, Math.round(bottom))),
  };
}

/** Keep a top-right–anchored panel inside its offset parent. */
export function clampFloatingPanelTopOffsets(
  right: number,
  top: number,
  panelWidth: number,
  panelHeight: number,
  parentWidth: number,
  parentHeight: number
): { right: number; top: number } {
  const maxRight = Math.max(PANEL_EDGE_MARGIN, parentWidth - panelWidth - PANEL_EDGE_MARGIN);
  const maxTop = Math.max(PANEL_EDGE_MARGIN, parentHeight - panelHeight - PANEL_EDGE_MARGIN);
  return {
    right: Math.min(maxRight, Math.max(PANEL_EDGE_MARGIN, Math.round(right))),
    top: Math.min(maxTop, Math.max(PANEL_EDGE_MARGIN, Math.round(top))),
  };
}

export const RESET_COMPILER_LOG_LAYOUT_EVENT = 'vvs:reset-compiler-log-layout';
export const RESET_DETAILS_PANEL_LAYOUT_EVENT = 'vvs:reset-details-panel-layout';
export const TOGGLE_COMPILER_LOG_PIN_EVENT = 'vvs:toggle-compiler-log-pin';
export const FOCUS_GRAPH_NODE_SEARCH_EVENT = 'vvs:focus-graph-node-search';

export function defaultCompilerLogLayout() {
  return {
    width: DEFAULT_UI_PREFERENCES.compilerLogExpandedWidth,
    height: DEFAULT_UI_PREFERENCES.compilerLogExpandedHeight,
    offsetRight: DEFAULT_UI_PREFERENCES.compilerLogOffsetRight,
    offsetBottom: DEFAULT_UI_PREFERENCES.compilerLogOffsetBottom,
  };
}

export function defaultDetailsPanelLayout() {
  return {
    width: DEFAULT_UI_PREFERENCES.detailsPanelExpandedWidth,
    height: DEFAULT_UI_PREFERENCES.detailsPanelExpandedHeight,
    offsetRight: DEFAULT_UI_PREFERENCES.detailsPanelOffsetRight,
    offsetTop: DEFAULT_UI_PREFERENCES.detailsPanelOffsetTop,
  };
}

/** Persist default log size/position and notify open panels to sync. */
export function dispatchResetCompilerLogLayout(): void {
  const d = defaultCompilerLogLayout();
  writeUiPreferences({
    compilerLogExpandedWidth: d.width,
    compilerLogExpandedHeight: d.height,
    compilerLogOffsetRight: d.offsetRight,
    compilerLogOffsetBottom: d.offsetBottom,
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(RESET_COMPILER_LOG_LAYOUT_EVENT));
  }
}

/** Persist default details size/position and notify open panels to sync. */
export function dispatchResetDetailsPanelLayout(): void {
  const d = defaultDetailsPanelLayout();
  writeUiPreferences({
    detailsPanelExpandedWidth: d.width,
    detailsPanelExpandedHeight: d.height,
    detailsPanelOffsetRight: d.offsetRight,
    detailsPanelOffsetTop: d.offsetTop,
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(RESET_DETAILS_PANEL_LAYOUT_EVENT));
  }
}

export function dispatchToggleCompilerLogPin(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TOGGLE_COMPILER_LOG_PIN_EVENT));
  }
}

export function dispatchFocusGraphNodeSearch(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(FOCUS_GRAPH_NODE_SEARCH_EVENT));
  }
}

export const OPEN_SHORTCUTS_HELP_EVENT = 'vvs:open-shortcuts-help';

export function dispatchOpenShortcutsHelp(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_SHORTCUTS_HELP_EVENT));
  }
}

function migrateLegacyDetailsPref(prefs: UiPreferences): UiPreferences {
  if (typeof window === 'undefined') return prefs;
  const legacy = window.localStorage.getItem(LEGACY_DETAILS_KEY);
  if (legacy === 'true' && !prefs.detailsPanelPinned) {
    return { ...prefs, detailsPanelPinned: true };
  }
  return prefs;
}

export function readUiPreferences(): UiPreferences {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_UI_PREFERENCES };
  }

  try {
    const raw = window.localStorage.getItem(UI_PREFERENCES_KEY);
    if (!raw) {
      return migrateLegacyDetailsPref({ ...DEFAULT_UI_PREFERENCES });
    }
    const parsed = JSON.parse(raw) as Partial<UiPreferences> & {
      detailsPanelExpanded?: boolean;
    };
    const { detailsPanelExpanded, ...rest } = parsed;
    const merged: UiPreferences = {
      ...DEFAULT_UI_PREFERENCES,
      ...rest,
      detailsPanelPinned:
        typeof rest.detailsPanelPinned === 'boolean'
          ? rest.detailsPanelPinned
          : Boolean(detailsPanelExpanded),
    };
    return migrateLegacyDetailsPref(merged);
  } catch {
    return migrateLegacyDetailsPref({ ...DEFAULT_UI_PREFERENCES });
  }
}

export function writeUiPreferences(patch: Partial<UiPreferences>): void {
  if (typeof window === 'undefined') return;
  const next = { ...readUiPreferences(), ...patch };
  window.localStorage.setItem(UI_PREFERENCES_KEY, JSON.stringify(next));
}

export function readUiPreference<K extends keyof UiPreferences>(key: K): UiPreferences[K] {
  return readUiPreferences()[key];
}
