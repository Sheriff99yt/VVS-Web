import type { TargetLanguage } from '@vvs/graph-types';
import type { ProjectEnvironmentManifest } from '../types';
import { validateEnvironmentManifest } from '../validate';
import type { AsyncApiDocument } from './fromAsyncApi';
import { importEventsFromAsyncApi } from './fromAsyncApi';
import type { OpenApiDocument } from './fromOpenApi';
import { importMethodsFromOpenApi } from './fromOpenApi';

export interface BuildEnvironmentManifestInput {
  id: string;
  version: string;
  displayName: string;
  description: string;
  defaultTarget: TargetLanguage;
  supportedTargets: TargetLanguage[];
  moduleDefaultName?: string;
  extendsTypeId?: string;
  openapi?: OpenApiDocument;
  asyncapi?: AsyncApiDocument;
  hostFiles?: ProjectEnvironmentManifest['hostFiles'];
  /** Merge with generated methods/events (generated first, then manual overrides by id). */
  extraMethods?: ProjectEnvironmentManifest['apiSurface']['methods'];
  extraEvents?: ProjectEnvironmentManifest['apiSurface']['events'];
  openapiOptions?: Parameters<typeof importMethodsFromOpenApi>[1];
  asyncapiOptions?: Parameters<typeof importEventsFromAsyncApi>[1];
}

export function buildEnvironmentManifest(
  input: BuildEnvironmentManifestInput
): ProjectEnvironmentManifest {
  const openapiMethods = input.openapi
    ? importMethodsFromOpenApi(input.openapi, input.openapiOptions)
    : [];
  const asyncEvents = input.asyncapi
    ? importEventsFromAsyncApi(input.asyncapi, input.asyncapiOptions)
    : [];

  const methods = mergeById(openapiMethods, input.extraMethods ?? []);
  const events = mergeById(asyncEvents, input.extraEvents ?? []);

  const extendsId = input.extendsTypeId ?? 'object';

  const manifest: ProjectEnvironmentManifest = {
    id: input.id,
    version: input.version,
    displayName: input.displayName,
    description: input.description,
    defaultTarget: input.defaultTarget,
    supportedTargets: input.supportedTargets,
    module: {
      defaultName: input.moduleDefaultName ?? 'App',
      extends: { id: extendsId },
    },
    apiSurface: {
      types: [
        {
          id: extendsId,
          displayName: extendsId.charAt(0).toUpperCase() + extendsId.slice(1),
          targets: buildDefaultTypeTargets(extendsId, input.supportedTargets),
        },
      ],
      methods,
      events,
    },
    hostFiles: input.hostFiles ?? [],
  };

  const validated = validateEnvironmentManifest(manifest);
  if (!validated.ok) {
    const msg = validated.issues.map((i) => `${i.path}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment manifest: ${msg}`);
  }
  return validated.manifest;
}

function mergeById<T extends { id: string }>(primary: T[], overrides: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of primary) map.set(item.id, item);
  for (const item of overrides) map.set(item.id, item);
  return [...map.values()];
}

function buildDefaultTypeTargets(
  extendsId: string,
  targets: TargetLanguage[]
): Partial<Record<TargetLanguage, { extendsName?: string }>> {
  const out: Partial<Record<TargetLanguage, { extendsName?: string }>> = {};
  for (const t of targets) {
    if (t === 'python') out.python = { extendsName: extendsId };
    if (t === 'javascript') out.javascript = { extendsName: 'Object' };
    if (t === 'cpp') out.cpp = { extendsName: 'std::enable_shared_from_this' };
    if (t === 'verse') out.verse = { extendsName: 'creative_object' };
  }
  return out;
}
