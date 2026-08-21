/**
 * Advanced — inheritance + GetInput + Wait. Runs on most languages (not all).
 *
 * Machine.Label + virtual Diagnose; Sensor extends + override + Call Super.
 * Sensor On Start: GetInput "name" → Operator, Print, Diagnose, Wait 1s, Print done.
 * No Bind. No extra overloads. Verse GetInput leftover is expected.
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
  classDefineNode,
  dataEdge,
  eventMemberDefineNode,
  execEdge,
  functionDefineNode,
  functionEntryNode,
  functionImplementNode,
  getUserInputNode,
  printStringNode,
  usabilityTestDocument,
  varDefineNode,
  waitNode,
  importModuleNode,
} from '@/lib/usabilityExampleTests/usabilityTestGraphBuild';

/** Bump when fixture graph/semantics change so Test Project seeds refresh. */
export const ADVANCED_FIXTURE_REVISION = 1;

export const MACHINE_CLASS = createClassSymbol('Machine', {
  id: MAIN_CLASS_ID,
  containerId: MAIN_GRAPH_CONTAINER_ID,
});

export const SENSOR_CLASS_ID = 'cls-sensor';
export const SENSOR_CLASS = createClassSymbol('Sensor', {
  id: SENSOR_CLASS_ID,
  containerId: MAIN_GRAPH_CONTAINER_ID,
  extendsType: 'Machine',
});

const VAR_LABEL = createVariableSymbol('Label', {
  id: 'var-label',
  type: 'data_string',
  classId: MAIN_CLASS_ID,
});
VAR_LABEL.defaultValue = 'ok';
VAR_LABEL.visibility = 'public';

const VAR_OPERATOR = createVariableSymbol('Operator', {
  id: 'var-operator',
  type: 'data_string',
  classId: SENSOR_CLASS_ID,
});
VAR_OPERATOR.defaultValue = '';
VAR_OPERATOR.visibility = 'public';

const FN_MACHINE_DIAGNOSE = createFunctionSymbol('Diagnose', {
  id: 'fn-machine-diagnose',
  classId: MAIN_CLASS_ID,
});
FN_MACHINE_DIAGNOSE.flags = { virtual: true };
FN_MACHINE_DIAGNOSE.visibility = 'public';

const FN_SENSOR_DIAGNOSE = createFunctionSymbol('Diagnose', {
  id: 'fn-sensor-diagnose',
  classId: SENSOR_CLASS_ID,
});
FN_SENSOR_DIAGNOSE.flags = { override: true };
FN_SENSOR_DIAGNOSE.visibility = 'public';

const EVT_SENSOR_START = {
  id: 'evt-sensor-start',
  name: 'start',
  role: 'entry' as const,
  parameters: [] as { id: string; label: string; type: 'data_number' }[],
  classId: SENSOR_CLASS_ID,
};

const IMPORT_IOSTREAM = importModuleNode('ad-import-iostream', { x: -160, y: 0 }, {
  modulePath: 'iostream',
  importStyle: 'include_system',
  label: 'Import iostream',
  targetLanguages: ['cpp'],
});

const MACHINE_MEMBER_NODES: VVSNode[] = [
  IMPORT_IOSTREAM,
  classDefineNode('ad-machine-class', { x: 40, y: 0 }, MACHINE_CLASS),
  varDefineNode('ad-var-label', { x: 240, y: 0 }, VAR_LABEL),
  functionDefineNode('ad-fn-machine-diagnose', { x: 440, y: 0 }, FN_MACHINE_DIAGNOSE),
  functionImplementNode('ad-fn-machine-diagnose-impl', { x: 640, y: 0 }, FN_MACHINE_DIAGNOSE),
];

const MACHINE_MEMBER_EDGES: VVSEdge[] = [
  execEdge('ad-mm-imp', 'ad-import-iostream', 'ad-machine-class'),
  execEdge('ad-mm-0', 'ad-machine-class', 'ad-var-label'),
  execEdge('ad-mm-1', 'ad-var-label', 'ad-fn-machine-diagnose'),
  execEdge('ad-mm-2', 'ad-fn-machine-diagnose', 'ad-fn-machine-diagnose-impl'),
];

const SENSOR_START_MEM = eventMemberDefineNode('ad-sensor-start-mem', { x: 840, y: 200 }, EVT_SENSOR_START);
if (SENSOR_START_MEM.data.properties) {
  SENSOR_START_MEM.data.properties.isAsync = true;
}

const SENSOR_MEMBER_NODES: VVSNode[] = [
  classDefineNode('ad-sensor-class', { x: 40, y: 200 }, SENSOR_CLASS),
  varDefineNode('ad-var-operator', { x: 240, y: 200 }, VAR_OPERATOR),
  functionDefineNode('ad-fn-sensor-diagnose', { x: 440, y: 200 }, FN_SENSOR_DIAGNOSE),
  functionImplementNode('ad-fn-sensor-diagnose-impl', { x: 640, y: 200 }, FN_SENSOR_DIAGNOSE),
  SENSOR_START_MEM,
];

const SENSOR_MEMBER_EDGES: VVSEdge[] = [
  execEdge('ad-sm-0', 'ad-sensor-class', 'ad-var-operator'),
  execEdge('ad-sm-1', 'ad-var-operator', 'ad-fn-sensor-diagnose'),
  execEdge('ad-sm-2', 'ad-fn-sensor-diagnose', 'ad-fn-sensor-diagnose-impl'),
  execEdge('ad-sm-3', 'ad-fn-sensor-diagnose-impl', 'ad-sensor-start-mem'),
];

const SENSOR_START_HANDLER = boundEventDefine('ad-on-sensor-start', { x: 40, y: 400 }, EVT_SENSOR_START);
if (SENSOR_START_HANDLER.data.properties) {
  SENSOR_START_HANDLER.data.properties.isAsync = true;
}

const SENSOR_START_NODES: VVSNode[] = [
  SENSOR_START_HANDLER,
  getUserInputNode('ad-get-input', { x: 280, y: 400 }, {
    prompt: 'name',
    inputKind: 'text',
  }),
  boundVariableSet('ad-set-operator', { x: 520, y: 400 }, VAR_OPERATOR),
  printStringNode('ad-print-operator', { x: 760, y: 400 }),
  boundCallFunction('ad-call-diagnose', { x: 1000, y: 400 }, FN_SENSOR_DIAGNOSE),
  waitNode('ad-wait', { x: 1240, y: 400 }, { seconds: '1', isAsync: true }),
  printStringNode('ad-print-done', { x: 1480, y: 400 }, 'done'),
];

const SENSOR_START_EDGES: VVSEdge[] = [
  execEdge('ad-ss-0', 'ad-on-sensor-start', 'ad-get-input'),
  execEdge('ad-ss-1', 'ad-get-input', 'ad-set-operator'),
  execEdge('ad-ss-2', 'ad-set-operator', 'ad-print-operator'),
  execEdge('ad-ss-3', 'ad-print-operator', 'ad-call-diagnose'),
  execEdge('ad-ss-4', 'ad-call-diagnose', 'ad-wait'),
  execEdge('ad-ss-5', 'ad-wait', 'ad-print-done'),
  dataEdge('ad-ss-in-set', 'ad-get-input', 'ad-set-operator', 'value', 'val', 'data_string'),
  dataEdge('ad-ss-in-print', 'ad-get-input', 'ad-print-operator', 'value', 'in_str', 'data_string'),
];

const MACHINE_DIAGNOSE_NODES: VVSNode[] = [
  functionEntryNode('ad-machine-diagnose-entry', { x: 40, y: 80 }, FN_MACHINE_DIAGNOSE),
  boundVariableGet('ad-get-label', { x: 40, y: 200 }, VAR_LABEL),
  printStringNode('ad-print-label', { x: 280, y: 80 }),
];

const MACHINE_DIAGNOSE_EDGES: VVSEdge[] = [
  execEdge('ad-md-0', 'ad-machine-diagnose-entry', 'ad-print-label'),
  dataEdge('ad-md-label', 'ad-get-label', 'ad-print-label', 'val', 'in_str', 'data_string'),
];

const SUPER_DIAGNOSE = boundCallFunction('ad-super-diagnose', { x: 520, y: 80 }, FN_MACHINE_DIAGNOSE);
SUPER_DIAGNOSE.data.properties = { ...SUPER_DIAGNOSE.data.properties, isSuper: true };

const SENSOR_DIAGNOSE_ENTRY = functionEntryNode('ad-sensor-diagnose-entry', { x: 40, y: 80 }, FN_SENSOR_DIAGNOSE);
if (SENSOR_DIAGNOSE_ENTRY.data.properties) {
  SENSOR_DIAGNOSE_ENTRY.data.properties.isOverride = true;
}

const SENSOR_DIAGNOSE_NODES: VVSNode[] = [
  SENSOR_DIAGNOSE_ENTRY,
  printStringNode('ad-print-sensor', { x: 280, y: 80 }, 'sensor'),
  SUPER_DIAGNOSE,
];

const SENSOR_DIAGNOSE_EDGES: VVSEdge[] = [
  execEdge('ad-sd-0', 'ad-sensor-diagnose-entry', 'ad-print-sensor'),
  execEdge('ad-sd-1', 'ad-print-sensor', 'ad-super-diagnose'),
];

export function createAdvancedSnapshot(): ProjectSnapshot {
  return {
    version: 3,
    savedAt: new Date().toISOString(),
    projectDetails: {
      moduleName: 'Advanced',
      extendsType: '',
      description: `Advanced (rev ${ADVANCED_FIXTURE_REVISION}) — Machine/Sensor Diagnose + GetInput + Wait. Most languages.`,
    },
    classes: [MACHINE_CLASS, SENSOR_CLASS],
    activeClassId: MAIN_CLASS_ID,
    graphContainers: normalizeGraphContainers(undefined),
    variables: [VAR_LABEL, VAR_OPERATOR],
    events: [EVT_SENSOR_START],
    functions: [FN_MACHINE_DIAGNOSE, FN_SENSOR_DIAGNOSE],
    openTabs: [
      { id: MAIN_GRAPH_CONTAINER_ID, type: 'container', name: PROJECT_MAP_CONTAINER_NAME },
    ],
    activeGraphTab: MAIN_GRAPH_CONTAINER_ID,
    targetLanguage: 'python',
    autoCompile: true,
    autoSave: false,
    documents: {
      [MAIN_GRAPH_CONTAINER_ID]: {
        ...usabilityTestDocument(
          [...MACHINE_MEMBER_NODES, ...SENSOR_MEMBER_NODES, ...SENSOR_START_NODES],
          [...MACHINE_MEMBER_EDGES, ...SENSOR_MEMBER_EDGES, ...SENSOR_START_EDGES]
        ),
        metadata: defaultTabMetadata('container', 'Advanced'),
      },
      'fn-machine-diagnose': {
        ...usabilityTestDocument(MACHINE_DIAGNOSE_NODES, MACHINE_DIAGNOSE_EDGES),
        metadata: defaultTabMetadata('function', 'Diagnose'),
      },
      'fn-sensor-diagnose': {
        ...usabilityTestDocument(SENSOR_DIAGNOSE_NODES, SENSOR_DIAGNOSE_EDGES),
        metadata: defaultTabMetadata('function', 'Diagnose'),
      },
    },
    installedLibrary: [],
    integration: createDefaultIntegration({
      moduleName: 'Advanced',
      defaultTarget: 'python',
      adoptExisting: true,
    }),
  };
}
