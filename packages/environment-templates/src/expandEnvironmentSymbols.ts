import type { PinDefinition } from '@vvs/graph-types';
import type { SpawnNodeTemplate, LibraryCategory } from '@vvs/syntax-registry';
import type { ProjectEnvironmentManifest } from './types';
import { resolveApiSurface } from './resolveApiSurface';
import type { TargetLanguage } from '@vvs/graph-types';

const EXEC_IN: PinDefinition = { id: 'exec_in', label: '', type: 'execution' };
const EXEC_OUT: PinDefinition = { id: 'exec_out', label: '', type: 'execution' };

export interface ExpandEnvironmentSymbolsOptions {
  environmentId: string;
  manifest: ProjectEnvironmentManifest;
  targetLanguage: TargetLanguage;
  currentGraphId: string;
}

function dataInputsFromParameters(
  parameters: { id: string; label: string; type: PinDefinition['type'] }[]
): PinDefinition[] {
  return parameters.map((p) => ({
    id: p.id,
    label: p.label,
    type: p.type,
  }));
}

function nativeSpawnTemplate(
  manifest: ProjectEnvironmentManifest,
  method: { id: string; name: string; parameters: ExpandEnvironmentSymbolsOptions['manifest']['apiSurface']['methods'][0]['parameters'] },
  targetLanguage: TargetLanguage
): SpawnNodeTemplate | null {
  const binding = manifest.apiSurface.methods.find((m) => m.id === method.id)?.targets[targetLanguage];
  if (!binding?.callExpr) return null;

  const dataInputs = dataInputsFromParameters(method.parameters);
  return {
    type: 'env.call_native',
    kindId: 'env.call_native',
    kindVersion: 1,
    label: `${method.name}()`,
    category: 'From environment',
    inputs: [EXEC_IN, ...dataInputs],
    outputs: [EXEC_OUT],
    graphBinding: {
      kind: 'env_native',
      symbolId: method.id,
      manifestMethodId: method.id,
    },
    properties: { manifestMethodId: method.id },
  } as SpawnNodeTemplate & { properties?: Record<string, unknown> };
}

function eventHandlerSpawnTemplate(
  event: { id: string; name: string; parameters: ExpandEnvironmentSymbolsOptions['manifest']['apiSurface']['events'][0]['parameters'] }
): SpawnNodeTemplate {
  const dataInputs = dataInputsFromParameters(event.parameters);
  return {
    type: 'env.event_handler',
    kindId: 'env.event_handler',
    kindVersion: 1,
    label: `On ${event.name}`,
    category: 'From environment',
    inputs: dataInputs,
    outputs: [EXEC_OUT],
    graphBinding: {
      kind: 'env_event',
      symbolId: event.id,
      manifestEventId: event.id,
    },
    properties: { manifestEventId: event.id, eventName: event.name },
  } as SpawnNodeTemplate & { properties?: Record<string, unknown> };
}

export function expandEnvironmentSymbols(
  options: ExpandEnvironmentSymbolsOptions
): LibraryCategory[] {
  const surface = resolveApiSurface(options.manifest, options.targetLanguage);
  const categories: LibraryCategory[] = [];

  const nativeItems = surface.natives
    .map((m) => nativeSpawnTemplate(options.manifest, m, options.targetLanguage))
    .filter((t): t is SpawnNodeTemplate => t != null);

  if (nativeItems.length > 0) {
    categories.push({ name: 'From environment · Natives', items: nativeItems });
  }

  const eventItems = surface.events.map((e) => eventHandlerSpawnTemplate(e));
  if (eventItems.length > 0) {
    categories.push({ name: 'From environment · Events', items: eventItems });
  }

  const overrideItems = surface.overrideable.map((m) => ({
    type: 'env.event_handler',
    kindId: 'env.event_handler',
    kindVersion: 1,
    label: `Override ${m.name}()`,
    category: 'From environment',
    inputs: [EXEC_IN, ...dataInputsFromParameters(m.parameters)],
    outputs: [EXEC_OUT],
    graphBinding: {
      kind: 'env_event',
      symbolId: m.id,
      manifestMethodId: m.id,
    },
    properties: { manifestMethodId: m.id, override: true },
  })) as SpawnNodeTemplate[];

  if (overrideItems.length > 0) {
    categories.push({ name: 'From environment · Overrides', items: overrideItems });
  }

  return categories;
}

export function buildEnvironmentSpawnDetail(
  manifest: ProjectEnvironmentManifest,
  targetLanguage: TargetLanguage,
  action: 'call_native' | 'event_handler' | 'event_subscribe',
  symbolId: string
): SpawnNodeTemplate | null {
  const surface = resolveApiSurface(manifest, targetLanguage);

  if (action === 'call_native') {
    const method = surface.natives.find((m) => m.id === symbolId);
    if (!method) return null;
    return nativeSpawnTemplate(manifest, method, targetLanguage);
  }

  if (action === 'event_handler') {
    const event = surface.events.find((e) => e.id === symbolId);
    if (event) return eventHandlerSpawnTemplate(event);
    const method = surface.overrideable.find((m) => m.id === symbolId);
    if (!method) return null;
    return {
      type: 'env.event_handler',
      kindId: 'env.event_handler',
      kindVersion: 1,
      label: `Override ${method.name}()`,
      category: 'From environment',
      inputs: [EXEC_IN, ...dataInputsFromParameters(method.parameters)],
      outputs: [EXEC_OUT],
      graphBinding: {
        kind: 'env_event',
        symbolId: method.id,
        manifestMethodId: method.id,
      },
      properties: { manifestMethodId: method.id, override: true },
    } as SpawnNodeTemplate & { properties?: Record<string, unknown> };
  }

  if (action === 'event_subscribe') {
    const event = surface.events.find((e) => e.id === symbolId);
    if (!event) return null;
    return {
      type: 'event_subscribe',
      kindId: 'event_subscribe',
      kindVersion: 1,
      label: `Subscribe ${event.name}`,
      category: 'From environment',
      inputs: [EXEC_IN, ...dataInputsFromParameters(event.parameters)],
      outputs: [EXEC_OUT],
      graphBinding: {
        kind: 'env_event',
        symbolId: event.id,
        manifestEventId: event.id,
      },
      properties: { manifestEventId: event.id, eventName: event.name },
    } as SpawnNodeTemplate & { properties?: Record<string, unknown> };
  }

  return null;
}
