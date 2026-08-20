import {
  resolveHostEmitPath,
  shouldEmitHostFile,
  syncIntegrationEnvironment,
  type ProjectIntegrationConfig,
  type ProjectSnapshot,
} from '@vvs/graph-types';
import { renderHostFileTemplate } from './resolveApiSurface';
import type { HostFileTemplate, ProjectEnvironmentManifest } from './types';

export type HostFileSkipReason = 'policy' | 'user-changed';

export interface HostFileDrift {
  path: string;
  reason: 'user-changed' | 'template-changed';
}

export interface HostFileWritePlan {
  writes: { path: string; content: string }[];
  skipped: { path: string; reason: HostFileSkipReason }[];
  unchanged: string[];
  drift: HostFileDrift[];
  appliedHostFiles: Record<string, string>;
}

export function normalizeHostFileContent(content: string): string {
  const normalized = content.replace(/\r\n/g, '\n');
  return normalized.endsWith('\n') ? normalized : `${normalized}\n`;
}

/** Stable fingerprint for last-applied host file contents (not a security hash). */
export function hashHostContent(content: string): string {
  const norm = normalizeHostFileContent(content);
  let hash = 2166136261;
  for (let i = 0; i < norm.length; i++) {
    hash ^= norm.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

export function adoptHostFileRules(
  hostFilePaths: string[],
  existingPaths: Iterable<string>
): Record<string, { strategy: 'skip' | 'emit' }> {
  const existing = new Set(
    [...existingPaths].map((path) => path.replace(/\\/g, '/'))
  );
  const rules: Record<string, { strategy: 'skip' | 'emit' }> = {};
  for (const path of hostFilePaths) {
    const normalized = path.replace(/\\/g, '/');
    rules[normalized] = { strategy: existing.has(normalized) ? 'skip' : 'emit' };
  }
  return rules;
}

/** Host files Generate would write: emit/patch only; `contents` overrides the template render. */
export function generateHostFiles(
  manifest: { hostFiles: HostFileTemplate[] },
  moduleName: string,
  integration?: ProjectIntegrationConfig
): { path: string; content: string }[] {
  return manifest.hostFiles
    .filter((host) => shouldEmitHostFile(integration, host.path))
    .map((host) => {
      const rule = integration?.hostFiles?.[host.path];
      const content =
        typeof rule?.contents === 'string'
          ? rule.contents
          : renderHostFileTemplate(host.template, moduleName);
      return {
        path: resolveHostEmitPath(integration, host.path),
        content,
      };
    });
}

export function skippedHostEmitPaths(
  integration: ProjectIntegrationConfig | undefined
): Set<string> {
  const skipped = new Set<string>();
  if (!integration) return skipped;
  for (const templatePath of Object.keys(integration.hostFiles ?? {})) {
    if (shouldEmitHostFile(integration, templatePath)) continue;
    skipped.add(templatePath.replace(/\\/g, '/'));
    skipped.add(resolveHostEmitPath(integration, templatePath).replace(/\\/g, '/'));
  }
  return skipped;
}

export function filterGeneratedFilesForHostPolicy<T extends { path: string }>(
  files: T[],
  integration: ProjectIntegrationConfig | undefined
): T[] {
  const skipped = skippedHostEmitPaths(integration);
  if (skipped.size === 0) return files;
  return files.filter((file) => !skipped.has(file.path.replace(/\\/g, '/')));
}

export function planHostFileWrites(input: {
  hostFiles: HostFileTemplate[];
  moduleName: string;
  existingContents: Record<string, string | undefined>;
  integration?: ProjectIntegrationConfig;
}): HostFileWritePlan {
  const writes: HostFileWritePlan['writes'] = [];
  const skipped: HostFileWritePlan['skipped'] = [];
  const unchanged: string[] = [];
  const drift: HostFileDrift[] = [];
  const appliedHostFiles: Record<string, string> = {
    ...(input.integration?.appliedHostFiles ?? {}),
  };

  for (const hostFile of input.hostFiles) {
    const dest = resolveHostEmitPath(input.integration, hostFile.path).replace(/\\/g, '/');
    if (!shouldEmitHostFile(input.integration, hostFile.path)) {
      skipped.push({ path: dest, reason: 'policy' });
      continue;
    }

    const nextContent = normalizeHostFileContent(
      renderHostFileTemplate(hostFile.template, input.moduleName)
    );
    const nextHash = hashHostContent(nextContent);
    const existing = input.existingContents[dest] ?? input.existingContents[hostFile.path];

    if (existing == null) {
      writes.push({ path: dest, content: nextContent });
      appliedHostFiles[dest] = nextHash;
      continue;
    }

    const existingNorm = normalizeHostFileContent(existing);
    const existingHash = hashHostContent(existingNorm);
    if (existingHash === nextHash) {
      unchanged.push(dest);
      appliedHostFiles[dest] = nextHash;
      continue;
    }

    const previousHash = input.integration?.appliedHostFiles?.[dest];
    if (previousHash && previousHash === existingHash) {
      writes.push({ path: dest, content: nextContent });
      appliedHostFiles[dest] = nextHash;
      continue;
    }

    skipped.push({ path: dest, reason: 'user-changed' });
    drift.push({
      path: dest,
      reason: previousHash ? 'user-changed' : 'template-changed',
    });
  }

  return { writes, skipped, unchanged, drift, appliedHostFiles };
}

export function recordAppliedHostFiles(
  integration: ProjectIntegrationConfig,
  appliedHostFiles: Record<string, string>
): ProjectIntegrationConfig {
  return { ...integration, appliedHostFiles };
}

/** Bump the linked env version and integration pointer. Graphs are left untouched. */
export function refreshLinkedEnvironment(
  snapshot: ProjectSnapshot,
  manifest: ProjectEnvironmentManifest
): ProjectSnapshot {
  const hostPaths = manifest.hostFiles.map((file) => file.path);
  const integration = snapshot.integration
    ? syncIntegrationEnvironment(
        snapshot.integration,
        manifest.id,
        manifest.version,
        hostPaths
      )
    : snapshot.integration;

  return {
    ...snapshot,
    environmentId: manifest.id,
    environmentVersion: manifest.version,
    installedLibrary: (snapshot.installedLibrary ?? []).map((entry) =>
      entry.assetId === manifest.id
        ? { ...entry, environmentVersion: manifest.version }
        : entry
    ),
    integration,
  };
}

export function mergeImportedManifest(
  existing: ProjectEnvironmentManifest,
  incoming: ProjectEnvironmentManifest
): ProjectEnvironmentManifest {
  const methods = mergeById(existing.apiSurface.methods, incoming.apiSurface.methods);
  const events = mergeById(existing.apiSurface.events, incoming.apiSurface.events);
  const types = mergeById(existing.apiSurface.types, incoming.apiSurface.types);
  const hostFiles = mergeHostFiles(existing.hostFiles, incoming.hostFiles);

  return {
    ...existing,
    ...incoming,
    displayName: incoming.displayName || existing.displayName,
    description: incoming.description || existing.description,
    apiSurface: { types, methods, events },
    hostFiles,
  };
}

function mergeById<T extends { id: string }>(primary: T[], incoming: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of primary) map.set(item.id, item);
  for (const item of incoming) map.set(item.id, item);
  return [...map.values()];
}

function mergeHostFiles(
  existing: HostFileTemplate[],
  incoming: HostFileTemplate[]
): HostFileTemplate[] {
  const map = new Map<string, HostFileTemplate>();
  for (const file of existing) map.set(file.path, file);
  for (const file of incoming) map.set(file.path, file);
  return [...map.values()].sort((a, b) => a.path.localeCompare(b.path));
}
