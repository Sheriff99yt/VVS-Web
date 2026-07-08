'use client';

import React, { useCallback, useMemo } from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { AlertTriangle, FolderOpen } from 'lucide-react';
import { VVSNodeData } from '@/types/graph';
import { useProject } from '@/contexts/ProjectContext';
import { linkedGraphTargetLabel } from '@/lib/linkedGraphNodes';
import { getNodeDisplayTitle, resolveNodeKindId } from '@/lib/nodeKind';
import { NodePinRow } from './NodePinRow';
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
  const isGraphRef = resolveNodeKindId(data) === 'graph_ref' || data.linkKind === 'graph_ref';
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
      <div
        className={`${styles.nodeContainer} ${selected ? styles.nodeContainerSelected : ''} ${data.isSimulating ? styles.nodeSimulating : ''} ${hasBrokenRef ? styles.nodeBrokenRef : ''}`}
        data-category={data.category}
      >
        <div className={styles.header}>
          <div className={`${styles.titleBlock} flex items-center gap-1.5 min-w-0`}>
            {isGraphRef ? (
              <FolderOpen size={12} className="text-emerald-400/90 shrink-0" aria-hidden />
            ) : null}
            <span className={`${styles.title} truncate`}>{title}</span>
            {hasBrokenRef ? (
              <span title="Unresolved symbol reference">
                <AlertTriangle size={12} className="text-amber-400 shrink-0" aria-hidden />
              </span>
            ) : null}
            {linkedTargetLabel && (
              <span
                className={`${styles.linkedSubtitle} ${isImportNode ? styles.linkedSubtitleImport : ''}`}
                title={
                  isGraphRef
                    ? 'Double-click to open referenced graph'
                    : isImportNode
                      ? 'Double-click to open module'
                      : 'Double-click to open graph'
                }
              >
                {isImportNode ? `↳ ${linkedTargetLabel}` : `→ ${linkedTargetLabel}`}
              </span>
            )}
          </div>
        </div>

        <div className={`${styles.body} ${!hasPins ? styles.bodyPinless : ''}`}>
          <div className={`${styles.column} ${styles.leftColumn}`}>
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
          </div>

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
