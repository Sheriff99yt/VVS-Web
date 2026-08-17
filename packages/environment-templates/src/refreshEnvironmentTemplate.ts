import {
  resolveHostEmitPath,
  type InstalledLibraryEntry,
  type ProjectIntegrationConfig,
} from '@vvs/graph-types';
import { renderHostFileTemplate } from './resolveApiSurface';
import type { ProjectEnvironmentManifest } from './types';

export type HostFileRefreshAction = 'applied' | 'kept-yours' | 'already-current';

export interface HostFileRefreshNote {
  path: string;
  emitPath: string;
  action: HostFileRefreshAction;
}

export interface RefreshEnvironmentTemplateInput {
  environmentId?: string;
  environmentVersion?: string;
  moduleName: string;
  integration: ProjectIntegrationConfig;
  nextManifest: ProjectEnvironmentManifest;
  /**
   * On-disk host file contents keyed by emit path.
   * Omit when there is no project folder — version is updated and the next
   * generate emits new templates (no user file to preserve).
   */
  currentHostFiles?: Record<string, string>;
  /** Last-applied template renders keyed by template path (overrides integration.appliedTemplate). */
  previousRenderedHostFiles?: Record<string, string>;
  installedLibrary?: InstalledLibraryEntry[];
}

export interface RefreshEnvironmentTemplateResult {
  environmentId: string;
  environmentVersion: string;
  integration: ProjectIntegrationConfig;
  installedLibrary: InstalledLibraryEntry[];
  writeFiles: { path: string; content: string }[];
  notes: HostFileRefreshNote[];
}

function normalizeHostContent(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\s+$/g, '');
}

/**
 * Re-apply host files / linkage from the current catalog version of a linked
 * environment. Preserves the user graph (this function never touches documents).
 *
 * Overwrites a host file only when it is missing, already matches the new
 * template, or still matches the last-applied / previous template render.
 * Diverged files are kept and marked skip so a later generate does not clobber them.
 */
export function refreshEnvironmentTemplate(
  input: RefreshEnvironmentTemplateInput
): RefreshEnvironmentTemplateResult {
  const { nextManifest, moduleName, integration } = input;
  const hostFiles = { ...integration.hostFiles };
  const writeFiles: { path: string; content: string }[] = [];
  const notes: HostFileRefreshNote[] = [];

  for (const host of nextManifest.hostFiles) {
    const prior = hostFiles[host.path] ?? { strategy: 'emit' as const };
    const emitPath = resolveHostEmitPath(
      { ...integration, hostFiles: { ...hostFiles, [host.path]: prior } },
      host.path
    );
    const newContent = renderHostFileTemplate(host.template, moduleName);
    const previous =
      input.previousRenderedHostFiles?.[host.path] ?? prior.appliedTemplate;

    if (prior.strategy === 'skip' || prior.strategy === 'patch') {
      hostFiles[host.path] = { ...prior };
      notes.push({ path: host.path, emitPath, action: 'kept-yours' });
      continue;
    }

    if (input.currentHostFiles === undefined) {
      hostFiles[host.path] = {
        ...prior,
        strategy: 'emit',
        appliedTemplate: newContent,
      };
      notes.push({ path: host.path, emitPath, action: 'applied' });
      continue;
    }

    const currentRaw = input.currentHostFiles[emitPath];
    const current =
      currentRaw === undefined ? undefined : normalizeHostContent(currentRaw);
    const nextNorm = normalizeHostContent(newContent);
    const prevNorm = previous === undefined ? undefined : normalizeHostContent(previous);

    if (current === undefined) {
      writeFiles.push({ path: emitPath, content: newContent });
      hostFiles[host.path] = {
        ...prior,
        strategy: 'emit',
        appliedTemplate: newContent,
      };
      notes.push({ path: host.path, emitPath, action: 'applied' });
      continue;
    }

    if (current === nextNorm) {
      hostFiles[host.path] = {
        ...prior,
        appliedTemplate: newContent,
      };
      notes.push({ path: host.path, emitPath, action: 'already-current' });
      continue;
    }

    if (prevNorm !== undefined && current === prevNorm) {
      writeFiles.push({ path: emitPath, content: newContent });
      hostFiles[host.path] = {
        ...prior,
        strategy: 'emit',
        appliedTemplate: newContent,
      };
      notes.push({ path: host.path, emitPath, action: 'applied' });
      continue;
    }

    hostFiles[host.path] = {
      ...prior,
      strategy: 'skip',
      appliedTemplate: previous,
    };
    notes.push({ path: host.path, emitPath, action: 'kept-yours' });
  }

  const installedLibrary = (input.installedLibrary ?? []).map((entry) =>
    entry.assetId === nextManifest.id
      ? { ...entry, environmentVersion: nextManifest.version }
      : entry
  );

  return {
    environmentId: nextManifest.id,
    environmentVersion: nextManifest.version,
    integration: {
      ...integration,
      environmentId: nextManifest.id,
      environmentVersion: nextManifest.version,
      hostFiles,
    },
    installedLibrary,
    writeFiles,
    notes,
  };
}
