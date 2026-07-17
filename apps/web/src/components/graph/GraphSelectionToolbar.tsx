'use client';

import React, { useCallback, useMemo } from 'react';
import { Copy, Trash2, MessageSquarePlus, Ungroup, Cable, Unplug } from 'lucide-react';
import { useReactFlow, useStore, ViewportPortal } from '@xyflow/react';
import { dispatchGraphAction } from '@/lib/graphActions';
import { shortcutTitle } from '@/lib/graphShortcuts';
import { useGraphNodeSelectionFromStore } from '@/hooks/useGraphNodeSelection';
import { findBestAutoConnect } from '@/lib/graphAutoConnect';
import type { VVSEdge, VVSNode } from '@/types/graph';
import { Tooltip } from '@/components/ui/Tooltip';
import styles from './GraphSelectionToolbar.module.css';

export function GraphSelectionToolbar() {
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

  const canDisconnect =
    edgeSelectionCount > 0 ||
    selection.selectedNodes.some((n) =>
      (getEdges() as VVSEdge[]).some((e) => e.source === n.id || e.target === n.id)
    );

  if (!selection.isVisible || !selection.anchorFlowPoint) return null;

  const { x, y } = selection.anchorFlowPoint;

  return (
    <ViewportPortal>
      <div
        className={`${styles.toolbar} nodrag nopan nowheel`}
        style={{ left: x, top: y }}
        role="toolbar"
        aria-label="Node selection actions"
      >
        {selection.count > 1 ? (
          <>
            <span className={styles.count}>{selection.count} selected</span>
            <div className={styles.divider} />
          </>
        ) : null}
        {canAutoConnect ? (
          <Tooltip content="Auto-connect compatible pins" placement="bottom">
            <button
              type="button"
              className={styles.button}
              aria-label="Auto-connect selected nodes"
              onClick={() => dispatchGraphAction('auto-connect-selection')}
            >
              <Cable size={14} />
            </button>
          </Tooltip>
        ) : null}
        {canDisconnect ? (
          <Tooltip content={shortcutTitle('disconnect')} placement="bottom">
            <button
              type="button"
              className={styles.button}
              aria-label="Disconnect selection"
              onClick={() => dispatchGraphAction('disconnect-selection')}
            >
              <Unplug size={14} />
            </button>
          </Tooltip>
        ) : null}
        {(canAutoConnect || canDisconnect) && <div className={styles.divider} />}
        <Tooltip content={shortcutTitle('duplicate')} placement="bottom">
          <button
            type="button"
            className={styles.button}
            aria-label="Duplicate selection"
            onClick={() => dispatchGraphAction('duplicate')}
          >
            <Copy size={14} />
          </button>
        </Tooltip>
        {selection.canGroup ? (
          <Tooltip content={shortcutTitle('group-comment')} placement="bottom">
            <button
              type="button"
              className={styles.button}
              aria-label="Comment selection"
              onClick={() => dispatchGraphAction('group-comment')}
            >
              <MessageSquarePlus size={14} />
            </button>
          </Tooltip>
        ) : null}
        {selection.canUngroup ? (
          <Tooltip content={shortcutTitle('ungroup-comment')} placement="bottom">
            <button
              type="button"
              className={styles.button}
              aria-label="Release from comment"
              onClick={() => dispatchGraphAction('ungroup-comment')}
            >
              <Ungroup size={14} />
            </button>
          </Tooltip>
        ) : null}
        <div className={styles.divider} />
        <Tooltip content={shortcutTitle('delete')} placement="bottom">
          <button
            type="button"
            className={`${styles.button} ${styles.buttonDanger}`}
            aria-label="Delete selection"
            onClick={() => dispatchGraphAction('delete-selection')}
          >
            <Trash2 size={14} />
          </button>
        </Tooltip>
      </div>
    </ViewportPortal>
  );
}
