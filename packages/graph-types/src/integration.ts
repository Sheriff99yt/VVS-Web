import type { TargetLanguage } from './symbols';
import { resolveTargetFileExtension, type TargetFileExtensions } from './targetFileExtensions';

export type HostFileStrategy = 'skip' | 'emit' | 'patch';

export interface HostFileIntegrationRule {
  strategy: HostFileStrategy;
  /** Repo-relative path when strategy is emit (defaults to template path) */
  path?: string;
}

export interface TargetEmitConfig {
  /** Repo-relative directory for generated module files */
  moduleDir?: string;
  /** Main graph module filename (e.g. App.py) */
  moduleFile?: string;
  /** Directory for function graph modules (defaults to moduleDir) */
  functionDir?: string;
}

export interface ProjectIntegrationConfig {
  environmentId?: string;
  environmentVersion?: string;
  emit: Partial<Record<TargetLanguage, TargetEmitConfig>>;
  hostFiles: Record<string, HostFileIntegrationRule>;
}

export function createDefaultIntegration(options?: {
  environmentId?: string;
  environmentVersion?: string;
  moduleName?: string;
  defaultTarget?: TargetLanguage;
  /** When true, skip emitting template host entry files (existing repo) */
  adoptExisting?: boolean;
  hostFilePaths?: string[];
}): ProjectIntegrationConfig {
  const hostFiles: Record<string, HostFileIntegrationRule> = {};
  const strategy: HostFileStrategy = options?.adoptExisting ? 'skip' : 'emit';
  for (const path of options?.hostFilePaths ?? []) {
    hostFiles[path] = { strategy };
  }

  const target = options?.defaultTarget ?? 'python';
  const moduleName = options?.moduleName ?? 'App';
  const ext = resolveTargetFileExtension(target);

  return {
    environmentId: options?.environmentId,
    environmentVersion: options?.environmentVersion,
    emit: {
      [target]: {
        moduleDir: options?.adoptExisting ? 'src' : '',
        moduleFile: `${moduleName}.${ext}`,
        functionDir: options?.adoptExisting ? 'src' : '',
      },
    },
    hostFiles,
  };
}

export function normalizeIntegrationConfig(raw: unknown): ProjectIntegrationConfig {
  if (!raw || typeof raw !== 'object') {
    return createDefaultIntegration();
  }
  const value = raw as Record<string, unknown>;
  const emit: ProjectIntegrationConfig['emit'] = {};
  if (value.emit && typeof value.emit === 'object') {
    for (const [lang, cfg] of Object.entries(value.emit as Record<string, unknown>)) {
      if (!cfg || typeof cfg !== 'object') continue;
      const c = cfg as Record<string, unknown>;
      emit[lang as TargetLanguage] = {
        moduleDir: typeof c.moduleDir === 'string' ? c.moduleDir : undefined,
        moduleFile: typeof c.moduleFile === 'string' ? c.moduleFile : undefined,
        functionDir: typeof c.functionDir === 'string' ? c.functionDir : undefined,
      };
    }
  }

  const hostFiles: Record<string, HostFileIntegrationRule> = {};
  if (value.hostFiles && typeof value.hostFiles === 'object') {
    for (const [path, rule] of Object.entries(value.hostFiles as Record<string, unknown>)) {
      if (!rule || typeof rule !== 'object') continue;
      const r = rule as Record<string, unknown>;
      const strategy = r.strategy;
      if (strategy === 'skip' || strategy === 'emit' || strategy === 'patch') {
        hostFiles[path] = {
          strategy,
          path: typeof r.path === 'string' ? r.path : undefined,
        };
      }
    }
  }

  return {
    environmentId: typeof value.environmentId === 'string' ? value.environmentId : undefined,
    environmentVersion:
      typeof value.environmentVersion === 'string' ? value.environmentVersion : undefined,
    emit,
    hostFiles,
  };
}

function joinPath(dir: string | undefined, file: string): string {
  const normalizedDir = (dir ?? '').replace(/\\/g, '/').replace(/\/+$/, '');
  if (!normalizedDir) return file;
  return `${normalizedDir}/${file}`;
}

function extensionForTarget(
  target: TargetLanguage,
  overrides?: TargetFileExtensions
): string {
  return resolveTargetFileExtension(target, overrides);
}

/** Resolve repo-relative path for a generated module file. */
export function resolveModuleEmitPath(
  integration: ProjectIntegrationConfig | undefined,
  target: TargetLanguage,
  options: {
    tabKind: 'main' | 'function';
    moduleName: string;
    functionBaseName?: string;
    fallbackFileName: string;
    targetFileExtensions?: TargetFileExtensions;
  }
): string {
  const emitCfg = integration?.emit?.[target];
  if (options.tabKind === 'main') {
    if (emitCfg?.moduleFile) {
      return joinPath(emitCfg.moduleDir, emitCfg.moduleFile);
    }
    if (emitCfg?.moduleDir) {
      return joinPath(emitCfg.moduleDir, options.fallbackFileName);
    }
    return options.fallbackFileName;
  }

  const base =
    options.functionBaseName?.replace(/[^a-zA-Z0-9_-]+/g, '_') || 'Function';
  const ext = extensionForTarget(target, options.targetFileExtensions);
  const fileName = `${base}.${ext}`;
  const dir = emitCfg?.functionDir ?? emitCfg?.moduleDir;
  if (dir || emitCfg?.moduleFile) {
    return joinPath(dir, fileName);
  }
  return fileName;
}

export function shouldEmitHostFile(
  integration: ProjectIntegrationConfig | undefined,
  templateHostPath: string
): boolean {
  const rule = integration?.hostFiles?.[templateHostPath];
  if (!rule) return true;
  return rule.strategy === 'emit' || rule.strategy === 'patch';
}

export function resolveHostEmitPath(
  integration: ProjectIntegrationConfig | undefined,
  templateHostPath: string
): string {
  const rule = integration?.hostFiles?.[templateHostPath];
  if (rule?.path) return rule.path;
  return templateHostPath;
}

export function syncIntegrationEnvironment(
  integration: ProjectIntegrationConfig,
  environmentId: string | undefined,
  environmentVersion: string | undefined,
  hostFilePaths: string[]
): ProjectIntegrationConfig {
  const hostFiles = { ...integration.hostFiles };
  for (const path of hostFilePaths) {
    if (!hostFiles[path]) {
      hostFiles[path] = { strategy: 'skip' };
    }
  }
  return {
    ...integration,
    environmentId,
    environmentVersion,
    hostFiles,
  };
}

export function formatEmitPreview(
  integration: ProjectIntegrationConfig | undefined,
  target: TargetLanguage,
  moduleName: string
): string {
  const ext = extensionForTarget(target);
  const path = resolveModuleEmitPath(integration, target, {
    tabKind: 'main',
    moduleName,
    fallbackFileName: `${moduleName}.${ext}`,
  });
  return path || `${moduleName}.${ext}`;
}
