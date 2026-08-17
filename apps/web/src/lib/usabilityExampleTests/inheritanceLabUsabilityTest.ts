/**
 * Inheritance Lab — Extends + override + Call Super + Wait async (U92).
 * Two classes on one home graph: Parent.Speak (virtual) and Child.Speak (override).
 * Child entry: Wait async → Call Speak → Print.
 */

import type { ProjectSnapshot } from '@/types/projectSnapshot';
import {
  createClassSymbol,
  createDefaultIntegration,
  MAIN_CLASS_ID,
  MAIN_GRAPH_CONTAINER_ID,
  normalizeGraphContainers,
  PROJECT_MAP_CONTAINER_NAME,
} from '@vvs/graph-types';
import { defaultTabMetadata } from '@/lib/graphDefaults';
import { createFunctionSymbol } from '@/lib/functionTabs';
import type { VVSEdge, VVSNode } from '@/types/graph';
import {
  boundCallFunction,
  boundEventDefine,
  classDefineNode,
  eventMemberDefineNode,
  execEdge,
  functionDefineNode,
  functionEntryNode,
  functionImplementNode,
  printStringNode,
  usabilityTestDocument,
  waitNode,
} from '@/lib/usabilityExampleTests/usabilityTestGraphBuild';

/** Bump when fixture graph/semantics change so Test Project seeds refresh. */
export const INHERITANCE_LAB_FIXTURE_REVISION = 5;

export const PARENT_CLASS = createClassSymbol('Parent', {
  id: MAIN_CLASS_ID,
  containerId: MAIN_GRAPH_CONTAINER_ID,
});

export const CHILD_CLASS_ID = 'cls-child';
export const CHILD_CLASS = createClassSymbol('Child', {
  id: CHILD_CLASS_ID,
  containerId: MAIN_GRAPH_CONTAINER_ID,
  extendsType: 'Parent',
});

const FN_PARENT_CTOR = createFunctionSymbol('Parent', {
  id: 'fn-parent-ctor',
  classId: MAIN_CLASS_ID,
});
FN_PARENT_CTOR.visibility = 'public';

const FN_PARENT_SPEAK = createFunctionSymbol('Speak', {
  id: 'fn-parent-speak',
  classId: MAIN_CLASS_ID,
});
FN_PARENT_SPEAK.flags = { virtual: true };
FN_PARENT_SPEAK.visibility = 'public';

const FN_CHILD_SPEAK = createFunctionSymbol('Speak', {
  id: 'fn-child-speak',
  classId: CHILD_CLASS_ID,
});
FN_CHILD_SPEAK.flags = { override: true };
FN_CHILD_SPEAK.visibility = 'public';

const EVT_CHILD_START = {
  id: 'evt-child-start',
  name: 'start',
  role: 'entry' as const,
  parameters: [] as { id: string; label: string; type: 'data_number' }[],
  classId: CHILD_CLASS_ID,
};

const PARENT_CTOR_DEF = functionDefineNode('il-parent-ctor-def', { x: 240, y: 0 }, FN_PARENT_CTOR);
PARENT_CTOR_DEF.data.properties = { ...PARENT_CTOR_DEF.data.properties, role: 'constructor' };
const PARENT_CTOR_IMPL = functionImplementNode('il-parent-ctor-impl', { x: 440, y: 0 }, FN_PARENT_CTOR);
PARENT_CTOR_IMPL.data.properties = { ...PARENT_CTOR_IMPL.data.properties, role: 'constructor' };

const PARENT_MEMBER_NODES: VVSNode[] = [
  classDefineNode('il-parent-class', { x: 40, y: 0 }, PARENT_CLASS),
  PARENT_CTOR_DEF,
  PARENT_CTOR_IMPL,
  functionDefineNode('il-parent-speak-def', { x: 640, y: 0 }, FN_PARENT_SPEAK),
  functionImplementNode('il-parent-speak-impl', { x: 840, y: 0 }, FN_PARENT_SPEAK),
];

const PARENT_MEMBER_EDGES: VVSEdge[] = [
  execEdge('il-pm-0', 'il-parent-class', 'il-parent-ctor-def'),
  execEdge('il-pm-1', 'il-parent-ctor-def', 'il-parent-ctor-impl'),
  execEdge('il-pm-2', 'il-parent-ctor-impl', 'il-parent-speak-def'),
  execEdge('il-pm-3', 'il-parent-speak-def', 'il-parent-speak-impl'),
];

const CHILD_START_MEM = eventMemberDefineNode('il-child-start-mem', { x: 640, y: 200 }, EVT_CHILD_START);
if (CHILD_START_MEM.data.properties) {
  CHILD_START_MEM.data.properties.isAsync = true;
}

const CHILD_MEMBER_NODES: VVSNode[] = [
  classDefineNode('il-child-class', { x: 40, y: 200 }, CHILD_CLASS),
  functionDefineNode('il-child-speak-def', { x: 240, y: 200 }, FN_CHILD_SPEAK),
  functionImplementNode('il-child-speak-impl', { x: 440, y: 200 }, FN_CHILD_SPEAK),
  CHILD_START_MEM,
];

const CHILD_MEMBER_EDGES: VVSEdge[] = [
  execEdge('il-cm-0', 'il-child-class', 'il-child-speak-def'),
  execEdge('il-cm-1', 'il-child-speak-def', 'il-child-speak-impl'),
  execEdge('il-cm-2', 'il-child-speak-impl', 'il-child-start-mem'),
];

const CHILD_START_HANDLER = boundEventDefine('il-on-child-start', { x: 40, y: 400 }, EVT_CHILD_START);
if (CHILD_START_HANDLER.data.properties) {
  CHILD_START_HANDLER.data.properties.isAsync = true;
}

const CHILD_START_NODES: VVSNode[] = [
  CHILD_START_HANDLER,
  waitNode('il-wait', { x: 280, y: 400 }, { seconds: '1', isAsync: true }),
  boundCallFunction('il-call-child-speak', { x: 520, y: 400 }, FN_CHILD_SPEAK),
  printStringNode('il-print-done', { x: 760, y: 400 }, 'done'),
];

const CHILD_START_EDGES: VVSEdge[] = [
  execEdge('il-cs-0', 'il-on-child-start', 'il-wait'),
  execEdge('il-cs-1', 'il-wait', 'il-call-child-speak'),
  execEdge('il-cs-2', 'il-call-child-speak', 'il-print-done'),
];

const PARENT_SPEAK_NODES: VVSNode[] = [
  functionEntryNode('il-parent-speak-entry', { x: 40, y: 80 }, FN_PARENT_SPEAK),
  printStringNode('il-parent-print', { x: 280, y: 80 }, 'parent'),
];

const PARENT_SPEAK_EDGES: VVSEdge[] = [
  execEdge('il-ps-0', 'il-parent-speak-entry', 'il-parent-print'),
];

const SUPER_SPEAK = boundCallFunction('il-super-speak', { x: 280, y: 80 }, FN_PARENT_SPEAK);
SUPER_SPEAK.data.properties = { ...SUPER_SPEAK.data.properties, isSuper: true };

const CHILD_SPEAK_ENTRY = functionEntryNode('il-child-speak-entry', { x: 40, y: 80 }, FN_CHILD_SPEAK);
if (CHILD_SPEAK_ENTRY.data.properties) {
  CHILD_SPEAK_ENTRY.data.properties.isOverride = true;
}

const CHILD_SPEAK_NODES: VVSNode[] = [
  CHILD_SPEAK_ENTRY,
  SUPER_SPEAK,
  printStringNode('il-child-print', { x: 520, y: 80 }, 'child'),
];

const CHILD_SPEAK_EDGES: VVSEdge[] = [
  execEdge('il-chs-0', 'il-child-speak-entry', 'il-super-speak'),
  execEdge('il-chs-1', 'il-super-speak', 'il-child-print'),
];

const HOME_NODES: VVSNode[] = [
  ...PARENT_MEMBER_NODES,
  ...CHILD_MEMBER_NODES,
  ...CHILD_START_NODES,
];

const HOME_EDGES: VVSEdge[] = [
  ...PARENT_MEMBER_EDGES,
  ...CHILD_MEMBER_EDGES,
  ...CHILD_START_EDGES,
];

export function createInheritanceLabUsabilityTestSnapshot(): ProjectSnapshot {
  return {
    version: 3,
    savedAt: new Date().toISOString(),
    projectDetails: {
      moduleName: 'InheritanceLab',
      extendsType: '',
      description:
        'Inheritance Lab (rev ' +
        INHERITANCE_LAB_FIXTURE_REVISION +
        ') — Extends + override + Call Super + Wait async + Parent constructor role. Parent.Speak (virtual) / Child.Speak (override) on one graph.',
    },
    classes: [PARENT_CLASS, CHILD_CLASS],
    activeClassId: MAIN_CLASS_ID,
    graphContainers: normalizeGraphContainers(undefined),
    variables: [],
    events: [EVT_CHILD_START],
    functions: [FN_PARENT_CTOR, FN_PARENT_SPEAK, FN_CHILD_SPEAK],
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
        metadata: defaultTabMetadata('container', 'InheritanceLab'),
      },
      'fn-parent-ctor': {
        ...usabilityTestDocument(
          [functionEntryNode('il-parent-ctor-entry', { x: 40, y: 80 }, FN_PARENT_CTOR)],
          []
        ),
        metadata: defaultTabMetadata('function', 'Parent'),
      },
      'fn-parent-speak': {
        ...usabilityTestDocument(PARENT_SPEAK_NODES, PARENT_SPEAK_EDGES),
        metadata: defaultTabMetadata('function', 'Speak'),
      },
      'fn-child-speak': {
        ...usabilityTestDocument(CHILD_SPEAK_NODES, CHILD_SPEAK_EDGES),
        metadata: defaultTabMetadata('function', 'Speak'),
      },
    },
    installedLibrary: [],
    integration: createDefaultIntegration({
      moduleName: 'InheritanceLab',
      defaultTarget: 'python',
      adoptExisting: true,
    }),
  };
}
