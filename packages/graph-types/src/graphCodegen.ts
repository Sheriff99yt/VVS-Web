import type { GraphTabMetadata, TargetLanguage } from './symbols';
import {
  resolveTargetFileExtension,
  type TargetFileExtensions,
} from './targetFileExtensions';

const TARGET_LANGUAGES: TargetLanguage[] = [
  'python',
  'javascript',
  'cpp',
  'verse',
  'gdscript',
  'rust',
  'csharp',
  'go',
  'json',
];

export interface ProjectCodegenDefaults {
  targetLanguage: TargetLanguage;
  targetFileExtensions?: TargetFileExtensions;
}

export interface GraphCodegenSettings {
  targetLanguage: TargetLanguage;
  targetFileExtension: string;
  /** Partial map for emit path resolution (single active language entry). */
  targetFileExtensions: TargetFileExtensions;
}

function isTargetLanguage(value: string | undefined): value is TargetLanguage {
  return value != null && TARGET_LANGUAGES.includes(value as TargetLanguage);
}

/** Effective codegen language + extension for a graph document (metadata overrides project defaults). */
export function resolveGraphCodegenSettings(
  metadata: GraphTabMetadata | undefined,
  defaults: ProjectCodegenDefaults
): GraphCodegenSettings {
  const targetLanguage = isTargetLanguage(metadata?.targetLanguage)
    ? metadata.targetLanguage
    : defaults.targetLanguage;

  const targetFileExtensions: TargetFileExtensions = {
    ...defaults.targetFileExtensions,
  };

  if (metadata?.targetFileExtension) {
    targetFileExtensions[targetLanguage] = metadata.targetFileExtension;
  }

  const targetFileExtension = resolveTargetFileExtension(targetLanguage, targetFileExtensions);

  return {
    targetLanguage,
    targetFileExtension,
    targetFileExtensions: {
      ...targetFileExtensions,
      [targetLanguage]: targetFileExtension,
    },
  };
}

/** Seed written onto new graph documents — empty so graphs inherit project defaults until explicitly overridden. */
export function codegenMetadataSeed(
  _defaults: ProjectCodegenDefaults
): Pick<GraphTabMetadata, 'targetLanguage' | 'targetFileExtension'> {
  return {};
}
