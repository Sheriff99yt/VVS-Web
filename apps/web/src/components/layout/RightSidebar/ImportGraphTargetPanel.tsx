'use client';

import React, { useMemo } from 'react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import type { VVSNodeData } from '@/types/graph';
import {
  applyProjectGraphTargetToGraphRef,
  buildProjectClassOptions,
  buildProjectGraphTargets,
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

  // Stdlib Import Module uses propertySchema (modulePath / importStyle / targetLanguages).
  // Do not show a graph-target picker — it hid those settings and never fed codegen.
  return null;
}
