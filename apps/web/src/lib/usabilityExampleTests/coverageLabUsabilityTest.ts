/**
 * Coverage Lab - both classes declared and programmed on **one** home graph.
 * Exercises 1:1 canvas-to-text order plus modifiers, enum, array, switch, for, branch,
 * convert, dispatch, call, inheritance, async/static/virtual/abstract/override/const.
 * Functions: **Declare** on host chain (exists); **Call** at use sites; body via
 * Edit function body tabs (same file, U80). Declare ≠ Define split = U81.
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
  arrayPushNode,
  boundCallFunction,
  boundEventDefine,
  boundEventDispatch,
  boundVariableGet,
  boundVariableSet,
  branchNode,
  classDefineNode,
  convertToStringNode,
  dataEdge,
  enumDefineNode,
  eventMemberDefineNode,
  execEdge,
  forEachNode,
  functionDefineNode,
  functionEntryNode,
  functionImplementNode,
  getUserInputNode,
  printStringNode,
  stringConcatNode,
  switchNode,
  usabilityTestDocument,
  varDefineNode,
  importModuleNode,
} from '@/lib/usabilityExampleTests/usabilityTestGraphBuild';

/** Bump when fixture graph/semantics change so Test Project seeds refresh. */
export const COVERAGE_LAB_FIXTURE_REVISION = 5;

/** Primary class - Machine (entry / modifiers / abstract). */
export const MACHINE_CLASS = createClassSymbol('Machine', {
  id: MAIN_CLASS_ID,
  containerId: MAIN_GRAPH_CONTAINER_ID,
});

/** Second class on the same graph - Sensor extends Machine. */
export const SENSOR_CLASS_ID = 'cls-sensor';
export const SENSOR_CLASS = createClassSymbol('Sensor', {
  id: SENSOR_CLASS_ID,
  containerId: MAIN_GRAPH_CONTAINER_ID,
  extendsType: 'Machine',
});

const VAR_POWER = createVariableSymbol('Power', {
  id: 'var-power',
  type: 'data_number',
  classId: MAIN_CLASS_ID,
});
VAR_POWER.defaultValue = 0;
VAR_POWER.visibility = 'protected';

const VAR_SERIAL = createVariableSymbol('Serial', {
  id: 'var-serial',
  type: 'data_number',
  classId: MAIN_CLASS_ID,
});
VAR_SERIAL.defaultValue = 0;
VAR_SERIAL.binding = 'static';
VAR_SERIAL.visibility = 'public';

const VAR_MAX = createVariableSymbol('MaxPower', {
  id: 'var-max',
  type: 'data_number',
  classId: MAIN_CLASS_ID,
});
VAR_MAX.defaultValue = 100;
VAR_MAX.visibility = 'public';
VAR_MAX.flags = { readonly: true };

const VAR_READY = createVariableSymbol('Ready', {
  id: 'var-ready',
  type: 'data_boolean',
  classId: MAIN_CLASS_ID,
});
VAR_READY.defaultValue = false;
VAR_READY.visibility = 'public';

const FN_BOOT = createFunctionSymbol('Boot', { id: 'fn-boot', classId: MAIN_CLASS_ID });
FN_BOOT.flags = { virtual: true };
FN_BOOT.visibility = 'public';

const FN_DIAGNOSE = createFunctionSymbol('Diagnose', { id: 'fn-diagnose', classId: MAIN_CLASS_ID });
FN_DIAGNOSE.flags = { abstract: true };
FN_DIAGNOSE.visibility = 'protected';

const FN_SHUTDOWN = createFunctionSymbol('Shutdown', { id: 'fn-shutdown', classId: MAIN_CLASS_ID });
FN_SHUTDOWN.flags = { async: true };
FN_SHUTDOWN.visibility = 'public';

const EVT_MACHINE_START = {
  id: 'evt-machine-start',
  name: 'start',
  role: 'entry' as const,
  parameters: [] as { id: string; label: string; type: 'data_number' }[],
  classId: MAIN_CLASS_ID,
};

const EVT_PULSE = {
  id: 'evt-pulse',
  name: 'pulse',
  parameters: [] as { id: string; label: string; type: 'data_number' }[],
  classId: MAIN_CLASS_ID,
};

const VAR_READINGS = createVariableSymbol('Readings', {
  id: 'var-readings',
  typeRef: { kind: 'array', of: { kind: 'builtin', id: 'data_number' } },
  classId: SENSOR_CLASS_ID,
});
VAR_READINGS.visibility = 'public';

const VAR_STATUS = createVariableSymbol('Status', {
  id: 'var-status',
  typeRef: { kind: 'enum', name: 'SensorStatus', enumId: 'enum-SensorStatus' },
  classId: SENSOR_CLASS_ID,
});
VAR_STATUS.defaultValue = 'OK';
VAR_STATUS.visibility = 'public';

const VAR_HOST = createVariableSymbol('Host', {
  id: 'var-host',
  typeRef: { kind: 'class', classId: MAIN_CLASS_ID, name: 'Machine' },
  classId: SENSOR_CLASS_ID,
});
VAR_HOST.visibility = 'public';
VAR_HOST.defaultValue = null;

const VAR_TAGS = createVariableSymbol('Tags', {
  id: 'var-tags',
  typeRef: {
    kind: 'map',
    key: { kind: 'builtin', id: 'data_string' },
    value: { kind: 'builtin', id: 'data_string' },
  },
  classId: SENSOR_CLASS_ID,
});
VAR_TAGS.visibility = 'public';

const FN_SAMPLE = createFunctionSymbol('Sample', { id: 'fn-sample', classId: SENSOR_CLASS_ID });
FN_SAMPLE.flags = { async: true };
FN_SAMPLE.visibility = 'public';

const FN_REPORT = createFunctionSymbol('Report', { id: 'fn-report', classId: SENSOR_CLASS_ID });
FN_REPORT.flags = { override: true };
FN_REPORT.visibility = 'public';

const EVT_SENSOR_START = {
  id: 'evt-sensor-start',
  name: 'start',
  role: 'entry' as const,
  parameters: [] as { id: string; label: string; type: 'data_number' }[],
  classId: SENSOR_CLASS_ID,
};

/** Sensor-only event - Machine Boot dispatches it (non-inherited cross-class). */
const EVT_TICK = {
  id: 'evt-tick',
  name: 'tick',
  parameters: [] as { id: string; label: string; type: 'data_number' }[],
  classId: SENSOR_CLASS_ID,
};

/** Shared file-top imports ? once on the graph, wired into Machine (first class) only. */
const IMPORT_IOSTREAM = importModuleNode('lab-import-iostream', { x: 40, y: -400 }, {
  modulePath: 'iostream',
  importStyle: 'include_system',
  label: 'Import iostream',
  targetLanguages: ['cpp'],
});
const IMPORT_SYSTEM = importModuleNode('lab-import-system', { x: 240, y: -400 }, {
  modulePath: 'System',
  importStyle: 'include_system',
  label: 'Import System',
  targetLanguages: ['csharp'],
});
const IMPORT_STRING = importModuleNode('lab-import-string', { x: 440, y: -400 }, {
  modulePath: 'string',
  importStyle: 'include_system',
  label: 'Import string',
  targetLanguages: ['cpp'],
});
const IMPORT_ENUM = importModuleNode('lab-import-enum', { x: 640, y: -400 }, {
  modulePath: 'enum',
  importStyle: 'from',
  importNames: 'Enum',
  label: 'Import Enum',
  targetLanguages: ['python'],
});
const IMPORT_VECTOR = importModuleNode('lab-import-vector', { x: 840, y: -400 }, {
  modulePath: 'vector',
  importStyle: 'include_system',
  label: 'Import vector',
  targetLanguages: ['cpp'],
});
const IMPORT_UNORDERED_MAP = importModuleNode('lab-import-unordered-map', { x: 1040, y: -400 }, {
  modulePath: 'unordered_map',
  importStyle: 'include_system',
  label: 'Import unordered_map',
  targetLanguages: ['cpp'],
});
const IMPORT_COLLECTIONS = importModuleNode('lab-import-collections', { x: 1240, y: -400 }, {
  modulePath: 'System.Collections.Generic',
  importStyle: 'include_system',
  label: 'Import Collections.Generic',
  targetLanguages: ['csharp'],
});

const MACHINE_MEMBER_NODES: VVSNode[] = [
  IMPORT_IOSTREAM,
  IMPORT_SYSTEM,
  IMPORT_STRING,
  IMPORT_ENUM,
  IMPORT_VECTOR,
  IMPORT_UNORDERED_MAP,
  IMPORT_COLLECTIONS,
  classDefineNode('lab-machine-class', { x: 1440, y: -200 }, MACHINE_CLASS),
  varDefineNode('lab-var-power', { x: 1640, y: -200 }, VAR_POWER),
  varDefineNode('lab-var-serial', { x: 1840, y: -200 }, VAR_SERIAL),
  varDefineNode('lab-var-max', { x: 2040, y: -200 }, VAR_MAX),
  varDefineNode('lab-var-ready', { x: 2240, y: -200 }, VAR_READY),
  functionDefineNode('lab-fn-boot', { x: 2440, y: -200 }, FN_BOOT),
  functionImplementNode('lab-fn-boot-impl', { x: 2540, y: -200 }, FN_BOOT),
  functionDefineNode('lab-fn-diagnose', { x: 2640, y: -200 }, FN_DIAGNOSE),
  functionDefineNode('lab-fn-shutdown', { x: 2840, y: -200 }, FN_SHUTDOWN),
  functionImplementNode('lab-fn-shutdown-impl', { x: 2940, y: -200 }, FN_SHUTDOWN),
  // Event peers: Y wins emit order (pulse higher => on_pulse before on_start).
  eventMemberDefineNode('lab-evt-start-mem', { x: 3140, y: -120 }, EVT_MACHINE_START),
  eventMemberDefineNode('lab-evt-pulse-mem', { x: 3340, y: -280 }, EVT_PULSE),
];

const MACHINE_MEMBER_EDGES: VVSEdge[] = [
  execEdge('lab-mm-imp-0', 'lab-import-iostream', 'lab-import-system'),
  execEdge('lab-mm-imp-1', 'lab-import-system', 'lab-import-string'),
  execEdge('lab-mm-imp-2', 'lab-import-string', 'lab-import-enum'),
  execEdge('lab-mm-imp-3', 'lab-import-enum', 'lab-import-vector'),
  execEdge('lab-mm-imp-4', 'lab-import-vector', 'lab-import-unordered-map'),
  execEdge('lab-mm-imp-5', 'lab-import-unordered-map', 'lab-import-collections'),
  execEdge('lab-mm-imp-6', 'lab-import-collections', 'lab-machine-class'),
  execEdge('lab-mm-0', 'lab-machine-class', 'lab-var-power'),
  execEdge('lab-mm-1', 'lab-var-power', 'lab-var-serial'),
  execEdge('lab-mm-2', 'lab-var-serial', 'lab-var-max'),
  execEdge('lab-mm-3', 'lab-var-max', 'lab-var-ready'),
  execEdge('lab-mm-4', 'lab-var-ready', 'lab-fn-boot'),
  execEdge('lab-mm-4b', 'lab-fn-boot', 'lab-fn-boot-impl'),
  execEdge('lab-mm-5', 'lab-fn-boot-impl', 'lab-fn-diagnose'),
  execEdge('lab-mm-6', 'lab-fn-diagnose', 'lab-fn-shutdown'),
  execEdge('lab-mm-6b', 'lab-fn-shutdown', 'lab-fn-shutdown-impl'),
  execEdge('lab-mm-7', 'lab-fn-shutdown-impl', 'lab-evt-start-mem'),
  execEdge('lab-mm-8', 'lab-evt-start-mem', 'lab-evt-pulse-mem'),
];

/** Sensor member chain ? no duplicate imports; shared imports live once at file top. */
const SENSOR_MEMBER_NODES: VVSNode[] = [
  enumDefineNode('lab-enum-status', { x: 40, y: 400 }, 'SensorStatus', ['OK', 'WARN', 'FAIL']),
  classDefineNode('lab-sensor-class', { x: 240, y: 400 }, SENSOR_CLASS),
  varDefineNode('lab-var-readings', { x: 440, y: 400 }, VAR_READINGS),
  varDefineNode('lab-var-status', { x: 640, y: 400 }, VAR_STATUS),
  varDefineNode('lab-var-host', { x: 840, y: 400 }, VAR_HOST),
  varDefineNode('lab-var-tags', { x: 1040, y: 400 }, VAR_TAGS),
  functionDefineNode('lab-fn-sample', { x: 1240, y: 400 }, FN_SAMPLE),
  functionImplementNode('lab-fn-sample-impl', { x: 1340, y: 400 }, FN_SAMPLE),
  functionDefineNode('lab-fn-report', { x: 1440, y: 400 }, FN_REPORT),
  functionImplementNode('lab-fn-report-impl', { x: 1540, y: 400 }, FN_REPORT),
  // Event peers: tick higher on canvas => on_tick before on_start.
  eventMemberDefineNode('lab-sensor-start-mem', { x: 1740, y: 480 }, EVT_SENSOR_START),
  eventMemberDefineNode('lab-evt-tick-mem', { x: 1940, y: 320 }, EVT_TICK),
];

const SENSOR_MEMBER_EDGES: VVSEdge[] = [
  execEdge('lab-sm-0', 'lab-enum-status', 'lab-sensor-class'),
  execEdge('lab-sm-1', 'lab-sensor-class', 'lab-var-readings'),
  execEdge('lab-sm-2', 'lab-var-readings', 'lab-var-status'),
  execEdge('lab-sm-2b', 'lab-var-status', 'lab-var-host'),
  execEdge('lab-sm-2c', 'lab-var-host', 'lab-var-tags'),
  execEdge('lab-sm-3', 'lab-var-tags', 'lab-fn-sample'),
  execEdge('lab-sm-3b', 'lab-fn-sample', 'lab-fn-sample-impl'),
  execEdge('lab-sm-4', 'lab-fn-sample-impl', 'lab-fn-report'),
  execEdge('lab-sm-4b', 'lab-fn-report', 'lab-fn-report-impl'),
  execEdge('lab-sm-5', 'lab-fn-report-impl', 'lab-sensor-start-mem'),
  execEdge('lab-sm-6', 'lab-sensor-start-mem', 'lab-evt-tick-mem'),
];

// -- Machine runtime flows --
const MACHINE_START_NODES: VVSNode[] = [
  boundEventDefine('lab-on-machine-start', { x: 40, y: 40 }, EVT_MACHINE_START),
  getUserInputNode('lab-get-input', { x: 280, y: 40 }, {
    prompt: 'Operator name?',
    inputKind: 'text',
  }),
  printStringNode('lab-print-boot', { x: 520, y: 40 }),
  boundCallFunction('lab-call-boot', { x: 760, y: 40 }, FN_BOOT),
  boundVariableGet('lab-get-ready', { x: 760, y: 180 }, VAR_READY),
  branchNode('lab-branch-ready', { x: 1000, y: 40 }),
  boundEventDispatch('lab-dispatch-pulse', { x: 1240, y: 0 }, EVT_PULSE),
  // Conditional import (Python-style): only on the false branch.
  importModuleNode('lab-import-json-cond', { x: 1240, y: 100 }, {
    modulePath: 'json',
    importStyle: 'module',
    label: 'Import json',
    targetLanguages: ['python'],
  }),
  printStringNode('lab-print-not-ready', { x: 1480, y: 120 }, 'Not ready'),
];

const MACHINE_START_EDGES: VVSEdge[] = [
  execEdge('lab-ms-0', 'lab-on-machine-start', 'lab-get-input'),
  execEdge('lab-ms-0b', 'lab-get-input', 'lab-print-boot'),
  execEdge('lab-ms-1', 'lab-print-boot', 'lab-call-boot'),
  execEdge('lab-ms-2', 'lab-call-boot', 'lab-branch-ready'),
  dataEdge('lab-ms-3', 'lab-get-ready', 'lab-branch-ready', 'val', 'condition', 'data_boolean'),
  dataEdge('lab-ms-input-print', 'lab-get-input', 'lab-print-boot', 'value', 'in_str', 'data_string'),
  execEdge('lab-ms-4', 'lab-branch-ready', 'lab-dispatch-pulse', 'true_exec', 'exec_in'),
  execEdge('lab-ms-5', 'lab-branch-ready', 'lab-import-json-cond', 'false_exec', 'exec_in'),
  execEdge('lab-ms-5b', 'lab-import-json-cond', 'lab-print-not-ready'),
];

const PULSE_NODES: VVSNode[] = [
  boundEventDefine('lab-on-pulse', { x: 40, y: 280 }, EVT_PULSE),
  boundVariableGet('lab-get-power', { x: 40, y: 380 }, VAR_POWER),
  convertToStringNode('lab-power-str', { x: 280, y: 380 }),
  stringConcatNode('lab-power-msg', { x: 480, y: 280 }, 'Power='),
  printStringNode('lab-print-pulse', { x: 720, y: 280 }),
];

const PULSE_EDGES: VVSEdge[] = [
  execEdge('lab-p-0', 'lab-on-pulse', 'lab-print-pulse'),
  dataEdge('lab-p-1', 'lab-get-power', 'lab-power-str', 'val', 'value'),
  dataEdge('lab-p-2', 'lab-power-str', 'lab-power-msg', 'result', 'b'),
  dataEdge('lab-p-3', 'lab-power-msg', 'lab-print-pulse', 'result', 'in_str'),
];

const BOOT_NODES: VVSNode[] = [
  functionEntryNode('lab-boot-entry', { x: 40, y: 600 }, FN_BOOT),
  boundVariableSet('lab-boot-set-ready', { x: 280, y: 600 }, VAR_READY, true),
  printStringNode('lab-boot-print', { x: 520, y: 600 }, 'Booted'),
  boundEventDispatch('lab-boot-dispatch-tick', { x: 760, y: 600 }, EVT_TICK),
];

const BOOT_EDGES: VVSEdge[] = [
  execEdge('lab-b-0', 'lab-boot-entry', 'lab-boot-set-ready'),
  execEdge('lab-b-1', 'lab-boot-set-ready', 'lab-boot-print'),
  execEdge('lab-b-2', 'lab-boot-print', 'lab-boot-dispatch-tick'),
];

const SHUTDOWN_NODES: VVSNode[] = [
  functionEntryNode('lab-shutdown-entry', { x: 40, y: 760 }, FN_SHUTDOWN),
  boundVariableSet('lab-shutdown-ready', { x: 280, y: 760 }, VAR_READY, false),
  printStringNode('lab-shutdown-print', { x: 520, y: 760 }, 'Shutdown'),
];

const SHUTDOWN_EDGES: VVSEdge[] = [
  execEdge('lab-sd-0', 'lab-shutdown-entry', 'lab-shutdown-ready'),
  execEdge('lab-sd-1', 'lab-shutdown-ready', 'lab-shutdown-print'),
];

// -- Sensor runtime flows --
const SENSOR_START_HANDLER = boundEventDefine('lab-on-sensor-start', { x: 40, y: 560 }, EVT_SENSOR_START);
if (SENSOR_START_HANDLER.data.properties) {
  SENSOR_START_HANDLER.data.properties.isOverride = true;
}

const SENSOR_START_NODES: VVSNode[] = [
  SENSOR_START_HANDLER,
  boundVariableGet('lab-get-status', { x: 40, y: 680 }, VAR_STATUS),
  switchNode('lab-switch-status', { x: 280, y: 560 }, ['OK', 'WARN', 'FAIL'], {
    enumType: 'SensorStatus',
  }),
  boundCallFunction('lab-call-sample', { x: 560, y: 500 }, FN_SAMPLE),
  printStringNode('lab-print-warn', { x: 560, y: 600 }, 'Warn'),
  printStringNode('lab-print-fail', { x: 560, y: 700 }, 'Fail'),
  boundCallFunction('lab-call-report', { x: 800, y: 560 }, FN_REPORT),
];

const SENSOR_START_EDGES: VVSEdge[] = [
  execEdge('lab-ss-0', 'lab-on-sensor-start', 'lab-switch-status'),
  dataEdge('lab-ss-1', 'lab-get-status', 'lab-switch-status', 'val', 'selector'),
  execEdge('lab-ss-2', 'lab-switch-status', 'lab-call-sample', 'case_0', 'exec_in'),
  execEdge('lab-ss-3', 'lab-switch-status', 'lab-print-warn', 'case_1', 'exec_in'),
  execEdge('lab-ss-4', 'lab-switch-status', 'lab-print-fail', 'case_2', 'exec_in'),
  execEdge('lab-ss-5', 'lab-call-sample', 'lab-call-report'),
  execEdge('lab-ss-6', 'lab-print-warn', 'lab-call-report'),
  execEdge('lab-ss-7', 'lab-print-fail', 'lab-call-report'),
];

const TICK_NODES: VVSNode[] = [
  boundEventDefine('lab-on-tick', { x: 40, y: 820 }, EVT_TICK),
  printStringNode('lab-print-tick', { x: 280, y: 820 }, 'Tick'),
];

const TICK_EDGES: VVSEdge[] = [
  execEdge('lab-t-0', 'lab-on-tick', 'lab-print-tick'),
];

const SAMPLE_NODES: VVSNode[] = [
  functionEntryNode('lab-sample-entry', { x: 40, y: 900 }, FN_SAMPLE),
  boundVariableGet('lab-sample-readings', { x: 40, y: 1020 }, VAR_READINGS),
  boundVariableGet('lab-sample-power', { x: 40, y: 1120 }, VAR_POWER),
  arrayPushNode('lab-sample-push', { x: 320, y: 900 }),
  printStringNode('lab-sample-print', { x: 560, y: 900 }, 'Sampled'),
];

const SAMPLE_EDGES: VVSEdge[] = [
  execEdge('lab-sa-0', 'lab-sample-entry', 'lab-sample-push'),
  dataEdge('lab-sa-1', 'lab-sample-readings', 'lab-sample-push', 'val', 'array'),
  dataEdge('lab-sa-2', 'lab-sample-power', 'lab-sample-push', 'val', 'val'),
  execEdge('lab-sa-3', 'lab-sample-push', 'lab-sample-print'),
];

const REPORT_HANDLER = functionEntryNode('lab-report-entry', { x: 40, y: 1200 }, FN_REPORT);
if (REPORT_HANDLER.data.properties) {
  REPORT_HANDLER.data.properties.isOverride = true;
}

const REPORT_NODES: VVSNode[] = [
  REPORT_HANDLER,
  printStringNode('lab-report-hdr', { x: 280, y: 1200 }, '--- Readings ---'),
  boundVariableGet('lab-report-get', { x: 280, y: 1340 }, VAR_READINGS),
  forEachNode('lab-report-for', { x: 520, y: 1200 }),
  convertToStringNode('lab-report-str', { x: 760, y: 1320 }),
  printStringNode('lab-report-print', { x: 960, y: 1200 }),
];

const REPORT_EDGES: VVSEdge[] = [
  execEdge('lab-r-0', 'lab-report-entry', 'lab-report-hdr'),
  execEdge('lab-r-1', 'lab-report-hdr', 'lab-report-for'),
  dataEdge('lab-r-2', 'lab-report-get', 'lab-report-for', 'val', 'array'),
  execEdge('lab-r-3', 'lab-report-for', 'lab-report-print', 'loop_body', 'exec_in'),
  dataEdge('lab-r-4', 'lab-report-for', 'lab-report-str', 'element', 'value'),
  dataEdge('lab-r-5', 'lab-report-str', 'lab-report-print', 'result', 'in_str'),
];

const HOME_NODES: VVSNode[] = [
  ...MACHINE_MEMBER_NODES,
  ...SENSOR_MEMBER_NODES,
  ...MACHINE_START_NODES,
  ...PULSE_NODES,
  ...SENSOR_START_NODES,
  ...TICK_NODES,
];

const HOME_EDGES: VVSEdge[] = [
  ...MACHINE_MEMBER_EDGES,
  ...SENSOR_MEMBER_EDGES,
  ...MACHINE_START_EDGES,
  ...PULSE_EDGES,
  ...SENSOR_START_EDGES,
  ...TICK_EDGES,
];

export function createCoverageLabUsabilityTestSnapshot(): ProjectSnapshot {
  return {
    version: 3,
    savedAt: new Date().toISOString(),
    projectDetails: {
      moduleName: 'CoverageLab',
      extendsType: '',
      description: `Coverage Lab (rev ${COVERAGE_LAB_FIXTURE_REVISION}) - Machine + Sensor on one graph -> one file. Declare functions on host chain; Call at use sites; bodies via Edit function body (U80). Declare ≠ Define (U81). Shared imports, TypeRef enum/class/array/map, modifiers, switch, for, Get User Input.`,
    },
    classes: [MACHINE_CLASS, SENSOR_CLASS],
    activeClassId: MAIN_CLASS_ID,
    graphContainers: normalizeGraphContainers([]),
    variables: [
      VAR_POWER,
      VAR_SERIAL,
      VAR_MAX,
      VAR_READY,
      VAR_READINGS,
      VAR_STATUS,
      VAR_HOST,
      VAR_TAGS,
    ],
    events: [EVT_MACHINE_START, EVT_PULSE, EVT_SENSOR_START, EVT_TICK],
    functions: [FN_BOOT, FN_DIAGNOSE, FN_SHUTDOWN, FN_SAMPLE, FN_REPORT],
    openTabs: [
      { id: MAIN_GRAPH_CONTAINER_ID, type: 'container', name: PROJECT_MAP_CONTAINER_NAME },
    ],
    activeGraphTab: MAIN_GRAPH_CONTAINER_ID,
    targetLanguage: 'python',
    autoCompile: true,
    autoSave: false,
    documents: {
      [MAIN_GRAPH_CONTAINER_ID]: {
        ...usabilityTestDocument(HOME_NODES, HOME_EDGES),
        metadata: defaultTabMetadata('container', 'CoverageLab'),
      },
      'fn-boot': {
        ...usabilityTestDocument(BOOT_NODES, BOOT_EDGES),
        metadata: defaultTabMetadata('function', 'Boot'),
      },
      'fn-shutdown': {
        ...usabilityTestDocument(SHUTDOWN_NODES, SHUTDOWN_EDGES),
        metadata: defaultTabMetadata('function', 'Shutdown'),
      },
      'fn-sample': {
        ...usabilityTestDocument(SAMPLE_NODES, SAMPLE_EDGES),
        metadata: defaultTabMetadata('function', 'Sample'),
      },
      'fn-report': {
        ...usabilityTestDocument(REPORT_NODES, REPORT_EDGES),
        metadata: defaultTabMetadata('function', 'Report'),
      },
    },
    installedLibrary: [],
    integration: createDefaultIntegration({
      moduleName: 'CoverageLab',
      defaultTarget: 'python',
      adoptExisting: true,
      hostFilePaths: ['main.py'],
    }),
    workspaceFiles: ['README.md'],
  };
}
