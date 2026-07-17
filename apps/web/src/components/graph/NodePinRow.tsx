'use client';

import React, { useCallback } from 'react';
import { Handle, Position, useStore, type Edge } from '@xyflow/react';
import type { PinDefinition } from '@/types/graph';
import { isPinWired } from '@/lib/graphVirtualization';
import { NodePinInlineWidget } from './NodePinInlineWidget';
import styles from './VVSNode.module.css';

interface NodePinRowProps {
  nodeId: string;
  pin: PinDefinition;
  direction: 'input' | 'output';
  inlineValue?: string | number | boolean;
  onInlineChange?: (pinId: string, value: string | number | boolean) => void;
}

/** Subscribe to a boolean only — avoid re-rendering every pin when any edge array identity changes (U83). */
function usePinWired(nodeId: string, pinId: string, direction: 'input' | 'output'): boolean {
  return useStore(
    useCallback(
      (state: { edges: Edge[] }) => isPinWired(state.edges, nodeId, pinId, direction),
      [nodeId, pinId, direction]
    )
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
