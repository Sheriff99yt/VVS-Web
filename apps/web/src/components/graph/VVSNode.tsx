'use client';

import React from 'react';
import { Handle, Position, NodeProps, NodeToolbar } from '@xyflow/react';
import { VVSNodeData, PinDefinition } from '@/types/graph';
import { Copy, Trash2, MessageSquarePlus } from 'lucide-react';
import { dispatchGraphAction, dispatchNodeAction } from '@/lib/graphActions';
import { linkedGraphTargetLabel } from '@/lib/linkedGraphNodes';
import styles from './VVSNode.module.css';

export function VVSNodeComponent({ id, data, selected }: NodeProps<import('@xyflow/react').Node<VVSNodeData>>) {
  const linkedTargetLabel = linkedGraphTargetLabel(data);
  const isImportNode = data.linkKind === 'import_module';
  const hasPins = data.inputs.length > 0 || data.outputs.length > 0;

  return (
    <>
      <NodeToolbar
        isVisible={selected}
        position={Position.Top}
        className="flex gap-1 p-1 bg-zinc-900 border border-zinc-700 rounded-md shadow-xl"
      >
        <button
          onClick={() => dispatchNodeAction('duplicate-node', id)}
          className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors"
          title="Duplicate"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={() => dispatchGraphAction('group-comment')}
          className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors"
          title="Group in Comment"
        >
          <MessageSquarePlus size={14} />
        </button>
        <div className="w-px bg-zinc-800 my-1 mx-0.5" />
        <button
          onClick={() => dispatchNodeAction('delete-node', id)}
          className="p-1.5 hover:bg-red-900/50 text-red-400 hover:text-red-300 rounded transition-colors"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </NodeToolbar>

      <div
        className={`${styles.nodeContainer} ${selected ? styles.nodeContainerSelected : ''} ${data.isSimulating ? styles.nodeSimulating : ''}`}
        data-category={data.category}
      >
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <span className={styles.title}>{data.label}</span>
            {linkedTargetLabel && (
              <span
                className={`${styles.linkedSubtitle} ${isImportNode ? styles.linkedSubtitleImport : ''}`}
                title={isImportNode ? 'Double-click to open module' : 'Double-click to open graph'}
              >
                {isImportNode ? `↳ ${linkedTargetLabel}` : `→ ${linkedTargetLabel}`}
              </span>
            )}
          </div>
        </div>

        <div className={`${styles.body} ${!hasPins ? styles.bodyPinless : ''}`}>
          <div className={`${styles.column} ${styles.leftColumn}`}>
            {data.inputs.map((input: PinDefinition) => {
              const hasInlineValue =
                input.type !== 'execution' && data.inlineValues && data.inlineValues[input.id] !== undefined;
              const inlineValueStr = hasInlineValue ? String(data.inlineValues[input.id]) : '';
              return (
                <div key={input.id} className={styles.pinRow}>
                  <Handle
                    type="target"
                    position={Position.Left}
                    id={input.id}
                    className={`${styles.handle} ${styles.handleLeft} ${input.type === 'execution' ? styles.handleExecution : ''}`}
                    data-pintype={input.type}
                  />
                  <span className={styles.pinLabel} style={{ marginLeft: 8 }}>
                    {input.label}
                  </span>
                  {hasInlineValue && (
                    <span
                      className="ml-1 px-1 py-0.5 bg-zinc-950/50 rounded border border-zinc-700 text-[9px] text-zinc-400 max-w-[60px] truncate"
                      title={inlineValueStr}
                    >
                      {inlineValueStr}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className={`${styles.column} ${styles.rightColumn}`}>
            {data.outputs.map((output: PinDefinition) => (
              <div key={output.id} className={styles.pinRow}>
                <span className={styles.pinLabel} style={{ marginRight: 8 }}>
                  {output.label}
                </span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={output.id}
                  className={`${styles.handle} ${styles.handleRight} ${output.type === 'execution' ? styles.handleExecution : ''}`}
                  data-pintype={output.type}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export const VVSNode = React.memo(VVSNodeComponent);
