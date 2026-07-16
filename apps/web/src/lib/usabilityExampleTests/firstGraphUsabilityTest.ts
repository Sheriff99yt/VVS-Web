/**
 * First Graph — simple Test Project for newcomers.
 *
 * One class, one story: Declare (var/class) → Define (function) → entry →
 * Get User Input → Print → Call → Print.
 * Edit function body (SayHello tab): entry → Print. Body inlines into the same
 * file via Define — no separate SayHello export.
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
  functionImplementNode,
  varDefineNode,
  boundCallFunction,
  functionEntryNode,
  dataEdge,
  getUserInputNode,
} from '@/lib/usabilityExampleTests/usabilityTestGraphBuild';

/** Bump when fixture graph/semantics change so Test Project seeds refresh. */
export const FIRST_GRAPH_FIXTURE_REVISION = 4;

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

/** First Graph — Declare on chain + Define (function_implement) + Edit function body tab. */
export function createFirstGraphUsabilityTestSnapshot(): ProjectSnapshot {
  const MAP_NODES: VVSNode[] = [
    classDefineNode('fg-class-define', { x: 40, y: 0 }, MAIN_CLASS),
    varDefineNode('fg-var-visitor', { x: 240, y: 0 }, VAR_VISITOR),
    functionDefineNode('fg-fn-hello', { x: 440, y: 0 }, FN_SAY_HELLO),
    functionImplementNode('fg-fn-hello-impl', { x: 640, y: 0 }, FN_SAY_HELLO),
    eventMemberDefineNode('fg-start-member', { x: 840, y: 0 }, EVT_START),

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
    execEdge('fg-fn-impl', 'fg-fn-hello', 'fg-fn-hello-impl'),
    execEdge('fg-impl-start-member', 'fg-fn-hello-impl', 'fg-start-member'),

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
      description: `Newcomer Test Project (rev ${FIRST_GRAPH_FIXTURE_REVISION}) — Declare var/class/function on chain; Define (function_implement) places body; Call; Get User Input.`,
    },
    classes: [MAIN_CLASS],
    activeClassId: MAIN_CLASS_ID,
    graphContainers: normalizeGraphContainers(undefined),
    variables: [VAR_VISITOR],
    events: [EVT_START],
    functions: [FN_SAY_HELLO],
    openTabs: [
      { id: MAIN_GRAPH_CONTAINER_ID, type: 'container', name: PROJECT_MAP_CONTAINER_NAME },
    ],
    activeGraphTab: MAIN_GRAPH_CONTAINER_ID,
    targetLanguage: 'python',
    autoCompile: true,
    autoSave: false,
    documents: {
      [MAIN_GRAPH_CONTAINER_ID]: {
        ...usabilityTestDocument(MAP_NODES, MAP_EDGES),
        metadata: defaultTabMetadata('container', 'FirstGraph'),
      },
      ['fn-say-hello']: {
        ...usabilityTestDocument(HELLO_NODES, HELLO_EDGES),
        metadata: defaultTabMetadata('function', 'SayHello'),
      },
    },
    installedLibrary: [],
  };
}
