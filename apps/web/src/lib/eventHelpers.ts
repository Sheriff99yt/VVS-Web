import type { GraphDocument } from '@/lib/graphDefaults';
import type { EventParameter, PinDefinition, ProjectEventDefinition, VVSNodeData } from '@/types/graph';
import { resolveNodeKindId } from './nodeKind';

export function createEventId(): string {
  return `evt-${Date.now()}`;
}

export function eventDisplayName(name: string): string {
  const trimmed = name.trim();
  return trimmed || 'Custom event';
}

export function eventHandlerName(name: string): string {
  return name
    .trim()
    .replace(/^on\s+/i, '')
    .toLowerCase()
    .replace(/\s+/g, '_');
}

export function parameterCodegenName(param: EventParameter): string {
  const fromLabel = param.label.trim().replace(/\s+/g, '_').toLowerCase();
  return fromLabel || param.id;
}

export function defineNodeOutputs(parameters: EventParameter[]): PinDefinition[] {
  return [
    { id: 'exec_out', label: '', type: 'execution' },
    ...parameters.map((p) => ({ id: p.id, label: p.label, type: p.type })),
  ];
}

export function dispatchNodeInputs(parameters: EventParameter[]): PinDefinition[] {
  return [
    { id: 'exec_in', label: '', type: 'execution' },
    ...parameters.map((p) => ({ id: p.id, label: p.label, type: p.type })),
  ];
}

export const EVENT_DRAG_MIME = 'application/vvs-event-dispatch';

export interface EventDragPayload {
  eventId: string;
  eventName?: string;
}

export function resolveEventForDrop(
  payload: EventDragPayload,
  events: ProjectEventDefinition[]
): ProjectEventDefinition | undefined {
  const direct = events.find((e) => e.id === payload.eventId);
  if (direct) return direct;

  const nameKey =
    payload.eventName?.trim().toLowerCase() ??
    (payload.eventId.startsWith('dispatcher-')
      ? payload.eventId.slice('dispatcher-'.length)
      : undefined);
  if (!nameKey) return undefined;

  return events.find((e) => e.name.trim().toLowerCase() === nameKey);
}

export function resolveEventForNode(
  data: VVSNodeData,
  events: ProjectEventDefinition[]
): ProjectEventDefinition | undefined {
  const bindingId =
    data.graphBinding?.kind === 'dispatch_event' ? data.graphBinding.symbolId : undefined;
  if (bindingId) {
    return events.find((e) => e.id === bindingId);
  }

  const eventId = data.properties?.eventId;
  if (typeof eventId === 'string') {
    return events.find((e) => e.id === eventId);
  }

  const eventName = data.properties?.eventName;
  if (typeof eventName === 'string' && eventName.trim()) {
    const key = eventName.trim().toLowerCase();
    return events.find((e) => e.name.toLowerCase() === key);
  }

  const match = data.label.match(/^On\s+(.+)$/i);
  if (match?.[1]) {
    const key = match[1].trim().toLowerCase();
    return events.find((e) => e.name.toLowerCase() === key);
  }

  return undefined;
}

export function inferEventNameFromNodeData(data: VVSNodeData): string | undefined {
  const eventName = data.properties?.eventName;
  if (typeof eventName === 'string' && eventName.trim()) return eventName.trim();

  const dispatchMatch = data.label.match(/^Dispatch\s+(.+)$/i);
  if (dispatchMatch?.[1]) return dispatchMatch[1].trim();

  const onMatch = data.label.match(/^On\s+(.+)$/i);
  if (onMatch?.[1]) return onMatch[1].trim();

  return undefined;
}

/** Infer project events from legacy Define nodes when `events[]` is missing. */
export function inferEventsFromDocuments(
  documents: Record<string, GraphDocument>
): ProjectEventDefinition[] {
  const seen = new Map<string, ProjectEventDefinition>();

  for (const doc of Object.values(documents)) {
    for (const node of doc.nodes) {
      if (node.type !== 'vvs_standard_node') continue;
      const kindId = resolveNodeKindId(node.data);
      if (kindId !== 'event_define' && kindId !== 'event_custom') continue;

      const name = inferEventNameFromNodeData(node.data);
      if (!name) continue;

      const key = name.toLowerCase();
      if (seen.has(key)) continue;

      const parameters: EventParameter[] = (node.data.outputs ?? [])
        .filter((p) => p.type !== 'execution')
        .map((p) => ({ id: p.id, label: p.label, type: p.type }));

      seen.set(key, {
        id: createEventId(),
        name,
        parameters,
      });
    }
  }

  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function findGraphWithEventDefine(
  eventId: string,
  documents: Record<string, GraphDocument> | null | undefined
): string | undefined {
  if (!documents) return undefined;

  for (const [graphId, doc] of Object.entries(documents)) {
    for (const node of doc.nodes) {
      if (node.type !== 'vvs_standard_node') continue;
      const kindId = resolveNodeKindId(node.data);
      if (kindId !== 'event_define' && kindId !== 'event_custom') continue;
      if (node.data.properties?.eventId === eventId) return graphId;
    }
  }

  return undefined;
}

export function createEventParameterId(): string {
  return `param-${Date.now()}`;
}

export function applyEventDefineBinding(
  data: VVSNodeData,
  event: ProjectEventDefinition
): VVSNodeData {
  const outputs = defineNodeOutputs(event.parameters);
  return {
    ...data,
    kindId: 'event_define',
    category: 'Events',
    label: eventDisplayName(event.name),
    properties: { ...(data.properties ?? {}), eventId: event.id, eventName: event.name },
    inputs: [],
    outputs,
  };
}

export function applyEventDispatchBinding(
  data: VVSNodeData,
  event: ProjectEventDefinition
): VVSNodeData {
  const inputs = dispatchNodeInputs(event.parameters);
  const inlineValues = { ...data.inlineValues };
  for (const input of inputs) {
    if (input.type === 'execution') continue;
    if (inlineValues[input.id] === undefined) {
      if (input.type === 'data_string' || input.type === 'data_any') inlineValues[input.id] = '';
      if (input.type === 'data_number') inlineValues[input.id] = 0;
      if (input.type === 'data_boolean') inlineValues[input.id] = false;
    }
  }
  return {
    ...data,
    kindId: 'event_dispatch',
    category: 'Events',
    label: `Dispatch ${event.name}`,
    graphBinding: { kind: 'dispatch_event', symbolId: event.id },
    properties: { ...(data.properties ?? {}), eventId: event.id, eventName: event.name },
    inputs,
    outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
    inlineValues,
  };
}

/** @deprecated Legacy emit nodes — use `applyEventDispatchBinding` for new spawns. */
export function applyEventEmitBinding(
  data: VVSNodeData,
  event: ProjectEventDefinition
): VVSNodeData {
  const bound = applyEventDispatchBinding(data, event);
  return {
    ...bound,
    kindId: 'event_emit',
    label: `Emit ${event.name}`,
  };
}

/** @deprecated Legacy subscribe nodes — use event_define handlers + event_dispatch. */
export function subscribeNodeInputs(parameters: EventParameter[]): PinDefinition[] {
  return [
    { id: 'exec_in', label: '', type: 'execution' },
    { id: 'handler', label: 'Handler', type: 'execution' },
    ...parameters.map((p) => ({ id: p.id, label: p.label, type: p.type })),
  ];
}

/** @deprecated Legacy subscribe nodes — use event_define handlers + event_dispatch. */
export function applyEventSubscribeBinding(
  data: VVSNodeData,
  event: ProjectEventDefinition
): VVSNodeData {
  return {
    ...data,
    kindId: 'event_subscribe',
    category: 'Events',
    label: `Subscribe ${event.name}`,
    properties: { ...(data.properties ?? {}), eventId: event.id, eventName: event.name },
    inputs: subscribeNodeInputs(event.parameters),
    outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
    inlineValues: data.inlineValues ?? {},
  };
}

export function buildEventNodeData(
  event: ProjectEventDefinition,
  role: 'define' | 'dispatch'
): VVSNodeData {
  const base: VVSNodeData = {
    label:
      role === 'define' ? eventDisplayName(event.name) : `Dispatch ${event.name}`,
    category: 'Events',
    kindId: role === 'define' ? 'event_define' : 'event_dispatch',
    properties: { eventId: event.id, eventName: event.name },
    inputs: [],
    outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
    inlineValues: {},
  };
  if (role === 'define') return applyEventDefineBinding(base, event);
  return applyEventDispatchBinding(base, event);
}
