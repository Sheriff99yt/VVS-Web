'use client';

import React, { useCallback } from 'react';
import { Copy, Trash2, MessageSquarePlus, Ungroup } from 'lucide-react';
import { useReactFlow, ViewportPortal } from '@xyflow/react';
import { dispatchGraphAction } from '@/lib/graphActions';
import { shortcutTitle } from '@/lib/graphShortcuts';
import { useGraphNodeSelectionFromStore } from '@/hooks/useGraphNodeSelection';
import { Tooltip } from '@/components/ui/Tooltip';
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
