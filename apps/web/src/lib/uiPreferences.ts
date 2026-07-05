const UI_PREFERENCES_KEY = 'vvs:ui-preferences';
const LEGACY_DETAILS_KEY = 'vvs:details-panel-expanded';

export interface UiPreferences {
  graphNavOpen: boolean;
  graphChromeOpen: boolean;
  codeOpen: boolean;
  compilerLogOpen: boolean;
  detailsPanelExpanded: boolean;
  detailsPanelExpandedHeight: number;
  detailsPanelCompactHeight: number;
}

export const DEFAULT_UI_PREFERENCES: UiPreferences = {
  graphNavOpen: true,
  graphChromeOpen: true,
  codeOpen: true,
  compilerLogOpen: false,
  detailsPanelExpanded: false,
  detailsPanelExpandedHeight: 360,
  detailsPanelCompactHeight: 148,
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

function migrateLegacyDetailsPref(prefs: UiPreferences): UiPreferences {
  if (typeof window === 'undefined') return prefs;
  const legacy = window.localStorage.getItem(LEGACY_DETAILS_KEY);
  if (legacy === 'true') {
    return { ...prefs, detailsPanelExpanded: true };
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
    const parsed = JSON.parse(raw) as Partial<UiPreferences>;
    return migrateLegacyDetailsPref({ ...DEFAULT_UI_PREFERENCES, ...parsed });
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
