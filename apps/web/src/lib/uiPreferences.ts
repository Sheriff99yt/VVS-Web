const UI_PREFERENCES_KEY = 'vvs:ui-preferences';
const LEGACY_DETAILS_KEY = 'vvs:details-panel-expanded';

/** Canvas map / zoom-controls chrome. M cycles: map → map-controls → hidden. */
export type GraphChromeMode = 'map' | 'map-controls' | 'hidden';

export const GRAPH_CHROME_CYCLE: readonly GraphChromeMode[] = [
  'map',
  'map-controls',
  'hidden',
] as const;

export function nextGraphChromeMode(current: GraphChromeMode): GraphChromeMode {
  const i = GRAPH_CHROME_CYCLE.indexOf(current);
  return GRAPH_CHROME_CYCLE[(i < 0 ? 0 : i + 1) % GRAPH_CHROME_CYCLE.length]!;
}

export function isGraphChromeMode(value: unknown): value is GraphChromeMode {
  return value === 'map' || value === 'map-controls' || value === 'hidden';
}

export interface UiPreferences {
  graphNavOpen: boolean;
  /**
   * Minimap / Controls chrome mode.
   * Migrated from legacy `graphChromeOpen` boolean on read.
   */
  graphChromeMode: GraphChromeMode;
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
  /**
   * After the user closes the canvas welcome/help once, stay collapsed until
   * they open it again (? / help button).
   */
  canvasWelcomeDismissed: boolean;
  /** U66: emit `(x)` comment lines for language-ineffective nodes (default on). */
  showUnsupportedComments: boolean;
  /** U69: emit author Comment [C] lines in Code preview (default on). Separate from `(x)`. */
  showUserComments: boolean;
  /** U67: dim language-ineffective nodes on the canvas (default on). */
  dimUnsupportedNodes: boolean;
  /**
   * U75: where S S places data-attribute trees relative to the exec spine.
   * `above` = canopy over the consumer; `below` = vertical hang; `below-extended` = flat staircase.
   */
  chainAttributeDirection: 'above' | 'below' | 'below-extended';
  /** Animate S S (auto layout) node movement (default on). */
  animateChainLayout: boolean;
  /**
   * When animate is on: move layout columns left→right in staggered steps (default on).
   * Ignored when animateChainLayout is off.
   */
  stepAnimateChainLayout: boolean;
  /** Pace of stepped column moves when step animate is on (default normal). */
  stepAnimateChainLayoutSpeed: 'slow' | 'normal' | 'fast';
  /** U70: allow MCP tools that can mutate/delete graphs (default off). */
  mcpAllowDangerousTools: boolean;
  /** U84: node search includes every graph document (default on). */
  nodeSearchAllGraphs: boolean;
  /**
   * U87: when true, Compiler Log shows Validator lines only for the current
   * graph/project target language (System/Compiler lines always shown).
   */
  compilerLogLanguageScoped: boolean;
}

export const DEFAULT_UI_PREFERENCES: UiPreferences = {
  graphNavOpen: true,
  graphChromeMode: 'map',
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
  canvasWelcomeDismissed: false,
  showUnsupportedComments: true,
  showUserComments: true,
  dimUnsupportedNodes: true,
  chainAttributeDirection: 'below-extended',
  animateChainLayout: true,
  stepAnimateChainLayout: true,
  stepAnimateChainLayoutSpeed: 'normal',
  mcpAllowDangerousTools: false,
  nodeSearchAllGraphs: true,
  compilerLogLanguageScoped: true,
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
export const TOGGLE_GRAPH_CHROME_EVENT = 'vvs:toggle-graph-chrome';
export const FOCUS_GRAPH_NODE_SEARCH_EVENT = 'vvs:focus-graph-node-search';
/** Ask TopNav to run Generate (validate + emit) — used by log language-scope toggle. */
export const REQUEST_GENERATE_EVENT = 'vvs:request-generate';

export type FocusGraphNodeSearchDetail = {
  query?: string;
  /**
   * Force Layers scope for this open:
   * `true` = all graphs, `false` = this graph only, omit = keep preference.
   */
  searchAllGraphs?: boolean;
};

export function dispatchFocusGraphNodeSearch(
  query?: string,
  options?: { searchAllGraphs?: boolean }
): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(FOCUS_GRAPH_NODE_SEARCH_EVENT, {
        detail: {
          query,
          searchAllGraphs: options?.searchAllGraphs,
        } satisfies FocusGraphNodeSearchDetail,
      })
    );
  }
}
export const FOCUS_PROJECT_TREE_FILTER_EVENT = 'vvs:focus-project-tree-filter';

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

export function dispatchToggleGraphChrome(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TOGGLE_GRAPH_CHROME_EVENT));
  }
}

export function dispatchFocusProjectTreeFilter(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(FOCUS_PROJECT_TREE_FILTER_EVENT));
  }
}

export const OPEN_SHORTCUTS_HELP_EVENT = 'vvs:open-shortcuts-help';

export function dispatchOpenShortcutsHelp(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_SHORTCUTS_HELP_EVENT));
  }
}

export function dispatchRequestGenerate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(REQUEST_GENERATE_EVENT));
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
      graphChromeOpen?: boolean;
    };
    const { detailsPanelExpanded, graphChromeOpen, ...rest } = parsed;
    const merged: UiPreferences = {
      ...DEFAULT_UI_PREFERENCES,
      ...rest,
      detailsPanelPinned:
        typeof rest.detailsPanelPinned === 'boolean'
          ? rest.detailsPanelPinned
          : Boolean(detailsPanelExpanded),
      graphChromeMode: isGraphChromeMode(rest.graphChromeMode)
        ? rest.graphChromeMode
        : graphChromeOpen === false
          ? 'hidden'
          : graphChromeOpen === true
            ? 'map-controls'
            : DEFAULT_UI_PREFERENCES.graphChromeMode,
      chainAttributeDirection:
        rest.chainAttributeDirection === 'above' ||
        rest.chainAttributeDirection === 'below' ||
        rest.chainAttributeDirection === 'below-extended'
          ? rest.chainAttributeDirection
          : DEFAULT_UI_PREFERENCES.chainAttributeDirection,
      animateChainLayout:
        typeof rest.animateChainLayout === 'boolean'
          ? rest.animateChainLayout
          : DEFAULT_UI_PREFERENCES.animateChainLayout,
      stepAnimateChainLayout:
        typeof rest.stepAnimateChainLayout === 'boolean'
          ? rest.stepAnimateChainLayout
          : DEFAULT_UI_PREFERENCES.stepAnimateChainLayout,
      stepAnimateChainLayoutSpeed:
        rest.stepAnimateChainLayoutSpeed === 'slow' ||
        rest.stepAnimateChainLayoutSpeed === 'normal' ||
        rest.stepAnimateChainLayoutSpeed === 'fast'
          ? rest.stepAnimateChainLayoutSpeed
          : DEFAULT_UI_PREFERENCES.stepAnimateChainLayoutSpeed,
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
