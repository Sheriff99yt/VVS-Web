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
import { DEFAULT_UI_PREFERENCES, readUiPreferences, writeUiPreferences } from '@/lib/uiPreferences';

interface EditorPanelContextValue {
  graphNavPanelRef: RefObject<PanelImperativeHandle | null>;
  graphNavOpen: boolean;
  toggleGraphNav: () => void;
  expandGraphNav: () => void;
  graphChromeOpen: boolean;
  toggleGraphChrome: () => void;
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
  const [graphChromeOpen, setGraphChromeOpen] = useState(DEFAULT_UI_PREFERENCES.graphChromeOpen);
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
    setCompilerLogOpen((open) => !open);
  }, []);

  const toggleGraphChrome = useCallback(() => {
    setGraphChromeOpen((open) => !open);
  }, []);

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
      setGraphChromeOpen(prefs.graphChromeOpen);
      setCompilerLogOpen(prefs.compilerLogOpen);
      setPanelsReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!panelsReady) return;
    writeUiPreferences({
      graphNavOpen,
      graphChromeOpen,
      codeOpen,
      compilerLogOpen,
    });
  }, [panelsReady, graphNavOpen, graphChromeOpen, codeOpen, compilerLogOpen]);

  useEffect(() => {
    if (!panelsReady) return;

    const onCompileState = (event: Event) => {
      const state = (event as CustomEvent<{ state: string }>).detail.state;
      if (state === 'compiling' || state === 'error') {
        expandCompilerLog();
      }
    };

    const onValidation = () => expandCompilerLog();

    window.addEventListener('vvs:compile-state', onCompileState);
    window.addEventListener('vvs:validation-result', onValidation);
    return () => {
      window.removeEventListener('vvs:compile-state', onCompileState);
      window.removeEventListener('vvs:validation-result', onValidation);
    };
  }, [panelsReady, expandCompilerLog]);

  return (
    <EditorPanelContext.Provider
      value={{
        graphNavPanelRef,
        graphNavOpen,
        toggleGraphNav,
        expandGraphNav,
        graphChromeOpen,
        toggleGraphChrome,
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
