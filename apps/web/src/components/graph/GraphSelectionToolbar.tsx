'use client';

import React, { useCallback } from 'react';
import { useReactFlow, ViewportPortal } from '@xyflow/react';
import { Copy, Trash2, MessageSquarePlus, Ungroup } from 'lucide-react';
import { dispatchGraphAction } from '@/lib/graphActions';
import { shortcutTitle } from '@/lib/graphShortcuts';
import { useGraphNodeSelectionFromStore } from '@/hooks/useGraphNodeSelection';
import styles from './GraphSelectionToolbar.module.css';

export function GraphSelectionToolbar() {
  const { getInternalNode } = useReactFlow();

  const getAbsolutePosition = useCallback(
    (nodeId: string) => getInternalNode(nodeId)?.internals.positionAbsolute,
    [getInternalNode]
  );

  const selection = useGraphNodeSelectionFromStore(getAbsolutePosition);

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
        <button
          type="button"
          className={styles.button}
          title={shortcutTitle('duplicate')}
          aria-label="Duplicate selection"
          onClick={() => dispatchGraphAction('duplicate')}
        >
          <Copy size={14} />
        </button>
        {selection.canGroup ? (
          <button
            type="button"
            className={styles.button}
            title={shortcutTitle('group-comment')}
            aria-label="Group selection in comment"
            onClick={() => dispatchGraphAction('group-comment')}
          >
            <MessageSquarePlus size={14} />
          </button>
        ) : null}
        {selection.canUngroup ? (
          <button
            type="button"
            className={styles.button}
            title={shortcutTitle('ungroup-comment')}
            aria-label="Ungroup selection from comment"
            onClick={() => dispatchGraphAction('ungroup-comment')}
          >
            <Ungroup size={14} />
          </button>
        ) : null}
        <div className={styles.divider} />
        <button
          type="button"
          className={`${styles.button} ${styles.buttonDanger}`}
          title={shortcutTitle('delete')}
          aria-label="Delete selection"
          onClick={() => dispatchGraphAction('delete-selection')}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </ViewportPortal>
  );
}
