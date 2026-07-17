'use client';

import React, { useCallback } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { Lock, LockOpen, Maximize2 } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { useGraphEdit } from '@/contexts/GraphEditContext';
import {
  isCommentLocked,
  lockCommentMembers,
  resizeCommentToFitMembers,
  unlockCommentMembers,
} from '@/lib/graphCommentMembership';
import { VVSNodeData } from '@/types/graph';
import styles from './VVSCommentNode.module.css';

export function VVSCommentNode({
  id,
  selected,
  data,
}: NodeProps<import('@xyflow/react').Node<VVSNodeData>>) {
  const { setNodes, setNodesWithHistory } = useGraphEdit();
  const isSelected = Boolean(selected);
  const customBorder = !isSelected && data.commentColor ? `${data.commentColor}99` : undefined;
  const locked = Boolean(data.properties?.commentLocked);
  const memberCount = Array.isArray(data.properties?.commentMemberIds)
    ? (data.properties.commentMemberIds as unknown[]).length
    : 0;
  const label =
    (typeof data.properties?.commentText === 'string' && data.properties.commentText) ||
    data.label ||
    'Comment';

  const setLabel = useCallback(
    (next: string) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== id) return n;
          return {
            ...n,
            data: {
              ...n.data,
              label: next,
              properties: {
                ...(n.data.properties ?? {}),
                commentText: next,
              },
            },
          };
        })
      );
    },
    [id, setNodes]
  );

  const toggleLock = useCallback(() => {
    setNodesWithHistory((nds) => {
      const comment = nds.find((n) => n.id === id);
      if (!comment) return nds;
      return isCommentLocked(comment)
        ? unlockCommentMembers(nds, id)
        : lockCommentMembers(nds, id);
    });
  }, [id, setNodesWithHistory]);

  const resizeToFit = useCallback(() => {
    setNodesWithHistory((nds) => resizeCommentToFitMembers(nds, id));
  }, [id, setNodesWithHistory]);

  const containerClass = [
    styles.container,
    locked ? styles.containerLocked : styles.containerUnlocked,
    isSelected ? styles.containerSelected : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <NodeResizer
        color={isSelected ? 'var(--vvs-node-border-selected)' : '#3f3f46'}
        isVisible={isSelected}
        minWidth={200}
        minHeight={100}
      />
      <div
        className={containerClass}
        style={{
          ...(customBorder ? { borderColor: customBorder } : {}),
          ...(data.commentColor
            ? {
                backgroundColor: locked
                  ? `${data.commentColor}22`
                  : `${data.commentColor}12`,
              }
            : {}),
        }}
      >
        <div className={styles.header}>
          <input
            className={styles.titleInput}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="Comment"
            aria-label="Comment text"
          />
          {memberCount > 0 ? (
            <Tooltip content="Resize to fit members (Ctrl+Shift+M)" placement="top">
              <button
                type="button"
                className={styles.lockBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  resizeToFit();
                }}
                aria-label="Resize comment to fit members"
              >
                <Maximize2 size={12} />
              </button>
            </Tooltip>
          ) : null}
          <Tooltip
            content={
              locked
                ? 'Unlock — comment moves alone; members stay put (L)'
                : 'Lock — adopt nodes currently inside the comment body (L)'
            }
            placement="top"
          >
            <button
              type="button"
              className={styles.lockBtn}
              onClick={(e) => {
                e.stopPropagation();
                toggleLock();
              }}
              aria-pressed={locked}
            >
              {locked ? <Lock size={12} /> : <LockOpen size={12} />}
            </button>
          </Tooltip>
        </div>
        <div className={styles.body} />
      </div>
    </>
  );
}
