import type { TargetLanguage } from '@vvs/graph-types';
import type { ProjectEnvironmentManifest } from '../types';
import { validateEnvironmentManifest } from '../validate';
import type { AsyncApiDocument } from './fromAsyncApi';
import { importEventsFromAsyncApi } from './fromAsyncApi';
import type { OpenApiDocument } from './fromOpenApi';
import { importMethodsFromOpenApi } from './fromOpenApi';
import type { TypeSpecImportDocument } from './fromTypeSpec';
import { importApiSurfaceFromTypeSpec } from './fromTypeSpec';

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
  /** Compiler-free TypeSpec snapshot (from `loadTypeSpecDocument` on Node). */
  typespec?: TypeSpecImportDocument;
  hostFiles?: ProjectEnvironmentManifest['hostFiles'];
  /** Merge with generated methods/events (generated first, then manual overrides by id). */
  extraMethods?: ProjectEnvironmentManifest['apiSurface']['methods'];
  extraEvents?: ProjectEnvironmentManifest['apiSurface']['events'];
  extraTypes?: ProjectEnvironmentManifest['apiSurface']['types'];
  openapiOptions?: Parameters<typeof importMethodsFromOpenApi>[1];
  asyncapiOptions?: Parameters<typeof importEventsFromAsyncApi>[1];
  typespecOptions?: Parameters<typeof importApiSurfaceFromTypeSpec>[1];
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
  const typespecSurface = input.typespec
    ? importApiSurfaceFromTypeSpec(input.typespec, input.typespecOptions)
    : { types: [], methods: [] };

  const methods = mergeById(
    [...typespecSurface.methods, ...openapiMethods],
    input.extraMethods ?? []
  );
  const events = mergeById(asyncEvents, input.extraEvents ?? []);

  const extendsId = input.extendsTypeId ?? 'object';

  const types = mergeById(
    [
      {
        id: extendsId,
        displayName: extendsId.charAt(0).toUpperCase() + extendsId.slice(1),
        targets: buildDefaultTypeTargets(extendsId, input.supportedTargets),
      },
      ...typespecSurface.types,
    ],
    input.extraTypes ?? []
  );

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
      types,
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
    if (t === 'gdscript') out.gdscript = { extendsName: 'Node' };
  }
  return out;
}
