import type { VVSNodeData } from '@/types/graph';
import type { ProjectEnvironmentManifest } from '@vvs/environment-templates';
import { buildEnvironmentSpawnDetail } from '@vvs/environment-templates';
import type { TargetLanguage } from '@vvs/graph-types';
import { getNodeKindDefinition } from '@/lib/nodeRegistry';

export const SPAWN_ENV_NODE_EVENT = 'vvs:spawn-env-node';

export type EnvironmentSpawnAction = 'call_native' | 'event_handler';

export function buildEnvironmentNodeData(
  manifest: ProjectEnvironmentManifest,
  targetLanguage: TargetLanguage,
  action: EnvironmentSpawnAction,
  symbolId: string
): VVSNodeData | null {
  const template = buildEnvironmentSpawnDetail(manifest, targetLanguage, action, symbolId);
  if (!template) return null;

  const kindDef = getNodeKindDefinition(template.kindId);
  const graphBinding = template.graphBinding;
  const properties =
    (template as { properties?: Record<string, unknown> }).properties ??
    (graphBinding?.manifestMethodId
      ? { manifestMethodId: graphBinding.manifestMethodId }
      : graphBinding?.manifestEventId
        ? {
            manifestEventId: graphBinding.manifestEventId,
            eventName:
              (template as { properties?: Record<string, unknown> }).properties?.eventName ??
              template.label.replace(/^On\s+/, ''),
          }
        : {});

  return {
    label: template.label,
    category: template.category,
    kindId: template.kindId,
    kindVersion: template.kindVersion,
    inputs: template.inputs,
    outputs: template.outputs,
    inlineValues: {},
    properties,
    graphBinding: template.graphBinding,
    resolvedPorts: kindDef
      ? { inputs: kindDef.inputs, outputs: kindDef.outputs }
      : { inputs: template.inputs, outputs: template.outputs },
  };
}

export function dispatchSpawnEnvironmentNode(
  action: EnvironmentSpawnAction,
  symbolId: string
) {
  window.dispatchEvent(
    new CustomEvent(SPAWN_ENV_NODE_EVENT, {
      detail: { action, symbolId },
    })
  );
}
