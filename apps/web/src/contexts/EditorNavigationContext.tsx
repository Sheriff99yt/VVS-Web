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
import { formatFunctionTabName } from '@/lib/functionTabs';
import {
  bindEditorMouseNavigation,
  collectAvailableGraphIds,
  createNavigationFrame,
  navigationFramesEqual,
  readNavigationFrameFromHistoryState,
  sanitizeNavigationFrame,
  writeNavigationHistory,
} from '@/lib/editorNavigationHistory';
import type { EditorNavigateEventDetail } from '@/types/editorNavigation';
import type { NavigateToNodeDetail } from '@/lib/graphNavigation';

interface PendingCanvasFocus {
  graphTab: string;
  nodeId: string;
}

interface EditorNavigationContextValue {
  currentFrame: VvsEditorNavigationFrame;
  navigate: (partial: Partial<VvsEditorNavigationFrame>, options?: EditorNavigateOptions) => void;
  pendingCanvasFocus: PendingCanvasFocus | null;
  clearPendingCanvasFocus: () => void;
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
    activeGraphTab,
    setActiveGraphTab,
    openTabs,
    setOpenTabs,
    functions,
    selection,
    setSelection,
    referenceRootGraphId,
    referenceVariableName,
    focusReference,
  } = useProject();

  const [pendingCanvasFocus, setPendingCanvasFocus] = useState<PendingCanvasFocus | null>(null);

  const applyingNavigationRef = useRef(false);
  const seededRef = useRef(false);
  const lastRecordedFrameRef = useRef<VvsEditorNavigationFrame | null>(null);

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
      if (openTabs.some((tab) => tab.id === graphTab)) return;

      const func = functions.find((f) => f.id === graphTab);
      if (func) {
        setOpenTabs((prev) => [
          ...prev,
          { id: func.id, type: 'function', name: formatFunctionTabName(func.name) },
        ]);
      }
    },
    [functions, openTabs, setOpenTabs]
  );

  const applyNavigationFrame = useCallback(
    (frame: VvsEditorNavigationFrame) => {
      ensureGraphTabOpen(frame.graphTab);
      setEditorView(frame.editorView);
      setActiveGraphTab(frame.graphTab);
      focusReference(frame.referenceGraphId, frame.referenceVariableName);
      setSelection(frame.selection);

      if (frame.focusedNodeId && frame.editorView === 'canvas') {
        setPendingCanvasFocus({ graphTab: frame.graphTab, nodeId: frame.focusedNodeId });
      } else {
        setPendingCanvasFocus(null);
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
      const merged = createNavigationFrame({ ...base, ...partial, focusedNodeId: partial.focusedNodeId ?? null });
      const sanitized = sanitizeNavigationFrame(merged, availableGraphIds);
      const historyMode = options?.history ?? 'push';

      applyingNavigationRef.current = true;
      applyNavigationFrame(sanitized);

      if (historyMode !== 'none') {
        recordHistory(sanitized, historyMode);
      } else {
        lastRecordedFrameRef.current = sanitized;
      }

      applyingNavigationRef.current = false;
    },
    [applyNavigationFrame, availableGraphIds, buildCurrentFrame, recordHistory]
  );

  const clearPendingCanvasFocus = useCallback(() => {
    setPendingCanvasFocus(null);
  }, []);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;

    queueMicrotask(() => {
      const fromHistory = readNavigationFrameFromHistoryState(window.history.state);
      if (fromHistory) {
        const sanitized = sanitizeNavigationFrame(fromHistory, availableGraphIds);
        applyingNavigationRef.current = true;
        applyNavigationFrame(sanitized);
        lastRecordedFrameRef.current = sanitized;
        applyingNavigationRef.current = false;
        return;
      }

      const initial = sanitizeNavigationFrame(buildCurrentFrame(), availableGraphIds);
      recordHistory(initial, 'replace');
    });
  }, [
    applyNavigationFrame,
    availableGraphIds,
    buildCurrentFrame,
    recordHistory,
  ]);

  useEffect(() => {
    if (!seededRef.current || applyingNavigationRef.current) return;

    const frame = sanitizeNavigationFrame(buildCurrentFrame(), availableGraphIds);
    const lastRecorded = lastRecordedFrameRef.current;
    if (lastRecorded && navigationFramesEqual(lastRecorded, frame)) return;

    const browserFrame = readNavigationFrameFromHistoryState(window.history.state);
    if (browserFrame && navigationFramesEqual(browserFrame, frame)) {
      lastRecordedFrameRef.current = frame;
      return;
    }

    recordHistory(frame, 'push');
  }, [availableGraphIds, buildCurrentFrame, recordHistory]);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const frame = readNavigationFrameFromHistoryState(event.state);
      if (!frame) return;

      const sanitized = sanitizeNavigationFrame(frame, availableGraphIds);
      applyingNavigationRef.current = true;
      lastRecordedFrameRef.current = sanitized;
      applyNavigationFrame(sanitized);
      applyingNavigationRef.current = false;
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [applyNavigationFrame, availableGraphIds]);

  useEffect(() => bindEditorMouseNavigation(), []);

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

    const onSwitchEditorView = (event: Event) => {
      const view = (event as CustomEvent<{ view: EditorViewTab }>).detail.view;
      navigate({ editorView: view });
    };

    window.addEventListener('vvs:editor-navigate', onEditorNavigate);
    window.addEventListener('vvs:navigate-to-node', onNavigateToNode);
    window.addEventListener('vvs:switch-editor-view', onSwitchEditorView);
    return () => {
      window.removeEventListener('vvs:editor-navigate', onEditorNavigate);
      window.removeEventListener('vvs:navigate-to-node', onNavigateToNode);
      window.removeEventListener('vvs:switch-editor-view', onSwitchEditorView);
    };
  }, [navigate]);

  const value = useMemo(
    () => ({
      currentFrame,
      navigate,
      pendingCanvasFocus,
      clearPendingCanvasFocus,
    }),
    [clearPendingCanvasFocus, currentFrame, navigate, pendingCanvasFocus]
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
