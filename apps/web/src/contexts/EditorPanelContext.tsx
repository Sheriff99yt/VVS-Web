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

interface EditorPanelContextValue {
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
  const codePanelRef = useRef<PanelImperativeHandle>(null);
  const [codeOpen, setCodeOpen] = useState(true);
  const [compilerLogOpen, setCompilerLogOpen] = useState(false);
  const [panelsReady, setPanelsReady] = useState(false);

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

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      codePanelRef.current?.expand();
      setCodeOpen(true);
      setPanelsReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

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
