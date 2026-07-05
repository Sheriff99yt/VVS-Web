import {
  createEmptyProjectSnapshot,
  defaultTabMetadata,
  type ProjectSnapshot,
} from '@vvs/graph-types';
import { loadEnvironmentManifest } from './loader';
import { resolveApiSurface } from './resolveApiSurface';

export function createProjectFromEnvironment(environmentId: string): ProjectSnapshot | null {
  const manifest = loadEnvironmentManifest(environmentId);
  if (!manifest) return null;

  const snapshot = createEmptyProjectSnapshot();
  const moduleName = manifest.module.defaultName;
  const surface = resolveApiSurface(manifest, manifest.defaultTarget);

  snapshot.environmentId = environmentId;
  snapshot.environmentVersion = manifest.version;
  snapshot.projectDetails = {
    moduleName,
    extendsType: surface.extendsType,
    description: manifest.description,
  };
  snapshot.targetLanguage = manifest.defaultTarget;

  if (manifest.starter?.documents?.main) {
    snapshot.documents.main = structuredClone(manifest.starter.documents.main);
  } else if (manifest.starter?.documents) {
    snapshot.documents = { ...snapshot.documents, ...structuredClone(manifest.starter.documents) };
  }

  if (manifest.starter?.variables) {
    snapshot.variables = structuredClone(manifest.starter.variables);
  }
  if (manifest.starter?.functions) {
    snapshot.functions = structuredClone(manifest.starter.functions);
  }
  if (manifest.starter?.events) {
    snapshot.events = structuredClone(manifest.starter.events);
  }

  snapshot.documents.main.metadata = defaultTabMetadata('main', 'Main graph');
  snapshot.installedLibrary = [
    {
      assetId: environmentId,
      installedAt: new Date().toISOString(),
      environmentVersion: manifest.version,
    },
  ];

  return snapshot;
}
