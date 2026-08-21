/**
 * Simple — one class, one story that should run on all 8 languages.
 *
 * Hello.Name = "Ada"; Greet prints "Hello, " + Name; On Start calls Greet.
 * No GetInput. No Bind. No branch. No second overload. Zero leftover (x).
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
import type { VVSNode, VVSEdge } from '@/types/graph';
import {
  boundEventDefine,
  boundCallFunction,
  boundVariableGet,
  classDefineNode,
  eventMemberDefineNode,
  usabilityTestDocument,
  execEdge,
  dataEdge,
  printStringNode,
  functionDefineNode,
  functionImplementNode,
  varDefineNode,
  functionEntryNode,
  stringConcatNode,
  importModuleNode,
} from '@/lib/usabilityExampleTests/usabilityTestGraphBuild';

/** Bump when fixture graph/semantics change so Test Project seeds refresh. */
export const SIMPLE_FIXTURE_REVISION = 1;

export const HELLO_CLASS = createClassSymbol('Hello', {
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

const VAR_NAME = createVariableSymbol('Name', {
  id: 'var-name',
  type: 'data_string',
});
VAR_NAME.defaultValue = 'Ada';
VAR_NAME.classId = MAIN_CLASS_ID;

const FN_GREET = createFunctionSymbol('Greet', { id: 'fn-greet' });
FN_GREET.classId = MAIN_CLASS_ID;

export function createSimpleSnapshot(): ProjectSnapshot {
  const IMPORT_IOSTREAM = importModuleNode('sm-import-iostream', { x: -160, y: 0 }, {
    modulePath: 'iostream',
    importStyle: 'include_system',
    label: 'Import iostream',
    targetLanguages: ['cpp'],
  });

  const MAP_NODES: VVSNode[] = [
    IMPORT_IOSTREAM,
    classDefineNode('sm-class-define', { x: 40, y: 0 }, HELLO_CLASS),
    varDefineNode('sm-var-name', { x: 240, y: 0 }, VAR_NAME),
    functionDefineNode('sm-fn-greet', { x: 440, y: 0 }, FN_GREET),
    functionImplementNode('sm-fn-greet-impl', { x: 640, y: 0 }, FN_GREET),
    eventMemberDefineNode('sm-start-member', { x: 840, y: 0 }, EVT_START),

    boundEventDefine('sm-start-handler', { x: 40, y: 160 }, EVT_START),
    boundCallFunction('sm-call-greet', { x: 280, y: 160 }, FN_GREET),
  ];

  const MAP_EDGES: VVSEdge[] = [
    execEdge('sm-imp-class', 'sm-import-iostream', 'sm-class-define'),
    execEdge('sm-class-var', 'sm-class-define', 'sm-var-name'),
    execEdge('sm-var-fn', 'sm-var-name', 'sm-fn-greet'),
    execEdge('sm-fn-impl', 'sm-fn-greet', 'sm-fn-greet-impl'),
    execEdge('sm-impl-start-member', 'sm-fn-greet-impl', 'sm-start-member'),
    execEdge('sm-start-call', 'sm-start-handler', 'sm-call-greet'),
  ];

  const GREET_NODES: VVSNode[] = [
    functionEntryNode('sm-greet-entry', { x: 40, y: 80 }, FN_GREET),
    boundVariableGet('sm-greet-get-name', { x: 40, y: 200 }, VAR_NAME),
    stringConcatNode('sm-greet-concat', { x: 260, y: 80 }, 'Hello, '),
    printStringNode('sm-greet-print', { x: 500, y: 80 }),
  ];

  const GREET_EDGES: VVSEdge[] = [
    execEdge('sm-greet-entry-print', 'sm-greet-entry', 'sm-greet-print'),
    dataEdge('sm-greet-name-concat', 'sm-greet-get-name', 'sm-greet-concat', 'val', 'b', 'data_string'),
    dataEdge('sm-greet-concat-print', 'sm-greet-concat', 'sm-greet-print', 'result', 'in_str', 'data_string'),
  ];

  return {
    version: 3,
    savedAt: new Date().toISOString(),
    projectDetails: {
      moduleName: 'Hello',
      extendsType: '',
      description: `Simple (rev ${SIMPLE_FIXTURE_REVISION}) — Hello.Name + Greet concat/print. Runs on all 8 languages.`,
    },
    classes: [HELLO_CLASS],
    activeClassId: MAIN_CLASS_ID,
    graphContainers: normalizeGraphContainers(undefined),
    variables: [VAR_NAME],
    events: [EVT_START],
    functions: [FN_GREET],
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
        metadata: defaultTabMetadata('container', 'Hello'),
      },
      ['fn-greet']: {
        ...usabilityTestDocument(GREET_NODES, GREET_EDGES),
        metadata: defaultTabMetadata('function', 'Greet'),
      },
    },
    installedLibrary: [],
    integration: createDefaultIntegration({
      moduleName: 'Hello',
      defaultTarget: 'python',
      adoptExisting: true,
    }),
  };
}
