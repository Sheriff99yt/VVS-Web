'use client';

import React from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';
import { VVSEdgeData } from '@/types/graph';
import styles from './VVSEdge.module.css';

export function VVSEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected
}: EdgeProps<import('@xyflow/react').Edge<VVSEdgeData>>) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const pinType = data?.pinType || 'data_any';
  
  return (
    <>
      <BaseEdge 
        id={id} 
        path={edgePath} 
        className={`${styles.edgeBase} ${selected ? styles.edgeSelected : ''}`}
        data-pintype={pinType}
      />
      {/* Invisible wider edge for easier selection/hover */}
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={20}
        className="react-flow__edge-interaction"
      />
    </>
  );
}

export const VVSEdge = React.memo(VVSEdgeComponent);
