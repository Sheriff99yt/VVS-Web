'use client';

import React, { useCallback, useMemo } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useReactFlow, useStore, ViewportPortal } from '@xyflow/react';
import { dispatchGraphAction, type GraphAction } from '@/lib/graphActions';
import { shortcutTitle } from '@/lib/graphShortcuts';
import { useGraphNodeSelectionFromStore } from '@/hooks/useGraphNodeSelection';
import { findBestAutoConnect } from '@/lib/graphAutoConnect';
import {
  buildNodeActionContext,
  quickActionDescriptors,
} from '@/lib/nodeActionRegistry';
import type { VVSEdge, VVSNode } from '@/types/graph';
import { Tooltip } from '@/components/ui/Tooltip';
import styles from './GraphSelectionToolbar.module.css';

/**
 * Compact Quick Actions strip above the selection.
 * Full ops live in Node Actions via ⋯ More (owned by GraphCanvas) or node right-click.
 */
export function GraphSelectionToolbar({
  onOpenMoreActions,
}: {
  /** Opens the shared Node Actions menu at screen coords. */
  onOpenMoreActions?: (screen: { x: number; y: number }) => void;
} = {}) {
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

  const quickItems = useMemo(() => quickActionDescriptors(ctx), [ctx]);

  if (!selection.isVisible || !selection.anchorFlowPoint) return null;

  const { x, y } = selection.anchorFlowPoint;

  return (
    <ViewportPortal>
      <div
        className={`${styles.toolbar} nodrag nopan nowheel`}
        style={{ left: x, top: y }}
        role="toolbar"
        aria-label="Quick actions"
      >
        {selection.count > 1 ? (
          <>
            <span className={styles.count}>{selection.count}</span>
            <div className={styles.divider} />
          </>
        ) : null}
        {quickItems.map((item, index) => {
          const Icon = item.icon;
          if (!Icon) return null;
          const prev = quickItems[index - 1];
          const showDivider = Boolean(prev && prev.section !== item.section);
          const tip = item.shortcutId
            ? shortcutTitle(item.shortcutId)
            : item.shortcutHint
              ? `${item.label} (${item.shortcutHint})`
              : item.label;
          return (
            <React.Fragment key={item.id}>
              {showDivider ? <div className={styles.divider} /> : null}
              <Tooltip content={tip} placement="bottom">
                <button
                  type="button"
                  className={`${styles.button} ${item.danger ? styles.buttonDanger : ''}`}
                  aria-label={item.label}
                  onClick={() => dispatchGraphAction(item.id as GraphAction)}
                >
                  <Icon size={14} />
                </button>
              </Tooltip>
            </React.Fragment>
          );
        })}
        {onOpenMoreActions ? (
          <>
            <div className={styles.divider} />
            <Tooltip content="More node actions" placement="bottom">
              <button
                type="button"
                className={styles.button}
                aria-label="More node actions"
                onClick={(e) => {
                  const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                  onOpenMoreActions({ x: rect.left, y: rect.bottom + 4 });
                }}
              >
                <MoreHorizontal size={14} />
              </button>
            </Tooltip>
          </>
        ) : null}
      </div>
    </ViewportPortal>
  );
}
