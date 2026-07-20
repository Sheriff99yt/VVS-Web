import type { VVSNodeData, PinType } from '@/types/graph';
import { CORE_NODE_REGISTRY, getNodeKindDefinition } from './nodeRegistry';
import { defaultInlineValueForPinType } from './pinInlineWidget';
import { eventDisplayName } from './eventHelpers';
import { mergePropertyDefaults } from '@vvs/syntax-registry';
import { resolveNodeKindId as registryResolveNodeKindId } from '@vvs/syntax-registry';
import { resolveGraphNodeKindId, normalizeGraphNodeData as normalizeGraphNodeDataCore } from '@vvs/graph-types';
import { getInputKindLabel, syncGetInputNodePorts } from './getInputNode';
import { readUiPreferences } from './uiPreferences';

export { inferKindIdFromLabel } from '@vvs/syntax-registry';

export function resolveNodeKindId(data: VVSNodeData): string {
  return registryResolveNodeKindId(data);
}

export { resolveGraphNodeKindId };

export function getVariableName(data: VVSNodeData): string | undefined {
  const fromProps = data.properties?.variableName;
  if (typeof fromProps === 'string' && fromProps.trim()) return fromProps.trim();
  if (data.label.startsWith('Get ')) return data.label.slice(4).trim();
  if (data.label.startsWith('Set ')) return data.label.slice(4).trim();
  return undefined;
}

function getNamingPrefix(
  type: 'Get' | 'Set' | 'Declare' | 'Define' | 'Call' | 'Dispatch' | 'On',
  namingConvention: string,
  activeLanguage?: string
): string {
  let convention = namingConvention;
  if (convention === 'auto') {
    convention = activeLanguage || 'global';
  }

  switch (convention) {
    case 'python':
      if (type === 'Define' || type === 'Declare') return 'def';
      if (type === 'On') return 'def on_';
      if (type === 'Get') return 'get';
      if (type === 'Set') return 'set';
      if (type === 'Call') return 'call';
      if (type === 'Dispatch') return 'dispatch';
      break;
    case 'javascript':
    case 'typescript':
      if (type === 'Declare') return 'let';
      if (type === 'Define') return 'function';
      if (type === 'On') return 'on';
      if (type === 'Get') return 'get';
      if (type === 'Set') return 'set';
      if (type === 'Call') return 'call';
      if (type === 'Dispatch') return 'dispatch';
      break;
    case 'cpp':
      if (type === 'Declare') return 'declare';
      if (type === 'Define') return 'void';
      if (type === 'On') return 'On';
      if (type === 'Get') return 'get';
      if (type === 'Set') return 'set';
      if (type === 'Call') return 'call';
      if (type === 'Dispatch') return 'dispatch';
      break;
    case 'verse':
      if (type === 'Declare') return 'var';
      if (type === 'Define') return 'def';
      if (type === 'On') return 'On';
      if (type === 'Get') return 'get';
      if (type === 'Set') return 'set';
      if (type === 'Call') return 'call';
      if (type === 'Dispatch') return 'dispatch';
      break;
    case 'gdscript':
      if (type === 'Declare') return 'var';
      if (type === 'Define') return 'func';
      if (type === 'On') return 'on';
      if (type === 'Get') return 'get';
      if (type === 'Set') return 'set';
      if (type === 'Call') return 'call';
      if (type === 'Dispatch') return 'dispatch';
      break;
    case 'rust':
      if (type === 'Declare') return 'let';
      if (type === 'Define') return 'fn';
      if (type === 'On') return 'on';
      if (type === 'Get') return 'get';
      if (type === 'Set') return 'set';
      if (type === 'Call') return 'call';
      if (type === 'Dispatch') return 'dispatch';
      break;
    case 'csharp':
      if (type === 'Declare') return 'var';
      if (type === 'Define') return 'void';
      if (type === 'On') return 'On';
      if (type === 'Get') return 'get';
      if (type === 'Set') return 'set';
      if (type === 'Call') return 'call';
      if (type === 'Dispatch') return 'dispatch';
      break;
  }
  return type;
}

export function getNodeDisplayTitle(data: VVSNodeData, activeLanguage?: string): string {
  const kindId = resolveNodeKindId(data);
  const def = getNodeKindDefinition(kindId);
  const prefs = readUiPreferences();
  const convention = prefs.namingConvention ?? 'global';

  if (kindId === 'variable_get') {
    const name = getVariableName(data);
    const prefix = getNamingPrefix('Get', convention, activeLanguage);
    return name ? `${prefix} ${name}` : def?.title ?? data.label;
  }
  if (kindId === 'var_define') {
    const name =
      typeof data.properties?.name === 'string'
        ? data.properties.name
        : getVariableName(data);
    const prefix = getNamingPrefix('Declare', convention, activeLanguage);
    return name ? `${prefix} ${name}` : def?.title ?? data.label;
  }
  if (kindId === 'function_define') {
    const fn = data.properties?.name;
    const prefix = getNamingPrefix('Declare', convention, activeLanguage);
    if (typeof fn === 'string' && fn) return `${prefix} ${fn}`;
    return def?.title ?? data.label;
  }
  if (kindId === 'function_implement') {
    const fn = data.properties?.name;
    const prefix = getNamingPrefix('Define', convention, activeLanguage);
    if (typeof fn === 'string' && fn) return `${prefix} ${fn}`;
    return def?.title ?? data.label;
  }
  if (kindId === 'class_define') {
    const cls = data.properties?.name;
    const prefix = getNamingPrefix('Declare', convention, activeLanguage);
    if (typeof cls === 'string' && cls) return `${prefix} ${cls}`;
    return def?.title ?? data.label;
  }
  if (kindId === 'graph_ref') {
    const refLabel = data.properties?.refLabel;
    if (typeof refLabel === 'string' && refLabel.trim()) return refLabel.trim();
    return def?.title ?? data.label;
  }
  if (kindId === 'event_member_define') {
    const name = data.properties?.name;
    const prefix = getNamingPrefix('Declare', convention, activeLanguage);
    if (typeof name === 'string' && name) return `${prefix} ${name}`;
    return def?.title ?? data.label;
  }
  if (kindId === 'variable_set') {
    const name = getVariableName(data);
    const prefix = getNamingPrefix('Set', convention, activeLanguage);
    return name ? `${prefix} ${name}` : def?.title ?? data.label;
  }
  if (kindId === 'vvs.project.call_function') {
    const fn = data.properties?.functionName;
    const prefix = getNamingPrefix('Call', convention, activeLanguage);
    if (typeof fn === 'string' && fn) return `${prefix} ${fn}`;
    if (data.label.startsWith('Call ')) {
      return data.label.replace(/^Call/, prefix);
    }
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
    const prefix = getNamingPrefix('On', convention, activeLanguage);
    if (typeof eventName === 'string' && eventName.trim()) {
      return `${prefix} ${eventName}`;
    }
    if (data.label.startsWith('On ')) {
      return data.label.replace(/^On/, prefix);
    }
    return def?.title ?? data.label;
  }
  if (kindId === 'event_dispatch') {
    const eventName = data.properties?.eventName;
    const prefix = getNamingPrefix('Dispatch', convention, activeLanguage);
    if (typeof eventName === 'string' && eventName.trim()) {
      return `${prefix} ${eventName}`;
    }
    if (data.label.startsWith('Call ')) {
      return data.label.replace(/^Call/, prefix);
    }
    if (data.label.startsWith('Dispatch ')) {
      return data.label.replace(/^Dispatch/, prefix);
    }
    return def?.title ?? data.label;
  }
  if (kindId === 'action_get_input') {
    const kindLabel = getInputKindLabel(data);
    return kindLabel ? `${def?.title ?? 'Get User Input'} · ${kindLabel}` : def?.title ?? data.label;
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
  const core = normalizeGraphNodeDataCore(data);
  const kindId = resolveNodeKindId(core);
  const def = getNodeKindDefinition(kindId);
  const properties = mergePropertyDefaults(def?.propertySchema, core.properties);

  if ((kindId === 'variable_get' || kindId === 'variable_set') && !properties.variableName) {
    const inferred =
      typeof core.properties?.variableName === 'string'
        ? core.properties.variableName
        : core.label.startsWith('Get ')
          ? core.label.slice(4).trim()
          : core.label.startsWith('Set ')
            ? core.label.slice(4).trim()
            : undefined;
    if (inferred) properties.variableName = inferred;
  }

  if (kindId === 'event_define' || kindId === 'event_custom') {
    const match = core.label.match(/^On\s+(.+)$/i);
    if (match?.[1] && !properties.eventName) properties.eventName = match[1];
  }

  if (kindId === 'event_dispatch') {
    const match = core.label.match(/^(?:Call|Dispatch)\s+(.+)$/i);
    if (match?.[1] && !properties.eventName) properties.eventName = match[1];
  }

  const label = getNodeDisplayTitle({ ...core, kindId, properties });

  const inlineValues = { ...core.inlineValues };
  const inputs = core.inputs.length > 0 ? core.inputs : def?.inputs ?? core.inputs;
  for (const input of inputs) {
    if (input.type === 'execution') continue;
    if (inlineValues[input.id] === undefined) {
      const fallback = defaultInlineValueForPinType(input.type);
      if (fallback !== undefined) inlineValues[input.id] = fallback;
    }
  }

  return syncGetInputNodePorts({
    ...core,
    kindId,
    category: data.category || def?.category || data.category,
    properties,
    label,
    inputs,
    inlineValues,
  });
}

export function isCoreKindId(kindId: string): boolean {
  return kindId in CORE_NODE_REGISTRY;
}
