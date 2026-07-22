'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import type { PanelImperativeHandle } from 'react-resizable-panels';
import {
  DEFAULT_UI_PREFERENCES,
  FOCUS_PROJECT_TREE_FILTER_EVENT,
  TOGGLE_COMPILER_LOG_PIN_EVENT,
  TOGGLE_GRAPH_CHROME_EVENT,
  nextGraphChromeMode,
  readUiPreferences,
  writeUiPreferences,
  type GraphChromeMode,
} from '@/lib/uiPreferences';

interface EditorPanelContextValue {
  graphNavPanelRef: RefObject<PanelImperativeHandle | null>;
  graphNavOpen: boolean;
  toggleGraphNav: () => void;
  expandGraphNav: () => void;
  /** Minimap / zoom-controls chrome mode (M cycles). */
  graphChromeMode: GraphChromeMode;
  /** True when minimap is visible (`map` or `map-controls`). */
  graphChromeOpen: boolean;
  /** Cycle map → map-controls → hidden. */
  toggleGraphChrome: () => void;
  setGraphChromeMode: (mode: GraphChromeMode) => void;
  codePanelRef: RefObject<PanelImperativeHandle | null>;
  codeOpen: boolean;
  toggleCode: () => void;
  expandCode: () => void;
  compilerLogOpen: boolean;
  setCompilerLogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleCompilerLog: () => void;
  expandCompilerLog: () => void;
  /** @deprecated use compilerLogOpen */
  consoleOpen: boolean;
  /** @deprecated use toggleCompilerLog */
  toggleConsole: () => void;
  /** @deprecated use expandCompilerLog */
  expandConsole: () => void;
}

const EditorPanelContext = createContext<EditorPanelContextValue | null>(null);

export function EditorPanelProvider({ children }: { children: ReactNode }) {
  const graphNavPanelRef = useRef<PanelImperativeHandle>(null);
  const codePanelRef = useRef<PanelImperativeHandle>(null);
  const [graphNavOpen, setGraphNavOpen] = useState(DEFAULT_UI_PREFERENCES.graphNavOpen);
  const [graphChromeMode, setGraphChromeModeState] = useState<GraphChromeMode>(
    DEFAULT_UI_PREFERENCES.graphChromeMode
  );
  const [codeOpen, setCodeOpen] = useState(DEFAULT_UI_PREFERENCES.codeOpen);
  const [compilerLogOpen, setCompilerLogOpen] = useState(DEFAULT_UI_PREFERENCES.compilerLogOpen);
  const [panelsReady, setPanelsReady] = useState(false);

  const expandGraphNav = useCallback(() => {
    graphNavPanelRef.current?.expand();
    setGraphNavOpen(true);
  }, []);

  const toggleGraphNav = useCallback(() => {
    if (graphNavPanelRef.current?.isCollapsed()) {
      expandGraphNav();
    } else {
      graphNavPanelRef.current?.collapse();
      setGraphNavOpen(false);
    }
  }, [expandGraphNav]);

  const expandCode = useCallback(() => {
    codePanelRef.current?.expand();
    setCodeOpen(true);
  }, []);

  const toggleCode = useCallback(() => {
    if (codePanelRef.current?.isCollapsed()) {
      expandCode();
    } else {
      codePanelRef.current?.collapse();
      setCodeOpen(false);
    }
  }, [expandCode]);

  const expandCompilerLog = useCallback(() => {
    setCompilerLogOpen(true);
  }, []);

  const toggleCompilerLog = useCallback(() => {
    // Smart Log tab + open/close lives in GraphFloatingCompilerLog (TOGGLE event).
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(TOGGLE_COMPILER_LOG_PIN_EVENT));
    }
  }, []);

  const setGraphChromeMode = useCallback((mode: GraphChromeMode) => {
    setGraphChromeModeState(mode);
  }, []);

  const toggleGraphChrome = useCallback(() => {
    setGraphChromeModeState((mode) => nextGraphChromeMode(mode));
  }, []);

  // Stable refs so window listeners don't need callback identities in effect deps
  // (avoids HMR "deps changed size" and unnecessary re-subscribe).
  const expandGraphNavRef = useRef(expandGraphNav);
  const toggleGraphChromeRef = useRef(toggleGraphChrome);
  // eslint-disable-next-line react-hooks/refs
  expandGraphNavRef.current = expandGraphNav;
  // eslint-disable-next-line react-hooks/refs
  toggleGraphChromeRef.current = toggleGraphChrome;

  useEffect(() => {
    const prefs = readUiPreferences();
    const frame = requestAnimationFrame(() => {
      if (prefs.graphNavOpen) {
        graphNavPanelRef.current?.expand();
      } else {
        graphNavPanelRef.current?.collapse();
      }
      if (prefs.codeOpen) {
        codePanelRef.current?.expand();
      } else {
        codePanelRef.current?.collapse();
      }
      setGraphNavOpen(prefs.graphNavOpen);
      setCodeOpen(prefs.codeOpen);
      setGraphChromeModeState(prefs.graphChromeMode);
      setCompilerLogOpen(prefs.compilerLogOpen);
      setPanelsReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!panelsReady) return;
    writeUiPreferences({
      graphNavOpen,
      graphChromeMode,
      codeOpen,
      compilerLogOpen,
    });
  }, [panelsReady, graphNavOpen, graphChromeMode, codeOpen, compilerLogOpen]);

  useEffect(() => {
    if (!panelsReady) return;

    const onFocusProjectTreeFilter = () => expandGraphNavRef.current();
    const onToggleGraphChrome = () => toggleGraphChromeRef.current();

    window.addEventListener(FOCUS_PROJECT_TREE_FILTER_EVENT, onFocusProjectTreeFilter);
    window.addEventListener(TOGGLE_GRAPH_CHROME_EVENT, onToggleGraphChrome);
    return () => {
      window.removeEventListener(FOCUS_PROJECT_TREE_FILTER_EVENT, onFocusProjectTreeFilter);
      window.removeEventListener(TOGGLE_GRAPH_CHROME_EVENT, onToggleGraphChrome);
    };
  }, [panelsReady]);

  const graphChromeOpen = graphChromeMode !== 'hidden';

  return (
    <EditorPanelContext.Provider
      value={{
        graphNavPanelRef,
        graphNavOpen,
        toggleGraphNav,
        expandGraphNav,
        graphChromeMode,
        graphChromeOpen,
        toggleGraphChrome,
        setGraphChromeMode,
        codePanelRef,
        codeOpen,
        toggleCode,
        expandCode,
        compilerLogOpen,
        setCompilerLogOpen,
        toggleCompilerLog,
        expandCompilerLog,
        consoleOpen: compilerLogOpen,
        toggleConsole: toggleCompilerLog,
        expandConsole: expandCompilerLog,
      }}
    >
      {children}
    </EditorPanelContext.Provider>
  );
}

export function useEditorPanels() {
  const ctx = useContext(EditorPanelContext);
  if (!ctx) {
    throw new Error('useEditorPanels must be used within EditorPanelProvider');
  }
  return ctx;
}
