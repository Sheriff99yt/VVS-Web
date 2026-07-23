'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Minus,
  Plus,
  Crosshair,
  List,
  GitGraph,
  ArrowRight,
  ExternalLink,
  Filter,
  Layers,
} from 'lucide-react';
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
import { Tooltip } from '@/components/ui/Tooltip';
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
    <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-850 px-2 py-1 rounded">
      <span className="text-[9px] text-zinc-400 font-medium whitespace-nowrap">{label}</span>
      <button
        type="button"
        className="p-0.5 rounded border border-zinc-800 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30 transition-colors"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus size={10} />
      </button>
      <span className="text-[10px] text-zinc-200 w-4 text-center tabular-nums font-mono font-medium">
        {value}
      </span>
      <button
        type="button"
        className="p-0.5 rounded border border-zinc-800 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30 transition-colors"
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

type ViewMode = 'graph' | 'flat';

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
  const [viewMode, setViewMode] = useState<ViewMode>('graph');

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

  // Compute metrics for quick inspection
  const rootEdges = index?.get(referenceRootGraphId);
  const referencersCount = rootEdges?.incoming.length ?? 0;
  const dependenciesCount = rootEdges?.outgoing.length ?? 0;
  const totalGraphsCount = functions.length + 1;

  return (
    <PanelGroup orientation="horizontal" className="w-full h-full bg-zinc-950 font-sans">
      <Panel id="ref-left" defaultSize={18} minSize={14}>
        <GraphExplorer mode="references" />
      </Panel>

      <PanelResizeHandle className="w-1 cursor-col-resize bg-zinc-950 border-x border-zinc-900 hover:bg-zinc-800 transition-colors" />

      <Panel id="ref-center" defaultSize={58} minSize={35}>
        <div className="w-full h-full flex flex-col min-h-0">
          {/* Top Control Header */}
          <div className="shrink-0 border-b border-zinc-900 bg-zinc-950">
            {/* Navigation path & metrics bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-900/80 bg-zinc-900/30">
              <div className="flex items-center gap-2 min-w-0">
                <Tooltip content="Reset focus to current asset" placement="bottom">
                  <button
                    type="button"
                    className="p-1 rounded text-zinc-400 hover:text-amber-400 hover:bg-zinc-850 transition-colors"
                    onClick={() => selectReferenceGraph(referenceRootGraphId)}
                  >
                    <Crosshair size={13} />
                  </button>
                </Tooltip>

                <div className="flex items-center gap-1.5 text-[11px] text-zinc-300 font-mono truncate">
                  <span className="text-zinc-500">{projectDetails.moduleName}</span>
                  <span className="text-zinc-700">/</span>
                  <span className="font-semibold text-zinc-100 truncate">{rootLabel}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 text-[10px] text-zinc-400 bg-zinc-900 px-2 py-1 rounded border border-zinc-850 font-mono">
                  <span>Referencers: <strong className="text-emerald-400 font-medium">{referencersCount}</strong></span>
                  <span className="text-zinc-700">|</span>
                  <span>Dependencies: <strong className="text-indigo-400 font-medium">{dependenciesCount}</strong></span>
                  <span className="text-zinc-700">|</span>
                  <span>Total Graphs: <strong className="text-zinc-200 font-medium">{totalGraphsCount}</strong></span>
                </div>

                <button
                  type="button"
                  onClick={() => openGraphAndEdit(referenceRootGraphId)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-zinc-200 text-[10px] font-medium rounded transition-colors"
                >
                  <ExternalLink size={11} />
                  Open in Canvas
                </button>
              </div>
            </div>

            {/* Stepper controls & layout mode toggle */}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2">
              <div className="flex items-center gap-3 flex-wrap">
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
              </div>

              <div className="flex items-center gap-3">
                {/* Type Filter Badges */}
                <div className="flex items-center gap-1">
                  <Filter size={11} className="text-zinc-500 mr-1" />
                  {TYPE_FILTER_OPTIONS.map((opt) => {
                    const active = typeFilters.has(opt.id);
                    return (
                      <Tooltip key={opt.id} content={`Toggle ${opt.label} visibility`} placement="bottom">
                        <button
                          type="button"
                          className={`px-2 py-0.5 rounded text-[9px] font-medium border transition-colors ${
                            active
                              ? 'border-zinc-700 bg-zinc-850 text-zinc-200'
                              : 'border-zinc-900 text-zinc-600 opacity-40 hover:opacity-70'
                          }`}
                          style={active ? { borderLeftColor: opt.color, borderLeftWidth: 3 } : undefined}
                          onClick={() => toggleTypeFilter(opt.id)}
                        >
                          {opt.label}
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center gap-0.5 bg-zinc-900 border border-zinc-850 rounded p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('graph')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      viewMode === 'graph'
                        ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <GitGraph size={12} />
                    Graph
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('flat')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      viewMode === 'flat'
                        ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <List size={12} />
                    Tree List
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas or Flat List View */}
          <div className="flex-1 min-h-0 relative">
            {viewMode === 'graph' ? (
              <ReactFlowProvider>
                <ReferenceGraphCanvas
                  depths={depths}
                  typeFilters={typeFilters}
                  index={index}
                  onOpenGraph={openGraphAndEdit}
                  onSelectGraph={selectReferenceGraph}
                />
              </ReactFlowProvider>
            ) : (
              <div className="w-full h-full overflow-y-auto p-4 bg-zinc-950 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <h3 className="text-[12px] font-medium text-zinc-300 flex items-center gap-1.5">
                    <Layers size={14} className="text-zinc-500" />
                    Reference Dependency & Referencers List
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Showing relationships for {rootLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Referencers list */}
                  <div className="bg-zinc-900/40 border border-zinc-900 rounded p-3 space-y-2">
                    <h4 className="text-[11px] font-medium text-emerald-400 flex items-center justify-between">
                      <span>Referenced By ({referencersCount})</span>
                      <ArrowRight size={12} className="rotate-180 text-zinc-500" />
                    </h4>
                    {referencersCount > 0 ? (
                      <div className="space-y-1">
                        {rootEdges?.incoming.map((ref, i) => (
                          <div
                            key={`${ref.fromGraphId}:${ref.kind}:${i}`}
                            onClick={() => selectReferenceGraph(ref.fromGraphId)}
                            onDoubleClick={() => openGraphAndEdit(ref.fromGraphId)}
                            className="p-2 bg-zinc-950 border border-zinc-850 hover:border-zinc-700 rounded text-[11px] font-mono text-zinc-300 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <span>{formatReferenceEndpoint(ref.fromGraphId, openTabs, functions)}</span>
                            <span className="text-[9px] bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-800">
                              {ref.kind}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-zinc-600 italic">No incoming referencers found.</p>
                    )}
                  </div>

                  {/* Dependencies list */}
                  <div className="bg-zinc-900/40 border border-zinc-900 rounded p-3 space-y-2">
                    <h4 className="text-[11px] font-medium text-indigo-400 flex items-center justify-between">
                      <span>Depends On ({dependenciesCount})</span>
                      <ArrowRight size={12} className="text-zinc-500" />
                    </h4>
                    {dependenciesCount > 0 ? (
                      <div className="space-y-1">
                        {rootEdges?.outgoing.map((ref, i) => (
                          <div
                            key={`${ref.toGraphId}:${ref.kind}:${i}`}
                            onClick={() => selectReferenceGraph(ref.toGraphId)}
                            onDoubleClick={() => openGraphAndEdit(ref.toGraphId)}
                            className="p-2 bg-zinc-950 border border-zinc-850 hover:border-zinc-700 rounded text-[11px] font-mono text-zinc-300 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <span>{formatReferenceEndpoint(ref.toGraphId, openTabs, functions)}</span>
                            <span className="text-[9px] bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-800">
                              {ref.kind}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-zinc-600 italic">No outgoing dependencies found.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Panel>

      <PanelResizeHandle className="w-1 cursor-col-resize bg-zinc-950 border-x border-zinc-900 hover:bg-zinc-800 transition-colors" />

      <Panel id="ref-right" defaultSize={24} minSize={16}>
        <div className="w-full h-full flex flex-col bg-zinc-950 border-l border-zinc-900 min-h-0">
          <div className="shrink-0 px-3 py-2 border-b border-zinc-900 space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Reference tree
            </div>
            <input
              type="search"
              value={treeQuery}
              onChange={(e) => setTreeQuery(e.target.value)}
              placeholder="Filter graphs…"
              className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-700"
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
