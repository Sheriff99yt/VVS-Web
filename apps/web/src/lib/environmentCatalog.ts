import type { ProjectEnvironmentManifest } from '@vvs/environment-templates';
import {
  listAllEnvironments,
  previewHostEntry,
  registerEnvironmentManifest,
  resolveApiSurface,
  resolveEnvironmentCategory,
  environmentCategoryLabel,
} from '@vvs/environment-templates';
import type { TargetLanguage } from '@vvs/graph-types';
import type { LibraryAsset } from '@/types/libraryAsset';
import { VvsApi, type EnvironmentCatalogEntry } from '@/lib/api';
import { bootstrapImportedEnvironments } from '@/lib/api';

let catalogBootstrapped = false;
let bootstrapPromise: Promise<void> | null = null;

export function isEnvironmentCatalogReady(): boolean {
  return catalogBootstrapped;
}

/** Load manifests from the server registry (HTTP) or keep package built-ins (offline). */
export async function bootstrapEnvironmentCatalog(): Promise<void> {
  if (catalogBootstrapped) return;
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    bootstrapImportedEnvironments();
    try {
      const entries = await VvsApi.listEnvironments();
      for (const entry of entries) {
        registerEnvironmentManifest(entry.manifest);
      }
    } catch {
      // Offline / mock — built-in JSON manifests from the package are enough.
    } finally {
      catalogBootstrapped = true;
    }
  })();

  return bootstrapPromise;
}

/** All environments available after bootstrap (built-ins + registered). */
export function listProjectEnvironments(): ProjectEnvironmentManifest[] {
  return listAllEnvironments().sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function environmentManifestToLibraryAsset(
  manifest: ProjectEnvironmentManifest
): LibraryAsset {
  const tags = [
    environmentCategoryLabel(resolveEnvironmentCategory(manifest)),
    manifest.defaultTarget,
    ...manifest.supportedTargets.filter((t) => t !== manifest.defaultTarget),
  ].slice(0, 5);

  return {
    id: manifest.id,
    title: manifest.displayName,
    author: 'VVS',
    type: 'Environments',
    downloads: 'Built-in',
    likes: `v${manifest.version}`,
    description: manifest.description,
    tags,
    previewCode: previewHostEntry(manifest),
    importKind: 'environment',
    environmentId: manifest.id,
    environmentVersion: manifest.version,
    environmentCategory: resolveEnvironmentCategory(manifest),
  };
}

export function linkEnvironmentManifest(
  manifest: ProjectEnvironmentManifest,
  targetLanguage: TargetLanguage
) {
  const surface = resolveApiSurface(manifest, targetLanguage);
  return {
    environmentId: manifest.id,
    environmentVersion: manifest.version,
    targetLanguage,
    projectDetails: {
      moduleName: manifest.module.defaultName,
      extendsType: surface.extendsType,
      description: manifest.description,
    },
  };
}

export function applyRegistryEntries(entries: EnvironmentCatalogEntry[]): void {
  for (const entry of entries) {
    registerEnvironmentManifest(entry.manifest);
  }
  catalogBootstrapped = true;
}
