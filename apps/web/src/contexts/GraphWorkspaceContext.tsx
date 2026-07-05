'use client';

import React, { createContext, useCallback, useContext, useRef, ReactNode } from 'react';
import { GraphDocument, GraphTabMetadata } from '@/lib/graphDefaults';

export interface GraphWorkspaceApi {
  getDocuments: () => Record<string, GraphDocument>;
  loadDocuments: (documents: Record<string, GraphDocument>, activeTab: string) => void;
  importGraphDocument: (tab: import('@/contexts/ProjectContext').GraphTab, document: GraphDocument) => void;
  getActiveTabMetadata: () => GraphTabMetadata;
  updateActiveTabMetadata: (patch: Partial<GraphTabMetadata>) => void;
  subscribeMetadata: (listener: () => void) => () => void;
}

interface GraphWorkspaceContextValue {
  registerWorkspace: (api: GraphWorkspaceApi | null) => void;
  getDocuments: () => Record<string, GraphDocument> | null;
  loadDocuments: (documents: Record<string, GraphDocument>, activeTab: string) => void;
  importGraphDocument: (tab: import('@/contexts/ProjectContext').GraphTab, document: GraphDocument) => void;
  getActiveTabMetadata: () => GraphTabMetadata | null;
  updateActiveTabMetadata: (patch: Partial<GraphTabMetadata>) => void;
  subscribeMetadata: (listener: () => void) => () => void;
}

const GraphWorkspaceContext = createContext<GraphWorkspaceContextValue | undefined>(undefined);

export function GraphWorkspaceProvider({ children }: { children: ReactNode }) {
  const apiRef = useRef<GraphWorkspaceApi | null>(null);
  const metadataListenersRef = useRef(new Set<() => void>());
  const workspaceBridgeRef = useRef<(() => void) | null>(null);

  const notifyMetadataListeners = useCallback(() => {
    metadataListenersRef.current.forEach((listener) => listener());
  }, []);

  const registerWorkspace = useCallback(
    (api: GraphWorkspaceApi | null) => {
      workspaceBridgeRef.current?.();
      workspaceBridgeRef.current = null;
      apiRef.current = api;

      if (api) {
        workspaceBridgeRef.current = api.subscribeMetadata(() => {
          notifyMetadataListeners();
        });
      }
    },
    [notifyMetadataListeners]
  );

  const getDocuments = useCallback(() => apiRef.current?.getDocuments() ?? null, []);

  const loadDocuments = useCallback(
    (documents: Record<string, GraphDocument>, activeTab: string) => {
      apiRef.current?.loadDocuments(documents, activeTab);
    },
    []
  );

  const importGraphDocument = useCallback(
    (tab: import('@/contexts/ProjectContext').GraphTab, document: GraphDocument) => {
      apiRef.current?.importGraphDocument(tab, document);
    },
    []
  );

  const getActiveTabMetadata = useCallback(
    () => apiRef.current?.getActiveTabMetadata() ?? null,
    []
  );

  const updateActiveTabMetadata = useCallback((patch: Partial<GraphTabMetadata>) => {
    apiRef.current?.updateActiveTabMetadata(patch);
  }, []);

  const subscribeMetadata = useCallback((listener: () => void) => {
    metadataListenersRef.current.add(listener);
    return () => {
      metadataListenersRef.current.delete(listener);
    };
  }, []);

  return (
    <GraphWorkspaceContext.Provider
      value={{
        registerWorkspace,
        getDocuments,
        loadDocuments,
        importGraphDocument,
        getActiveTabMetadata,
        updateActiveTabMetadata,
        subscribeMetadata,
      }}
    >
      {children}
    </GraphWorkspaceContext.Provider>
  );
}

export function useGraphWorkspace() {
  const context = useContext(GraphWorkspaceContext);
  if (!context) {
    throw new Error('useGraphWorkspace must be used within a GraphWorkspaceProvider');
  }
  return context;
}
