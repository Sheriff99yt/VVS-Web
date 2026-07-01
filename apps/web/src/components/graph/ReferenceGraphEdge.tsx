'use client';

import React from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from '@xyflow/react';
import type { GraphReferenceKind } from '@/lib/graphRelations';
import styles from './VVSEdge.module.css';

interface ReferenceEdgeData extends Record<string, unknown> {
  kind: GraphReferenceKind;
  pinType: string;
}

export function ReferenceGraphEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  data,
  selected,
}: EdgeProps<import('@xyflow/react').Edge<ReferenceEdgeData>>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const pinType = data?.pinType ?? 'data_any';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={`${styles.edgeBase} ${selected ? styles.edgeSelected : ''}`}
        data-pintype={pinType}
      />
      {label ? (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="px-1.5 py-0.5 rounded bg-zinc-900/95 border border-zinc-700/80 text-[9px] text-zinc-400 max-w-[120px] truncate"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
