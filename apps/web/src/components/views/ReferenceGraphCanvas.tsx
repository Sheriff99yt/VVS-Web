'use client';

import React, { useMemo, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useProject } from '@/contexts/ProjectContext';
import { buildReferenceIndex } from '@/lib/graphRelations';
import { buildReferenceFlowGraph } from '@/lib/referenceGraphLayout';
import type { ReferenceGraphTypeFilter, ReferenceViewerDepths } from '@/lib/referenceTree';
import { ReferenceGraphNode } from '@/components/graph/ReferenceGraphNode';
import { ReferenceGraphEdge } from '@/components/graph/ReferenceGraphEdge';
import { GRAPH_ONLY_RENDER_VISIBLE } from '@/lib/graphVirtualization';
import { openGraphCamera } from '@/lib/graphCamera';

const nodeTypes = { reference_graph_node: ReferenceGraphNode };
const edgeTypes = { reference_graph_edge: ReferenceGraphEdge };

interface ReferenceGraphCanvasProps {
  depths: ReferenceViewerDepths;
  typeFilters: Set<ReferenceGraphTypeFilter>;
  index: ReturnType<typeof buildReferenceIndex> | null;
  onOpenGraph?: (graphId: string) => void;
  onSelectGraph?: (graphId: string) => void;
}

function FitOnChange({ dep }: { dep: string }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const t = window.setTimeout(() => openGraphCamera(fitView), 50);
    return () => window.clearTimeout(t);
  }, [dep, fitView]);
  return null;
}

export function ReferenceGraphCanvas({
  depths,
  typeFilters,
  index,
  onOpenGraph,
  onSelectGraph,
}: ReferenceGraphCanvasProps) {
  const { referenceRootGraphId, referenceVariableName, openTabs, functions } = useProject();

  const flow = useMemo(() => {
    if (!index) return { nodes: [], edges: [] };
    return buildReferenceFlowGraph({
      rootId: referenceRootGraphId,
      index,
      direction: 'both',
      depths,
      openTabs,
      functions,
      variableFilter: referenceVariableName,
      typeFilters,
    });
  }, [
    referenceRootGraphId,
    referenceVariableName,
    index,
    depths,
    openTabs,
    functions,
    typeFilters,
  ]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      onSelectGraph?.(node.id);
    },
    [onSelectGraph]
  );

  const handleNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      onOpenGraph?.(node.id);
    },
    [onOpenGraph]
  );

  if (!index) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-zinc-600">
        Load a project to view reference graph.
      </div>
    );
  }

  const totalRefs = Array.from(index.values()).reduce(
    (sum, e) => sum + e.incoming.length + e.outgoing.length,
    0
  );

  if (totalRefs === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center px-6 text-[11px] text-zinc-600">
        No cross-graph links yet. Share variables or call functions across graphs to see the reference map.
      </div>
    );
  }

  const fitKey = `${depths.referencers}-${depths.dependencies}-${depths.breadthLimit}-${referenceRootGraphId}-${referenceVariableName ?? ''}-${[...typeFilters].join(',')}`;

  return (
    <div className="w-full h-full bg-zinc-950">
      <ReactFlow
        nodes={flow.nodes}
        edges={flow.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnDrag={[1, 2]}
        onlyRenderVisibleElements={GRAPH_ONLY_RENDER_VISIBLE}
        minZoom={0.15}
        maxZoom={1.5}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        proOptions={{ hideAttribution: true }}
      >
        <FitOnChange dep={fitKey} />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#27272a" />
        <Controls
          position="bottom-right"
          className="!bg-zinc-900 !border-zinc-800 !shadow-md [&>button]:!bg-zinc-900 [&>button]:!border-zinc-800 [&>button]:!text-zinc-400"
        />
        <MiniMap
          position="bottom-left"
          pannable
          zoomable
          className="!bg-zinc-900 !border-zinc-800 nowheel nopan"
          nodeColor={(n) => {
            if (n.data?.isRoot) return '#f59e0b';
            if (n.data?.side === 'referencers') return '#52525b';
            if (n.data?.side === 'dependencies') return '#3f3f46';
            return '#3f3f46';
          }}
          maskColor="rgb(9 9 11 / 0.75)"
        />
      </ReactFlow>
    </div>
  );
}
