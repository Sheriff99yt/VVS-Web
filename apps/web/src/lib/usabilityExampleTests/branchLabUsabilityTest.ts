/**
 * Branch Lab — thin cross-language flow fixture (U92).
 * Entry → Branch → True Print / False Print.
 */

import { ProjectSnapshot } from '@/types/projectSnapshot';
import {
  createClassSymbol,
  MAIN_CLASS_ID,
  MAIN_GRAPH_CONTAINER_ID,
  normalizeGraphContainers,
  PROJECT_MAP_CONTAINER_NAME,
  createDefaultIntegration,
} from '@vvs/graph-types';
import { defaultTabMetadata } from '@/lib/graphDefaults';
import type { VVSNode, VVSEdge } from '@/types/graph';
import {
  boundEventDefine,
  classDefineNode,
  eventMemberDefineNode,
  usabilityTestDocument,
  execEdge,
  printStringNode,
  branchNode,
} from '@/lib/usabilityExampleTests/usabilityTestGraphBuild';

export const BRANCH_LAB_FIXTURE_REVISION = 1;

const MAIN_CLASS = createClassSymbol('BranchLab', {
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

export function createBranchLabUsabilityTestSnapshot(): ProjectSnapshot {
  const MAP_NODES: VVSNode[] = [
    classDefineNode('bl-class-define', { x: 40, y: 0 }, MAIN_CLASS),
    eventMemberDefineNode('bl-start-member', { x: 240, y: 0 }, EVT_START),

    boundEventDefine('bl-start-handler', { x: 40, y: 160 }, EVT_START),
    branchNode('bl-branch', { x: 280, y: 160 }),
    printStringNode('bl-print-true', { x: 520, y: 80 }, 'True path'),
    printStringNode('bl-print-false', { x: 520, y: 240 }, 'False path'),
  ];

  const MAP_EDGES: VVSEdge[] = [
    execEdge('bl-e1', 'bl-class-define', 'bl-start-member'),
    execEdge('bl-e2', 'bl-start-handler', 'bl-branch'),
    {
      id: 'bl-e-true',
      source: 'bl-branch',
      target: 'bl-print-true',
      sourceHandle: 'true_exec',
      targetHandle: 'exec_in',
      type: 'vvs_standard_edge',
      data: { pinType: 'execution' },
    },
    {
      id: 'bl-e-false',
      source: 'bl-branch',
      target: 'bl-print-false',
      sourceHandle: 'false_exec',
      targetHandle: 'exec_in',
      type: 'vvs_standard_edge',
      data: { pinType: 'execution' },
    },
  ];

  return {
    version: 3,
    savedAt: new Date().toISOString(),
    projectDetails: {
      moduleName: 'BranchLab',
      extendsType: '',
      description: `Branch Lab (rev ${BRANCH_LAB_FIXTURE_REVISION}) — Entry → Branch → True/False Print.`,
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
        ...usabilityTestDocument(MAP_NODES, MAP_EDGES),
        metadata: defaultTabMetadata('container', 'BranchLab'),
      },
    },
    installedLibrary: [],
    integration: createDefaultIntegration({
      moduleName: 'BranchLab',
      defaultTarget: 'python',
      adoptExisting: true,
    }),
  };
}
