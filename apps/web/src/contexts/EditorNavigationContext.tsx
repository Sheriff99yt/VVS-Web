'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type {
  EditorNavigateOptions,
  EditorViewTab,
  VvsEditorNavigationFrame,
} from '@/types/editorNavigation';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { formatFunctionTabName } from '@/lib/functionTabs';
import {
  bindEditorMouseNavigation,
  collectAvailableGraphIds,
  createNavigationFrame,
  navigationFramesEqual,
  navigationFramesEqualForSync,
  readNavigationFrameFromHistoryState,
  sanitizeNavigationFrame,
  writeNavigationHistory,
} from '@/lib/editorNavigationHistory';
import { consumeNavCameraKind } from '@/lib/navActivityFlags';
import type { VvsNavigationViewport } from '@/types/editorNavigation';
import { resolveVariableFocusFrame } from '@/lib/editorFocus';
import { openGraphContainerTab } from '@/lib/graphTabs';
import { symbolClassId } from '@/lib/classScope';
import type { EditorNavigateEventDetail } from '@/types/editorNavigation';
import type { NavigateToNodeDetail } from '@/lib/graphNavigation';
import { REVEAL_EDIT_HISTORY_EVENT } from '@/lib/editHistoryReveal';
import type { GraphHistoryReveal } from '@/lib/graphHistory';

interface PendingCanvasFocus {
  graphTab: string;
  /** Primary node (selection / Details). */
  nodeId: string;
  /** All nodes to select and frame (undo reveal may include several). */
  nodeIds: string[];
  /** Bumps on every navigate so re-clicking the same error re-selects/frames. */
  requestId: number;
}

interface PendingCanvasViewport {
  graphTab: string;
  viewport: VvsNavigationViewport;
  requestId: number;
}

interface EditorNavigationContextValue {
  currentFrame: VvsEditorNavigationFrame;
  navigate: (partial: Partial<VvsEditorNavigationFrame>, options?: EditorNavigateOptions) => void;
  /** Record a camera dwell bookmark (Back/Forward). */
  recordCameraDwell: (viewport: VvsNavigationViewport) => void;
  pendingCanvasFocus: PendingCanvasFocus | null;
  clearPendingCanvasFocus: () => void;
  pendingCanvasViewport: PendingCanvasViewport | null;
  clearPendingCanvasViewport: () => void;
}

const EditorNavigationContext = createContext<EditorNavigationContextValue | undefined>(undefined);

interface EditorNavigationProviderProps {
  editorView: EditorViewTab;
  setEditorView: Dispatch<SetStateAction<EditorViewTab>>;
  children: ReactNode;
}

export function EditorNavigationProvider({
  editorView,
  setEditorView,
  children,
}: EditorNavigationProviderProps) {
  const {
    openTabs,
    setOpenTabs,
    classes,
    variables,
    functions,
    events,
    activeClassId,
    targetLanguage,
    targetFileExtensions,
    referenceRootGraphId,
    graphContainers,
    setActiveClassId,
    selection,
    setSelection,
    referenceVariableName,
    focusReference,
    activeGraphTab,
    setActiveGraphTab,
  } = useProject();

  const { getDocuments } = useGraphWorkspace();

  const [pendingCanvasFocus, setPendingCanvasFocus] = useState<PendingCanvasFocus | null>(null);
  const [pendingCanvasViewport, setPendingCanvasViewport] =
    useState<PendingCanvasViewport | null>(null);
  const focusRequestIdRef = useRef(0);
  const viewportRequestIdRef = useRef(0);

  const applyingNavigationRef = useRef(false);
  const seededRef = useRef(false);
  const lastRecordedFrameRef = useRef<VvsEditorNavigationFrame | null>(null);
  const applyingClearTimerRef = useRef<number | null>(null);

  const beginApplyingNavigation = useCallback(() => {
    applyingNavigationRef.current = true;
    if (applyingClearTimerRef.current != null) {
      window.clearTimeout(applyingClearTimerRef.current);
      applyingClearTimerRef.current = null;
    }
  }, []);

  const endApplyingNavigation = useCallback(() => {
    // Stay suppressed through React commit + GraphCanvas tab selection effects
    // so the sync watcher cannot push a duplicate history entry.
    if (applyingClearTimerRef.current != null) {
      window.clearTimeout(applyingClearTimerRef.current);
    }
    applyingClearTimerRef.current = window.setTimeout(() => {
      applyingNavigationRef.current = false;
      applyingClearTimerRef.current = null;
    }, 0);
  }, []);

  const availableGraphIds = useMemo(
    () => collectAvailableGraphIds(
      openTabs.map((tab) => tab.id),
      functions.map((func) => func.id)
    ),
    [openTabs, functions]
  );

  const buildCurrentFrame = useCallback((): VvsEditorNavigationFrame => {
    return createNavigationFrame({
      graphTab: activeGraphTab,
      editorView,
      referenceGraphId: referenceRootGraphId,
      referenceVariableName,
      selection: { type: selection.type, id: selection.id },
      focusedNodeId: null,
    });
  }, [
    activeGraphTab,
    editorView,
    referenceRootGraphId,
    referenceVariableName,
    selection.id,
    selection.type,
  ]);

  const currentFrame = useMemo(() => buildCurrentFrame(), [buildCurrentFrame]);

  const ensureGraphTabOpen = useCallback(
    (graphTab: string) => {
      if (graphTab === 'main') return;

      const container = graphContainers.find((c) => c.id === graphTab);
      if (container) {
        openGraphContainerTab(container, setOpenTabs, setActiveGraphTab);
        return;
      }

      const func = functions.find((f) => f.id === graphTab);
      if (func) {
        // Deduplicate against `prev` — callers may have already queued an open
        // in the same React batch (stale `openTabs` would miss it).
        setOpenTabs((prev) => {
          if (prev.some((tab) => tab.id === graphTab)) return prev;
          return [
            ...prev,
            { id: func.id, type: 'function', name: formatFunctionTabName(func.name) },
          ];
        });
      }
    },
    [functions, graphContainers, setActiveGraphTab, setOpenTabs]
  );

  const applyNavigationFrame = useCallback(
    (frame: VvsEditorNavigationFrame) => {
      ensureGraphTabOpen(frame.graphTab);
      setEditorView(frame.editorView);
      setActiveGraphTab(frame.graphTab);
      focusReference(frame.referenceGraphId, frame.referenceVariableName);
      setSelection(frame.selection);

      if (frame.focusedNodeId && frame.editorView === 'canvas') {
        focusRequestIdRef.current += 1;
        setPendingCanvasFocus({
          graphTab: frame.graphTab,
          nodeId: frame.focusedNodeId,
          nodeIds: [frame.focusedNodeId],
          requestId: focusRequestIdRef.current,
        });
      } else {
        setPendingCanvasFocus(null);
      }

      if (frame.viewport && frame.editorView === 'canvas') {
        viewportRequestIdRef.current += 1;
        setPendingCanvasViewport({
          graphTab: frame.graphTab,
          viewport: frame.viewport,
          requestId: viewportRequestIdRef.current,
        });
      } else {
        setPendingCanvasViewport(null);
      }
    },
    [
      ensureGraphTabOpen,
      focusReference,
      setActiveGraphTab,
      setEditorView,
      setSelection,
    ]
  );

  const recordHistory = useCallback(
    (frame: VvsEditorNavigationFrame, mode: 'push' | 'replace') => {
      writeNavigationHistory(frame, mode);
      lastRecordedFrameRef.current = frame;
    },
    []
  );

  const navigate = useCallback(
    (partial: Partial<VvsEditorNavigationFrame>, options?: EditorNavigateOptions) => {
      const base = buildCurrentFrame();
      const merged = createNavigationFrame(
        { ...base, ...partial, focusedNodeId: partial.focusedNodeId ?? null },
        base
      );
      const sanitized = sanitizeNavigationFrame(merged, availableGraphIds);
      const historyMode = options?.history ?? 'push';

      beginApplyingNavigation();
      applyNavigationFrame(sanitized);

      if (historyMode !== 'none') {
        recordHistory(sanitized, historyMode);
      } else {
        // Ephemeral focus (undo reveal, etc.) must not create a mouse Back entry.
        lastRecordedFrameRef.current = {
          ...sanitized,
          focusedNodeId: null,
          viewport: lastRecordedFrameRef.current?.viewport ?? sanitized.viewport ?? null,
        };
      }

      endApplyingNavigation();
    },
    [
      applyNavigationFrame,
      availableGraphIds,
      beginApplyingNavigation,
      buildCurrentFrame,
      endApplyingNavigation,
      recordHistory,
    ]
  );

  const recordCameraDwell = useCallback(
    (viewport: VvsNavigationViewport) => {
      if (applyingNavigationRef.current) return;
      if (editorView !== 'canvas') return;

      const kind = consumeNavCameraKind();
      const base = buildCurrentFrame();
      const next = sanitizeNavigationFrame(
        createNavigationFrame(
          {
            ...base,
            viewport,
            cameraKind: kind,
            focusedNodeId: null,
          },
          base
        ),
        availableGraphIds
      );

      const last = lastRecordedFrameRef.current;
      const samePlace =
        last &&
        last.graphTab === next.graphTab &&
        last.editorView === next.editorView &&
        last.referenceGraphId === next.referenceGraphId &&
        last.referenceVariableName === next.referenceVariableName;

      // Pure camera dwells coalesce onto the tip; edits force a new Back step.
      const mode =
        kind === 'camera' && samePlace && (last?.cameraKind === 'camera' || last?.cameraKind == null)
          ? 'replace'
          : 'push';

      if (
        last &&
        navigationFramesEqual(
          { ...last, focusedNodeId: null },
          { ...next, focusedNodeId: null }
        )
      ) {
        return;
      }

      recordHistory(next, mode);
    },
    [availableGraphIds, buildCurrentFrame, editorView, recordHistory]
  );

  const clearPendingCanvasFocus = useCallback(() => {
    setPendingCanvasFocus(null);
  }, []);

  const clearPendingCanvasViewport = useCallback(() => {
    setPendingCanvasViewport(null);
  }, []);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;

    queueMicrotask(() => {
      const fromHistory = readNavigationFrameFromHistoryState(window.history.state);
      if (fromHistory) {
        const sanitized = sanitizeNavigationFrame(fromHistory, availableGraphIds);
        beginApplyingNavigation();
        applyNavigationFrame(sanitized);
        lastRecordedFrameRef.current = sanitized;
        endApplyingNavigation();
        return;
      }

      const initial = sanitizeNavigationFrame(buildCurrentFrame(), availableGraphIds);
      recordHistory(initial, 'replace');
    });
  }, [
    applyNavigationFrame,
    availableGraphIds,
    beginApplyingNavigation,
    buildCurrentFrame,
    endApplyingNavigation,
    recordHistory,
  ]);

  useEffect(() => {
    if (!seededRef.current || applyingNavigationRef.current) return;

    const frame = sanitizeNavigationFrame(buildCurrentFrame(), availableGraphIds);
    const lastRecorded = lastRecordedFrameRef.current;
    if (lastRecorded && navigationFramesEqualForSync(lastRecorded, frame)) {
      // Keep lastRecorded viewport/cameraKind; only absorb selection nulling.
      lastRecordedFrameRef.current = {
        ...lastRecorded,
        selection: frame.selection,
      };
      return;
    }

    const browserFrame = readNavigationFrameFromHistoryState(window.history.state);
    if (browserFrame && navigationFramesEqualForSync(browserFrame, frame)) {
      lastRecordedFrameRef.current = {
        ...browserFrame,
        selection: frame.selection,
      };
      return;
    }

    // Preserve last known viewport on automatic sync pushes (tab/selection).
    const withViewport = createNavigationFrame(
      {
        ...frame,
        viewport: lastRecorded?.viewport ?? frame.viewport ?? null,
        cameraKind: lastRecorded?.cameraKind ?? frame.cameraKind ?? null,
      },
      frame
    );
    recordHistory(withViewport, 'push');
  }, [availableGraphIds, buildCurrentFrame, recordHistory]);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const frame = readNavigationFrameFromHistoryState(event.state);
      if (!frame) return;

      const sanitized = sanitizeNavigationFrame(frame, availableGraphIds);
      beginApplyingNavigation();
      lastRecordedFrameRef.current = sanitized;
      applyNavigationFrame(sanitized);
      endApplyingNavigation();
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [applyNavigationFrame, availableGraphIds, beginApplyingNavigation, endApplyingNavigation]);

  useEffect(() => bindEditorMouseNavigation(), []);

  useEffect(() => {
    const onRevealEditHistory = (event: Event) => {
      const reveal = (event as CustomEvent<GraphHistoryReveal>).detail;
      if (!reveal?.tabId) return;

      const focusIds = reveal.focusNodeIds.filter(Boolean);
      const primary = focusIds[0] ?? null;

      // Edit undo/redo reveals location without touching mouse navigation history.
      navigate(
        {
          graphTab: reveal.tabId,
          editorView: 'canvas',
          focusedNodeId: primary,
          selection: primary
            ? { type: 'node', id: primary }
            : { type: 'graph', id: reveal.tabId === 'main' ? null : reveal.tabId },
        },
        { history: 'none' }
      );

      if (focusIds.length > 0) {
        focusRequestIdRef.current += 1;
        setPendingCanvasFocus({
          graphTab: reveal.tabId,
          nodeId: focusIds[0]!,
          nodeIds: focusIds,
          requestId: focusRequestIdRef.current,
        });
      }
    };

    window.addEventListener(REVEAL_EDIT_HISTORY_EVENT, onRevealEditHistory);
    return () => window.removeEventListener(REVEAL_EDIT_HISTORY_EVENT, onRevealEditHistory);
  }, [navigate]);

  useEffect(() => {
    const onEditorNavigate = (event: Event) => {
      const detail = (event as CustomEvent<EditorNavigateEventDetail>).detail;
      navigate(detail.frame, detail.options);
    };

    const onNavigateToNode = (event: Event) => {
      const detail = (event as CustomEvent<NavigateToNodeDetail>).detail;
      navigate(
        {
          graphTab: detail.tabId,
          editorView: 'canvas',
          focusedNodeId: detail.nodeId,
          selection: { type: 'node', id: detail.nodeId },
        },
        { history: 'push' }
      );
    };

    const onNavigateToVariable = (event: Event) => {
      const { symbolId } = (event as CustomEvent<{ symbolId: string }>).detail;
      if (!symbolId) return;

      const frame = resolveVariableFocusFrame(symbolId, variables, classes, graphContainers, getDocuments() || {}, activeGraphTab);
      if (!frame) return;

      const variable = variables.find((v) => v.id === symbolId);
      if (variable) {
        setActiveClassId(symbolClassId(variable));
      }

      navigate(frame, { history: 'push' });
    };

    const onSwitchEditorView = (event: Event) => {
      const view = (event as CustomEvent<{ view: EditorViewTab }>).detail.view;
      navigate({ editorView: view });
    };

    window.addEventListener('vvs:editor-navigate', onEditorNavigate);
    window.addEventListener('vvs:navigate-to-node', onNavigateToNode);
    window.addEventListener('vvs:navigate-to-variable', onNavigateToVariable);
    window.addEventListener('vvs:switch-editor-view', onSwitchEditorView);
    return () => {
      window.removeEventListener('vvs:editor-navigate', onEditorNavigate);
      window.removeEventListener('vvs:navigate-to-node', onNavigateToNode);
      window.removeEventListener('vvs:navigate-to-variable', onNavigateToVariable);
      window.removeEventListener('vvs:switch-editor-view', onSwitchEditorView);
    };
  }, [classes, graphContainers, navigate, setActiveClassId, variables]);

  const value = useMemo(
    () => ({
      currentFrame,
      navigate,
      recordCameraDwell,
      pendingCanvasFocus,
      clearPendingCanvasFocus,
      pendingCanvasViewport,
      clearPendingCanvasViewport,
    }),
    [
      clearPendingCanvasFocus,
      clearPendingCanvasViewport,
      currentFrame,
      navigate,
      pendingCanvasFocus,
      pendingCanvasViewport,
      recordCameraDwell,
    ]
  );

  return (
    <EditorNavigationContext.Provider value={value}>{children}</EditorNavigationContext.Provider>
  );
}

export function useEditorNavigation() {
  const context = useContext(EditorNavigationContext);
  if (!context) {
    throw new Error('useEditorNavigation must be used within an EditorNavigationProvider');
  }
  return context;
}

/** Safe hook for components that may render outside the provider during transitions. */
export function useEditorNavigationOptional() {
  return useContext(EditorNavigationContext);
}
