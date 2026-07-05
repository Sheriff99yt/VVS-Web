import type { VVSNodeData, PinType } from '@/types/graph';
import { CORE_NODE_REGISTRY, getNodeKindDefinition } from './nodeRegistry';
import { defaultInlineValueForPinType } from './pinInlineWidget';
import { eventDisplayName } from './eventHelpers';
import { resolveNodeKindId as registryResolveNodeKindId } from '@vvs/syntax-registry';

export { inferKindIdFromLabel } from '@vvs/syntax-registry';

export function resolveNodeKindId(data: VVSNodeData): string {
  return registryResolveNodeKindId(data);
}

export function getVariableName(data: VVSNodeData): string | undefined {
  const fromProps = data.properties?.variableName;
  if (typeof fromProps === 'string' && fromProps.trim()) return fromProps.trim();
  if (data.label.startsWith('Get ')) return data.label.slice(4).trim();
  if (data.label.startsWith('Set ')) return data.label.slice(4).trim();
  return undefined;
}

export function getNodeDisplayTitle(data: VVSNodeData): string {
  const kindId = resolveNodeKindId(data);
  const def = getNodeKindDefinition(kindId);

  if (kindId === 'variable_get') {
    const name = getVariableName(data);
    return name ? `Get ${name}` : def?.title ?? data.label;
  }
  if (kindId === 'variable_set') {
    const name = getVariableName(data);
    return name ? `Set ${name}` : def?.title ?? data.label;
  }
  if (kindId === 'vvs.project.call_function') {
    const fn = data.properties?.functionName;
    if (typeof fn === 'string' && fn) return `Call ${fn}`;
    if (data.label.startsWith('Call ')) return data.label;
    return def?.title ?? data.label;
  }
  if (kindId === 'vvs.project.import_module') {
    if (data.label.startsWith('Import ')) return data.label;
    return def?.title ?? data.label;
  }
  if (kindId === 'vvs.project.use_macro') {
    if (data.label.startsWith('Use ')) return data.label;
    return def?.title ?? `Macro ${data.label}`;
  }
  if (kindId === 'event_define' || kindId === 'event_custom' || kindId === 'event_on_start' || kindId === 'event_on_update') {
    const eventName = data.properties?.eventName;
    if (typeof eventName === 'string' && eventName.trim()) {
      return eventDisplayName(eventName);
    }
    if (data.label.startsWith('On ')) return data.label;
    return def?.title ?? data.label;
  }
  if (kindId === 'event_dispatch') {
    const eventName = data.properties?.eventName;
    if (typeof eventName === 'string' && eventName.trim()) {
      return `Dispatch ${eventName}`;
    }
    if (data.label.startsWith('Dispatch ')) return data.label;
    return def?.title ?? data.label;
  }

  return def?.title ?? data.label;
}

export function defaultInlineValueForPin(
  pinType: string
): string | number | boolean | undefined {
  return defaultInlineValueForPinType(pinType as PinType);
}

/** Backfill kindId, properties, and display label from legacy graph data. */
export function normalizeNodeData(data: VVSNodeData): VVSNodeData {
  const kindId = resolveNodeKindId(data);
  const def = getNodeKindDefinition(kindId);
  const properties = { ...(data.properties ?? {}) };

  if ((kindId === 'variable_get' || kindId === 'variable_set') && !properties.variableName) {
    const inferred = getVariableName(data);
    if (inferred) properties.variableName = inferred;
  }

  if (kindId === 'event_define' || kindId === 'event_custom') {
    const match = data.label.match(/^On\s+(.+)$/i);
    if (match?.[1] && !properties.eventName) properties.eventName = match[1];
  }

  if (kindId === 'event_dispatch') {
    const match = data.label.match(/^Dispatch\s+(.+)$/i);
    if (match?.[1] && !properties.eventName) properties.eventName = match[1];
  }

  const label = getNodeDisplayTitle({ ...data, kindId, properties });

  const inlineValues = { ...data.inlineValues };
  const inputs = data.inputs.length > 0 ? data.inputs : def?.inputs ?? data.inputs;
  for (const input of inputs) {
    if (input.type === 'execution') continue;
    if (inlineValues[input.id] === undefined) {
      const fallback = defaultInlineValueForPinType(input.type);
      if (fallback !== undefined) inlineValues[input.id] = fallback;
    }
  }

  return {
    ...data,
    kindId,
    category: data.category || def?.category || data.category,
    properties,
    label,
    inputs,
    inlineValues,
  };
}

export function isCoreKindId(kindId: string): boolean {
  return kindId in CORE_NODE_REGISTRY;
}
