import { ProjectSnapshot } from '@/types/projectSnapshot';
import { createClassSymbol, MAIN_CLASS_ID, normalizeGraphContainers } from '@vvs/graph-types';
import { defaultTabMetadata } from '@/lib/graphDefaults';
import {
  classDefineNode,
  exampleDocument,
  execEdge,
  onStartNode,
  printStringNode,
} from '@/lib/examples/exampleGraphBuild';

const MAIN_CLASS = createClassSymbol('HelloWorld', { id: MAIN_CLASS_ID, graphTabId: 'main' });

/** Minimal starter — class define + On Start wired to a single Print String node. */
export function createSimpleExampleSnapshot(): ProjectSnapshot {
  const classDefine = classDefineNode('ex-class-define', { x: 80, y: 0 }, MAIN_CLASS);
  const start = onStartNode('ex-simple-start', { x: 80, y: 120 });
  const print = printStringNode('ex-simple-print', { x: 380, y: 120 }, 'Hello from VVS!');

  return {
    version: 3,
    savedAt: new Date().toISOString(),
    projectDetails: {
      moduleName: 'HelloWorld',
      extendsType: '',
      description: 'Simple example — class define, one event and one action',
    },
    classes: [MAIN_CLASS],
    activeClassId: MAIN_CLASS_ID,
    graphContainers: normalizeGraphContainers(undefined),
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
        ...exampleDocument(
          [classDefine, start, print],
          [
            execEdge('ex-class-start', classDefine.id, start.id),
            execEdge('ex-simple-edge', start.id, print.id),
          ]
        ),
        metadata: defaultTabMetadata('main', 'Main graph'),
      },
    },
    installedLibrary: [],
  };
}
