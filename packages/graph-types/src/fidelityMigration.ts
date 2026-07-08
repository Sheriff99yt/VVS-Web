import type { GraphDocument, GraphTab, FunctionSymbol, ClassSymbol, ProjectEventDefinition } from './symbols';
import { migrateLegacyFunction, classHomeGraphId, createProgramEntryEvent, findProgramEntryEvent } from './symbols';
import type { GraphNode } from './nodes';
import type { ProjectSnapshot } from './snapshot';
import { normalizeGraphNode } from './normalizeGraphNodeData';

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
      next = normalizeGraphNode(next);
      return next;
    }),
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

function migrateLegacyOnStartInDocument(
  doc: GraphDocument,
  entry: ProjectEventDefinition
): GraphDocument {
  const legacy = doc.nodes.find(
    (n) =>
      n.type === 'vvs_standard_node' &&
      (n.data.kindId === 'event_on_start' || n.data.label === 'On Start')
  );
  if (!legacy) return doc;

  const nodes = doc.nodes.map((node) => {
    if (node.id !== legacy.id) return node;
    return normalizeGraphNode({
      ...node,
      data: {
        ...node.data,
        kindId: 'event_define',
        label: 'On start',
        category: 'Events',
        properties: {
          ...node.data.properties,
          eventId: entry.id,
          eventName: entry.name,
          symbolId: entry.id,
        },
      },
    });
  });

  const hasMember = nodes.some(
    (n) =>
      n.data.kindId === 'event_member_define' &&
      n.data.properties?.symbolId === entry.id
  );
  if (hasMember) {
    return { ...doc, nodes };
  }

  const classDefine = nodes.find((n) => n.data.kindId === 'class_define');
  const execIn = { id: 'exec_in', label: '', type: 'execution' as const };
  const execOut = { id: 'exec_out', label: '', type: 'execution' as const };
  const memberNode = {
    id: `entry-member-migrated-${entry.id}`,
    type: 'vvs_standard_node' as const,
    position: { x: (classDefine?.position.x ?? 80) + 200, y: classDefine?.position.y ?? 40 },
    data: {
      label: 'Declare start',
      category: 'Events',
      kindId: 'event_member_define',
      inputs: [execIn],
      outputs: [execOut],
      inlineValues: {},
      properties: {
        symbolId: entry.id,
        name: entry.name,
        eventId: entry.id,
        eventName: 'On start',
      },
    },
  };

  const nextNodes = [...nodes, memberNode];
  let edges = [...doc.edges];
  if (classDefine) {
    edges.push({
      id: `migrated-entry-member-${entry.id}`,
      source: classDefine.id,
      target: memberNode.id,
      sourceHandle: 'exec_out',
      targetHandle: 'exec_in',
      type: 'vvs_standard_edge',
      data: { pinType: 'execution' },
    });
  }

  return { ...doc, nodes: nextNodes, edges };
}

function migrateProgramEntryAlignment(snapshot: ProjectSnapshot): ProjectSnapshot {
  let events = [...snapshot.events];
  const documents: Record<string, GraphDocument> = { ...snapshot.documents };

  for (const cls of snapshot.classes) {
    const tabId = classHomeGraphId(cls);
    const doc = documents[tabId];
    if (!doc) continue;

    const hasLegacy = doc.nodes.some(
      (n) =>
        n.type === 'vvs_standard_node' &&
        (n.data.kindId === 'event_on_start' || n.data.label === 'On Start')
    );
    if (!hasLegacy) continue;

    let entry = findProgramEntryEvent(events, cls.id);
    if (!entry) {
      entry = createProgramEntryEvent({ classId: cls.id });
      events.push(entry);
    }
    documents[tabId] = migrateLegacyOnStartInDocument(doc, entry);
  }

  return { ...snapshot, events, documents };
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

  return migrateProgramEntryAlignment({
    ...snapshot,
    functions,
    openTabs,
    documents,
  });
}

export function macroTabIdsFromSnapshot(snapshot: ProjectSnapshot): string[] {
  return snapshot.openTabs.filter((t) => t.type === 'macro').map((t) => t.id);
}
