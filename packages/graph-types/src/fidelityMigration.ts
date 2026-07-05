import type { GraphDocument, GraphTab, FunctionSymbol } from './symbols';
import { migrateLegacyFunction } from './symbols';
import type { GraphNode } from './nodes';
import type { ProjectSnapshot } from './snapshot';

function stripMacroPrefix(name: string): string {
  return name.replace(/^Macro:\s*/, '').replace(/^Function:\s*/, '').trim();
}

function isMacroStubNode(node: GraphNode, macroName: string): boolean {
  if (node.type !== 'vvs_standard_node') return false;
  const label = node.data.label ?? '';
  if (label === `${macroName} Input` || label === `${macroName} Output`) return true;
  if (label.endsWith(' Input') && node.data.category === 'Flow Control') {
    return node.data.inputs?.length === 0 && node.data.outputs?.some((p) => p.type === 'execution');
  }
  if (label.endsWith(' Output') && node.data.category === 'Flow Control') {
    return node.data.outputs?.length === 0 && node.data.inputs?.some((p) => p.type === 'execution');
  }
  return false;
}

function migrateMacroDocument(doc: GraphDocument, macroName: string, functionName: string): GraphDocument {
  const stubIds = new Set(
    doc.nodes.filter((n) => isMacroStubNode(n, macroName)).map((n) => n.id)
  );
  if (stubIds.size === 0) {
    const hasEntry = doc.nodes.some(
      (n) => n.type === 'vvs_standard_node' && n.data.category === 'Events'
    );
    if (hasEntry) return doc;
  }

  const inputStub = doc.nodes.find(
    (n) => stubIds.has(n.id) && (n.data.label === `${macroName} Input` || n.data.label.endsWith(' Input'))
  );
  const outgoingFromInput = inputStub
    ? doc.edges.filter((e) => e.source === inputStub.id && !stubIds.has(e.target))
    : [];

  const keptNodes = doc.nodes.filter((n) => !stubIds.has(n.id));
  const keptEdges = doc.edges.filter((e) => !stubIds.has(e.source) && !stubIds.has(e.target));

  const hasEntry = keptNodes.some(
    (n) => n.type === 'vvs_standard_node' && n.data.category === 'Events'
  );

  let nodes = keptNodes;
  let edges = keptEdges;

  if (!hasEntry) {
    const entryId = `fn-entry-${Date.now()}`;
    const entryNode: GraphNode = {
      id: entryId,
      type: 'vvs_standard_node',
      position: inputStub?.position ?? { x: 80, y: 80 },
      data: {
        label: functionName,
        category: 'Events',
        inputs: [],
        outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
        inlineValues: {},
      },
    };
    nodes = [entryNode, ...nodes];
    for (const edge of outgoingFromInput) {
      edges.push({
        ...edge,
        id: `migrated-${edge.id}`,
        source: entryId,
      });
    }
  }

  return { ...doc, nodes, edges };
}

function migrateUseMacroNodeData(data: GraphNode['data']): GraphNode['data'] {
  const symbolId =
    data.graphBinding?.kind === 'use_macro'
      ? data.graphBinding.symbolId
      : data.linkedGraphId ?? data.graphBinding?.symbolId;
  const macroName =
    typeof data.properties?.macroName === 'string'
      ? data.properties.macroName
      : data.label.replace(/^Use\s+/, '').replace(/^Macro:\s*/, '');
  const callLabel = macroName ? `Call ${macroName}` : 'Call Function';

  return {
    ...data,
    label: callLabel,
    category: data.category === 'Project' ? 'Project' : 'Project',
    kindId: 'vvs.project.call_function',
    linkKind: 'call_function',
    linkedGraphId: symbolId,
    graphBinding: symbolId
      ? { kind: 'call_function', symbolId }
      : data.graphBinding,
    properties: { ...data.properties, macroName: undefined, macroId: undefined },
  };
}

function isUseMacroNode(node: GraphNode): boolean {
  if (node.type !== 'vvs_standard_node') return false;
  const d = node.data;
  return (
    d.kindId === 'vvs.project.use_macro' ||
    d.linkKind === 'use_macro' ||
    d.graphBinding?.kind === 'use_macro' ||
    (typeof d.kindId === 'string' && d.kindId.startsWith('use_macro_'))
  );
}

function migrateDocumentNodes(doc: GraphDocument): GraphDocument {
  return {
    ...doc,
    nodes: doc.nodes.map((node) => {
      let next = node;
      if (isUseMacroNode(next)) {
        next = { ...next, data: migrateUseMacroNodeData(next.data) };
      }
      next = migrateEventDispatchNode(next);
      next = backfillNodeKindId(next);
      return next;
    }),
  };
}

/** Persist kindId on load when graphBinding or legacy labels imply a known kind. */
function backfillNodeKindId(node: GraphNode): GraphNode {
  if (node.type !== 'vvs_standard_node') return node;
  const d = node.data;
  if (d.kindId) return node;

  let kindId: string | undefined;
  const binding = d.graphBinding?.kind ?? d.linkKind;
  if (binding === 'call_function' || d.graphBinding?.kind === 'call_function') {
    kindId = 'vvs.project.call_function';
  } else if (binding === 'import_module') {
    kindId = 'vvs.project.import_module';
  } else if (binding === 'use_macro') {
    kindId = 'vvs.project.call_function';
  } else if (d.graphBinding?.kind === 'env_native') {
    kindId = 'env.call_native';
  } else if (d.graphBinding?.kind === 'env_event') {
    kindId = 'env.event_handler';
  } else if (d.label === 'On Start') {
    kindId = 'event_on_start';
  } else if (d.label === 'On Update') {
    kindId = 'event_on_update';
  } else if (d.label.startsWith('On ')) {
    kindId = 'event_define';
  } else if (d.label.startsWith('Emit ')) {
    kindId = 'event_emit';
  } else if (d.label.startsWith('Dispatch ')) {
    kindId = 'event_dispatch';
  } else if (d.label.startsWith('Subscribe ')) {
    kindId = 'event_subscribe';
  } else if (d.label.startsWith('Get ')) {
    kindId = 'variable_get';
  } else if (d.label.startsWith('Set ')) {
    kindId = 'variable_set';
  } else if (d.label.startsWith('Call ')) {
    kindId = 'vvs.project.call_function';
  } else if (d.label.startsWith('Import ')) {
    kindId = 'vvs.project.import_module';
  }

  if (!kindId) return node;
  return { ...node, data: { ...d, kindId } };
}

function migrateEventDispatchNode(node: GraphNode): GraphNode {
  if (node.type !== 'vvs_standard_node') return node;
  const kindId = node.data.kindId ?? '';
  if (kindId !== 'event_dispatch' && !node.data.label.startsWith('Dispatch ')) {
    return node;
  }
  const eventId =
    typeof node.data.properties?.eventId === 'string' ? node.data.properties.eventId : undefined;
  const eventName =
    typeof node.data.properties?.eventName === 'string' ? node.data.properties.eventName : undefined;
  const label = node.data.label.replace(/^Dispatch\s+/, 'Emit ');
  return {
    ...node,
    data: {
      ...node.data,
      kindId: 'event_emit',
      label,
      properties: {
        ...node.data.properties,
        eventId,
        eventName,
      },
    },
  };
}

function ensureFunctionForMacroTab(
  functions: FunctionSymbol[],
  tab: GraphTab
): FunctionSymbol[] {
  if (functions.some((f) => f.id === tab.id)) return functions;
  const name = stripMacroPrefix(tab.name);
  return [...functions, migrateLegacyFunction({ id: tab.id, name })];
}

/** Migrate macro tabs and use_macro nodes to text-shaped function + call semantics. */
export function migrateTextShapedAlignment(snapshot: ProjectSnapshot): ProjectSnapshot {
  let functions = [...snapshot.functions];
  const openTabs: GraphTab[] = [];
  const documents: Record<string, GraphDocument> = { ...snapshot.documents };

  for (const tab of snapshot.openTabs) {
    if (tab.type === 'macro') {
      const functionName = stripMacroPrefix(tab.name);
      functions = ensureFunctionForMacroTab(functions, tab);
      openTabs.push({
        id: tab.id,
        type: 'function',
        name: functionName,
      });
      const doc = documents[tab.id];
      if (doc) {
        documents[tab.id] = migrateMacroDocument(doc, functionName, functionName);
      }
    } else {
      openTabs.push(tab);
    }
  }

  for (const [tabId, doc] of Object.entries(documents)) {
    documents[tabId] = migrateDocumentNodes(doc);
  }

  return {
    ...snapshot,
    functions,
    openTabs,
    documents,
  };
}

export function macroTabIdsFromSnapshot(snapshot: ProjectSnapshot): string[] {
  return snapshot.openTabs.filter((t) => t.type === 'macro').map((t) => t.id);
}
