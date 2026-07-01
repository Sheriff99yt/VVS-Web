import { ProjectSnapshot } from '@/types/projectSnapshot';
import { defaultTabMetadata } from '@/lib/graphDefaults';

export function createEmptyProjectSnapshot(): ProjectSnapshot {
  const moduleName = 'Untitled';
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    projectDetails: { moduleName, extendsType: '', description: '' },
    variables: [],
    functions: [],
    openTabs: [{ id: 'main', type: 'main', name: 'Main graph' }],
    activeGraphTab: 'main',
    targetLanguage: 'python',
    autoCompile: true,
    documents: {
      main: {
        nodes: [
          {
            id: 'node-on-start',
            type: 'vvs_standard_node',
            position: { x: 80, y: 80 },
            data: {
              label: 'On Start',
              category: 'Events',
              inputs: [],
              outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
              inlineValues: {},
            },
          },
        ],
        edges: [],
        metadata: defaultTabMetadata('main', 'Main graph'),
      },
    },
    installedLibrary: [],
  };
}
