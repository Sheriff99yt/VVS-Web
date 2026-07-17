'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import type { VVSNode, VVSEdge } from '@/types/graph';
import type { GraphDocument } from '@/lib/graphDefaults';
import type { GraphTab } from '@/contexts/ProjectContext';

import type { GraphHistoryEntryMeta } from '@/lib/graphHistory';

export interface GraphEditContextValue {
  nodes: VVSNode[];
  edges: VVSEdge[];
  onNodesChange: ReturnType<typeof import('@/hooks/useGraphState').useGraphState>['onNodesChange'];
  onEdgesChange: ReturnType<typeof import('@/hooks/useGraphState').useGraphState>['onEdgesChange'];
  setNodes: React.Dispatch<React.SetStateAction<VVSNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<VVSEdge[]>>;
  setNodesWithHistory: React.Dispatch<React.SetStateAction<VVSNode[]>>;
  setEdgesWithHistory: React.Dispatch<React.SetStateAction<VVSEdge[]>>;
  undo: () => string | null;
  redo: () => string | null;
  canUndo: boolean;
  canRedo: boolean;
  jumpToPastEntry: (entryId: string) => string | null;
  getPastHistory: () => GraphHistoryEntryMeta[];
  getFutureCount: () => number;
  historyVersion: number;
  importGraphTab: (tab: GraphTab, document: GraphDocument) => void;
}

const GraphEditContext = createContext<GraphEditContextValue | undefined>(undefined);

export function GraphEditProvider({
  value,
  children,
}: {
  value: GraphEditContextValue;
  children: ReactNode;
}) {
  return <GraphEditContext.Provider value={value}>{children}</GraphEditContext.Provider>;
}

export function useGraphEdit() {
  const context = useContext(GraphEditContext);
  if (!context) {
    throw new Error('useGraphEdit must be used within a GraphEditProvider');
  }
  return context;
}
