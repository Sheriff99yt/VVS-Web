/**
 * Complex — richer control flow that should run on all 8 languages.
 *
 * Counter: Total/Limit/Ready + Add(n) + branch + counted for + enum switch.
 * No GetInput. No Bind. No second overload. No inheritance. Zero leftover (x).
 */

import type { ProjectSnapshot } from '@/types/projectSnapshot';
import {
  createClassSymbol,
  createDefaultIntegration,
  MAIN_CLASS_ID,
  MAIN_GRAPH_CONTAINER_ID,
  normalizeGraphContainers,
  PROJECT_MAP_CONTAINER_NAME,
  createVariableSymbol,
} from '@vvs/graph-types';
import { defaultTabMetadata } from '@/lib/graphDefaults';
import { createFunctionSymbol } from '@/lib/functionTabs';
import type { VVSEdge, VVSNode } from '@/types/graph';
import {
  boundCallFunction,
  boundEventDefine,
  boundVariableGet,
  boundVariableSet,
  branchNode,
  classDefineNode,
  convertToStringNode,
  dataEdge,
  enumDefineNode,
  eventMemberDefineNode,
  execEdge,
  forRangeNode,
  functionDefineNode,
  importModuleNode,
  functionEntryNode,
  functionImplementNode,
  mathAddNode,
  printStringNode,
  returnNode,
  switchNode,
  usabilityTestDocument,
  varDefineNode,
} from '@/lib/usabilityExampleTests/usabilityTestGraphBuild';

/** Bump when fixture graph/semantics change so Test Project seeds refresh. */
export const COMPLEX_FIXTURE_REVISION = 2;

export const COUNTER_CLASS = createClassSymbol('Counter', {
  id: MAIN_CLASS_ID,
  containerId: MAIN_GRAPH_CONTAINER_ID,
});

const VAR_TOTAL = createVariableSymbol('Total', {
  id: 'var-total',
  type: 'data_number',
  classId: MAIN_CLASS_ID,
});
VAR_TOTAL.defaultValue = 0;
VAR_TOTAL.visibility = 'public';

const VAR_LIMIT = createVariableSymbol('Limit', {
  id: 'var-limit',
  type: 'data_number',
  classId: MAIN_CLASS_ID,
});
VAR_LIMIT.defaultValue = 3;
VAR_LIMIT.visibility = 'public';

const VAR_READY = createVariableSymbol('Ready', {
  id: 'var-ready',
  type: 'data_boolean',
  classId: MAIN_CLASS_ID,
});
VAR_READY.defaultValue = true;
VAR_READY.visibility = 'public';

const VAR_MODE = createVariableSymbol('CurrentMode', {
  id: 'var-mode',
  typeRef: { kind: 'enum', name: 'Mode', enumId: 'enum-Mode' },
  classId: MAIN_CLASS_ID,
});
VAR_MODE.defaultValue = 'Run';
VAR_MODE.visibility = 'public';

const FN_ADD = createFunctionSymbol('Add', { id: 'fn-add', classId: MAIN_CLASS_ID });
FN_ADD.visibility = 'public';
FN_ADD.overloads = [{
  id: 'o1',
  parameters: [{ id: 'p-n', label: 'n', type: 'data_number' }],
  returnType: 'data_number',
  graphTabId: 'fn-add',
}];

const EVT_START = {
  id: 'evt-start',
  name: 'start',
  role: 'entry' as const,
  parameters: [] as { id: string; label: string; type: 'data_number' }[],
  classId: MAIN_CLASS_ID,
};

const IMPORT_ENUM = importModuleNode('cx-import-enum', { x: -360, y: 0 }, {
  modulePath: 'enum',
  importStyle: 'from',
  importNames: 'Enum',
  label: 'Import Enum',
  targetLanguages: ['python'],
});
const IMPORT_IOSTREAM = importModuleNode('cx-import-iostream', { x: -160, y: 0 }, {
  modulePath: 'iostream',
  importStyle: 'include_system',
  label: 'Import iostream',
  targetLanguages: ['cpp'],
});

const MEMBER_NODES: VVSNode[] = [
  IMPORT_ENUM,
  IMPORT_IOSTREAM,
  enumDefineNode('cx-enum-mode', { x: 40, y: 0 }, 'Mode', ['Idle', 'Run']),
  classDefineNode('cx-class', { x: 240, y: 0 }, COUNTER_CLASS),
  varDefineNode('cx-var-total', { x: 440, y: 0 }, VAR_TOTAL),
  varDefineNode('cx-var-limit', { x: 640, y: 0 }, VAR_LIMIT),
  varDefineNode('cx-var-ready', { x: 840, y: 0 }, VAR_READY),
  varDefineNode('cx-var-mode', { x: 1040, y: 0 }, VAR_MODE),
  functionDefineNode('cx-fn-add', { x: 1240, y: 0 }, FN_ADD),
  functionImplementNode('cx-fn-add-impl', { x: 1440, y: 0 }, FN_ADD),
  eventMemberDefineNode('cx-start-mem', { x: 1640, y: 0 }, EVT_START),
];

const MEMBER_EDGES: VVSEdge[] = [
  execEdge('cx-m-imp-0', 'cx-import-enum', 'cx-import-iostream'),
  execEdge('cx-m-imp-1', 'cx-import-iostream', 'cx-enum-mode'),
  execEdge('cx-m-0', 'cx-enum-mode', 'cx-class'),
  execEdge('cx-m-1', 'cx-class', 'cx-var-total'),
  execEdge('cx-m-2', 'cx-var-total', 'cx-var-limit'),
  execEdge('cx-m-3', 'cx-var-limit', 'cx-var-ready'),
  execEdge('cx-m-4', 'cx-var-ready', 'cx-var-mode'),
  execEdge('cx-m-5', 'cx-var-mode', 'cx-fn-add'),
  execEdge('cx-m-6', 'cx-fn-add', 'cx-fn-add-impl'),
  execEdge('cx-m-7', 'cx-fn-add-impl', 'cx-start-mem'),
];

const CALL_ADD = boundCallFunction('cx-call-add', { x: 760, y: 200 }, FN_ADD);
CALL_ADD.data.inlineValues = { ...CALL_ADD.data.inlineValues, 'p-n': 1 };

const START_NODES: VVSNode[] = [
  boundEventDefine('cx-on-start', { x: 40, y: 200 }, EVT_START),
  boundVariableGet('cx-get-ready', { x: 40, y: 340 }, VAR_READY),
  branchNode('cx-branch-ready', { x: 280, y: 200 }),
  printStringNode('cx-print-go', { x: 520, y: 140 }, 'go'),
  printStringNode('cx-print-skip', { x: 520, y: 280 }, 'skip'),
  boundVariableGet('cx-get-limit', { x: 520, y: 400 }, VAR_LIMIT),
  forRangeNode('cx-for-limit', { x: 760, y: 200 }, { first: 1 }),
  CALL_ADD,
  boundVariableGet('cx-get-total-print', { x: 760, y: 360 }, VAR_TOTAL),
  convertToStringNode('cx-total-str', { x: 1000, y: 360 }),
  printStringNode('cx-print-total', { x: 1240, y: 200 }),
  boundVariableGet('cx-get-mode', { x: 1240, y: 360 }, VAR_MODE),
  switchNode('cx-switch-mode', { x: 1480, y: 200 }, ['Idle', 'Run'], { enumType: 'Mode' }),
  printStringNode('cx-print-idle', { x: 1720, y: 140 }, 'Idle'),
  printStringNode('cx-print-run', { x: 1720, y: 280 }, 'Run'),
];

const START_EDGES: VVSEdge[] = [
  execEdge('cx-s-0', 'cx-on-start', 'cx-branch-ready'),
  dataEdge('cx-s-ready', 'cx-get-ready', 'cx-branch-ready', 'val', 'condition', 'data_boolean'),
  execEdge('cx-s-true', 'cx-branch-ready', 'cx-print-go', 'true_exec', 'exec_in'),
  execEdge('cx-s-false', 'cx-branch-ready', 'cx-print-skip', 'false_exec', 'exec_in'),
  execEdge('cx-s-go-for', 'cx-print-go', 'cx-for-limit'),
  dataEdge('cx-s-limit', 'cx-get-limit', 'cx-for-limit', 'val', 'last', 'data_number'),
  execEdge('cx-s-for-body', 'cx-for-limit', 'cx-call-add', 'body_exec', 'exec_in'),
  execEdge('cx-s-add-print', 'cx-call-add', 'cx-print-total'),
  dataEdge('cx-s-total-str', 'cx-get-total-print', 'cx-total-str', 'val', 'value', 'data_number'),
  dataEdge('cx-s-total-print', 'cx-total-str', 'cx-print-total', 'result', 'in_str', 'data_string'),
  execEdge('cx-s-for-done', 'cx-for-limit', 'cx-switch-mode', 'exec_out', 'exec_in'),
  dataEdge('cx-s-mode', 'cx-get-mode', 'cx-switch-mode', 'val', 'selector'),
  execEdge('cx-s-idle', 'cx-switch-mode', 'cx-print-idle', 'case_0', 'exec_in'),
  execEdge('cx-s-run', 'cx-switch-mode', 'cx-print-run', 'case_1', 'exec_in'),
];

const ADD_NODES: VVSNode[] = [
  functionEntryNode('cx-add-entry', { x: 40, y: 80 }, FN_ADD),
  boundVariableGet('cx-add-get-total', { x: 40, y: 220 }, VAR_TOTAL),
  mathAddNode('cx-add-math', { x: 280, y: 220 }),
  boundVariableSet('cx-add-set-total', { x: 280, y: 80 }, VAR_TOTAL),
  returnNode('cx-add-return', { x: 520, y: 80 }),
];

const ADD_EDGES: VVSEdge[] = [
  execEdge('cx-a-0', 'cx-add-entry', 'cx-add-set-total'),
  execEdge('cx-a-1', 'cx-add-set-total', 'cx-add-return'),
  dataEdge('cx-a-total', 'cx-add-get-total', 'cx-add-math', 'val', 'a', 'data_number'),
  dataEdge('cx-a-n', 'cx-add-entry', 'cx-add-math', 'p-n', 'b', 'data_number'),
  dataEdge('cx-a-sum-set', 'cx-add-math', 'cx-add-set-total', 'result', 'val', 'data_number'),
  dataEdge('cx-a-sum-ret', 'cx-add-get-total', 'cx-add-return', 'val', 'value', 'data_number'),
];

export function createComplexSnapshot(): ProjectSnapshot {
  return {
    version: 3,
    savedAt: new Date().toISOString(),
    projectDetails: {
      moduleName: 'Counter',
      extendsType: '',
      description: `Complex (rev ${COMPLEX_FIXTURE_REVISION}) — Counter Add + branch/for/enum switch. Runs on all 8 languages.`,
    },
    classes: [COUNTER_CLASS],
    activeClassId: MAIN_CLASS_ID,
    graphContainers: normalizeGraphContainers(undefined),
    variables: [VAR_TOTAL, VAR_LIMIT, VAR_READY, VAR_MODE],
    events: [EVT_START],
    functions: [FN_ADD],
    openTabs: [
      { id: MAIN_GRAPH_CONTAINER_ID, type: 'container', name: PROJECT_MAP_CONTAINER_NAME },
    ],
    activeGraphTab: MAIN_GRAPH_CONTAINER_ID,
    targetLanguage: 'python',
    autoCompile: true,
    autoSave: false,
    documents: {
      [MAIN_GRAPH_CONTAINER_ID]: {
        ...usabilityTestDocument([...MEMBER_NODES, ...START_NODES], [...MEMBER_EDGES, ...START_EDGES]),
        metadata: defaultTabMetadata('container', 'Counter'),
      },
      'fn-add': {
        ...usabilityTestDocument(ADD_NODES, ADD_EDGES),
        metadata: defaultTabMetadata('function', 'Add'),
      },
    },
    installedLibrary: [],
    integration: createDefaultIntegration({
      moduleName: 'Counter',
      defaultTarget: 'python',
      adoptExisting: true,
    }),
  };
}
