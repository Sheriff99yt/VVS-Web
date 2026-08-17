import type { GraphContainer, TargetLanguage } from './symbols';
import { MAIN_GRAPH_CONTAINER_ID } from './symbols';
import { resolveTargetFileExtension, type TargetFileExtensions } from './targetFileExtensions';

/** Repo-relative output folder for graphs living in a container (empty for project map). */
export function containerEmitSubdir(container: GraphContainer): string {
  if (container.id === MAIN_GRAPH_CONTAINER_ID) return '';
  const slug = container.name
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || 'output';
}

export type HostFileStrategy = 'skip' | 'emit' | 'patch';

export interface HostFileIntegrationRule {
  strategy: HostFileStrategy;
  /** Repo-relative path when strategy is emit (defaults to template path) */
  path?: string;
  /** Last-applied template render — used by refresh to detect user edits. */
  appliedTemplate?: string;
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
  /** Fingerprints of last-applied host file contents (refresh / drift). */
  appliedHostFiles?: Record<string, string>;
}

export function createDefaultIntegration(options?: {
  environmentId?: string;
  environmentVersion?: string;
  moduleName?: string;
  defaultTarget?: TargetLanguage;
  /** When true, skip emitting template host entry files (existing repo) */
  adoptExisting?: boolean;
  hostFilePaths?: string[];
  /** Host files already on disk — those are skipped; others emit when this list is provided. */
  existingHostFilePaths?: string[];
}): ProjectIntegrationConfig {
  const hostFiles: Record<string, HostFileIntegrationRule> = {};
  const existing = new Set(
    (options?.existingHostFilePaths ?? []).map((path) => path.replace(/\\/g, '/'))
  );
  const probed = options?.existingHostFilePaths != null;
  for (const path of options?.hostFilePaths ?? []) {
    const normalized = path.replace(/\\/g, '/');
    let strategy: HostFileStrategy;
    if (existing.has(normalized)) strategy = 'skip';
    else if (probed) strategy = 'emit';
    else strategy = options?.adoptExisting ? 'skip' : 'emit';
    hostFiles[normalized] = { strategy };
  }

  const moduleName = options?.moduleName ?? 'App';
  const moduleDir = options?.adoptExisting ? 'src' : '';
  const functionDir = options?.adoptExisting ? 'src' : '';
  const emitTargets: TargetLanguage[] = [
    'python',
    'javascript',
    'cpp',
    'csharp',
    'rust',
    'gdscript',
    'verse',
    'go',
  ];
  const emit: ProjectIntegrationConfig['emit'] = {};
  for (const lang of emitTargets) {
    const ext = resolveTargetFileExtension(lang);
    emit[lang] = {
      moduleDir,
      moduleFile: `${moduleName}.${ext}`,
      functionDir,
    };
  }

  return {
    environmentId: options?.environmentId,
    environmentVersion: options?.environmentVersion,
    emit,
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
          appliedTemplate: typeof r.appliedTemplate === 'string' ? r.appliedTemplate : undefined,
        };
      }
    }
  }

  const appliedHostFiles: Record<string, string> = {};
  if (value.appliedHostFiles && typeof value.appliedHostFiles === 'object') {
    for (const [path, hash] of Object.entries(value.appliedHostFiles as Record<string, unknown>)) {
      if (typeof hash === 'string' && hash.trim()) appliedHostFiles[path] = hash;
    }
  }

  return {
    environmentId: typeof value.environmentId === 'string' ? value.environmentId : undefined,
    environmentVersion:
      typeof value.environmentVersion === 'string' ? value.environmentVersion : undefined,
    emit,
    hostFiles,
    ...(Object.keys(appliedHostFiles).length > 0 ? { appliedHostFiles } : {}),
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
    /** Extra folder prefix from graph container placement (e.g. `utils/Player.py`). */
    subdirPrefix?: string;
    /**
     * Class home modules (especially multi-class on one graph) must use the class-named
     * fallback file — not a fixed project `moduleFile` — or every class overwrites one path.
     */
    preferFallbackOverModuleFile?: boolean;
  }
): string {
  const emitCfg = integration?.emit?.[target];
  let path: string;
  if (options.tabKind === 'main') {
    if (options.preferFallbackOverModuleFile) {
      path = joinPath(emitCfg?.moduleDir, options.fallbackFileName);
    } else if (emitCfg?.moduleFile) {
      path = joinPath(emitCfg.moduleDir, emitCfg.moduleFile);
    } else if (emitCfg?.moduleDir) {
      path = joinPath(emitCfg.moduleDir, options.fallbackFileName);
    } else {
      path = options.fallbackFileName;
    }
  } else {
    const base =
      options.functionBaseName?.replace(/[^a-zA-Z0-9_-]+/g, '_') || 'Function';
    const ext = extensionForTarget(target, options.targetFileExtensions);
    const fileName = `${base}.${ext}`;
    const dir = emitCfg?.functionDir ?? emitCfg?.moduleDir;
    if (dir || emitCfg?.moduleFile) {
      path = joinPath(dir, fileName);
    } else {
      path = fileName;
    }
  }

  const prefix = options.subdirPrefix?.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  if (prefix) {
    path = joinPath(prefix, path);
  }
  return path;
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
  hostFilePaths: string[],
  existingHostFilePaths?: string[]
): ProjectIntegrationConfig {
  const hostFiles = { ...integration.hostFiles };
  const existing = new Set(
    (existingHostFilePaths ?? []).map((path) => path.replace(/\\/g, '/'))
  );
  const probed = existingHostFilePaths != null;
  for (const path of hostFilePaths) {
    const normalized = path.replace(/\\/g, '/');
    if (hostFiles[normalized]) continue;
    hostFiles[normalized] = {
      strategy: probed ? (existing.has(normalized) ? 'skip' : 'emit') : 'skip',
    };
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
