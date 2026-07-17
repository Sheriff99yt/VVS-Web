'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { AlertTriangle, FolderOpen } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
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
import { NodeModifiers, nodeHasModifierChrome } from './NodeModifiers';
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
  const [modifiersPinned, setModifiersPinned] = useState(false);
  const showHeaderOverlay = Boolean(importLangGate) || nodeHasModifierChrome(data);

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
      <Tooltip content={unsupportedTitle || undefined} placement="top" disabled={!unsupportedTitle} className="block w-full min-w-0">
        <div
          className={`${styles.nodeContainer} ${selected ? styles.nodeContainerSelected : ''} ${data.isSimulating ? styles.nodeSimulating : ''} ${hasBrokenRef ? styles.nodeBrokenRef : ''} ${isUnsupported ? styles.nodeUnsupported : ''}`}
          data-category={data.category}
        >
        {showHeaderOverlay ? (
          <div
            className={`${styles.headerOverlay} ${modifiersPinned ? styles.headerOverlayPinned : ''}`}
          >
            {importLangGate ? (
              <Tooltip content="Emits only for these target languages" placement="top">
                <span className={styles.headerOverlayMeta}>{importLangGate}</span>
              </Tooltip>
            ) : null}
            <NodeModifiers id={id} data={data} onInteractionChange={setModifiersPinned} />
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
                <Tooltip content="Unresolved symbol reference" placement="top">
                  <span>
                    <AlertTriangle size={12} className="text-amber-400 shrink-0" aria-hidden />
                  </span>
                </Tooltip>
              ) : null}
            </div>
            {linkedTargetLabel && (
              <Tooltip
                content={
                  isGraphRef
                    ? 'Double-click to open referenced graph'
                    : isImportNode
                      ? 'Double-click to open module'
                      : 'Double-click to open graph'
                }
                placement="bottom"
                className="block w-full min-w-0"
              >
                <span
                  className={`${styles.linkedSubtitle} ${isImportNode ? styles.linkedSubtitleImport : ''}`}
                >
                  {isImportNode ? `↳ ${linkedTargetLabel}` : `→ ${linkedTargetLabel}`}
                </span>
              </Tooltip>
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
      </Tooltip>
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
