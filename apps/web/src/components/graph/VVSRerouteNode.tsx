'use client';

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { VVSNodeData, PinType } from '@/types/graph';
import styles from './VVSRerouteNode.module.css';

export function VVSRerouteNodeComponent({
  data,
  selected,
}: NodeProps<import('@xyflow/react').Node<VVSNodeData>>) {
  const pinType = (data.pinType as PinType) || data.inputs[0]?.type || 'data_any';

  return (
    <div className={`${styles.reroute} ${selected ? styles.rerouteSelected : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className={styles.handle}
        data-pintype={pinType}
      />
      <div className={styles.dot} data-pintype={pinType} />
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className={styles.handle}
        data-pintype={pinType}
      />
    </div>
  );
}

export const VVSRerouteNode = React.memo(VVSRerouteNodeComponent);
