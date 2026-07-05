import { ProjectSnapshot } from '@/types/projectSnapshot';
import { defaultTabMetadata } from '@/lib/graphDefaults';
import { exampleDocument, execEdge, onStartNode, printStringNode } from '@/lib/examples/exampleGraphBuild';

/** Minimal starter — On Start wired to a single Print String node. */
export function createSimpleExampleSnapshot(): ProjectSnapshot {
  const start = onStartNode('ex-simple-start', { x: 80, y: 80 });
  const print = printStringNode('ex-simple-print', { x: 380, y: 80 }, 'Hello from VVS!');

  return {
    version: 2,
    savedAt: new Date().toISOString(),
    projectDetails: {
      moduleName: 'HelloWorld',
      extendsType: '',
      description: 'Simple example — one event and one action',
    },
    variables: [],
    events: [],
    functions: [],
    openTabs: [{ id: 'main', type: 'main', name: 'Main graph' }],
    activeGraphTab: 'main',
    targetLanguage: 'python',
    autoCompile: true,
    autoSave: false,
    documents: {
      main: {
        ...exampleDocument([start, print], [execEdge('ex-simple-edge', start.id, print.id)]),
        metadata: defaultTabMetadata('main', 'Main graph'),
      },
    },
    installedLibrary: [],
  };
}
