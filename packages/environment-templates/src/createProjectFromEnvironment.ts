import {
  createEmptyProjectSnapshot,
  defaultTabMetadata,
  MAIN_GRAPH_CONTAINER_ID,
  PROJECT_MAP_CONTAINER_NAME,
  type ProjectSnapshot,
} from '@vvs/graph-types';
import { loadEnvironmentManifest } from './loader';
import { resolveApiSurface } from './resolveApiSurface';

function mergeStarterDocuments(
  snapshot: ProjectSnapshot,
  starterDocuments: NonNullable<NonNullable<ReturnType<typeof loadEnvironmentManifest>>['starter']>['documents']
): void {
  if (!starterDocuments) return;

  const cloned = structuredClone(starterDocuments);
  if (cloned.main) {
    snapshot.documents[MAIN_GRAPH_CONTAINER_ID] = {
      ...cloned.main,
      metadata:
        cloned.main.metadata ?? defaultTabMetadata('container', PROJECT_MAP_CONTAINER_NAME),
    };
    delete cloned.main;
  }

  for (const [tabId, doc] of Object.entries(cloned)) {
    snapshot.documents[tabId] = doc;
  }
}

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

  mergeStarterDocuments(snapshot, manifest.starter?.documents);

  if (manifest.starter?.variables) {
    snapshot.variables = structuredClone(manifest.starter.variables);
  }
  if (manifest.starter?.functions) {
    snapshot.functions = structuredClone(manifest.starter.functions);
  }
  if (manifest.starter?.events) {
    snapshot.events = structuredClone(manifest.starter.events);
  }

  snapshot.installedLibrary = [
    {
      assetId: environmentId,
      installedAt: new Date().toISOString(),
      environmentVersion: manifest.version,
    },
  ];

  return snapshot;
}
