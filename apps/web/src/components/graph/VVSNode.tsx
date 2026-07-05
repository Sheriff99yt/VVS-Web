'use client';

import React, { useCallback, useMemo } from 'react';
import { Position, NodeToolbar, NodeProps, useReactFlow } from '@xyflow/react';
import { AlertTriangle, Copy, Trash2, MessageSquarePlus } from 'lucide-react';
import { VVSNodeData } from '@/types/graph';
import { useProject } from '@/contexts/ProjectContext';
import { dispatchGraphAction, dispatchNodeAction } from '@/lib/graphActions';
import { linkedGraphTargetLabel } from '@/lib/linkedGraphNodes';
import { getNodeDisplayTitle } from '@/lib/nodeKind';
import { NodePinRow } from './NodePinRow';
import { GraphWheelShield } from './GraphWheelShield';
import styles from './VVSNode.module.css';

interface VVSNodeBodyProps {
  id: string;
  data: VVSNodeData;
  selected: boolean;
}

function VVSNodeBody({ id, data, selected }: VVSNodeBodyProps) {
  const { updateNodeData } = useReactFlow();
  const { validationWarnings, activeGraphTab } = useProject();
  const hasBrokenRef = useMemo(
    () =>
      validationWarnings.some(
        (w) =>
          w.code === 'UNRESOLVED_SYMBOL_REF' &&
          w.nodeId === id &&
          (w.tabId === undefined || w.tabId === activeGraphTab)
      ),
    [validationWarnings, id, activeGraphTab]
  );
  const linkedTargetLabel = linkedGraphTargetLabel(data);
  const isImportNode = data.linkKind === 'import_module';
  const hasPins = data.inputs.length > 0 || data.outputs.length > 0;
  const title = getNodeDisplayTitle(data);

  const handleInlineChange = useCallback(
    (pinId: string, value: string | number | boolean) => {
      updateNodeData(id, {
        inlineValues: {
          ...(data.inlineValues ?? {}),
          [pinId]: value,
        },
      });
    },
    [data.inlineValues, id, updateNodeData]
  );

  return (
    <>
      <NodeToolbar
        isVisible={selected}
        position={Position.Top}
        className="flex gap-1 p-1 bg-zinc-900 border border-zinc-700 rounded-md shadow-xl nowheel nopan nodrag"
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
        className={`${styles.nodeContainer} ${selected ? styles.nodeContainerSelected : ''} ${data.isSimulating ? styles.nodeSimulating : ''} ${hasBrokenRef ? styles.nodeBrokenRef : ''}`}
        data-category={data.category}
      >
        <div className={styles.header}>
          <div className={`${styles.titleBlock} flex items-center gap-1.5 min-w-0`}>
            <span className={`${styles.title} truncate`}>{title}</span>
            {hasBrokenRef ? (
              <span title="Unresolved symbol reference">
                <AlertTriangle size={12} className="text-amber-400 shrink-0" aria-hidden />
              </span>
            ) : null}
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
          <GraphWheelShield className={`${styles.column} ${styles.leftColumn}`}>
            {data.inputs.map((input) => (
              <NodePinRow
                key={input.id}
                nodeId={id}
                pin={input}
                direction="input"
                inlineValue={data.inlineValues?.[input.id]}
                onInlineChange={handleInlineChange}
              />
            ))}
          </GraphWheelShield>

          <div className={`${styles.column} ${styles.rightColumn}`}>
            {data.outputs.map((output) => (
              <NodePinRow key={output.id} nodeId={id} pin={output} direction="output" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function VVSNodeComponent({
  id,
  data,
  selected,
}: NodeProps<import('@xyflow/react').Node<VVSNodeData>>) {
  return <VVSNodeBody id={id} data={data} selected={Boolean(selected)} />;
}

export const VVSNode = React.memo(VVSNodeComponent);
