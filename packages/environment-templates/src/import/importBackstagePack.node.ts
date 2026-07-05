import type { TargetLanguage } from '@vvs/graph-types';
import type { ProjectEnvironmentManifest } from '../types';
import { buildEnvironmentManifest } from './buildEnvironmentManifest';
import type { AsyncApiDocument } from './fromAsyncApi';
import type { OpenApiDocument } from './fromOpenApi';
import {
  backstageMetaToEnvId,
  parseBackstageTemplateYaml,
  type BackstageTemplateMeta,
} from './fromBackstageSkeleton';
import { importHostFilesFromSkeleton } from './fromBackstageSkeleton.node';

export interface ImportBackstagePackInput {
  packDir: string;
  skeletonSubdir?: string;
  id?: string;
  version?: string;
  defaultTarget?: TargetLanguage;
  supportedTargets?: TargetLanguage[];
  openapi?: OpenApiDocument;
  asyncapi?: AsyncApiDocument;
}

/** Import Backstage-style pack: template.yaml metadata + skeleton/ → manifest (Node/Bun only). */
export async function importBackstagePack(
  input: ImportBackstagePackInput
): Promise<ProjectEnvironmentManifest> {
  const skeletonDir = `${input.packDir}/${input.skeletonSubdir ?? 'skeleton'}`.replace(/\/+/g, '/');
  let meta: BackstageTemplateMeta = {};
  try {
    const yaml = await Bun.file(`${input.packDir}/template.yaml`).text();
    meta = parseBackstageTemplateYaml(yaml);
  } catch {
    try {
      meta = (await Bun.file(`${input.packDir}/vvs-environment.meta.json`).json()) as BackstageTemplateMeta;
    } catch {
      meta = {};
    }
  }

  const hostFiles = await importHostFilesFromSkeleton({ skeletonDir });
  const id = input.id ?? backstageMetaToEnvId(meta, 'custom.template');
  const version = input.version ?? '1.0.0';

  return buildEnvironmentManifest({
    id,
    version,
    displayName: meta.title ?? meta.name ?? id,
    description: meta.description ?? `Imported from Backstage template pack at ${input.packDir}`,
    defaultTarget: input.defaultTarget ?? 'python',
    supportedTargets: input.supportedTargets ?? ['python', 'javascript'],
    hostFiles,
    openapi: input.openapi,
    asyncapi: input.asyncapi,
  });
}
