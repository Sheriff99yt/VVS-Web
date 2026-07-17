'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Minus, Plus } from 'lucide-react';
import type { GraphTab } from '@/contexts/ProjectContext';
import {
  buildReferenceIndex,
  formatReferenceEndpoint,
  referenceKindLabel,
  type GraphReference,
} from '@/lib/graphRelations';
import {
  buildReferenceTree,
  countTreeNodes,
  filterReferenceTreeByName,
  REFERENCE_DEPTH_DEFAULT,
  REFERENCE_DEPTH_MAX,
  REFERENCE_DEPTH_MIN,
  type ReferenceTreeDirection,
  type ReferenceTreeNode,
} from '@/lib/referenceTree';

interface ReferenceGraphTreeProps {
  rootGraphId: string;
  index: ReturnType<typeof buildReferenceIndex>;
  openTabs: GraphTab[];
  functions: { id: string; name: string }[];
  onOpenGraph: (graphId: string) => void;
  onSelectGraph?: (graphId: string) => void;
  depth?: number;
  onDepthChange?: (depth: number) => void;
  direction?: ReferenceTreeDirection;
  onDirectionChange?: (direction: ReferenceTreeDirection) => void;
  hideControls?: boolean;
  /** Case-insensitive substring filter on graph display names (thin U89). */
  nameFilter?: string;
}

function edgeCaption(ref: GraphReference): string {
  if (ref.kind === 'uses_variable') {
    return ref.label.replace(/^Shared variable:\s*/, '');
  }
  if (ref.kind === 'calls') return ref.label.replace(/^Calls\s*/, '');
  if (ref.kind === 'imports') return ref.label.replace(/^Uses macro:\s*/, '');
  if (ref.kind === 'module_import') return ref.label.replace(/^Imports module:\s*/, '');
  if (ref.kind === 'shared_event') return ref.label.replace(/^Shared event:\s*/, '');
  return ref.label;
}

function TreeBranch({
  node,
  rootId,
  activeRootId,
  direction,
  openTabs,
  functions,
  onOpenGraph,
  onSelectGraph,
  defaultExpanded,
}: {
  node: ReferenceTreeNode;
  rootId: string;
  activeRootId: string;
  direction: 'dependencies' | 'referencers';
  openTabs: GraphTab[];
  functions: { id: string; name: string }[];
  onOpenGraph: (graphId: string) => void;
  onSelectGraph?: (graphId: string) => void;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const label = formatReferenceEndpoint(node.graphId, openTabs, functions);
  const isRoot = node.graphId === rootId && node.depth === 0;
  const hasChildren = node.children.length > 0;
  const canExpand = hasChildren || node.truncated || node.cyclic;

  return (
    <div className="relative">
      <div
        className={`flex items-start gap-1 py-0.5 pr-2 rounded-sm group ${
          node.graphId === activeRootId ? 'bg-zinc-800/60' : 'hover:bg-zinc-900/80'
        }`}
        style={{ paddingLeft: `${8 + node.depth * 14}px` }}
      >
        {canExpand ? (
          <button
            type="button"
            className="mt-0.5 p-0 text-zinc-500 hover:text-zinc-300 shrink-0"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
        ) : (
          <span className="w-[11px] shrink-0" />
        )}

        <button
          type="button"
          className="flex-1 min-w-0 text-left"
          onClick={() => (onSelectGraph ?? onOpenGraph)(node.graphId)}
          onDoubleClick={(e) => {
            e.preventDefault();
            onOpenGraph(node.graphId);
          }}
          title="Click to focus · Double-click to open in Canvas"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isRoot ? 'bg-indigo-400' : direction === 'dependencies' ? 'bg-emerald-500/80' : 'bg-amber-500/80'
              }`}
            />
            <span
              className={`text-[10px] truncate ${
                isRoot ? 'text-zinc-100 font-medium' : 'text-zinc-400 group-hover:text-zinc-200'
              }`}
            >
              {label}
            </span>
          </div>
          {node.viaRef && (
            <div className="text-[9px] text-zinc-600 truncate mt-0.5 pl-3">
              {direction === 'dependencies' ? '→' : '←'} {edgeCaption(node.viaRef)}
              <span className="text-zinc-700 ml-1">({referenceKindLabel(node.viaRef.kind)})</span>
            </div>
          )}
          {node.cyclic && (
            <div className="text-[9px] text-amber-600/90 italic mt-0.5 pl-3">Circular reference</div>
          )}
          {node.truncated && !hasChildren && (
            <div className="text-[9px] text-zinc-600 italic mt-0.5 pl-3">Increase depth to see more</div>
          )}
        </button>
      </div>

      {expanded && hasChildren && (
        <div className="border-l border-zinc-800/80 ml-[18px]" style={{ marginLeft: `${18 + node.depth * 14}px` }}>
          {node.children.map((child) => (
            <TreeBranch
              key={`${child.graphId}-${child.depth}-${child.viaRef?.kind ?? ''}-${child.viaRef?.label ?? ''}`}
              node={child}
              rootId={rootId}
              activeRootId={activeRootId}
              direction={direction}
              openTabs={openTabs}
              functions={functions}
              onOpenGraph={onOpenGraph}
              onSelectGraph={onSelectGraph}
              defaultExpanded={child.depth < 2}
            />
          ))}
        </div>
      )}

      {expanded && node.truncated && hasChildren && (
        <div
          className="text-[9px] text-zinc-600 italic py-0.5"
          style={{ paddingLeft: `${22 + (node.depth + 1) * 14}px` }}
        >
          … more at greater depth
        </div>
      )}
    </div>
  );
}

function TreeSection({
  title,
  tree,
  rootId,
  activeRootId,
  direction,
  openTabs,
  functions,
  onOpenGraph,
  onSelectGraph,
}: {
  title: string;
  tree: ReferenceTreeNode;
  rootId: string;
  activeRootId: string;
  direction: 'dependencies' | 'referencers';
  openTabs: GraphTab[];
  functions: { id: string; name: string }[];
  onOpenGraph: (graphId: string) => void;
  onSelectGraph?: (graphId: string) => void;
}) {
  const childCount = countTreeNodes(tree) - 1;

  return (
    <div className="mb-2">
      <div className="px-3 py-1 text-[9px] font-semibold uppercase tracking-wide text-zinc-600">
        {title}
        {childCount > 0 ? <span className="font-normal text-zinc-700"> · {childCount} nodes</span> : null}
      </div>
      {childCount === 0 && tree.depth === 0 && tree.children.length === 0 ? (
        <div className="px-3 py-1 text-[10px] text-zinc-600 italic">None</div>
      ) : (
        <TreeBranch
          node={tree}
          rootId={rootId}
          activeRootId={activeRootId}
          direction={direction}
          openTabs={openTabs}
          functions={functions}
          onOpenGraph={onOpenGraph}
          onSelectGraph={onSelectGraph}
          defaultExpanded
        />
      )}
    </div>
  );
}

export function ReferenceGraphTree({
  rootGraphId,
  index,
  openTabs,
  functions,
  onOpenGraph,
  onSelectGraph,
  depth: depthProp,
  onDepthChange,
  direction: directionProp,
  onDirectionChange,
  hideControls = false,
  nameFilter = '',
}: ReferenceGraphTreeProps) {
  const [depthInternal, setDepthInternal] = useState(REFERENCE_DEPTH_DEFAULT);
  const [directionInternal, setDirectionInternal] = useState<ReferenceTreeDirection>('both');

  const depth = depthProp ?? depthInternal;
  const direction = directionProp ?? directionInternal;
  const setDepth = onDepthChange ?? setDepthInternal;
  const setDirection = onDirectionChange ?? setDirectionInternal;

  const result = useMemo(
    () => buildReferenceTree(rootGraphId, index, direction, depth),
    [rootGraphId, index, direction, depth]
  );

  const labelFor = useCallback(
    (graphId: string) => formatReferenceEndpoint(graphId, openTabs, functions),
    [openTabs, functions]
  );

  const filtered = useMemo(() => {
    const q = nameFilter.trim();
    if (!q) return { ...result, emptyFilter: false as const };
    const tree = filterReferenceTreeByName(result.tree, q, labelFor);
    const referencersTree = result.referencersTree
      ? filterReferenceTreeByName(result.referencersTree, q, labelFor)
      : undefined;
    const emptyFilter = !tree && !referencersTree;
    return {
      ...result,
      tree: tree ?? { ...result.tree, children: [] },
      referencersTree: referencersTree ?? undefined,
      emptyFilter,
    };
  }, [result, nameFilter, labelFor]);

  const rootLabel = formatReferenceEndpoint(rootGraphId, openTabs, functions);

  return (
    <div className="flex flex-col min-h-0">
      {!hideControls && (
        <div className="px-2 py-2 space-y-2 border-b border-zinc-800/80 bg-zinc-950/80 sticky top-0 z-10">
          <div className="text-[10px] text-zinc-500">
            Root: <span className="text-zinc-300">{rootLabel}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] uppercase tracking-wide text-zinc-600 shrink-0">Depth</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-1 rounded border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30"
                disabled={depth <= REFERENCE_DEPTH_MIN}
                onClick={() => setDepth(Math.max(REFERENCE_DEPTH_MIN, depth - 1))}
                title="Decrease search depth"
              >
                <Minus size={11} />
              </button>
              <span className="text-[11px] text-zinc-200 w-6 text-center tabular-nums">{depth}</span>
              <button
                type="button"
                className="p-1 rounded border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30"
                disabled={depth >= REFERENCE_DEPTH_MAX}
                onClick={() => setDepth(Math.min(REFERENCE_DEPTH_MAX, depth + 1))}
                title="Increase search depth"
              >
                <Plus size={11} />
              </button>
            </div>
          </div>

          <div className="flex rounded border border-zinc-800 overflow-hidden text-[9px]">
            {(
              [
                ['dependencies', 'Dependencies'],
                ['referencers', 'Referencers'],
                ['both', 'Both'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`flex-1 py-1 px-1 transition-colors ${
                  direction === value
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
                onClick={() => setDirection(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`py-1 ${hideControls ? '' : 'max-h-[min(420px,50vh)]'} overflow-y-auto`}>
        {'emptyFilter' in filtered && filtered.emptyFilter ? (
          <div className="px-3 py-4 text-[11px] text-zinc-600">No graphs match “{nameFilter.trim()}”.</div>
        ) : direction === 'both' ? (
          <>
            <TreeSection
              title="Dependencies"
              tree={filtered.tree}
              rootId={rootGraphId}
              activeRootId={rootGraphId}
              direction="dependencies"
              openTabs={openTabs}
              functions={functions}
              onOpenGraph={onOpenGraph}
              onSelectGraph={onSelectGraph}
            />
            {filtered.referencersTree && (
              <TreeSection
                title="Referencers"
                tree={filtered.referencersTree}
                rootId={rootGraphId}
                activeRootId={rootGraphId}
                direction="referencers"
                openTabs={openTabs}
                functions={functions}
                onOpenGraph={onOpenGraph}
                onSelectGraph={onSelectGraph}
              />
            )}
          </>
        ) : (
          <TreeSection
            title={direction === 'dependencies' ? 'Dependencies' : 'Referencers'}
            tree={filtered.tree}
            rootId={rootGraphId}
            activeRootId={rootGraphId}
            direction={direction}
            openTabs={openTabs}
            functions={functions}
            onOpenGraph={onOpenGraph}
            onSelectGraph={onSelectGraph}
          />
        )}
      </div>
    </div>
  );
}
