'use client';

import React, { useMemo } from 'react';
import { Handle, Position, useStore, type Edge } from '@xyflow/react';
import type { PinDefinition } from '@/types/graph';
import { NodePinInlineWidget } from './NodePinInlineWidget';
import styles from './VVSNode.module.css';

interface NodePinRowProps {
  nodeId: string;
  pin: PinDefinition;
  direction: 'input' | 'output';
  inlineValue?: string | number | boolean;
  onInlineChange?: (pinId: string, value: string | number | boolean) => void;
}

const selectEdges = (state: { edges: Edge[] }) => state.edges;
const edgesEqual = (a: Edge[], b: Edge[]) => a === b;

function usePinWired(nodeId: string, pinId: string, direction: 'input' | 'output'): boolean {
  const edges = useStore(selectEdges, edgesEqual);
  return useMemo(
    () =>
      edges.some((edge) =>
        direction === 'input'
          ? edge.target === nodeId && edge.targetHandle === pinId
          : edge.source === nodeId && edge.sourceHandle === pinId
      ),
    [edges, nodeId, pinId, direction]
  );
}

export function NodePinRow({
  nodeId,
  pin,
  direction,
  inlineValue,
  onInlineChange,
}: NodePinRowProps) {
  const isWired = usePinWired(nodeId, pin.id, direction);
  const isExecution = pin.type === 'execution';
  const showInline =
    direction === 'input' && !isExecution && !isWired && onInlineChange !== undefined;

  return (
    <div className={styles.pinRow}>
      {direction === 'input' ? (
        <>
          <Handle
            type="target"
            position={Position.Left}
            id={pin.id}
            className={`${styles.handle} ${styles.handleLeft} ${isExecution ? styles.handleExecution : ''}`}
            data-pintype={pin.type}
          />
          {pin.label ? <span className={styles.pinLabel}>{pin.label}</span> : null}
          {showInline ? (
            <NodePinInlineWidget
              pin={pin}
              value={inlineValue}
              onChange={(next) => onInlineChange(pin.id, next)}
            />
          ) : null}
        </>
      ) : (
        <>
          {pin.label ? <span className={styles.pinLabel}>{pin.label}</span> : null}
          <Handle
            type="source"
            position={Position.Right}
            id={pin.id}
            className={`${styles.handle} ${styles.handleRight} ${isExecution ? styles.handleExecution : ''}`}
            data-pintype={pin.type}
          />
        </>
      )}
    </div>
  );
}
