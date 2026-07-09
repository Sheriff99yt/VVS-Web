import type { TargetLanguage } from '@vvs/graph-types';
import type { ProjectEnvironmentManifest } from './types';
import { isEnvironmentCategory } from './categories';

const TARGETS = new Set<TargetLanguage>(['python', 'javascript', 'cpp', 'verse', 'gdscript', 'rust', 'csharp', 'json']);

export interface ManifestValidationIssue {
  path: string;
  message: string;
}

export function validateEnvironmentManifest(
  value: unknown
): { ok: true; manifest: ProjectEnvironmentManifest } | { ok: false; issues: ManifestValidationIssue[] } {
  const issues: ManifestValidationIssue[] = [];

  if (!value || typeof value !== 'object') {
    return { ok: false, issues: [{ path: '', message: 'Manifest must be an object' }] };
  }

  const m = value as Record<string, unknown>;

  requireString(m, 'id', issues);
  if (typeof m.id === 'string' && !/^env\.[a-z0-9.-]+$/.test(m.id)) {
    issues.push({ path: 'id', message: 'id must match env.{slug} (lowercase, dots, hyphens)' });
  }
  requireString(m, 'version', issues);
  requireString(m, 'displayName', issues);
  requireString(m, 'description', issues);
  if (m.category !== undefined) {
    if (typeof m.category !== 'string' || !isEnvironmentCategory(m.category)) {
      issues.push({
        path: 'category',
        message: 'category must be one of: console, web, data, api, game',
      });
    }
  }
  requireTarget(m, 'defaultTarget', issues);
  requireTargetArray(m, 'supportedTargets', issues);

  if (m.module && typeof m.module === 'object') {
    const mod = m.module as Record<string, unknown>;
    requireString(mod, 'defaultName', issues, 'module.defaultName');
  } else {
    issues.push({ path: 'module', message: 'module object is required' });
  }

  if (!m.apiSurface || typeof m.apiSurface !== 'object') {
    issues.push({ path: 'apiSurface', message: 'apiSurface object is required' });
  } else {
    const api = m.apiSurface as Record<string, unknown>;
    for (const key of ['types', 'methods', 'events'] as const) {
      if (!Array.isArray(api[key])) {
        issues.push({ path: `apiSurface.${key}`, message: `${key} must be an array` });
      }
    }
  }

  if (!Array.isArray(m.hostFiles)) {
    issues.push({ path: 'hostFiles', message: 'hostFiles must be an array' });
  } else {
    for (let i = 0; i < m.hostFiles.length; i++) {
      const f = m.hostFiles[i];
      if (!f || typeof f !== 'object') {
        issues.push({ path: `hostFiles[${i}]`, message: 'host file must be an object' });
        continue;
      }
      const file = f as Record<string, unknown>;
      requireString(file, 'path', issues, `hostFiles[${i}].path`);
      requireString(file, 'template', issues, `hostFiles[${i}].template`);
      if (file.role !== 'entry' && file.role !== 'config' && file.role !== 'asset') {
        issues.push({ path: `hostFiles[${i}].role`, message: 'role must be entry, config, or asset' });
      }
    }
  }

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, manifest: value as ProjectEnvironmentManifest };
}

function requireString(
  obj: Record<string, unknown>,
  key: string,
  issues: ManifestValidationIssue[],
  path = key
): void {
  if (typeof obj[key] !== 'string' || !(obj[key] as string).trim()) {
    issues.push({ path, message: `${path} must be a non-empty string` });
  }
}

function requireTarget(
  obj: Record<string, unknown>,
  key: string,
  issues: ManifestValidationIssue[],
  path = key
): void {
  if (typeof obj[key] !== 'string' || !TARGETS.has(obj[key] as TargetLanguage)) {
    issues.push({ path, message: `${path} must be a supported target language` });
  }
}

function requireTargetArray(
  obj: Record<string, unknown>,
  key: string,
  issues: ManifestValidationIssue[]
): void {
  if (!Array.isArray(obj[key]) || (obj[key] as unknown[]).length === 0) {
    issues.push({ path: key, message: `${key} must be a non-empty array` });
    return;
  }
  for (let i = 0; i < (obj[key] as unknown[]).length; i++) {
    const t = (obj[key] as unknown[])[i];
    if (typeof t !== 'string' || !TARGETS.has(t as TargetLanguage)) {
      issues.push({ path: `${key}[${i}]`, message: 'invalid target language' });
    }
  }
}
