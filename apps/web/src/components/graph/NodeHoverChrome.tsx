'use client';

import React, { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useReactFlow, useStore, ViewportPortal } from '@xyflow/react';
import { Tooltip } from '@/components/ui/Tooltip';
import { useUiPreference } from '@/hooks/useUiPreference';
import { NodeModifiers, nodeHasModifierChrome } from './NodeModifiers';
import {
  getHoverChromeState,
  hoverChromeClear,
  hoverChromeSetMenuPinned,
  hoverChromeSetStripHovered,
  subscribeHoverChrome,
} from '@/lib/nodeHoverChromeStore';
import type { VVSNodeData } from '@/types/graph';
import styles from './VVSNode.module.css';

function useHoverChromeState() {
  return useSyncExternalStore(subscribeHoverChrome, getHoverChromeState, getHoverChromeState);
}

function isEditableGraphNode(n: { type?: string }): boolean {
  return n.type !== 'comment' && n.type !== 'reroute';
}

function stripPayload(data: VVSNodeData): {
  importLangGate: string;
  showModifiers: boolean;
} | null {
  const isImportNode = data.linkKind === 'import_module';
  const importLangGate =
    isImportNode && typeof data.properties?.targetLanguages === 'string'
      ? data.properties.targetLanguages.trim()
      : '';
  const showModifiers = nodeHasModifierChrome(data);
  if (!importLangGate && !showModifiers) return null;
  return { importLangGate, showModifiers };
}

function NodeOptionsStripAt({
  nodeId,
  data,
  left,
  top,
  width,
  bridgeHover,
}: {
  nodeId: string;
  data: VVSNodeData;
  left: number;
  top: number;
  width: number;
  /** Wire strip hover/pin hold (hover mode only). */
  bridgeHover: boolean;
}) {
  const payload = stripPayload(data);
  if (!payload) return null;

  return (
    <div
      className={`${styles.sharedHoverChrome} nodrag nopan nowheel`}
      style={{ left, top, width }}
      onMouseEnter={() => {
        if (bridgeHover) hoverChromeSetStripHovered(true);
      }}
      onMouseLeave={() => {
        if (bridgeHover) hoverChromeSetStripHovered(false);
      }}
    >
      {payload.importLangGate ? (
        <Tooltip content="Emits only for these target languages" placement="top">
          <span className={styles.headerOverlayMeta}>{payload.importLangGate}</span>
        </Tooltip>
      ) : null}
      {payload.showModifiers ? (
        <NodeModifiers
          id={nodeId}
          data={data}
          onInteractionChange={bridgeHover ? hoverChromeSetMenuPinned : undefined}
        />
      ) : null}
    </div>
  );
}

/**
 * Canvas option strips — not mounted inside each node.
 * - Hover (default): one shared strip rebinds to the hovered node
 * - Select: one strip per selected node that has options (incl. multi-select)
 */
export function NodeHoverChrome() {
  const [stripOnSelect] = useUiPreference('nodeOptionsStripOnSelect');
  const hover = useHoverChromeState();
  const { getInternalNode } = useReactFlow();

  useEffect(() => {
    if (stripOnSelect) hoverChromeClear();
  }, [stripOnSelect]);

  const selectedIds = useStore(
    useCallback((state: { nodes: { id: string; selected?: boolean; type?: string }[] }) => {
      return state.nodes
        .filter((n) => n.selected && isEditableGraphNode(n))
        .map((n) => n.id);
    }, [])
  );

  /** Select mode: strips for all selected (1…N). Hover mode: exactly one strip on hover. */
  const targetIds: string[] = stripOnSelect
    ? selectedIds
    : hover.hoveredNodeId
      ? [hover.hoveredNodeId]
      : [];
  const targetIdsKey = targetIds.join('|');

  const nodesById = useStore(
    useCallback(
      (state: {
        nodeLookup?: Map<string, { id: string; data: unknown; width?: number }>;
        nodes: { id: string; data: unknown; width?: number }[];
      }) => {
        const map = new Map<string, { id: string; data: unknown; width?: number }>();
        for (const id of targetIds) {
          const fromLookup = state.nodeLookup?.get(id);
          const n = fromLookup ?? state.nodes.find((x) => x.id === id);
          if (n) map.set(id, n);
        }
        return map;
      },
      // targetIdsKey tracks membership; targetIds array identity changes each render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [targetIdsKey]
    )
  );

  if (targetIds.length === 0) return null;

  const bridgeHover = !stripOnSelect;

  return (
    <ViewportPortal>
      {targetIds.map((nodeId) => {
        const node = nodesById.get(nodeId);
        if (!node) return null;
        const data = node.data as VVSNodeData;
        if (!stripPayload(data)) return null;

        const internal = getInternalNode(nodeId);
        const abs = internal?.internals.positionAbsolute;
        if (!abs) return null;

        const width =
          internal.measured?.width ??
          (typeof node.width === 'number' ? node.width : undefined) ??
          180;

        return (
          <NodeOptionsStripAt
            key={nodeId}
            nodeId={nodeId}
            data={data}
            left={abs.x}
            top={abs.y}
            width={width}
            bridgeHover={bridgeHover}
          />
        );
      })}
    </ViewportPortal>
  );
}
