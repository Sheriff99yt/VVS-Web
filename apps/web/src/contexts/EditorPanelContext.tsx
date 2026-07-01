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
  consolePanelRef: RefObject<PanelImperativeHandle | null>;
  codePanelRef: RefObject<PanelImperativeHandle | null>;
  consoleOpen: boolean;
  codeOpen: boolean;
  toggleConsole: () => void;
  toggleCode: () => void;
  expandConsole: () => void;
  expandCode: () => void;
}

const EditorPanelContext = createContext<EditorPanelContextValue | null>(null);

export function EditorPanelProvider({ children }: { children: ReactNode }) {
  const consolePanelRef = useRef<PanelImperativeHandle>(null);
  const codePanelRef = useRef<PanelImperativeHandle>(null);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [panelsReady, setPanelsReady] = useState(false);

  const expandConsole = useCallback(() => {
    consolePanelRef.current?.expand();
    setConsoleOpen(true);
  }, []);

  const expandCode = useCallback(() => {
    codePanelRef.current?.expand();
    setCodeOpen(true);
  }, []);

  const toggleConsole = useCallback(() => {
    if (consolePanelRef.current?.isCollapsed()) {
      expandConsole();
    } else {
      consolePanelRef.current?.collapse();
      setConsoleOpen(false);
    }
  }, [expandConsole]);

  const toggleCode = useCallback(() => {
    if (codePanelRef.current?.isCollapsed()) {
      expandCode();
    } else {
      codePanelRef.current?.collapse();
      setCodeOpen(false);
    }
  }, [expandCode]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      consolePanelRef.current?.collapse();
      codePanelRef.current?.collapse();
      setPanelsReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!panelsReady) return;

    const onCompileState = (event: Event) => {
      const state = (event as CustomEvent<{ state: string }>).detail.state;
      if (state === 'compiling' || state === 'error') {
        expandConsole();
      }
      if (state === 'success') {
        expandCode();
      }
    };

    const onValidation = () => expandConsole();

    window.addEventListener('vvs:compile-state', onCompileState);
    window.addEventListener('vvs:validation-result', onValidation);
    return () => {
      window.removeEventListener('vvs:compile-state', onCompileState);
      window.removeEventListener('vvs:validation-result', onValidation);
    };
  }, [panelsReady, expandConsole, expandCode]);

  return (
    <EditorPanelContext.Provider
      value={{
        consolePanelRef,
        codePanelRef,
        consoleOpen,
        codeOpen,
        toggleConsole,
        toggleCode,
        expandConsole,
        expandCode,
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
