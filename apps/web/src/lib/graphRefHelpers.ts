import type { Dispatch, SetStateAction } from 'react';
import type { ClassSymbol, GraphContainer, GraphTab } from '@vvs/graph-types';
import type { VVSNodeData } from '@/types/graph';
import { classGraphTabId, classContainerId } from '@/lib/classScope';
import { openGraphContainerTab } from '@/lib/graphTabs';
import { resolveNodeKindId } from '@/lib/nodeKind';

export type GraphRefTarget =
  | { type: 'class'; classId: string; graphTabId: string; label: string }
  | { type: 'container'; containerId: string; label: string }
  | { type: 'tab'; graphTabId: string; label: string };

export function buildGraphRefNodeData(options: {
  label: string;
  classId?: string;
  containerId?: string;
  graphTabId?: string;
}): VVSNodeData {
  const linkedGraphId =
    options.graphTabId ?? options.classId ?? options.containerId ?? '';
  return {
    label: options.label,
    category: 'Project',
    kindId: 'graph_ref',
    inputs: [],
    outputs: [],
    inlineValues: {},
    linkedGraphId,
    linkKind: 'graph_ref',
    properties: {
      classId: options.classId ?? '',
      containerId: options.containerId ?? '',
      graphTabId: options.graphTabId ?? '',
      refLabel: options.label,
    },
  };
}

export function isGraphRefNode(data: VVSNodeData): boolean {
  return resolveNodeKindId(data) === 'graph_ref' || data.linkKind === 'graph_ref';
}

export function resolveGraphRefTarget(
  data: VVSNodeData,
  classes: ClassSymbol[],
  graphContainerName?: string
): GraphRefTarget | null {
  const props = data.properties ?? {};
  const containerId =
    typeof props.containerId === 'string' && props.containerId ? props.containerId : undefined;
  if (containerId) {
    return {
      type: 'container',
      containerId,
      label: graphContainerName ?? data.label,
    };
  }

  const graphTabId =
    typeof props.graphTabId === 'string' && props.graphTabId ? props.graphTabId : undefined;
  if (graphTabId) {
    return { type: 'tab', graphTabId, label: data.label };
  }

  const classId =
    (typeof props.classId === 'string' && props.classId ? props.classId : undefined) ??
    (data.linkedGraphId && classes.some((c) => c.id === data.linkedGraphId)
      ? data.linkedGraphId
      : undefined);
  if (classId) {
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return null;
    return {
      type: 'class',
      classId,
      graphTabId: classGraphTabId(cls),
      label: cls.name,
    };
  }

  return null;
}

export interface OpenGraphRefContext {
  classes: ClassSymbol[];
  graphContainers: GraphContainer[];
  setActiveClassId: (id: string) => void;
  setActiveGraphTab: Dispatch<SetStateAction<string>>;
  setOpenTabs: Dispatch<SetStateAction<GraphTab[]>>;
  containerName?: (containerId: string) => string | undefined;
}

export function openGraphRefTarget(
  data: VVSNodeData,
  ctx: OpenGraphRefContext
): boolean {
  const target = resolveGraphRefTarget(
    data,
    ctx.classes,
    data.properties?.containerId
      ? ctx.containerName?.(String(data.properties.containerId))
      : undefined
  );
  if (!target) return false;

  if (target.type === 'container') {
    const container = ctx.graphContainers.find((c) => c.id === target.containerId);
    if (!container) return false;
    openGraphContainerTab(container, ctx.setOpenTabs, ctx.setActiveGraphTab);
    return true;
  }

  if (target.type === 'class') {
    const cls = ctx.classes.find((c) => c.id === target.classId);
    if (!cls) return false;
    ctx.setActiveClassId(cls.id);
    const containerId = classContainerId(cls);
    const container = ctx.graphContainers.find((c) => c.id === containerId);
    if (container) {
      openGraphContainerTab(container, ctx.setOpenTabs, ctx.setActiveGraphTab);
    } else {
      ctx.setActiveGraphTab(target.graphTabId);
    }
    return true;
  }

  ctx.setActiveGraphTab(target.graphTabId);
  return true;
}
