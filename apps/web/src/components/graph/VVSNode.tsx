'use client';

import React, { useCallback, useMemo, useSyncExternalStore } from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { CircleHelp, FolderOpen } from 'lucide-react';
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
import { hoverChromeSetHoveredNode } from '@/lib/nodeHoverChromeStore';
import {
  isCodeHoverNode,
  subscribeCodeHoverHighlight,
} from '@/lib/codeHoverHighlightStore';
import { NodePinRow } from './NodePinRow';
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
  const [stripOnSelect] = useUiPreference('nodeOptionsStripOnSelect');
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
  const hasPins = data.inputs.length > 0 || data.outputs.length > 0;
  const title = getNodeDisplayTitle(data);
  const stateTip = [unsupportedTitle, hasBrokenRef ? 'Unresolved symbol reference' : '']
    .filter(Boolean)
    .join(' · ');
  const showStateIcon = Boolean(stateTip);
  const isCodeHover = useSyncExternalStore(
    subscribeCodeHoverHighlight,
    () => isCodeHoverNode(id),
    () => false
  );

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
    <div
      className={`${styles.nodeContainer} ${selected ? styles.nodeContainerSelected : ''} ${isCodeHover ? styles.nodeCodeHover : ''} ${data.isSimulating ? styles.nodeSimulating : ''} ${hasBrokenRef ? styles.nodeBrokenRef : ''}`}
      data-category={data.category}
      onMouseEnter={() => {
        if (!stripOnSelect) hoverChromeSetHoveredNode(id);
      }}
      onMouseLeave={() => {
        if (!stripOnSelect) hoverChromeSetHoveredNode(null);
      }}
    >
      {showStateIcon ? (
        <div className={styles.stateIcons}>
          <Tooltip content={stateTip} placement="right">
            <span className={styles.stateIcon} role="img" aria-label={stateTip}>
              <CircleHelp size={12} strokeWidth={2} />
            </span>
          </Tooltip>
        </div>
      ) : null}

      <div
        className={`${isUnsupported ? styles.nodeDimmedContent : ''} ${isUnsupported && selected ? styles.nodeDimmedContentSelected : ''}`}
      >
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <div className="flex items-center gap-1.5 min-w-0">
              {isGraphRef ? (
                <FolderOpen size={12} className="text-emerald-400/90 shrink-0" aria-hidden />
              ) : null}
              <span className={`${styles.title} truncate`}>{title}</span>
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
    </div>
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
