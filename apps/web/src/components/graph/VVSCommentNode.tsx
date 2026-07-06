'use client';

import React from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { VVSNodeData } from '@/types/graph';
import styles from './VVSCommentNode.module.css';

export function VVSCommentNode({
  selected,
  data,
}: NodeProps<import('@xyflow/react').Node<VVSNodeData>>) {
  const isSelected = Boolean(selected);
  const customBorder = !isSelected && data.commentColor ? `${data.commentColor}99` : undefined;

  return (
    <>
      <NodeResizer
        color={isSelected ? 'var(--vvs-node-border-selected)' : '#3f3f46'}
        isVisible={isSelected}
        minWidth={200}
        minHeight={100}
      />
      <div
        className={`${styles.container} ${isSelected ? styles.containerSelected : ''}`}
        style={{
          ...(customBorder ? { borderColor: customBorder } : {}),
          ...(data.commentColor ? { backgroundColor: `${data.commentColor}14` } : {}),
        }}
      >
        <div className={styles.header}>{data.label || 'Comment Box'}</div>
        <div className={styles.body} />
      </div>
    </>
  );
}
