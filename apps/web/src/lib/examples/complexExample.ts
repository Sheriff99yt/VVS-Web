import type { ProjectSnapshot } from '@/types/projectSnapshot';
import { defaultTabMetadata } from '@/lib/graphDefaults';
import type { VVSNode, VVSEdge } from '@/types/graph';
import { createFunctionSymbol } from '@/lib/functionTabs';
import { createVariableSymbol } from '@vvs/graph-types';
import {
  convertToStringNode,
  boundCallFunction,
  boundEventDefine,
  boundEventDispatch,
  boundVariableGet,
  boundVariableSet,
  branchNode,
  dataEdge,
  exampleDocument,
  execEdge,
  functionEntryNode,
  getUserInputNode,
  mathAddNode,
  onStartNode,
  printStringNode,
} from '@/lib/examples/exampleGraphBuild';

const VAR_A = createVariableSymbol('A', { id: 'var-a', type: 'data_number' });
const VAR_B = createVariableSymbol('B', { id: 'var-b', type: 'data_number' });
const VAR_RESULT = createVariableSymbol('Result', { id: 'var-result', type: 'data_number' });
const VAR_SHOW = createVariableSymbol('ShowResult', { id: 'var-show', type: 'data_boolean' });

VAR_A.defaultValue = 0;
VAR_B.defaultValue = 0;
VAR_RESULT.defaultValue = 0;
VAR_SHOW.defaultValue = true;

const FN_ADD = createFunctionSymbol('Add', { id: 'fn-add' });
const FN_CLEAR = createFunctionSymbol('Clear', { id: 'fn-clear' });

const EVT_CALCULATE = {
  id: 'evt-calc',
  name: 'calculate',
  parameters: [] as { id: string; label: string; type: 'data_number' }[],
};

const EVT_CLEAR = {
  id: 'evt-clear',
  name: 'clear',
  parameters: [] as { id: string; label: string; type: 'data_number' }[],
};

const MAIN_NODES: VVSNode[] = [
  onStartNode('calc-start', { x: 40, y: 40 }),
  getUserInputNode('calc-input-a', { x: 240, y: 40 }, { prompt: 'Enter A:', inputKind: 'number' }),
  boundVariableSet('calc-set-a', { x: 480, y: 40 }, VAR_A),
  getUserInputNode('calc-input-b', { x: 720, y: 40 }, { prompt: 'Enter B:', inputKind: 'number' }),
  boundVariableSet('calc-set-b', { x: 960, y: 40 }, VAR_B),
  boundVariableSet('calc-set-show', { x: 1200, y: 40 }, VAR_SHOW, true),
  boundEventDispatch('calc-dispatch', { x: 1440, y: 40 }, EVT_CALCULATE),
  boundEventDefine('calc-define', { x: 40, y: 280 }, EVT_CALCULATE),
  boundCallFunction('calc-call-add', { x: 320, y: 280 }, FN_ADD),
  boundVariableGet('calc-get-show', { x: 320, y: 420 }, VAR_SHOW),
  branchNode('calc-branch', { x: 560, y: 280 }),
  printStringNode('calc-print-done', { x: 820, y: 220 }, 'Calculation complete'),
  boundVariableGet('calc-get-result', { x: 820, y: 340 }, VAR_RESULT),
  convertToStringNode('calc-to-string', { x: 950, y: 340 }),
  printStringNode('calc-print-result', { x: 1080, y: 220 }),
  boundEventDispatch('calc-dispatch-clear', { x: 1340, y: 220 }, EVT_CLEAR),
  printStringNode('calc-print-skip', { x: 820, y: 400 }, 'Result hidden'),
  boundEventDefine('calc-define-clear', { x: 40, y: 560 }, EVT_CLEAR),
  boundCallFunction('calc-call-clear', { x: 320, y: 560 }, FN_CLEAR),
  printStringNode('calc-print-cleared', { x: 580, y: 560 }, 'Values cleared'),
];

const MAIN_EDGES: VVSEdge[] = [
  execEdge('calc-e-start-input-a', 'calc-start', 'calc-input-a'),
  execEdge('calc-e-input-a-set-a', 'calc-input-a', 'calc-set-a'),
  dataEdge('calc-e-input-a-val', 'calc-input-a', 'calc-set-a', 'value', 'val'),
  execEdge('calc-e-set-a-input-b', 'calc-set-a', 'calc-input-b'),
  execEdge('calc-e-input-b-set-b', 'calc-input-b', 'calc-set-b'),
  dataEdge('calc-e-input-b-val', 'calc-input-b', 'calc-set-b', 'value', 'val'),
  execEdge('calc-e-set-b-show', 'calc-set-b', 'calc-set-show'),
  execEdge('calc-e-show-dispatch', 'calc-set-show', 'calc-dispatch'),
  execEdge('calc-e-define-call', 'calc-define', 'calc-call-add'),
  execEdge('calc-e-call-branch', 'calc-call-add', 'calc-branch'),
  dataEdge('calc-e-show-branch', 'calc-get-show', 'calc-branch', 'val', 'condition', 'data_boolean'),
  execEdge('calc-e-branch-done', 'calc-branch', 'calc-print-done', 'true_exec', 'exec_in'),
  execEdge('calc-e-done-result', 'calc-print-done', 'calc-print-result'),
  dataEdge('calc-e-result-tostr', 'calc-get-result', 'calc-to-string', 'val', 'value', 'data_number'),
  dataEdge('calc-e-tostr-print', 'calc-to-string', 'calc-print-result', 'result', 'in_str', 'data_string'),
  execEdge('calc-e-result-clear', 'calc-print-result', 'calc-dispatch-clear'),
  execEdge('calc-e-branch-skip', 'calc-branch', 'calc-print-skip', 'false_exec', 'exec_in'),
  execEdge('calc-e-define-clear-call', 'calc-define-clear', 'calc-call-clear'),
  execEdge('calc-e-clear-print', 'calc-call-clear', 'calc-print-cleared'),
];

const ADD_NODES: VVSNode[] = [
  functionEntryNode('calc-add-entry', { x: 60, y: 80 }, FN_ADD),
  boundVariableGet('calc-add-get-a', { x: 60, y: 220 }, VAR_A),
  boundVariableGet('calc-add-get-b', { x: 60, y: 340 }, VAR_B),
  mathAddNode('calc-add-math', { x: 320, y: 260 }),
  boundVariableSet('calc-add-set-result', { x: 580, y: 80 }, VAR_RESULT),
];

const ADD_EDGES: VVSEdge[] = [
  execEdge('calc-add-e-entry-set', 'calc-add-entry', 'calc-add-set-result'),
  dataEdge('calc-add-e-a-math', 'calc-add-get-a', 'calc-add-math', 'val', 'a'),
  dataEdge('calc-add-e-b-math', 'calc-add-get-b', 'calc-add-math', 'val', 'b'),
  dataEdge('calc-add-e-math-set', 'calc-add-math', 'calc-add-set-result', 'result', 'val'),
];

const CLEAR_NODES: VVSNode[] = [
  functionEntryNode('calc-clear-entry', { x: 60, y: 100 }, FN_CLEAR),
  boundVariableSet('calc-clear-a', { x: 320, y: 100 }, VAR_A, 0),
  boundVariableSet('calc-clear-b', { x: 560, y: 100 }, VAR_B, 0),
  boundVariableSet('calc-clear-result', { x: 800, y: 100 }, VAR_RESULT, 0),
];

const CLEAR_EDGES: VVSEdge[] = [
  execEdge('calc-clear-e-entry-a', 'calc-clear-entry', 'calc-clear-a'),
  execEdge('calc-clear-e-a-b', 'calc-clear-a', 'calc-clear-b'),
  execEdge('calc-clear-e-b-result', 'calc-clear-b', 'calc-clear-result'),
];

/** Multi-graph calculator — user input, variables, functions, events, branch, and dispatch. */
export function createComplexExampleSnapshot(): ProjectSnapshot {
  return {
    version: 2,
    savedAt: new Date().toISOString(),
    projectDetails: {
      moduleName: 'Calculator',
      extendsType: '',
      description:
        'Complex example — prompt for A and B, add via function, print Result, then clear',
    },
    variables: [VAR_A, VAR_B, VAR_RESULT, VAR_SHOW],
    events: [EVT_CALCULATE, EVT_CLEAR],
    functions: [FN_ADD, FN_CLEAR],
    openTabs: [
      { id: 'main', type: 'main', name: 'Main graph' },
      { id: 'fn-add', type: 'function', name: 'Function: Add' },
      { id: 'fn-clear', type: 'function', name: 'Function: Clear' },
    ],
    activeGraphTab: 'main',
    targetLanguage: 'python',
    autoCompile: true,
    autoSave: false,
    documents: {
      main: {
        ...exampleDocument(MAIN_NODES, MAIN_EDGES),
        metadata: defaultTabMetadata('main', 'Main graph'),
      },
      'fn-add': {
        ...exampleDocument(ADD_NODES, ADD_EDGES),
        metadata: defaultTabMetadata('function', 'Add'),
      },
      'fn-clear': {
        ...exampleDocument(CLEAR_NODES, CLEAR_EDGES),
        metadata: defaultTabMetadata('function', 'Clear'),
      },
    },
    installedLibrary: [],
  };
}
