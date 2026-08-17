import {
  classHomeGraphId,
  createClassSymbol,
  createProgramEntryEvent,
  pinsAreCompatible,
  type GraphDocument,
  type GraphEdge,
  type GraphNode,
  type PinType,
  type ProjectSnapshot,
} from '@vvs/graph-types';
import {
  defaultPropertiesFromSchema,
  listCoreKinds,
  resolve as resolveKind,
} from '@vvs/syntax-registry';
import { listSyntaxPacks } from '@vvs/syntax-packs';
import { bootstrapClassHomeDocuments } from '@/lib/defineNodeSync';
import { emitProjectLikeCodePanelOffThread } from '@/lib/emitProjectCode';
import { normalizeNodeData } from '@/lib/nodeKind';
import { coerceInlineValue } from '@/lib/pinInlineWidget';
import type { PinDefinition } from '@/types/graph';
import { isLeftoverUnspawnableKind } from './leftoverKinds';
import { AGENT_TOOLS, getAgentTool, type AgentToolDef } from './toolDefs';

export interface ToolRuntimeContext {
  snapshot: ProjectSnapshot;
  allowWrites: boolean;
}

export interface ToolCallResult {
  ok: boolean;
  write: boolean;
  error?: string;
  data?: unknown;
  snapshot?: ProjectSnapshot;
  affectedTabId?: string;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function requireString(args: Record<string, unknown>, key: string): string {
  const value = asString(args[key]);
  if (!value) throw new Error(`${key} is required`);
  return value;
}

function resolveTabId(snapshot: ProjectSnapshot, args: Record<string, unknown>): string {
  const tabId = asString(args.tab_id);
  if (tabId) return tabId;
  const classId = asString(args.class_id);
  if (classId) {
    const cls = snapshot.classes.find((c) => c.id === classId);
    if (!cls) throw new Error(`class not found: ${classId}`);
    return classHomeGraphId(cls);
  }
  return snapshot.activeGraphTab || Object.keys(snapshot.documents)[0] || '';
}

function documentForTab(snapshot: ProjectSnapshot, tabId: string): GraphDocument {
  const doc = snapshot.documents[tabId];
  if (!doc) throw new Error(`graph tab not found: ${tabId}`);
  return doc;
}

function patchDocument(
  snapshot: ProjectSnapshot,
  tabId: string,
  doc: GraphDocument
): ProjectSnapshot {
  return {
    ...snapshot,
    documents: { ...snapshot.documents, [tabId]: doc },
  };
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function listAvailableNodes() {
  return listCoreKinds()
    .filter((kind) => !isLeftoverUnspawnableKind(kind.kindId))
    .map((kind) => ({
      kindId: kind.kindId,
      kindVersion: kind.kindVersion,
      category: kind.category,
      title: kind.title,
      semantics: kind.semantics,
      inputs: kind.inputs,
      outputs: kind.outputs,
    }));
}

function listPacks() {
  return listSyntaxPacks().map((pack) => ({
    id: pack.id,
    version: pack.version,
    family: pack.family,
    capabilities: pack.capabilities ?? [],
    extends: pack.extends,
  }));
}

function asInlineScalar(value: unknown): string | number | boolean | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'boolean') return value;
  return undefined;
}

function applyInlineOverrides(
  inlineValues: Record<string, string | number | boolean>,
  inputs: PinDefinition[],
  overrides: Record<string, unknown>
): void {
  for (const [pinId, raw] of Object.entries(overrides)) {
    const value = asInlineScalar(raw);
    if (value === undefined) continue;
    const pin = inputs.find((p) => p.id === pinId);
    if (!pin || pin.type === 'execution') continue;
    inlineValues[pinId] = coerceInlineValue(pin, value);
  }
}

function isEntryHandlerNode(node: GraphNode): boolean {
  return node.data.kindId === 'event_define';
}

function entryHandlerScore(node: GraphNode): number {
  const eventName = String(node.data.properties?.eventName ?? '').toLowerCase();
  const label = String(node.data.label ?? '').toLowerCase();
  if (eventName === 'start' || eventName === 'on start' || label === 'on start') return 0;
  if (node.id.startsWith('entry-handler-')) return 1;
  return 2;
}

/** Free event_define / On start exec_out — do not invent Event Listeners. */
function findFreeEntryExecOut(doc: GraphDocument): { node: GraphNode; handle: string } | null {
  const handlers = doc.nodes.filter(isEntryHandlerNode).sort((a, b) => entryHandlerScore(a) - entryHandlerScore(b));
  for (const node of handlers) {
    const execOut = node.data.outputs?.find((pin) => pin.id === 'exec_out' && pin.type === 'execution');
    if (!execOut) continue;
    const taken = doc.edges.some((edge) => edge.source === node.id && edge.sourceHandle === 'exec_out');
    if (!taken) return { node, handle: execOut.id };
  }
  return null;
}

function addNode(
  snapshot: ProjectSnapshot,
  args: Record<string, unknown>
): {
  snapshot: ProjectSnapshot;
  node: GraphNode;
  tabId: string;
  wiredFrom?: { nodeId: string; handle: string };
} {
  const kindId = requireString(args, 'kind_id');
  if (isLeftoverUnspawnableKind(kindId)) {
    throw new Error(
      `leftover kind is unspawnable: ${kindId} (event_on_start, event_on_update, event_emit, event_subscribe, flow_sequence, action_await_wait, graph_ref)`
    );
  }
  const kind = resolveKind(kindId);
  if (!kind) throw new Error(`kind not found: ${kindId}`);

  const tabId = resolveTabId(snapshot, args);
  const doc = documentForTab(snapshot, tabId);
  const defaultProps = Array.isArray(kind.propertySchema)
    ? defaultPropertiesFromSchema(kind.propertySchema)
    : {};
  const inlineValues: Record<string, string | number | boolean> = {};
  for (const input of kind.inputs) {
    if (input.type === 'data_string' || input.type === 'data_any') inlineValues[input.id] = '';
    if (input.type === 'data_number') inlineValues[input.id] = 0;
    if (input.type === 'data_boolean') inlineValues[input.id] = false;
  }

  if (typeof args.message === 'string') {
    inlineValues.in_str = args.message;
  }
  const rawInline = args.inline_values;
  if (rawInline && typeof rawInline === 'object' && !Array.isArray(rawInline)) {
    applyInlineOverrides(inlineValues, kind.inputs as PinDefinition[], rawInline as Record<string, unknown>);
  }

  const data = normalizeNodeData({
    label: kind.title,
    category: kind.category,
    inputs: kind.inputs,
    outputs: kind.outputs,
    inlineValues,
    kindId: kind.kindId,
    kindVersion: kind.kindVersion,
    properties: defaultProps,
  });

  const node: GraphNode = {
    id: nextId('node'),
    type: 'vvs_standard_node',
    position: { x: asNumber(args.x, 120), y: asNumber(args.y, 120) },
    data: {
      ...data,
      resolvedPorts: { inputs: data.inputs, outputs: data.outputs },
    },
  };

  let next = patchDocument(snapshot, tabId, {
    ...doc,
    nodes: [...doc.nodes, node],
  });
  let wiredFrom: { nodeId: string; handle: string } | undefined;

  const execIn = node.data.inputs?.find((pin) => pin.id === 'exec_in' && pin.type === 'execution');
  if (execIn) {
    const entry = findFreeEntryExecOut(doc);
    if (entry) {
      try {
        const connected = connectPins(next, {
          source: entry.node.id,
          target: node.id,
          source_handle: entry.handle,
          target_handle: execIn.id,
          tab_id: tabId,
        });
        next = connected.snapshot;
        wiredFrom = { nodeId: entry.node.id, handle: entry.handle };
      } catch {
        // Compatibility failed — leave the new node unwired.
      }
    }
  }

  return { node, snapshot: next, tabId, wiredFrom };
}

function removeNode(snapshot: ProjectSnapshot, args: Record<string, unknown>): { snapshot: ProjectSnapshot; tabId: string } {
  const nodeId = requireString(args, 'node_id');
  const tabId = resolveTabId(snapshot, args);
  const doc = documentForTab(snapshot, tabId);
  if (!doc.nodes.some((n) => n.id === nodeId)) {
    throw new Error(`node not found: ${nodeId}`);
  }
  return {
    tabId,
    snapshot: patchDocument(snapshot, tabId, {
      ...doc,
      nodes: doc.nodes.filter((n) => n.id !== nodeId),
      edges: doc.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    }),
  };
}

function connectPins(
  snapshot: ProjectSnapshot,
  args: Record<string, unknown>
): { snapshot: ProjectSnapshot; edge: GraphEdge; tabId: string } {
  const sourceId = requireString(args, 'source');
  const targetId = requireString(args, 'target');
  const sourceHandle = requireString(args, 'source_handle');
  const targetHandle = requireString(args, 'target_handle');
  const tabId = resolveTabId(snapshot, args);
  const doc = documentForTab(snapshot, tabId);
  const sourceNode = doc.nodes.find((n) => n.id === sourceId);
  const targetNode = doc.nodes.find((n) => n.id === targetId);
  if (!sourceNode || !targetNode) throw new Error('node not found');
  const sourcePin = sourceNode.data.outputs?.find((p) => p.id === sourceHandle);
  const targetPin = targetNode.data.inputs?.find((p) => p.id === targetHandle);
  if (!sourcePin || !targetPin) throw new Error('pin not found');
  if (!pinsAreCompatible(sourcePin.type as PinType, targetPin.type as PinType)) {
    throw new Error('incompatible pin types');
  }
  const duplicate = doc.edges.some(
    (e) =>
      e.source === sourceId &&
      e.target === targetId &&
      e.sourceHandle === sourceHandle &&
      e.targetHandle === targetHandle
  );
  if (duplicate) throw new Error('edge already exists');

  const edge: GraphEdge = {
    id: nextId('edge'),
    source: sourceId,
    target: targetId,
    sourceHandle,
    targetHandle,
    type: 'vvs_standard_edge',
    data: { pinType: sourcePin.type as PinType },
  };
  return {
    edge,
    tabId,
    snapshot: patchDocument(snapshot, tabId, {
      ...doc,
      edges: [...doc.edges, edge],
    }),
  };
}

function addClass(snapshot: ProjectSnapshot, args: Record<string, unknown>): { snapshot: ProjectSnapshot; class: { id: string }; tabId: string } {
  const name = requireString(args, 'name');
  const cls = createClassSymbol(name);
  const entry = createProgramEntryEvent({ id: `evt-start-${cls.id}`, classId: cls.id });
  const documents = bootstrapClassHomeDocuments(
    snapshot.documents as Record<string, import('@/lib/graphDefaults').GraphDocument>,
    cls,
    entry,
    snapshot.activeGraphTab
  );
  return {
    class: cls,
    tabId: classHomeGraphId(cls),
    snapshot: {
      ...snapshot,
      classes: [...snapshot.classes, cls],
      events: [...(snapshot.events ?? []), entry],
      documents: documents as ProjectSnapshot['documents'],
      activeClassId: cls.id,
    },
  };
}

function getGraph(snapshot: ProjectSnapshot, args: Record<string, unknown>) {
  const tabId = resolveTabId(snapshot, args);
  const doc = documentForTab(snapshot, tabId);
  return {
    projectId: snapshot.projectId,
    activeGraphTab: snapshot.activeGraphTab,
    activeClassId: snapshot.activeClassId,
    tabId,
    classId: asString(args.class_id) ?? '',
    targetLanguage: snapshot.targetLanguage,
    moduleName: snapshot.projectDetails.moduleName,
    nodes: doc.nodes,
    edges: doc.edges,
  };
}

export { AGENT_TOOLS } from './toolDefs';

export function listAgentTools(): AgentToolDef[] {
  return AGENT_TOOLS.map((t) => t);
}

export async function callTool(
  name: string,
  args: Record<string, unknown> | undefined,
  ctx: ToolRuntimeContext
): Promise<ToolCallResult> {
  const tool = getAgentTool(name);
  if (!tool) {
    return { ok: false, write: false, error: `unknown tool: ${name}` };
  }
  const write = tool.safety === 'write';
  if (write && !ctx.allowWrites) {
    return {
      ok: false,
      write: true,
      error: 'write access is disabled (enable Allow agent writes in the Agent panel)',
    };
  }

  const snapshot = ctx.snapshot;
  const safeArgs = args ?? {};

  try {
    switch (name) {
      case 'list_available_nodes':
        return { ok: true, write: false, data: { nodes: listAvailableNodes() } };
      case 'list_syntax_packs':
        return { ok: true, write: false, data: { packs: listPacks() } };
      case 'list_classes':
        return {
          ok: true,
          write: false,
          data: { classes: snapshot.classes, activeClassId: snapshot.activeClassId },
        };
      case 'get_graph':
        return { ok: true, write: false, data: getGraph(snapshot, safeArgs) };
      case 'generate_code':
        return { ok: true, write: false, data: await emitProjectLikeCodePanelOffThread(snapshot) };
      case 'add_class': {
        const result = addClass(snapshot, safeArgs);
        return {
          ok: true,
          write: true,
          data: { class: result.class },
          snapshot: result.snapshot,
          affectedTabId: result.tabId,
        };
      }
      case 'add_node': {
        const result = addNode(snapshot, safeArgs);
        return {
          ok: true,
          write: true,
          data: { node: result.node, tabId: result.tabId, wiredFrom: result.wiredFrom },
          snapshot: result.snapshot,
          affectedTabId: result.tabId,
        };
      }
      case 'remove_node': {
        const result = removeNode(snapshot, safeArgs);
        return { ok: true, write: true, data: { ok: true }, snapshot: result.snapshot, affectedTabId: result.tabId };
      }
      case 'connect_pins': {
        const result = connectPins(snapshot, safeArgs);
        return {
          ok: true,
          write: true,
          data: { edge: result.edge },
          snapshot: result.snapshot,
          affectedTabId: result.tabId,
        };
      }
      default:
        return { ok: false, write, error: `unknown tool: ${name}` };
    }
  } catch (err) {
    return {
      ok: false,
      write,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
