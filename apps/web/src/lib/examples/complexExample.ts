/**
 * Calculator fidelity reference — Declare / On / Dispatch pattern:
 * - Member chain (`event_member_define`, `var_define`, …): class-body **Declare** slots on canvas.
 * - `boundEventDefine` handlers in runtime flow: **On** {event} entry nodes for wiring bodies.
 * - `boundEventDispatch`: **Dispatch** {event} to invoke another handler.
 * Entry `start` uses `eventMemberDefineNode` → Declare start; `boundEventDefine` → On start.
 */
import type { ProjectSnapshot } from '@/types/projectSnapshot';
import {
  createClassSymbol,
  createGraphContainer,
  MAIN_CLASS_ID,
  MAIN_GRAPH_CONTAINER_ID,
  normalizeGraphContainers,
  PROJECT_MAP_CONTAINER_NAME,
} from '@vvs/graph-types';
import { defaultTabMetadata } from '@/lib/graphDefaults';
import type { VVSNode, VVSEdge } from '@/types/graph';
import { createFunctionSymbol } from '@/lib/functionTabs';
import { createVariableSymbol } from '@vvs/graph-types';
import {
  classDefineNode,
  convertToStringNode,
  boundCallFunction,
  boundEventDispatch,
  boundEventDefine,
  boundVariableGet,
  boundVariableSet,
  branchNode,
  dataEdge,
  eventMemberDefineNode,
  exampleDocument,
  execEdge,
  functionDefineNode,
  functionEntryNode,
  getUserInputNode,
  graphRefNode,
  mathAddNode,
  printStringNode,
  varDefineNode,
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

const EVT_START = {
  id: 'evt-start',
  name: 'start',
  role: 'entry' as const,
  parameters: [] as { id: string; label: string; type: 'data_number' }[],
};

const CALCULATOR_CONTAINER_ID = 'calc-calculator-graph';
const CALCULATOR_CONTAINER = createGraphContainer('Calculator', { id: CALCULATOR_CONTAINER_ID });

const MAIN_CLASS = createClassSymbol('Calculator', {
  id: MAIN_CLASS_ID,
  containerId: CALCULATOR_CONTAINER_ID,
});

const UI_FLOW_CONTAINER_ID = 'calc-ui-flow-container';
const UI_FLOW_CONTAINER = createGraphContainer('UI flow', { id: UI_FLOW_CONTAINER_ID });

const RESULT_PANEL_CLASS_ID = 'calc-result-panel-class';
const RESULT_PANEL_CLASS = createClassSymbol('ResultPanel', {
  id: RESULT_PANEL_CLASS_ID,
  containerId: UI_FLOW_CONTAINER_ID,
});

const EVT_PANEL_START = {
  id: 'evt-panel-start',
  name: 'start',
  role: 'entry' as const,
  parameters: [] as { id: string; label: string; type: 'data_number' }[],
  classId: RESULT_PANEL_CLASS_ID,
};

const MAP_NODES: VVSNode[] = [
  graphRefNode('calc-ref-calculator', { x: 80, y: 80 }, {
    label: 'Calculator',
    containerId: CALCULATOR_CONTAINER_ID,
  }),
  graphRefNode('calc-ref-ui-flow', { x: 360, y: 80 }, {
    label: 'UI flow',
    containerId: UI_FLOW_CONTAINER_ID,
  }),
];

const RESULT_PANEL_NODES: VVSNode[] = [
  classDefineNode('calc-panel-class-define', { x: 40, y: -80 }, RESULT_PANEL_CLASS),
  eventMemberDefineNode('calc-panel-start-member', { x: 200, y: -80 }, EVT_PANEL_START),
  boundEventDefine('calc-panel-start-handler', { x: 60, y: 80 }, EVT_PANEL_START),
  printStringNode('calc-panel-print', { x: 320, y: 80 }, 'Result panel ready'),
];

const RESULT_PANEL_EDGES: VVSEdge[] = [
  execEdge('calc-panel-e-class-member', 'calc-panel-class-define', 'calc-panel-start-member'),
  execEdge('calc-panel-e-start-print', 'calc-panel-start-handler', 'calc-panel-print'),
];

/** Canvas member chain — declarations in graph order (above runtime flow). */
const MEMBER_CHAIN_NODES: VVSNode[] = [
  classDefineNode('calc-class-define', { x: 40, y: -120 }, MAIN_CLASS),
  eventMemberDefineNode('calc-evt-start-member', { x: 140, y: -120 }, EVT_START),
  varDefineNode('calc-var-a-define', { x: 240, y: -120 }, VAR_A),
  varDefineNode('calc-var-b-define', { x: 440, y: -120 }, VAR_B),
  varDefineNode('calc-var-result-define', { x: 640, y: -120 }, VAR_RESULT),
  varDefineNode('calc-var-show-define', { x: 840, y: -120 }, VAR_SHOW),
  functionDefineNode('calc-fn-add-define', { x: 1040, y: -120 }, FN_ADD),
  functionDefineNode('calc-fn-clear-define', { x: 1240, y: -120 }, FN_CLEAR),
  // Member declaration in class body — paired with On handler nodes below.
  eventMemberDefineNode('calc-evt-calc-member', { x: 1440, y: -120 }, EVT_CALCULATE),
  eventMemberDefineNode('calc-evt-clear-member', { x: 1640, y: -120 }, EVT_CLEAR),
];

const MEMBER_CHAIN_EDGES: VVSEdge[] = [
  execEdge('calc-def-e-class-start', 'calc-class-define', 'calc-evt-start-member'),
  execEdge('calc-def-e-start-a', 'calc-evt-start-member', 'calc-var-a-define'),
  execEdge('calc-def-e-a-b', 'calc-var-a-define', 'calc-var-b-define'),
  execEdge('calc-def-e-b-result', 'calc-var-b-define', 'calc-var-result-define'),
  execEdge('calc-def-e-result-show', 'calc-var-result-define', 'calc-var-show-define'),
  execEdge('calc-def-e-show-add', 'calc-var-show-define', 'calc-fn-add-define'),
  execEdge('calc-def-e-add-clear', 'calc-fn-add-define', 'calc-fn-clear-define'),
  execEdge('calc-def-e-clear-calc', 'calc-fn-clear-define', 'calc-evt-calc-member'),
  execEdge('calc-def-e-calc-clear', 'calc-evt-calc-member', 'calc-evt-clear-member'),
];

const MAIN_NODES: VVSNode[] = [
  ...MEMBER_CHAIN_NODES,
  // Program entry — same Declare member + On handler pattern as calculate/clear.
  boundEventDefine('calc-start-handler', { x: 40, y: 40 }, EVT_START),
  getUserInputNode('calc-input-a', { x: 240, y: 40 }, { prompt: 'Enter A:', inputKind: 'number' }),
  boundVariableSet('calc-set-a', { x: 480, y: 40 }, VAR_A),
  getUserInputNode('calc-input-b', { x: 720, y: 40 }, { prompt: 'Enter B:', inputKind: 'number' }),
  boundVariableSet('calc-set-b', { x: 960, y: 40 }, VAR_B),
  boundVariableSet('calc-set-show', { x: 1200, y: 40 }, VAR_SHOW, true),
  boundEventDispatch('calc-dispatch', { x: 1440, y: 40 }, EVT_CALCULATE),
  // Dual-node event pattern (calculate): event_member_define on the member chain
  // (`calc-evt-calc-member`) owns the class-body Declare slot; event_define in flow
  // (`calc-on-calculate`) is the On handler entry for wiring the body. Both must stay —
  // do not collapse into a single node or codegen/highlight fidelity breaks.
  boundEventDefine('calc-on-calculate', { x: 40, y: 280 }, EVT_CALCULATE),
  boundCallFunction('calc-call-add', { x: 320, y: 280 }, FN_ADD),
  boundVariableGet('calc-get-show', { x: 320, y: 420 }, VAR_SHOW),
  branchNode('calc-branch', { x: 560, y: 280 }),
  printStringNode('calc-print-done', { x: 820, y: 220 }, 'Calculation complete'),
  boundVariableGet('calc-get-result', { x: 820, y: 340 }, VAR_RESULT),
  convertToStringNode('calc-to-string', { x: 950, y: 340 }),
  printStringNode('calc-print-result', { x: 1080, y: 220 }),
  boundEventDispatch('calc-dispatch-clear', { x: 1340, y: 220 }, EVT_CLEAR),
  printStringNode('calc-print-skip', { x: 820, y: 400 }, 'Result hidden'),
  boundEventDefine('calc-on-clear', { x: 40, y: 560 }, EVT_CLEAR),
  boundCallFunction('calc-call-clear', { x: 320, y: 560 }, FN_CLEAR),
  printStringNode('calc-print-cleared', { x: 580, y: 560 }, 'Values cleared'),
];

const MAIN_EDGES: VVSEdge[] = [
  ...MEMBER_CHAIN_EDGES,
  execEdge('calc-e-start-input-a', 'calc-start-handler', 'calc-input-a'),
  execEdge('calc-e-input-a-set-a', 'calc-input-a', 'calc-set-a'),
  dataEdge('calc-e-input-a-val', 'calc-input-a', 'calc-set-a', 'value', 'val'),
  execEdge('calc-e-set-a-input-b', 'calc-set-a', 'calc-input-b'),
  execEdge('calc-e-input-b-set-b', 'calc-input-b', 'calc-set-b'),
  dataEdge('calc-e-input-b-val', 'calc-input-b', 'calc-set-b', 'value', 'val'),
  execEdge('calc-e-set-b-show', 'calc-set-b', 'calc-set-show'),
  execEdge('calc-e-show-dispatch', 'calc-set-show', 'calc-dispatch'),
  execEdge('calc-e-on-calculate-call', 'calc-on-calculate', 'calc-call-add'),
  execEdge('calc-e-call-branch', 'calc-call-add', 'calc-branch'),
  dataEdge('calc-e-show-branch', 'calc-get-show', 'calc-branch', 'val', 'condition', 'data_boolean'),
  execEdge('calc-e-branch-done', 'calc-branch', 'calc-print-done', 'true_exec', 'exec_in'),
  execEdge('calc-e-done-result', 'calc-print-done', 'calc-print-result'),
  dataEdge('calc-e-result-tostr', 'calc-get-result', 'calc-to-string', 'val', 'value', 'data_number'),
  dataEdge('calc-e-tostr-print', 'calc-to-string', 'calc-print-result', 'result', 'in_str', 'data_string'),
  execEdge('calc-e-result-clear', 'calc-print-result', 'calc-dispatch-clear'),
  execEdge('calc-e-branch-skip', 'calc-branch', 'calc-print-skip', 'false_exec', 'exec_in'),
  execEdge('calc-e-on-clear-call', 'calc-on-clear', 'calc-call-clear'),
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

/** Multi-graph calculator — member chain, user input, functions, events, branch, and dispatch. */
export function createComplexExampleSnapshot(): ProjectSnapshot {
  const stamp = <T>(item: T): T & { classId: string } => ({ ...item, classId: MAIN_CLASS_ID });

  return {
    version: 3,
    savedAt: new Date().toISOString(),
    projectDetails: {
      moduleName: 'Calculator',
      extendsType: '',
      description:
        'Member chain (Declare), On handlers, Call/Dispatch — prompt for A and B, add, branch on ShowResult, clear',
    },
    classes: [MAIN_CLASS, RESULT_PANEL_CLASS],
    activeClassId: MAIN_CLASS_ID,
    graphContainers: normalizeGraphContainers([CALCULATOR_CONTAINER, UI_FLOW_CONTAINER]),
    variables: [VAR_A, VAR_B, VAR_RESULT, VAR_SHOW].map(stamp),
    events: [...[EVT_START, EVT_CALCULATE, EVT_CLEAR].map(stamp), EVT_PANEL_START],
    functions: [FN_ADD, FN_CLEAR].map(stamp),
    openTabs: [
      { id: MAIN_GRAPH_CONTAINER_ID, type: 'container', name: PROJECT_MAP_CONTAINER_NAME },
      { id: CALCULATOR_CONTAINER_ID, type: 'container', name: 'Calculator' },
      { id: UI_FLOW_CONTAINER_ID, type: 'container', name: 'UI flow' },
      { id: 'fn-add', type: 'function', name: 'Function: Add' },
      { id: 'fn-clear', type: 'function', name: 'Function: Clear' },
    ],
    activeGraphTab: MAIN_GRAPH_CONTAINER_ID,
    targetLanguage: 'python',
    autoCompile: true,
    autoSave: false,
    documents: {
      [MAIN_GRAPH_CONTAINER_ID]: {
        ...exampleDocument(MAP_NODES, []),
        metadata: defaultTabMetadata('container', PROJECT_MAP_CONTAINER_NAME),
      },
      [CALCULATOR_CONTAINER_ID]: {
        ...exampleDocument(MAIN_NODES, MAIN_EDGES),
        metadata: defaultTabMetadata('container', 'Calculator'),
      },
      [UI_FLOW_CONTAINER_ID]: {
        ...exampleDocument(RESULT_PANEL_NODES, RESULT_PANEL_EDGES),
        metadata: defaultTabMetadata('container', 'UI flow'),
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
