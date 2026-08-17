import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
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

async function readBackstageMeta(packDir: string): Promise<BackstageTemplateMeta> {
  for (const name of ['template.yaml', 'template.yml']) {
    try {
      const yaml = await readFile(join(packDir, name), 'utf8');
      return parseBackstageTemplateYaml(yaml);
    } catch {
      // try next candidate
    }
  }
  try {
    return (await Bun.file(join(packDir, 'vvs-environment.meta.json')).json()) as BackstageTemplateMeta;
  } catch {
    return {};
  }
}

/** Import Backstage-style pack: template.yaml metadata + skeleton/ → manifest (Node/Bun only). */
export async function importBackstagePack(
  input: ImportBackstagePackInput
): Promise<ProjectEnvironmentManifest> {
  const skeletonDir = join(input.packDir, input.skeletonSubdir ?? 'skeleton');
  const meta = await readBackstageMeta(input.packDir);
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
