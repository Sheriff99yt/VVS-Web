import type {
  EditorViewTab,
  VvsEditorNavigationFrame,
  VvsNavigationCameraKind,
  VvsNavigationSelection,
  VvsNavigationViewport,
} from '@/types/editorNavigation';
import { VVS_HISTORY_STATE_KEY, VVS_NAVIGATION_VERSION } from '@/types/editorNavigation';

const EDITOR_VIEWS = new Set<EditorViewTab>(['canvas', 'references', 'library', 'roadmap']);
const CAMERA_KINDS = new Set<VvsNavigationCameraKind>([
  'camera',
  'after-graph-edit',
  'after-node-options',
]);

/** @deprecated Legacy v0 frame — graph tab + view only. */
interface LegacyVvsEditorHistoryEntry {
  graphTab: string;
  editorView: EditorViewTab;
}

function isEditorViewTab(value: unknown): value is EditorViewTab {
  return typeof value === 'string' && EDITOR_VIEWS.has(value as EditorViewTab);
}

function isLegacyEntry(value: unknown): value is LegacyVvsEditorHistoryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as LegacyVvsEditorHistoryEntry;
  return typeof entry.graphTab === 'string' && isEditorViewTab(entry.editorView);
}

function isViewport(value: unknown): value is VvsNavigationViewport {
  if (!value || typeof value !== 'object') return false;
  const v = value as VvsNavigationViewport;
  return (
    typeof v.x === 'number' &&
    typeof v.y === 'number' &&
    typeof v.zoom === 'number' &&
    Number.isFinite(v.x) &&
    Number.isFinite(v.y) &&
    Number.isFinite(v.zoom)
  );
}

export function isVvsEditorNavigationFrame(value: unknown): value is VvsEditorNavigationFrame {
  if (!value || typeof value !== 'object') return false;
  const frame = value as VvsEditorNavigationFrame;
  if (frame.version !== VVS_NAVIGATION_VERSION) return false;
  if (typeof frame.graphTab !== 'string' || !isEditorViewTab(frame.editorView)) return false;
  if (typeof frame.referenceGraphId !== 'string') return false;
  if (frame.referenceVariableName !== null && typeof frame.referenceVariableName !== 'string') {
    return false;
  }
  if (!frame.selection || typeof frame.selection !== 'object') return false;
  const selectionType = frame.selection.type;
  if (
    selectionType !== 'node' &&
    selectionType !== 'variable' &&
    selectionType !== 'event' &&
    selectionType !== 'function' &&
    selectionType !== 'class' &&
    selectionType !== 'graph'
  ) {
    return false;
  }
  if (frame.selection.id !== null && typeof frame.selection.id !== 'string') return false;
  if (frame.focusedNodeId !== null && typeof frame.focusedNodeId !== 'string') return false;
  if (frame.viewport != null && !isViewport(frame.viewport)) return false;
  if (frame.cameraKind != null && !CAMERA_KINDS.has(frame.cameraKind)) return false;
  return true;
}

export function defaultNavigationSelection(): VvsNavigationSelection {
  return { type: 'graph', id: null };
}

export function createNavigationFrame(
  partial: Partial<VvsEditorNavigationFrame> & Pick<VvsEditorNavigationFrame, 'graphTab'>,
  base?: Partial<VvsEditorNavigationFrame>
): VvsEditorNavigationFrame {
  const merged = { ...base, ...partial };
  return {
    version: VVS_NAVIGATION_VERSION,
    graphTab: merged.graphTab,
    editorView: merged.editorView ?? 'canvas',
    referenceGraphId: merged.referenceGraphId ?? merged.graphTab,
    referenceVariableName: merged.referenceVariableName ?? null,
    selection: merged.selection ?? defaultNavigationSelection(),
    focusedNodeId: merged.focusedNodeId ?? null,
    viewport: merged.viewport ?? null,
    cameraKind: merged.cameraKind ?? null,
  };
}

function upgradeLegacyEntry(entry: LegacyVvsEditorHistoryEntry): VvsEditorNavigationFrame {
  return createNavigationFrame({
    graphTab: entry.graphTab,
    editorView: entry.editorView,
    referenceGraphId: entry.graphTab,
    referenceVariableName: null,
    selection: defaultNavigationSelection(),
    focusedNodeId: null,
  });
}

export function readNavigationFrameFromHistoryState(state: unknown): VvsEditorNavigationFrame | null {
  if (!state || typeof state !== 'object') return null;
  const raw = (state as Record<string, unknown>)[VVS_HISTORY_STATE_KEY];
  if (isVvsEditorNavigationFrame(raw)) return raw;
  if (isLegacyEntry(raw)) return upgradeLegacyEntry(raw);
  return null;
}

export function buildHistoryState(
  baseState: unknown,
  frame: VvsEditorNavigationFrame
): Record<string, unknown> {
  const next =
    baseState && typeof baseState === 'object'
      ? { ...(baseState as Record<string, unknown>) }
      : {};
  next[VVS_HISTORY_STATE_KEY] = frame;
  return next;
}

function viewportsEqual(
  a: VvsNavigationViewport | null | undefined,
  b: VvsNavigationViewport | null | undefined
): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return (
    Math.abs(a.x - b.x) < 0.5 &&
    Math.abs(a.y - b.y) < 0.5 &&
    Math.abs(a.zoom - b.zoom) < 0.001
  );
}

export function navigationFramesEqual(
  a: VvsEditorNavigationFrame,
  b: VvsEditorNavigationFrame
): boolean {
  return (
    a.graphTab === b.graphTab &&
    a.editorView === b.editorView &&
    a.referenceGraphId === b.referenceGraphId &&
    a.referenceVariableName === b.referenceVariableName &&
    a.selection.type === b.selection.type &&
    a.selection.id === b.selection.id &&
    a.focusedNodeId === b.focusedNodeId &&
    viewportsEqual(a.viewport, b.viewport) &&
    (a.cameraKind ?? null) === (b.cameraKind ?? null)
  );
}

/**
 * Same place in the editor ignoring ephemeral focus and graph-selection id
 * (tab bar pushes id=tabId; canvas tab effect often nulls it — must not double-push).
 */
export function navigationFramesEqualForSync(
  a: VvsEditorNavigationFrame,
  b: VvsEditorNavigationFrame
): boolean {
  const normalize = (f: VvsEditorNavigationFrame): VvsEditorNavigationFrame => ({
    ...f,
    focusedNodeId: null,
    selection:
      f.selection.type === 'graph'
        ? { type: 'graph', id: null }
        : f.selection,
    // Viewport compared separately for camera dwell; sync ignores unset ↔ set noise
    // when both missing or equal.
    viewport: f.viewport ?? null,
    cameraKind: f.cameraKind ?? null,
  });
  return navigationFramesEqual(normalize(a), normalize(b));
}

/** Drop stale tab ids and normalize selection when tabs were closed. */
export function sanitizeNavigationFrame(
  frame: VvsEditorNavigationFrame,
  availableGraphIds: ReadonlySet<string>
): VvsEditorNavigationFrame {
  let graphTab = frame.graphTab;
  if (!availableGraphIds.has(graphTab)) {
    graphTab = availableGraphIds.has('main') ? 'main' : Array.from(availableGraphIds)[0] ?? 'main';
  }

  let referenceGraphId = frame.referenceGraphId;
  if (!availableGraphIds.has(referenceGraphId)) {
    referenceGraphId = graphTab;
  }

  let selection = frame.selection;
  if (selection.type === 'graph' && selection.id && !availableGraphIds.has(selection.id)) {
    selection = { type: 'graph', id: graphTab === 'main' ? null : graphTab };
  }

  return createNavigationFrame({
    ...frame,
    graphTab,
    referenceGraphId,
    referenceVariableName: frame.referenceVariableName,
    selection,
    focusedNodeId: frame.focusedNodeId,
    viewport: frame.viewport ?? null,
    cameraKind: frame.cameraKind ?? null,
  });
}

export function collectAvailableGraphIds(
  openTabIds: Iterable<string>,
  functionIds: Iterable<string>
): Set<string> {
  const ids = new Set<string>(['main']);
  for (const id of openTabIds) ids.add(id);
  for (const id of functionIds) ids.add(id);
  return ids;
}

export function writeNavigationHistory(
  frame: VvsEditorNavigationFrame,
  mode: 'push' | 'replace'
): void {
  const nextState = buildHistoryState(window.history.state, frame);
  if (mode === 'replace') {
    window.history.replaceState(nextState, '');
  } else {
    window.history.pushState(nextState, '');
  }
}

export function bindEditorMouseNavigation(): () => void {
  /**
   * Mouse Back/Forward = navigation history only (tabs / view / selection / camera).
   * Use auxclick only — side buttons also fire mouseup; listening to both double-steps.
   */
  const onAuxClick = (event: MouseEvent) => {
    if (event.button === 3) {
      event.preventDefault();
      window.history.back();
    } else if (event.button === 4) {
      event.preventDefault();
      window.history.forward();
    }
  };

  window.addEventListener('auxclick', onAuxClick, true);
  return () => {
    window.removeEventListener('auxclick', onAuxClick, true);
  };
}
