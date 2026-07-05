'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import type { EditorViewTab } from '@/types/editorNavigation';

export type { EditorViewTab };

interface EditorViewContextValue {
  activeView: EditorViewTab;
  isCanvasActive: boolean;
}

const EditorViewContext = createContext<EditorViewContextValue | undefined>(undefined);

export function EditorViewProvider({
  activeView,
  children,
}: {
  activeView: EditorViewTab;
  children: ReactNode;
}) {
  return (
    <EditorViewContext.Provider
      value={{
        activeView,
        isCanvasActive: activeView === 'canvas',
      }}
    >
      {children}
    </EditorViewContext.Provider>
  );
}

export function useEditorView() {
  const context = useContext(EditorViewContext);
  if (!context) {
    throw new Error('useEditorView must be used within an EditorViewProvider');
  }
  return context;
}
