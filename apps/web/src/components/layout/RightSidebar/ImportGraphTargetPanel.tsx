'use client';

import React, { useMemo } from 'react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import type { VVSNodeData } from '@/types/graph';
import {
  applyProjectGraphTargetToGraphRef,
  buildProjectClassOptions,
  buildProjectGraphTargets,
  decodeProjectGraphTargetId,
  encodeProjectGraphTargetId,
  projectGraphTargetOptions,
  resolveGraphRefTargetFromNode,
} from '@/lib/projectGraphCatalog';
import { normalizeNodeData } from '@/lib/nodeKind';
import type { ClassSymbol, FunctionSymbol, GraphContainer, GraphTab } from '@vvs/graph-types';

interface ImportGraphTargetPanelProps {
  kindId: string | null;
  nodeData: VVSNodeData;
  activeGraphTab: string;
  graphContainers: GraphContainer[];
  openTabs: GraphTab[];
  functions: FunctionSymbol[];
  classes: ClassSymbol[];
  onApply: (patch: Partial<VVSNodeData>) => void;
}

export function ImportGraphTargetPanel({
  kindId,
  nodeData,
  activeGraphTab,
  graphContainers,
  openTabs,
  functions,
  classes,
  onApply,
}: ImportGraphTargetPanelProps) {
  const graphTargets = useMemo(
    () =>
      buildProjectGraphTargets({
        graphContainers,
        openTabs,
        functions,
        classes,
        excludeGraphTabId: activeGraphTab,
      }),
    [graphContainers, openTabs, functions, classes, activeGraphTab]
  );

  const graphOptions = useMemo(() => projectGraphTargetOptions(graphTargets), [graphTargets]);
  const classOptions = useMemo(() => buildProjectClassOptions(classes), [classes]);

  if (kindId === 'graph_ref') {
    const current = resolveGraphRefTargetFromNode(
      graphTargets,
      nodeData.properties as Record<string, unknown> | undefined,
      nodeData.linkedGraphId
    );

    return (
      <div className="space-y-2 mb-2 pb-2 border-b border-zinc-800/80">
        <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
          Target graph
        </label>
        <SearchableSelect
          value={current}
          onChange={(encoded) => {
            const full = graphTargets.find((t) => encodeProjectGraphTargetId(t) === encoded);
            if (!full) return;
            const patch = applyProjectGraphTargetToGraphRef(full, full.label);
            onApply(normalizeNodeData({ ...nodeData, ...patch }));
          }}
          options={graphOptions}
          placeholder="Select project graph…"
          emptyLabel="No graphs in this project"
        />
      </div>
    );
  }

  if (kindId === 'import_class') {
    const targetClassId =
      typeof nodeData.properties?.targetClassId === 'string'
        ? nodeData.properties.targetClassId
        : nodeData.graphBinding?.targetClassId ?? '';

    return (
      <div className="space-y-2 mb-2 pb-2 border-b border-zinc-800/80">
        <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
          Import class
        </label>
        <SearchableSelect
          value={targetClassId}
          onChange={(classId) => {
            const cls = classes.find((c) => c.id === classId);
            if (!cls) return;
            onApply(
              normalizeNodeData({
                ...nodeData,
                label: `Import Class ${cls.name}`,
                category: 'Imports',
                kindId: 'import_class',
                graphBinding: {
                  kind: 'import_class',
                  symbolId: cls.id,
                  targetClassId: cls.id,
                },
                properties: {
                  ...(nodeData.properties ?? {}),
                  targetClassId: cls.id,
                },
              })
            );
          }}
          options={classOptions}
          placeholder="Select class…"
          emptyLabel="No classes in project"
        />
      </div>
    );
  }

  if (kindId === 'vvs.project.import_module' || nodeData.linkKind === 'import_module') {
    const moduleTargets = graphTargets.filter((t) => t.kind !== 'organizational');
    const moduleOptions = projectGraphTargetOptions(moduleTargets);
    const current =
      moduleOptions.find((o) => {
        const decoded = decodeProjectGraphTargetId(o.value);
        return decoded?.graphTabId === nodeData.linkedGraphId;
      })?.value ?? '';

    return (
      <div className="space-y-2 mb-2 pb-2 border-b border-zinc-800/80">
        <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
          Import module graph
        </label>
        <SearchableSelect
          value={current}
          onChange={(encoded) => {
            const full = moduleTargets.find((t) => encodeProjectGraphTargetId(t) === encoded);
            if (!full) return;
            const func = functions.find((f) => f.id === full.graphTabId);
            const label = func ? `Import ${func.name}` : `Import ${full.label}`;
            onApply(
              normalizeNodeData({
                ...nodeData,
                label,
                kindId: 'vvs.project.import_module',
                linkKind: 'import_module',
                linkedGraphId: full.graphTabId,
                graphBinding: { kind: 'import_module', symbolId: full.graphTabId },
              })
            );
          }}
          options={moduleOptions}
          placeholder="Select graph to import…"
          emptyLabel="No importable graphs"
        />
      </div>
    );
  }

  return null;
}
