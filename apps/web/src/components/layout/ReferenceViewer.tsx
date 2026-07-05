'use client';

import React, { useMemo } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { buildReferenceIndex } from '@/lib/graphRelations';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { ReferenceGraphTree } from './ReferenceGraphTree';

interface ReferenceViewerProps {
  onOpenGraph: (graphId: string) => void;
}

export function ReferenceViewer({ onOpenGraph }: ReferenceViewerProps) {
  const { activeGraphTab, openTabs, functions } = useProject();
  const { getDocuments } = useGraphWorkspace();

  const documents = getDocuments();
  const index = useMemo(() => {
    if (!documents) return null;
    return buildReferenceIndex(documents, functions, []);
  }, [documents, functions]);

  if (!documents || !index) {
    return (
      <div className="px-3 py-2 text-[10px] text-zinc-600 italic">
        Open a graph to scan references.
      </div>
    );
  }

  const totalRefs = Array.from(index.values()).reduce(
    (sum, e) => sum + e.incoming.length + e.outgoing.length,
    0
  );

  if (totalRefs === 0) {
    return (
      <div className="px-3 py-2 text-[10px] text-zinc-600 italic pr-2">
        No cross-graph links yet. References appear when graphs share variables, events, or call each
        other.
      </div>
    );
  }

  return (
    <ReferenceGraphTree
      rootGraphId={activeGraphTab}
      index={index}
      openTabs={openTabs}
      functions={functions}
      onOpenGraph={onOpenGraph}
    />
  );
}
