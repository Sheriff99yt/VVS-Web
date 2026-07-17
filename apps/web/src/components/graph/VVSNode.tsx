'use client';

import React, { useCallback, useMemo } from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { AlertTriangle, FolderOpen } from 'lucide-react';
import {
  isNodeEffectiveForLanguage,
  nodeIneffectiveTooltip,
} from '@vvs/language-profiles';
import { VVSNodeData } from '@/types/graph';
import { useProject } from '@/contexts/ProjectContext';
import { useActiveGraphCodegenSettings } from '@/hooks/useGraphCodegenSettings';
import { useUiPreference } from '@/hooks/useUiPreference';
import { useGraphDocuments } from '@/hooks/useGraphDocuments';
import { hasHandlerNodeForEvent } from '@/lib/defineNodeSync';
import { linkedGraphTargetLabel } from '@/lib/linkedGraphNodes';
import { getNodeDisplayTitle, resolveNodeKindId } from '@/lib/nodeKind';
import { NodePinRow } from './NodePinRow';
import { NodeModifiers } from './NodeModifiers';
import styles from './VVSNode.module.css';

interface VVSNodeBodyProps {
  id: string;
  data: VVSNodeData;
  selected: boolean;
}

function VVSNodeBody({ id, data, selected }: VVSNodeBodyProps) {
  const { updateNodeData } = useReactFlow();
  const { validationErrors, validationWarnings, activeGraphTab } = useProject();
  const documents = useGraphDocuments();
  const { targetLanguage } = useActiveGraphCodegenSettings();
  const [dimUnsupportedNodes] = useUiPreference('dimUnsupportedNodes');
  const kindId = resolveNodeKindId(data);
  const eventId =
    kindId === 'event_member_define'
      ? typeof data.properties?.eventId === 'string' && data.properties.eventId
        ? data.properties.eventId
        : typeof data.properties?.symbolId === 'string'
          ? data.properties.symbolId
          : ''
      : '';
  const eventHasHandler =
    kindId === 'event_member_define'
      ? Boolean(eventId && documents && hasHandlerNodeForEvent(documents, eventId))
      : undefined;
  const effectivenessOpts =
    kindId === 'event_member_define' ? { eventHasHandler } : undefined;
  const isUnsupported =
    dimUnsupportedNodes &&
    !isNodeEffectiveForLanguage(kindId, data.properties, targetLanguage, effectivenessOpts);
  const unsupportedTitle = isUnsupported
    ? nodeIneffectiveTooltip(kindId, data.properties, targetLanguage, effectivenessOpts)
    : '';
  const hasBrokenRef = useMemo(
    () =>
      [...validationErrors, ...validationWarnings].some(
        (w) =>
          w.code === 'UNRESOLVED_SYMBOL_REF' &&
          w.nodeId === id &&
          (w.tabId === undefined || w.tabId === activeGraphTab)
      ),
    [validationErrors, validationWarnings, id, activeGraphTab]
  );
  const linkedTargetLabel = linkedGraphTargetLabel(data);
  const isGraphRef = kindId === 'graph_ref' || data.linkKind === 'graph_ref';
  const isImportNode = data.linkKind === 'import_module';
  const importLangGate =
    isImportNode && typeof data.properties?.targetLanguages === 'string'
      ? data.properties.targetLanguages.trim()
      : '';
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
        className={`${styles.nodeContainer} ${selected ? styles.nodeContainerSelected : ''} ${data.isSimulating ? styles.nodeSimulating : ''} ${hasBrokenRef ? styles.nodeBrokenRef : ''} ${isUnsupported ? styles.nodeUnsupported : ''}`}
        data-category={data.category}
        title={unsupportedTitle || undefined}
      >
        {selected ? (
          <div className={styles.headerOverlay}>
            {importLangGate ? (
              <span
                className={styles.headerOverlayMeta}
                title="Emits only for these target languages"
              >
                {importLangGate}
              </span>
            ) : null}
            <NodeModifiers id={id} data={data} />
          </div>
        ) : null}

        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <div className="flex items-center gap-1.5 min-w-0">
              {isGraphRef ? (
                <FolderOpen size={12} className="text-emerald-400/90 shrink-0" aria-hidden />
              ) : null}
              <span className={`${styles.title} truncate`}>{title}</span>
              {hasBrokenRef ? (
                <span title="Unresolved symbol reference">
                  <AlertTriangle size={12} className="text-amber-400 shrink-0" aria-hidden />
                </span>
              ) : null}
            </div>
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
