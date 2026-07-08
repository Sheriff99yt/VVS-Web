import type { PinType, VVSNodeData } from '@vvs/graph-types';
import type { ProjectEventDefinition, SymbolParameter } from '@vvs/graph-types';
import { normalizeGraphNodeData as normalizeGraphNodeDataCore, resolveGraphNodeKindId } from '@vvs/graph-types';
import { resolve as resolveKind } from '@vvs/syntax-registry';

export { resolveNodeKindId } from '@vvs/syntax-registry';

export function getNodeKindDefinition(kindId: string) {
  return resolveKind(kindId);
}

export function getVariableName(data: VVSNodeData): string | undefined {
  const fromProps = data.properties?.variableName;
  if (typeof fromProps === 'string' && fromProps.trim()) return fromProps.trim();
  if (data.label.startsWith('Get ')) return data.label.slice(4).trim();
  if (data.label.startsWith('Set ')) return data.label.slice(4).trim();
  return undefined;
}

function defaultInlineValueForPinType(pinType: PinType): string | number | boolean | undefined {
  switch (pinType) {
    case 'data_string':
      return '';
    case 'data_number':
      return 0;
    case 'data_boolean':
      return false;
    default:
      return undefined;
  }
}

export function normalizeNodeData(data: VVSNodeData): VVSNodeData {
  const core = normalizeGraphNodeDataCore(data);
  const kindId = resolveGraphNodeKindId(core);
  const def = resolveKind(kindId);
  const properties = { ...(core.properties ?? {}) };

  if ((kindId === 'variable_get' || kindId === 'variable_set') && !properties.variableName) {
    const inferred = getVariableName(core);
    if (inferred) properties.variableName = inferred;
  }

  const inlineValues = { ...core.inlineValues };
  const inputs = core.inputs.length > 0 ? core.inputs : def?.inputs ?? core.inputs;
  for (const input of inputs) {
    if (input.type === 'execution') continue;
    if (inlineValues[input.id] === undefined) {
      const fallback = defaultInlineValueForPinType(input.type);
      if (fallback !== undefined) inlineValues[input.id] = fallback;
    }
  }

  return {
    ...core,
    kindId,
    category: core.category || def?.category || core.category,
    properties,
    inputs,
    inlineValues,
  };
}

export function eventHandlerName(eventName: string): string {
  return eventName.replace(/\s+/g, '_').toLowerCase();
}

export function parameterCodegenName(param: SymbolParameter): string {
  const fromLabel = param.label.trim().replace(/\s+/g, '_').toLowerCase();
  return fromLabel || param.id;
}

export function resolveEventForNode(
  data: VVSNodeData,
  events: ProjectEventDefinition[]
): ProjectEventDefinition | undefined {
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
