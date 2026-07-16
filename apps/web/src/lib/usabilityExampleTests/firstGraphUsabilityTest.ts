/**
 * First Graph — simple Test Project for newcomers.
 *
 * One class, one story: Declare → entry → Get User Input → Print → Call → Print.
 * Function tab: entry → Print. Intentionally omits second class, modifiers matrix,
 * switch/for, and imports so the graph stays readable at a glance.
 */

import { ProjectSnapshot } from '@/types/projectSnapshot';
import {
  createClassSymbol,
  MAIN_CLASS_ID,
  MAIN_GRAPH_CONTAINER_ID,
  normalizeGraphContainers,
  PROJECT_MAP_CONTAINER_NAME,
  createVariableSymbol,
} from '@vvs/graph-types';
import { createFunctionSymbol } from '@/lib/functionTabs';
import { defaultTabMetadata } from '@/lib/graphDefaults';
import type { VVSNode, VVSEdge } from '@/types/graph';
import {
  boundEventDefine,
  classDefineNode,
  eventMemberDefineNode,
  usabilityTestDocument,
  execEdge,
  printStringNode,
  functionDefineNode,
  varDefineNode,
  boundCallFunction,
  functionEntryNode,
  dataEdge,
  getUserInputNode,
} from '@/lib/usabilityExampleTests/usabilityTestGraphBuild';

const MAIN_CLASS = createClassSymbol('FirstGraph', {
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

const VAR_VISITOR = createVariableSymbol('VisitorName', {
  id: 'var-visitor-name',
  type: 'data_string',
});
VAR_VISITOR.defaultValue = '';
VAR_VISITOR.classId = MAIN_CLASS_ID;

const FN_SAY_HELLO = createFunctionSymbol('SayHello', { id: 'fn-say-hello' });
FN_SAY_HELLO.classId = MAIN_CLASS_ID;

/** First Graph — newcomer Declare → input → print → call path. */
export function createFirstGraphUsabilityTestSnapshot(): ProjectSnapshot {
  const MAP_NODES: VVSNode[] = [
    classDefineNode('fg-class-define', { x: 40, y: 0 }, MAIN_CLASS),
    varDefineNode('fg-var-visitor', { x: 240, y: 0 }, VAR_VISITOR),
    functionDefineNode('fg-fn-hello', { x: 440, y: 0 }, FN_SAY_HELLO),
    eventMemberDefineNode('fg-start-member', { x: 640, y: 0 }, EVT_START),

    boundEventDefine('fg-start-handler', { x: 40, y: 160 }, EVT_START),
    getUserInputNode('fg-get-input', { x: 240, y: 160 }, {
      prompt: 'What is your name?',
      inputKind: 'text',
    }),
    printStringNode('fg-print-got', { x: 480, y: 160 }),
    boundCallFunction('fg-call-hello', { x: 700, y: 160 }, FN_SAY_HELLO),
    printStringNode('fg-print-done', { x: 920, y: 160 }, 'Done.'),
  ];

  const MAP_EDGES: VVSEdge[] = [
    execEdge('fg-class-var', 'fg-class-define', 'fg-var-visitor'),
    execEdge('fg-var-fn', 'fg-var-visitor', 'fg-fn-hello'),
    execEdge('fg-fn-start-member', 'fg-fn-hello', 'fg-start-member'),

    execEdge('fg-start-input', 'fg-start-handler', 'fg-get-input'),
    execEdge('fg-input-print', 'fg-get-input', 'fg-print-got'),
    execEdge('fg-print-call', 'fg-print-got', 'fg-call-hello'),
    execEdge('fg-call-done', 'fg-call-hello', 'fg-print-done'),
    dataEdge('fg-input-print-val', 'fg-get-input', 'fg-print-got', 'value', 'in_str', 'data_string'),
  ];

  const HELLO_NODES: VVSNode[] = [
    functionEntryNode('fg-hello-entry', { x: 40, y: 80 }, FN_SAY_HELLO),
    printStringNode('fg-hello-print', { x: 260, y: 80 }, 'Hello from SayHello!'),
  ];

  const HELLO_EDGES: VVSEdge[] = [
    execEdge('fg-entry-print', 'fg-hello-entry', 'fg-hello-print'),
  ];

  return {
    version: 3,
    savedAt: new Date().toISOString(),
    projectDetails: {
      moduleName: 'FirstGraph',
      extendsType: '',
      description:
        'Newcomer Test Project — Declare, Get User Input, Print, and Call on one graph.',
    },
    classes: [MAIN_CLASS],
    activeClassId: MAIN_CLASS_ID,
    graphContainers: normalizeGraphContainers(undefined),
    variables: [VAR_VISITOR],
    events: [EVT_START],
    functions: [FN_SAY_HELLO],
    openTabs: [
      { id: MAIN_GRAPH_CONTAINER_ID, type: 'container', name: PROJECT_MAP_CONTAINER_NAME },
      { id: 'fn-say-hello', type: 'function', name: 'Function: SayHello' },
    ],
    activeGraphTab: MAIN_GRAPH_CONTAINER_ID,
    targetLanguage: 'python',
    autoCompile: true,
    autoSave: false,
    documents: {
      [MAIN_GRAPH_CONTAINER_ID]: {
        ...usabilityTestDocument(MAP_NODES, MAP_EDGES),
        metadata: defaultTabMetadata('container', PROJECT_MAP_CONTAINER_NAME),
      },
      ['fn-say-hello']: {
        ...usabilityTestDocument(HELLO_NODES, HELLO_EDGES),
        metadata: defaultTabMetadata('function', 'SayHello'),
      },
    },
    installedLibrary: [],
  };
}
