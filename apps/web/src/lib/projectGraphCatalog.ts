import type { ClassSymbol, GraphContainer, GraphTab, FunctionSymbol } from '@vvs/graph-types';
import {
  MAIN_GRAPH_CONTAINER_ID,
  PROJECT_MAP_CONTAINER_NAME,
  classHomeGraphId,
} from '@vvs/graph-types';
import type { SearchableSelectOption } from '@/components/ui/SearchableSelect';
import { graphContainerLabel } from '@/components/layout/project-tree/graphContainerLabels';
import { graphDisplayName } from '@/lib/graphTabs';

export type ProjectGraphTargetKind = 'container' | 'function' | 'organizational';

export interface ProjectGraphTarget {
  kind: ProjectGraphTargetKind;
  graphTabId: string;
  containerId?: string;
  classId?: string;
  label: string;
}

/** Stable id for SearchableSelect value — encodes target kind + ids. */
export function encodeProjectGraphTargetId(target: ProjectGraphTarget): string {
  return JSON.stringify({
    k: target.kind,
    g: target.graphTabId,
    c: target.containerId ?? '',
    cl: target.classId ?? '',
  });
}

export function decodeProjectGraphTargetId(raw: string): ProjectGraphTarget | null {
  try {
    const parsed = JSON.parse(raw) as {
      k?: ProjectGraphTargetKind;
      g?: string;
      c?: string;
      cl?: string;
    };
    if (!parsed.k || !parsed.g) return null;
    return {
      kind: parsed.k,
      graphTabId: parsed.g,
      containerId: parsed.c || undefined,
      classId: parsed.cl || undefined,
      label: '',
    };
  } catch {
    return null;
  }
}

export function buildProjectGraphTargets(input: {
  graphContainers: GraphContainer[];
  openTabs: GraphTab[];
  functions: FunctionSymbol[];
  classes: ClassSymbol[];
  excludeGraphTabId?: string;
}): ProjectGraphTarget[] {
  const targets: ProjectGraphTarget[] = [];
  const seen = new Set<string>();

  const push = (target: ProjectGraphTarget) => {
    const key = encodeProjectGraphTargetId(target);
    if (seen.has(key)) return;
    if (input.excludeGraphTabId && target.graphTabId === input.excludeGraphTabId) return;
    seen.add(key);
    targets.push(target);
  };

  push({
    kind: 'organizational',
    graphTabId: MAIN_GRAPH_CONTAINER_ID,
    containerId: MAIN_GRAPH_CONTAINER_ID,
    label: PROJECT_MAP_CONTAINER_NAME,
  });

  for (const container of input.graphContainers) {
    push({
      kind: 'container',
      graphTabId: container.id,
      containerId: container.id,
      label: graphContainerLabel(container),
    });
  }

  for (const tab of input.openTabs) {
    if (tab.type === 'function') {
      const func = input.functions.find((f) => f.id === tab.id);
      push({
        kind: 'function',
        graphTabId: tab.id,
        label: func?.name ?? graphDisplayName(tab),
      });
    }
  }

  for (const cls of input.classes) {
    const homeId = classHomeGraphId(cls);
    const container = input.graphContainers.find((c) => c.id === cls.containerId);
    push({
      kind: 'container',
      graphTabId: homeId,
      containerId: cls.containerId,
      classId: cls.id,
      label: container ? `${graphContainerLabel(container)} · ${cls.name}` : cls.name,
    });
  }

  return targets.sort((a, b) => a.label.localeCompare(b.label));
}

export function projectGraphTargetOptions(
  targets: ProjectGraphTarget[]
): SearchableSelectOption[] {
  return targets.map((target) => ({
    value: encodeProjectGraphTargetId(target),
    label: target.label,
    group:
      target.kind === 'organizational'
        ? 'Overview'
        : target.kind === 'function'
          ? 'Functions'
          : 'Graphs',
    description: target.graphTabId,
  }));
}

export function buildProjectClassOptions(classes: ClassSymbol[]): SearchableSelectOption[] {
  return classes
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((cls) => ({
      value: cls.id,
      label: cls.name,
      description: cls.containerId,
    }));
}

export function resolveGraphRefTargetFromNode(
  targets: ProjectGraphTarget[],
  properties: Record<string, unknown> | undefined,
  linkedGraphId?: string
): string {
  const containerId =
    typeof properties?.containerId === 'string' ? properties.containerId : undefined;
  const graphTabId =
    typeof properties?.graphTabId === 'string' ? properties.graphTabId : undefined;
  const classId = typeof properties?.classId === 'string' ? properties.classId : undefined;

  const match = targets.find((t) => {
    if (containerId && t.containerId === containerId) {
      if (classId) return t.classId === classId;
      return true;
    }
    if (graphTabId && t.graphTabId === graphTabId) return true;
    if (linkedGraphId && t.graphTabId === linkedGraphId) return true;
    return false;
  });

  return match ? encodeProjectGraphTargetId(match) : '';
}

export function applyProjectGraphTargetToGraphRef(
  target: ProjectGraphTarget,
  label: string
): {
  linkedGraphId: string;
  linkKind: 'graph_ref';
  label: string;
  properties: Record<string, string>;
} {
  return {
    linkedGraphId: target.graphTabId,
    linkKind: 'graph_ref',
    label: label || target.label,
    properties: {
      classId: target.classId ?? '',
      containerId: target.containerId ?? '',
      graphTabId: target.graphTabId,
      refLabel: label || target.label,
    },
  };
}
