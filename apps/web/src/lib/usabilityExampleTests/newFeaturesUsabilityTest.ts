/**
 * New Features Lab — Test Project for Global Scope, Function Overloads, and Event Args.
 */

import { ProjectSnapshot } from '@/types/projectSnapshot';
import {
  createClassSymbol,
  MAIN_CLASS_ID,
  MAIN_GRAPH_CONTAINER_ID,
  normalizeGraphContainers,
  PROJECT_MAP_CONTAINER_NAME,
  createVariableSymbol,
  createDefaultIntegration,
} from '@vvs/graph-types';
import { createFunctionSymbol } from '@/lib/functionTabs';
import { defaultTabMetadata } from '@/lib/graphDefaults';
import type { VVSNode, VVSEdge, ProjectEventDefinition } from '@/types/graph';
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
  stringConcatNode,
  mathAddNode,
  boundEventDispatch,
  boundVariableGet,
  boundVariableSet,
  usabilityTestNode,
  functionReturnNode,
} from '@/lib/usabilityExampleTests/usabilityTestGraphBuild';
import { applyFunctionDefineBinding, applyFunctionImplementBinding, applyFunctionCallBinding } from '@/lib/functionHelpers';

export const NEW_FEATURES_FIXTURE_REVISION = 1;

const MAIN_CLASS = createClassSymbol('MainClass', {
  id: MAIN_CLASS_ID,
  containerId: MAIN_GRAPH_CONTAINER_ID,
});

// 1. Global Variable
const GLOBAL_VAR = createVariableSymbol('GlobalGreeting', {
  id: 'var-global-greeting',
  type: 'data_string',
});
GLOBAL_VAR.defaultValue = 'World';
GLOBAL_VAR.classId = `global-${MAIN_GRAPH_CONTAINER_ID}`;

// 2. Overloaded Function (in Global Scope)
const FN_PROCESS_DATA = createFunctionSymbol('ProcessData', { id: 'fn-process-data' });
FN_PROCESS_DATA.classId = `global-${MAIN_GRAPH_CONTAINER_ID}`;
FN_PROCESS_DATA.overloads = [
  {
    id: 'fn-process-data-ov1',
    graphTabId: 'fn-process-data-ov1',
    parameters: [
      { id: 'p1', label: 'a', type: 'data_number' },
      { id: 'p2', label: 'b', type: 'data_number' },
    ],
    returnType: 'data_number',
  },
  {
    id: 'fn-process-data-ov2',
    graphTabId: 'fn-process-data-ov2',
    parameters: [
      { id: 'p1', label: 'a', type: 'data_string' },
      { id: 'p2', label: 'b', type: 'data_string' },
    ],
    returnType: 'data_string',
  },
];

// 3. Event with Args (in Global Scope)
const EVT_ON_DATA: ProjectEventDefinition = {
  id: 'evt-on-data',
  name: 'OnDataReceived',
  role: 'custom',
  parameters: [{ id: 'p1', label: 'payload', type: 'data_string' }],
  classId: `global-${MAIN_GRAPH_CONTAINER_ID}`,
};

// Start event for triggering
const EVT_START: ProjectEventDefinition = {
  id: 'evt-start',
  name: 'start',
  role: 'entry',
  parameters: [],
  classId: MAIN_CLASS_ID,
};

export function createNewFeaturesUsabilityTestSnapshot(): ProjectSnapshot {
  const MAP_NODES: VVSNode[] = [
    // Declarations
    classDefineNode('nf-class-define', { x: 40, y: 0 }, MAIN_CLASS),
    
    // Global var declaration (normally global scope members are just declared)
    varDefineNode('nf-global-var-def', { x: 240, y: 0 }, GLOBAL_VAR),
    
    // We need to pass the specific overload to function_define if we want it to bind properly
    usabilityTestNode('nf-fn-def', { x: 440, y: 0 }, applyFunctionDefineBinding({
      label: `Declare ProcessData`,
      category: 'Project',
      kindId: 'function_define',
      inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
      linkedGraphId: FN_PROCESS_DATA.id,
      graphBinding: { kind: 'call_function', symbolId: FN_PROCESS_DATA.id, overloadId: 'fn-process-data-ov1' },
      properties: { symbolId: FN_PROCESS_DATA.id, name: FN_PROCESS_DATA.name, graphTabId: 'fn-process-data-ov1' },
    }, FN_PROCESS_DATA, 'fn-process-data-ov1')),
    
    usabilityTestNode('nf-fn-impl1', { x: 640, y: 0 }, applyFunctionImplementBinding({
      label: `Define ProcessData`,
      category: 'Project',
      kindId: 'function_implement',
      inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
      linkedGraphId: FN_PROCESS_DATA.id,
      graphBinding: { kind: 'call_function', symbolId: FN_PROCESS_DATA.id, overloadId: 'fn-process-data-ov1' },
      properties: { symbolId: FN_PROCESS_DATA.id, name: FN_PROCESS_DATA.name, graphTabId: 'fn-process-data-ov1' },
    }, FN_PROCESS_DATA, 'fn-process-data-ov1')),

    usabilityTestNode('nf-fn-impl2', { x: 840, y: 0 }, applyFunctionImplementBinding({
      label: `Define ProcessData`,
      category: 'Project',
      kindId: 'function_implement',
      inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
      linkedGraphId: FN_PROCESS_DATA.id,
      graphBinding: { kind: 'call_function', symbolId: FN_PROCESS_DATA.id, overloadId: 'fn-process-data-ov2' },
      properties: { symbolId: FN_PROCESS_DATA.id, name: FN_PROCESS_DATA.name, graphTabId: 'fn-process-data-ov2' },
    }, FN_PROCESS_DATA, 'fn-process-data-ov2')),

    eventMemberDefineNode('nf-evt-def', { x: 1040, y: 0 }, EVT_ON_DATA),
    eventMemberDefineNode('nf-start-def', { x: 1240, y: 0 }, EVT_START),

    // Implementation logic: start -> dispatch event with global var
    boundEventDefine('nf-start-handler', { x: 40, y: 200 }, EVT_START),
    boundVariableGet('nf-get-global', { x: 40, y: 280 }, GLOBAL_VAR),
    stringConcatNode('nf-concat', { x: 260, y: 280 }, 'Hello from Global: '),
    boundEventDispatch('nf-dispatch', { x: 500, y: 200 }, EVT_ON_DATA),

    // Implementation logic: on event -> call string overload -> print
    boundEventDefine('nf-on-data-handler', { x: 40, y: 440 }, EVT_ON_DATA),
    usabilityTestNode('nf-call-ov2', { x: 260, y: 440 }, applyFunctionCallBinding({
      label: '', category: 'Project', inputs: [], outputs: [], inlineValues: {}
    }, FN_PROCESS_DATA, 'fn-process-data-ov2')),
    printStringNode('nf-print', { x: 500, y: 440 }),
  ];

  const MAP_EDGES: VVSEdge[] = [
    // Declarations
    execEdge('e-c-v', 'nf-class-define', 'nf-global-var-def'),
    execEdge('e-v-f', 'nf-global-var-def', 'nf-fn-def'),
    execEdge('e-f-i1', 'nf-fn-def', 'nf-fn-impl1'),
    execEdge('e-i1-i2', 'nf-fn-impl1', 'nf-fn-impl2'),
    execEdge('e-i2-e1', 'nf-fn-impl2', 'nf-evt-def'),
    execEdge('e-e1-e2', 'nf-evt-def', 'nf-start-def'),

    // Logic 1
    execEdge('e-st-disp', 'nf-start-handler', 'nf-dispatch'),
    dataEdge('d-get-concat', 'nf-get-global', 'nf-concat', 'val', 'b', 'data_string'),
    dataEdge('d-concat-disp', 'nf-concat', 'nf-dispatch', 'result', 'p1', 'data_string'),

    // Logic 2
    execEdge('e-ond-call', 'nf-on-data-handler', 'nf-call-ov2'),
    execEdge('e-call-print', 'nf-call-ov2', 'nf-print'),
    dataEdge('d-ond-call-a', 'nf-on-data-handler', 'nf-call-ov2', 'p1', 'p1', 'data_string'),
    dataEdge('d-ond-call-b', 'nf-on-data-handler', 'nf-call-ov2', 'p1', 'p2', 'data_string'),
    dataEdge('d-call-print', 'nf-call-ov2', 'nf-print', 'return_val', 'in_str', 'data_string'),
  ];

  const OV1_NODES: VVSNode[] = [
    functionEntryNode('nf-ov1-entry', { x: 40, y: 80 }, FN_PROCESS_DATA, 'fn-process-data-ov1'),
    mathAddNode('nf-ov1-add', { x: 260, y: 80 }),
    functionReturnNode('nf-ov1-ret', { x: 480, y: 80 }, FN_PROCESS_DATA, 'fn-process-data-ov1'),
  ];

  // Fix functionEntryNode properties for overloads
  OV1_NODES[0].data.properties = { ...OV1_NODES[0].data.properties, overloadId: 'fn-process-data-ov1' };

  const OV1_EDGES: VVSEdge[] = [
    execEdge('e-ov1-e-r', 'nf-ov1-entry', 'nf-ov1-ret'),
    dataEdge('d-ov1-p1', 'nf-ov1-entry', 'nf-ov1-add', 'p1', 'a', 'data_number'),
    dataEdge('d-ov1-p2', 'nf-ov1-entry', 'nf-ov1-add', 'p2', 'b', 'data_number'),
    dataEdge('d-ov1-res', 'nf-ov1-add', 'nf-ov1-ret', 'result', 'return_val', 'data_number'),
  ];

  const OV2_NODES: VVSNode[] = [
    functionEntryNode('nf-ov2-entry', { x: 40, y: 80 }, FN_PROCESS_DATA, 'fn-process-data-ov2'),
    stringConcatNode('nf-ov2-concat', { x: 260, y: 80 }),
    functionReturnNode('nf-ov2-ret', { x: 480, y: 80 }, FN_PROCESS_DATA, 'fn-process-data-ov2'),
  ];

  OV2_NODES[0].data.properties = { ...OV2_NODES[0].data.properties, overloadId: 'fn-process-data-ov2' };

  const OV2_EDGES: VVSEdge[] = [
    execEdge('e-ov2-e-r', 'nf-ov2-entry', 'nf-ov2-ret'),
    dataEdge('d-ov2-p1', 'nf-ov2-entry', 'nf-ov2-concat', 'p1', 'a', 'data_string'),
    dataEdge('d-ov2-p2', 'nf-ov2-entry', 'nf-ov2-concat', 'p2', 'b', 'data_string'),
    dataEdge('d-ov2-res', 'nf-ov2-concat', 'nf-ov2-ret', 'result', 'return_val', 'data_string'),
  ];

  return {
    version: 3,
    savedAt: new Date().toISOString(),
    projectDetails: {
      moduleName: 'NewFeaturesLab',
      extendsType: '',
      description: `New Features Test Project (rev ${NEW_FEATURES_FIXTURE_REVISION}) — Global Scope, Function Overloads, Event Args.`,
    },
    classes: [MAIN_CLASS],
    activeClassId: MAIN_CLASS_ID,
    graphContainers: normalizeGraphContainers(undefined),
    variables: [GLOBAL_VAR],
    events: [EVT_START, EVT_ON_DATA],
    functions: [FN_PROCESS_DATA],
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
        metadata: defaultTabMetadata('container', 'NewFeaturesLab'),
      },
      ['fn-process-data-ov1']: {
        ...usabilityTestDocument(OV1_NODES, OV1_EDGES),
        metadata: defaultTabMetadata('function', 'ProcessData (Number)'),
      },
      ['fn-process-data-ov2']: {
        ...usabilityTestDocument(OV2_NODES, OV2_EDGES),
        metadata: defaultTabMetadata('function', 'ProcessData (String)'),
      },
    },
    installedLibrary: [],
    integration: createDefaultIntegration({
      moduleName: 'NewFeaturesLab',
      defaultTarget: 'python',
      adoptExisting: true,
    }),
  };
}
