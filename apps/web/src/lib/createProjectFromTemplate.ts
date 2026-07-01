import { ProjectSnapshot } from '@/types/projectSnapshot';
import { LibraryAsset } from '@/types/libraryAsset';
import { createEmptyProjectSnapshot } from '@/lib/emptyProject';
import { LIBRARY_GRAPH_FIXTURES } from '@/lib/libraryCatalog';
import { defaultTabMetadata } from '@/lib/graphDefaults';

export function createProjectFromTemplate(asset: LibraryAsset): ProjectSnapshot {
  const snapshot = createEmptyProjectSnapshot();
  const fixture = LIBRARY_GRAPH_FIXTURES[asset.id];

  const moduleName = asset.title.replace(/[^a-zA-Z0-9]+/g, '') || 'Template';

  snapshot.projectDetails = {
    moduleName,
    extendsType: '',
    description: asset.description,
  };

  if (fixture) {
    snapshot.documents.main = {
      nodes: structuredClone(fixture.nodes),
      edges: structuredClone(fixture.edges),
      metadata: defaultTabMetadata('main', 'Main graph'),
    };
  }

  snapshot.installedLibrary = [
    { assetId: asset.id, installedAt: new Date().toISOString() },
  ];

  return snapshot;
}
