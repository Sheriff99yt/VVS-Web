'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Minus, Plus, Crosshair } from 'lucide-react';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { ReactFlowProvider } from '@xyflow/react';
import { useProject } from '@/contexts/ProjectContext';
import { formatReferenceEndpoint } from '@/lib/graphRelations';
import { useGraphReferenceIndex } from '@/hooks/useGraphDocuments';
import {
  REFERENCE_DEPTH_DEFAULT,
  REFERENCE_DEPTH_MAX,
  REFERENCE_DEPTH_MIN,
  REFERENCE_BREADTH_DEFAULT,
  REFERENCE_BREADTH_MAX,
  REFERENCE_BREADTH_MIN,
  type ReferenceGraphTypeFilter,
  type ReferenceTreeDirection,
} from '@/lib/referenceTree';
import {
  openFunctionGraphTab,
  openMainGraph,
} from '@/lib/graphTabs';
import { GraphExplorer } from '@/components/layout/GraphExplorer';
import { ReferenceGraphTree } from '@/components/layout/ReferenceGraphTree';
import { ReferenceGraphCanvas } from './ReferenceGraphCanvas';

interface ReferencesViewProps {
  onSwitchToCanvas: () => void;
}

function DepthStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] text-zinc-500 whitespace-nowrap">{label}</span>
      <button
        type="button"
        className="p-0.5 rounded border border-zinc-800 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus size={10} />
      </button>
      <span className="text-[10px] text-zinc-200 w-4 text-center tabular-nums">{value}</span>
      <button
        type="button"
        className="p-0.5 rounded border border-zinc-800 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus size={10} />
      </button>
    </div>
  );
}

const TYPE_FILTER_OPTIONS: { id: ReferenceGraphTypeFilter; label: string; color: string }[] = [
  { id: 'main', label: 'Event Graph', color: '#10b981' },
  { id: 'function', label: 'Function', color: '#6366f1' },
];

const ALL_TYPES: ReferenceGraphTypeFilter[] = ['main', 'function'];

export function ReferencesView({ onSwitchToCanvas }: ReferencesViewProps) {
  const {
    referenceRootGraphId,
    referenceVariableName,
    openTabs,
    functions,
    projectDetails,
    focusReference,
    setActiveGraphTab,
    setOpenTabs,
    setSelection,
  } = useProject();

  const [referencersDepth, setReferencersDepth] = useState(REFERENCE_DEPTH_DEFAULT);
  const [dependenciesDepth, setDependenciesDepth] = useState(REFERENCE_DEPTH_DEFAULT);
  const [breadthLimit, setBreadthLimit] = useState(REFERENCE_BREADTH_DEFAULT);
  const [direction, setDirection] = useState<ReferenceTreeDirection>('both');
  const [typeFilters, setTypeFilters] = useState<Set<ReferenceGraphTypeFilter>>(
    () => new Set(ALL_TYPES)
  );
  const [treeQuery, setTreeQuery] = useState('');

  const index = useGraphReferenceIndex(functions, []);

  const depths = useMemo(
    () => ({
      referencers: referencersDepth,
      dependencies: dependenciesDepth,
      breadthLimit,
    }),
    [referencersDepth, dependenciesDepth, breadthLimit]
  );

  const treeDepth = Math.max(referencersDepth, dependenciesDepth);

  const focusPath = referenceVariableName
    ? `${projectDetails.moduleName} / ${referenceVariableName}`
    : `${projectDetails.moduleName} / ${formatReferenceEndpoint(referenceRootGraphId, openTabs, functions)}`;

  const rootLabel = referenceVariableName
    ? `${referenceVariableName} · ${formatReferenceEndpoint(referenceRootGraphId, openTabs, functions)}`
    : formatReferenceEndpoint(referenceRootGraphId, openTabs, functions);

  const toggleTypeFilter = (id: ReferenceGraphTypeFilter) => {
    setTypeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openGraphAndEdit = useCallback(
    (graphId: string) => {
      if (graphId === 'main') {
        openMainGraph(setActiveGraphTab);
        setSelection({ type: 'graph', id: null });
      } else {
        const func = functions.find((f) => f.id === graphId);
        if (func) openFunctionGraphTab(func, setOpenTabs, setActiveGraphTab);
        setSelection({ type: 'graph', id: graphId });
      }
      onSwitchToCanvas();
    },
    [functions, onSwitchToCanvas, setActiveGraphTab, setOpenTabs, setSelection]
  );

  const selectReferenceGraph = useCallback(
    (graphId: string) => {
      focusReference(graphId, null);
      setSelection({ type: 'graph', id: graphId === 'main' ? null : graphId });
    },
    [focusReference, setSelection]
  );

  return (
    <PanelGroup orientation="horizontal" className="w-full h-full">
      <Panel id="ref-left" defaultSize={18} minSize={14}>
        <GraphExplorer mode="references" />
      </Panel>

      <PanelResizeHandle className="w-1 cursor-col-resize bg-zinc-950 border-x border-zinc-800/50 hover:bg-zinc-800 transition-colors" />

      <Panel id="ref-center" defaultSize={58} minSize={35}>
        <div className="w-full h-full flex flex-col min-h-0">
          <div className="shrink-0 border-b border-zinc-800 bg-zinc-950">
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800/60">
              <button
                type="button"
                className="p-1 rounded text-zinc-500 hover:text-amber-400 hover:bg-zinc-900"
                title="Focus current asset"
                onClick={() => selectReferenceGraph(referenceRootGraphId)}
              >
                <Crosshair size={13} />
              </button>
              <div className="flex-1 min-w-0 text-[10px] text-zinc-400 truncate font-mono" title={focusPath}>
                {focusPath}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2">
              <DepthStepper
                label="Referencers"
                value={referencersDepth}
                min={REFERENCE_DEPTH_MIN}
                max={REFERENCE_DEPTH_MAX}
                onChange={setReferencersDepth}
              />
              <DepthStepper
                label="Dependencies"
                value={dependenciesDepth}
                min={REFERENCE_DEPTH_MIN}
                max={REFERENCE_DEPTH_MAX}
                onChange={setDependenciesDepth}
              />
              <DepthStepper
                label="Breadth"
                value={breadthLimit}
                min={REFERENCE_BREADTH_MIN}
                max={REFERENCE_BREADTH_MAX}
                onChange={setBreadthLimit}
              />

              <div className="flex items-center gap-1 ml-auto">
                {TYPE_FILTER_OPTIONS.map((opt) => {
                  const active = typeFilters.has(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`px-2 py-0.5 rounded text-[9px] border transition-colors ${
                        active
                          ? 'border-zinc-600 bg-zinc-800 text-zinc-200'
                          : 'border-zinc-800 text-zinc-600 opacity-50'
                      }`}
                      style={active ? { borderTopColor: opt.color, borderTopWidth: 2 } : undefined}
                      onClick={() => toggleTypeFilter(opt.id)}
                      title={`Toggle ${opt.label} visibility`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-3 pb-2 flex items-center justify-between text-[9px] text-zinc-600">
              <span>
                Focus: <span className="text-amber-500/90">{rootLabel}</span>
                <span className="text-zinc-700 mx-1.5">·</span>
                Referencers ← center → Dependencies
              </span>
              <span className="hidden sm:inline">Click to focus · Double-click to open in Canvas</span>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <ReactFlowProvider>
              <ReferenceGraphCanvas
                depths={depths}
                typeFilters={typeFilters}
                index={index}
                onOpenGraph={openGraphAndEdit}
                onSelectGraph={selectReferenceGraph}
              />
            </ReactFlowProvider>
          </div>
        </div>
      </Panel>

      <PanelResizeHandle className="w-1 cursor-col-resize bg-zinc-950 border-x border-zinc-800/50 hover:bg-zinc-800 transition-colors" />

      <Panel id="ref-right" defaultSize={24} minSize={16}>
        <div className="w-full h-full flex flex-col bg-zinc-950 border-l border-zinc-800 min-h-0">
          <div className="shrink-0 px-3 py-2 border-b border-zinc-800 space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Reference tree
            </div>
            <input
              type="search"
              value={treeQuery}
              onChange={(e) => setTreeQuery(e.target.value)}
              placeholder="Filter graphs…"
              className="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-600"
              aria-label="Filter reference tree by graph name"
            />
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {!index ? (
              <div className="px-3 py-4 text-[11px] text-zinc-600">
                Graph workspace is still loading…
              </div>
            ) : (
              <ReferenceGraphTree
                rootGraphId={referenceRootGraphId}
                index={index}
                openTabs={openTabs}
                functions={functions}
                onOpenGraph={openGraphAndEdit}
                onSelectGraph={selectReferenceGraph}
                depth={treeDepth}
                onDepthChange={(d) => {
                  setReferencersDepth(d);
                  setDependenciesDepth(d);
                }}
                direction={direction}
                onDirectionChange={setDirection}
                hideControls
                nameFilter={treeQuery}
              />
            )}
          </div>
        </div>
      </Panel>
    </PanelGroup>
  );
}
