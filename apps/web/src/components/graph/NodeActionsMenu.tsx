'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useReactFlow, useStore } from '@xyflow/react';
import { dispatchGraphAction, type GraphAction } from '@/lib/graphActions';
import { shortcutKeys } from '@/lib/graphShortcuts';
import { paneMenuPosition } from '@/lib/paneMenuPosition';
import { findBestAutoConnect } from '@/lib/graphAutoConnect';
import { useGraphNodeSelectionFromStore } from '@/hooks/useGraphNodeSelection';
import {
  buildNodeActionContext,
  contextMenuSections,
  type NodeMenuActionId,
} from '@/lib/nodeActionRegistry';
import type { VVSEdge, VVSNode } from '@/types/graph';

function actionHint(shortcutId?: string, shortcutHint?: string): string {
  if (shortcutHint) return shortcutHint;
  if (!shortcutId) return '';
  return shortcutKeys(shortcutId as Parameters<typeof shortcutKeys>[0]);
}

/**
 * Full node edit menu (right-click or Quick Actions → More).
 * Spawn catalog stays in NodeContextMenu — use onAddNode for “Add node…”.
 */
export function NodeActionsMenu({
  x,
  y,
  onClose,
  onAddNode,
}: {
  x: number;
  y: number;
  onClose: () => void;
  /** Opens the spawn catalog at this menu’s screen position. */
  onAddNode?: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const { getInternalNode, getNodes, getEdges } = useReactFlow();
  const getAbsolutePosition = useCallback(
    (nodeId: string) => getInternalNode(nodeId)?.internals.positionAbsolute,
    [getInternalNode]
  );
  const selection = useGraphNodeSelectionFromStore(getAbsolutePosition);
  const edgeSelectionCount = useStore(
    useCallback(
      (state: { edges: readonly { selected?: boolean }[] }) =>
        state.edges.filter((e) => e.selected).length,
      []
    )
  );

  const canAutoConnect = useMemo(() => {
    if (selection.count !== 2) return false;
    const nodes = getNodes() as VVSNode[];
    const edges = getEdges() as VVSEdge[];
    const selected = selection.selectedNodes;
    if (selected.length !== 2) return false;
    return findBestAutoConnect(selected[0]!, selected[1]!, edges, nodes) != null;
  }, [selection.count, selection.selectedNodes, getNodes, getEdges]);

  const ctx = useMemo(() => {
    const edges = getEdges() as VVSEdge[];
    const base = buildNodeActionContext({
      selectedNodes: selection.selectedNodes,
      allEdges: edges,
      canGroup: selection.canGroup,
      canUngroup: selection.canUngroup,
      canAutoConnect,
    });
    if (edgeSelectionCount > 0 && !base.canDisconnect) {
      return { ...base, canDisconnect: true };
    }
    return base;
  }, [selection, getEdges, canAutoConnect, edgeSelectionCount]);

  const sections = useMemo(() => contextMenuSections(ctx), [ctx]);
  const approxH = sections.reduce((h, s) => h + 22 + s.items.length * 32, 16);
  const pos = paneMenuPosition(x, y, 260, approxH);

  useEffect(() => {
    let armed = false;
    const armId = window.setTimeout(() => {
      armed = true;
    }, 0);

    const onPointerDown = (event: PointerEvent) => {
      if (!armed) return;
      const root = rootRef.current;
      if (root && root.contains(event.target as Node)) return;
      onCloseRef.current();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
    };

    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(armId);
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const run = (id: NodeMenuActionId) => {
    if (id === 'add-node') {
      onAddNode?.();
      onCloseRef.current();
      return;
    }
    if (id === 'select-chain-downstream') {
      dispatchGraphAction(id, { allowLayoutArm: false });
    } else {
      dispatchGraphAction(id as GraphAction);
    }
    onCloseRef.current();
  };

  return (
    <div
      ref={rootRef}
      className="fixed z-[1100] w-[260px] max-h-[min(70vh,480px)] overflow-y-auto rounded-md border border-zinc-700 bg-zinc-950 shadow-xl shadow-black/50 text-xs text-zinc-100"
      style={{ top: pos.y, left: pos.x }}
      onClick={(e) => e.stopPropagation()}
      role="menu"
      aria-label="Node actions"
    >
      {sections.map((section, sectionIndex) => (
        <div key={section.section} className={sectionIndex > 0 ? 'border-t border-zinc-800' : ''}>
          <div className="px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            {section.label}
          </div>
          {section.items.map((item) => {
            const Icon = item.icon;
            const hint = actionHint(item.shortcutId, item.shortcutHint);
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-zinc-800 ${
                  item.danger ? 'text-red-300 hover:text-red-200' : 'text-zinc-100'
                }`}
                onClick={() => run(item.id)}
              >
                {Icon ? (
                  <Icon size={14} className="shrink-0 text-zinc-400" aria-hidden />
                ) : (
                  <span className="w-3.5 shrink-0" aria-hidden />
                )}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {hint ? (
                  <span className="shrink-0 font-mono text-[10px] text-zinc-500">{hint}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
