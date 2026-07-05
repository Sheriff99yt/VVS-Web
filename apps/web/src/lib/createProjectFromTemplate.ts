import { ProjectSnapshot } from '@/types/projectSnapshot';
import { LibraryAsset } from '@/types/libraryAsset';
import { createEmptyProjectSnapshot } from '@/lib/emptyProject';
import { LIBRARY_GRAPH_FIXTURES } from '@/lib/libraryCatalog';
import { defaultTabMetadata } from '@/lib/graphDefaults';
import { createProjectFromEnvironment } from '@vvs/environment-templates';
import { resolveApiSurface, loadEnvironmentManifest } from '@vvs/environment-templates';

export function createProjectFromTemplate(asset: LibraryAsset): ProjectSnapshot {
  if (asset.importKind === 'environment' && asset.environmentId) {
    const fromEnv = createProjectFromEnvironment(asset.environmentId);
    if (fromEnv) return fromEnv;
  }

  const snapshot = createEmptyProjectSnapshot();
  const fixture = LIBRARY_GRAPH_FIXTURES[asset.id];

  const moduleName = asset.title.replace(/[^a-zA-Z0-9]+/g, '') || 'Template';
  const envManifest = asset.environmentId ? loadEnvironmentManifest(asset.environmentId) : undefined;
  const extendsType = envManifest
    ? resolveApiSurface(envManifest, envManifest.defaultTarget).extendsType
    : '';

  snapshot.projectDetails = {
    moduleName,
    extendsType,
    description: asset.description,
  };

  if (envManifest) {
    snapshot.environmentId = envManifest.id;
    snapshot.environmentVersion = envManifest.version;
  }

  if (fixture) {
    snapshot.documents.main = {
      nodes: structuredClone(fixture.nodes),
      edges: structuredClone(fixture.edges),
      metadata: defaultTabMetadata('main', 'Main graph'),
    };
  }

  snapshot.installedLibrary = [
    {
      assetId: asset.id,
      installedAt: new Date().toISOString(),
      environmentVersion: envManifest?.version,
    },
  ];

  return snapshot;
}
