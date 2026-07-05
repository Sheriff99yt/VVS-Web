import type { VVSNode, VVSEdge } from '@/types/graph';
import type { FunctionSymbol } from '@vvs/graph-types';
import type { GraphTab } from '@/contexts/ProjectContext';
import type { GraphDocument } from '@/lib/graphDefaults';
import { createFunctionSymbol, formatFunctionTabName } from './functionTabs';
import { applyFunctionCallBinding } from './functionHelpers';
import { defaultTabMetadata } from './graphDefaults';

export interface ExtractToFunctionResult {
  func: FunctionSymbol;
  tab: GraphTab;
  functionDocument: GraphDocument;
  nextNodes: VVSNode[];
  nextEdges: VVSEdge[];
}

export function extractSelectionToFunction(
  nodes: VVSNode[],
  edges: VVSEdge[],
  options?: { name?: string }
): ExtractToFunctionResult | { error: string } {
  const selected = nodes.filter((n) => n.selected && n.type === 'vvs_standard_node');
  if (selected.length === 0) {
    return { error: 'Select at least one node to extract into a function.' };
  }

  const selectedIds = new Set(selected.map((n) => n.id));
  const internalEdges = edges.filter(
    (e) => selectedIds.has(e.source) && selectedIds.has(e.target)
  );

  let cx = 0;
  let cy = 0;
  selected.forEach((n) => {
    cx += n.position.x;
    cy += n.position.y;
  });
  cx /= selected.length;
  cy /= selected.length;

  const name = options?.name ?? `Extracted_${Date.now().toString(36).slice(-4)}`;
  const func = createFunctionSymbol(name);

  let minX = Infinity;
  let minY = Infinity;
  selected.forEach((n) => {
    if (n.position.x < minX) minX = n.position.x;
    if (n.position.y < minY) minY = n.position.y;
  });

  const idMap = new Map<string, string>();
  const clonedNodes = selected.map((n, i) => {
    const newId = `ext-${Date.now()}-${i}`;
    idMap.set(n.id, newId);
    return {
      ...n,
      id: newId,
      selected: false,
      position: {
        x: n.position.x - minX + 200,
        y: n.position.y - minY + 120,
      },
    };
  });

  const entryId = `entry-${func.id}`;
  const entryNode: VVSNode = {
    id: entryId,
    type: 'vvs_standard_node',
    position: { x: 40, y: 80 },
    data: {
      label: func.name,
      category: 'Events',
      kindId: 'function_entry',
      inputs: [],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
      properties: { functionId: func.id },
    },
  };

  const execEntryTargets = selected.filter((n) => {
    const hasExternalExecIn = edges.some(
      (e) =>
        e.target === n.id &&
        e.data?.pinType === 'execution' &&
        !selectedIds.has(e.source)
    );
    const hasInternalExecIn = edges.some(
      (e) =>
        e.target === n.id &&
        e.data?.pinType === 'execution' &&
        selectedIds.has(e.source)
    );
    return hasExternalExecIn || !hasInternalExecIn;
  });

  const firstEntry = execEntryTargets[0] ?? selected[0];
  const firstEntryCloneId = idMap.get(firstEntry.id)!;
  const entryTargetPin =
    firstEntry.data.inputs.find((p) => p.type === 'execution')?.id ?? 'exec_in';

  const entryEdge: VVSEdge = {
    id: `e-entry-${func.id}`,
    source: entryId,
    target: firstEntryCloneId,
    sourceHandle: 'exec_out',
    targetHandle: entryTargetPin,
    type: 'vvs_standard_edge',
    data: { pinType: 'execution' },
  };

  const clonedEdges = internalEdges.map((e, i) => ({
    ...e,
    id: `ext-e-${i}-${Date.now()}`,
    source: idMap.get(e.source)!,
    target: idMap.get(e.target)!,
  }));

  const functionDocument: GraphDocument = {
    nodes: [entryNode, ...clonedNodes],
    edges: [entryEdge, ...clonedEdges],
    metadata: defaultTabMetadata('function', func.name),
  };

  const externalExecIns = edges.filter(
    (e) =>
      !selectedIds.has(e.source) &&
      selectedIds.has(e.target) &&
      e.data?.pinType === 'execution'
  );
  const externalExecOuts = edges.filter(
    (e) =>
      selectedIds.has(e.source) &&
      !selectedIds.has(e.target) &&
      e.data?.pinType === 'execution'
  );

  const callNodeId = `call-${func.id}-${Date.now()}`;
  const callData = applyFunctionCallBinding(
    {
      label: `Call ${func.name}`,
      category: 'Project',
      kindId: 'vvs.project.call_function',
      inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
      graphBinding: { kind: 'call_function', symbolId: func.id },
      linkedGraphId: func.id,
      linkKind: 'call_function',
      properties: { functionName: func.name, functionId: func.id },
    },
    func
  );

  const callNode: VVSNode = {
    id: callNodeId,
    type: 'vvs_standard_node',
    position: { x: cx, y: cy },
    data: callData,
    selected: true,
  };

  const remainingNodes = nodes
    .filter((n) => !selectedIds.has(n.id))
    .map((n) => ({ ...n, selected: false }));
  const remainingEdges = edges.filter(
    (e) => !selectedIds.has(e.source) && !selectedIds.has(e.target)
  );

  const newEdges: VVSEdge[] = [...remainingEdges];
  externalExecIns.forEach((ext, i) => {
    newEdges.push({
      ...ext,
      id: `rewire-in-${callNodeId}-${i}`,
      target: callNodeId,
      targetHandle: 'exec_in',
    });
  });
  externalExecOuts.forEach((ext, i) => {
    newEdges.push({
      ...ext,
      id: `rewire-out-${callNodeId}-${i}`,
      source: callNodeId,
      sourceHandle: 'exec_out',
    });
  });

  return {
    func,
    tab: { id: func.id, type: 'function', name: formatFunctionTabName(func.name) },
    functionDocument,
    nextNodes: [...remainingNodes, callNode],
    nextEdges: newEdges,
  };
}
