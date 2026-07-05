import {
  loadEnvironmentManifest,
  resolveApiSurface,
  type ProjectEnvironmentManifest,
} from '@vvs/environment-templates';
import type { TargetLanguage } from '@vvs/graph-types';

export { loadEnvironmentManifest };

export function getLinkedEnvironmentManifest(
  environmentId?: string
): ProjectEnvironmentManifest | undefined {
  if (!environmentId) return undefined;
  return loadEnvironmentManifest(environmentId);
}

export function environmentAnalysisContext(
  environmentId: string | undefined,
  targetLanguage: TargetLanguage
) {
  const manifest = getLinkedEnvironmentManifest(environmentId);
  if (!manifest) {
    return {
      environmentId,
      environmentMethodIds: [] as string[],
      environmentEventIds: [] as string[],
      environmentNativeMethodIds: [] as string[],
    };
  }
  const surface = resolveApiSurface(manifest, targetLanguage);
  return {
    environmentId,
    environmentMethodIds: manifest.apiSurface.methods.map((m) => m.id),
    environmentEventIds: manifest.apiSurface.events.map((e) => e.id),
    environmentNativeMethodIds: surface.natives.map((m) => m.id),
  };
}

export function environmentVersionDrift(
  environmentId: string | undefined,
  linkedVersion: string | undefined
): { currentVersion?: string; drift: boolean } {
  if (!environmentId) return { drift: false };
  const manifest = loadEnvironmentManifest(environmentId);
  if (!manifest) return { drift: false };
  return {
    currentVersion: manifest.version,
    drift: Boolean(linkedVersion && linkedVersion !== manifest.version),
  };
}
