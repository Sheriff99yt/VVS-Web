import { ProjectSnapshot } from '@/types/projectSnapshot';
import {
  createClassSymbol,
  MAIN_CLASS_ID,
  MAIN_GRAPH_CONTAINER_ID,
  normalizeGraphContainers,
  PROJECT_MAP_CONTAINER_NAME,
} from '@vvs/graph-types';
import { defaultTabMetadata } from '@/lib/graphDefaults';
import {
  boundEventDefine,
  classDefineNode,
  eventMemberDefineNode,
  exampleDocument,
  execEdge,
  printStringNode,
} from '@/lib/examples/exampleGraphBuild';

const MAIN_CLASS = createClassSymbol('HelloWorld', {
  id: MAIN_CLASS_ID,
  containerId: MAIN_GRAPH_CONTAINER_ID,
});

const EVT_START = {
  id: 'evt-start',
  name: 'start',
  role: 'entry' as const,
  parameters: [] as { id: string; label: string; type: 'data_number' }[],
  classId: MAIN_CLASS_ID,
};

/** Minimal starter — class define, program entry declare/handler, Print String. */
export function createSimpleExampleSnapshot(): ProjectSnapshot {
  const classDefine = classDefineNode('ex-class-define', { x: 80, y: 0 }, MAIN_CLASS);
  const entryMember = eventMemberDefineNode('ex-start-member', { x: 280, y: 0 }, EVT_START);
  const entryHandler = boundEventDefine('ex-start-handler', { x: 80, y: 120 }, EVT_START);
  const print = printStringNode('ex-simple-print', { x: 380, y: 120 }, 'Hello from VVS!');

  return {
    version: 3,
    savedAt: new Date().toISOString(),
    projectDetails: {
      moduleName: 'HelloWorld',
      extendsType: '',
      description: 'Simple example — program entry declare/handler and one action',
    },
    classes: [MAIN_CLASS],
    activeClassId: MAIN_CLASS_ID,
    graphContainers: normalizeGraphContainers(undefined),
    variables: [],
    events: [EVT_START],
    functions: [],
    openTabs: [
      { id: MAIN_GRAPH_CONTAINER_ID, type: 'container', name: PROJECT_MAP_CONTAINER_NAME },
    ],
    activeGraphTab: MAIN_GRAPH_CONTAINER_ID,
    targetLanguage: 'python',
    autoCompile: true,
    autoSave: false,
    documents: {
      [MAIN_GRAPH_CONTAINER_ID]: {
        ...exampleDocument(
          [classDefine, entryMember, entryHandler, print],
          [
            execEdge('ex-class-entry-member', classDefine.id, entryMember.id),
            execEdge('ex-start-print', entryHandler.id, print.id),
          ]
        ),
        metadata: defaultTabMetadata('container', PROJECT_MAP_CONTAINER_NAME),
      },
    },
    installedLibrary: [],
  };
}
