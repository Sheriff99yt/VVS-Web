'use client';

import React, { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphDocuments } from '@/hooks/useGraphDocuments';
import { listMacroEntries } from '@/lib/projectTree';
import { wouldNodeLabelCauseCrossGraphCycle } from '@/lib/graphRelations';
import { dispatchEditorWarning } from '@/lib/editorMessages';
import { dispatchNavigateToNode } from '@/lib/graphNavigation';
import { findGraphEntryNodeId, isLinkedGraphNode, linkedGraphInspectorLabel } from '@/lib/linkedGraphNodes';
import { resolveImportableGraphName } from '@/lib/projectNodeCatalog';
import { GraphPropertiesPanel } from './RightSidebar/GraphPropertiesPanel';
import { VariablePropertiesPanel } from './RightSidebar/VariablePropertiesPanel';
import { NodePropertiesPanel } from './RightSidebar/NodePropertiesPanel';
import { useNodesData, useReactFlow } from '@xyflow/react';
import { VVSNode } from '@/types/graph';
import { defaultValueForVariableType, VariableType } from '@/lib/variableDefaults';

export function RightSidebar() {
  const { selection, variables, setVariables, activeGraphTab, functions, openTabs } = useProject();
  const documents = useGraphDocuments();
  const macros = listMacroEntries(openTabs);
  const [showGraphSettings, setShowGraphSettings] = useState(false);
  const graphSettingsOpen = selection.type === 'graph' && showGraphSettings;

  const selectedNodeId = selection.type === 'node' ? selection.id : null;
  const nodeData = useNodesData<VVSNode>(selectedNodeId || '');
  const { updateNodeData } = useReactFlow();

  const selectedVariable =
    selection.type === 'variable' ? variables.find((v) => v.id === selection.id) : null;

  const handleNodeInputChange = (key: string, value: string | number | boolean) => {
    if (!selectedNodeId || !nodeData) return;
    updateNodeData(selectedNodeId, {
      inlineValues: {
        ...(nodeData.data.inlineValues || {}),
        [key]: value,
      },
    });
  };

  const handleNodeLabelChange = (label: string) => {
    if (!selectedNodeId) return;
    if (
      documents &&
      wouldNodeLabelCauseCrossGraphCycle(
        documents,
        functions,
        macros,
        activeGraphTab,
        selectedNodeId,
        label
      )
    ) {
      dispatchEditorWarning('Circular cross-graph reference is not allowed.');
      return;
    }
    updateNodeData(selectedNodeId, { label });
  };

  const handleNodeDescriptionChange = (description: string) => {
    if (!selectedNodeId) return;
    updateNodeData(selectedNodeId, { description });
  };

  const handleCommentColorChange = (commentColor: string) => {
    if (!selectedNodeId) return;
    updateNodeData(selectedNodeId, { commentColor });
  };

  const handleVariableChange = (
    key: 'name' | 'type' | 'defaultValue',
    value: string | number | boolean | Record<string, unknown>
  ) => {
    if (!selectedVariable) return;

    if (key === 'name' && typeof value === 'string' && value !== selectedVariable.name) {
      window.dispatchEvent(
        new CustomEvent('vvs:variable-renamed', {
          detail: { oldName: selectedVariable.name, newName: value },
        })
      );
    }

    setVariables((vars) =>
      vars.map((v) => {
        if (v.id !== selectedVariable.id) return v;
        if (key === 'type') {
          const nextType = value as VariableType;
          return { ...v, type: nextType, defaultValue: defaultValueForVariableType(nextType) };
        }
        return { ...v, [key]: value };
      })
    );
  };

  const handleOpenLinkedGraph = () => {
    if (!nodeData || !isLinkedGraphNode(nodeData.data) || !nodeData.data.linkedGraphId) return;
    const entryId = findGraphEntryNodeId(documents ?? {}, nodeData.data.linkedGraphId);
    if (!entryId) return;
    dispatchNavigateToNode(nodeData.data.linkedGraphId, entryId);
  };

  const linkedGraphName =
    nodeData?.data.linkedGraphId && nodeData.data.linkKind
      ? resolveImportableGraphName(nodeData.data.linkedGraphId, functions, openTabs)
      : undefined;

  const headerLabel =
    selection.type === 'node'
      ? 'Node Properties'
      : selection.type === 'variable'
        ? 'Variable Properties'
        : graphSettingsOpen
          ? 'Graph Properties'
          : 'Inspector';

  const showIdle =
    selection.type === 'graph' && !graphSettingsOpen;

  return (
    <div className="w-full h-full bg-zinc-950 flex flex-col min-h-0 min-w-[250px]">
      <div className="flex border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex-1 py-3 text-xs font-semibold text-white border-b-2 border-white text-center">
          {headerLabel}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {showIdle && (
          <div className="flex flex-col items-center justify-center h-full min-h-[120px] text-center gap-3">
            <p className="text-xs text-zinc-500 leading-relaxed max-w-[200px]">
              Select a node on the canvas or a variable in the project tree to edit its properties.
            </p>
            <button
              type="button"
              onClick={() => setShowGraphSettings(true)}
              className="flex items-center gap-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <Settings2 size={13} />
              Graph settings…
            </button>
          </div>
        )}

        {selection.type === 'graph' && graphSettingsOpen && (
          <GraphPropertiesPanel onClose={() => setShowGraphSettings(false)} />
        )}

        {selection.type === 'variable' && selectedVariable && (
          <VariablePropertiesPanel variable={selectedVariable} onChange={handleVariableChange} />
        )}

        {selection.type === 'node' && nodeData && selectedNodeId && (
          <NodePropertiesPanel
            nodeId={selectedNodeId}
            nodeData={nodeData}
            onInputChange={handleNodeInputChange}
            onLabelChange={handleNodeLabelChange}
            onDescriptionChange={handleNodeDescriptionChange}
            onCommentColorChange={
              nodeData.type === 'vvs_comment_node' ? handleCommentColorChange : undefined
            }
            linkedGraphName={linkedGraphName}
            linkedGraphInspectorLabel={
              nodeData.data.linkKind ? linkedGraphInspectorLabel(nodeData.data.linkKind) : undefined
            }
            onOpenLinkedGraph={
              isLinkedGraphNode(nodeData.data) ? handleOpenLinkedGraph : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
