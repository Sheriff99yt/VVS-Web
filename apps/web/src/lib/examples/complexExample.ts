import type { ProjectSnapshot } from '@/types/projectSnapshot';
import { defaultTabMetadata } from '@/lib/graphDefaults';
import { VVSNode, VVSEdge } from '@/types/graph';
import { createFunctionSymbol } from '@/lib/functionTabs';

const MAIN_NODES: VVSNode[] = [
  {
    id: 'cx-start',
    type: 'vvs_standard_node',
    position: { x: 40, y: 40 },
    data: {
      label: 'On Start',
      category: 'Events',
      inputs: [],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
    },
  },
  {
    id: 'cx-print-welcome',
    type: 'vvs_standard_node',
    position: { x: 760, y: 40 },
    data: {
      label: 'Print String',
      category: 'Action',
      inputs: [
        { id: 'exec_in', label: '', type: 'execution' },
        { id: 'in_str', label: 'In String', type: 'data_string' },
      ],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: { in_str: 'GameSession started' },
    },
  },
  {
    id: 'cx-set-score-init',
    type: 'vvs_standard_node',
    position: { x: 1020, y: 40 },
    data: {
      label: 'Set Score',
      category: 'Variables',
      inputs: [
        { id: 'exec_in', label: '', type: 'execution' },
        { id: 'val', label: 'New Score', type: 'data_number' },
      ],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: { val: 0 },
    },
  },
  {
    id: 'cx-update',
    type: 'vvs_standard_node',
    position: { x: 40, y: 220 },
    data: {
      label: 'On Update',
      category: 'Events',
      inputs: [],
      outputs: [
        { id: 'exec_out', label: '', type: 'execution' },
        { id: 'delta', label: 'Delta time', type: 'data_number' },
      ],
      inlineValues: {},
    },
  },
  {
    id: 'cx-get-score',
    type: 'vvs_standard_node',
    position: { x: 280, y: 280 },
    data: {
      label: 'Get Score',
      category: 'Variables',
      inputs: [],
      outputs: [{ id: 'val', label: 'Score', type: 'data_number' }],
      inlineValues: {},
    },
  },
  {
    id: 'cx-add-score',
    type: 'vvs_standard_node',
    position: { x: 520, y: 260 },
    data: {
      label: 'Math Add',
      category: 'Math',
      inputs: [
        { id: 'a', label: 'A', type: 'data_number' },
        { id: 'b', label: 'B', type: 'data_number' },
      ],
      outputs: [{ id: 'result', label: 'Result', type: 'data_number' }],
      inlineValues: { b: 1 },
    },
  },
  {
    id: 'cx-set-score-tick',
    type: 'vvs_standard_node',
    position: { x: 760, y: 220 },
    data: {
      label: 'Set Score',
      category: 'Variables',
      inputs: [
        { id: 'exec_in', label: '', type: 'execution' },
        { id: 'val', label: 'New Score', type: 'data_number' },
      ],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
    },
  },
  {
    id: 'cx-import-apply-damage',
    type: 'vvs_standard_node',
    position: { x: 280, y: 40 },
    data: {
      label: 'Import ApplyDamage',
      category: 'Imports',
      linkKind: 'import_module',
      linkedGraphId: 'f1',
      inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
    },
  },
  {
    id: 'cx-import-reset-game',
    type: 'vvs_standard_node',
    position: { x: 520, y: 40 },
    data: {
      label: 'Import ResetGame',
      category: 'Imports',
      linkKind: 'import_module',
      linkedGraphId: 'f2',
      inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
    },
  },
  {
    id: 'cx-damage-event',
    type: 'vvs_standard_node',
    position: { x: 40, y: 480 },
    data: {
      label: 'On damage',
      category: 'Events',
      kindId: 'event_define',
      properties: { eventId: 'evt-damage', eventName: 'damage' },
      inputs: [],
      outputs: [
        { id: 'exec_out', label: '', type: 'execution' },
        { id: 'damage', label: 'DamageAmount', type: 'data_number' },
      ],
      inlineValues: {},
    },
  },
  {
    id: 'cx-call-apply-damage',
    type: 'vvs_standard_node',
    position: { x: 320, y: 480 },
    data: {
      label: 'Call ApplyDamage',
      category: 'Project',
      linkKind: 'call_function',
      linkedGraphId: 'f1',
      inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
    },
  },
  {
    id: 'cx-get-alive',
    type: 'vvs_standard_node',
    position: { x: 320, y: 640 },
    data: {
      label: 'Get IsAlive',
      category: 'Variables',
      inputs: [],
      outputs: [{ id: 'val', label: 'IsAlive', type: 'data_boolean' }],
      inlineValues: {},
    },
  },
  {
    id: 'cx-branch-alive',
    type: 'vvs_standard_node',
    position: { x: 600, y: 480 },
    data: {
      label: 'Branch',
      category: 'Flow Control',
      inputs: [
        { id: 'exec_in', label: '', type: 'execution' },
        { id: 'condition', label: 'Condition', type: 'data_boolean' },
      ],
      outputs: [
        { id: 'true_exec', label: 'True', type: 'execution' },
        { id: 'false_exec', label: 'False', type: 'execution' },
      ],
      inlineValues: {},
    },
  },
  {
    id: 'cx-call-reset-game',
    type: 'vvs_standard_node',
    position: { x: 900, y: 560 },
    data: {
      label: 'Call ResetGame',
      category: 'Project',
      linkKind: 'call_function',
      linkedGraphId: 'f2',
      inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
    },
  },
];

const MAIN_EDGES: VVSEdge[] = [
  {
    id: 'cx-e-start-import-damage',
    source: 'cx-start',
    target: 'cx-import-apply-damage',
    sourceHandle: 'exec_out',
    targetHandle: 'exec_in',
    type: 'vvs_standard_edge',
    data: { pinType: 'execution' },
  },
  {
    id: 'cx-e-import-damage-reset',
    source: 'cx-import-apply-damage',
    target: 'cx-import-reset-game',
    sourceHandle: 'exec_out',
    targetHandle: 'exec_in',
    type: 'vvs_standard_edge',
    data: { pinType: 'execution' },
  },
  {
    id: 'cx-e-import-reset-print',
    source: 'cx-import-reset-game',
    target: 'cx-print-welcome',
    sourceHandle: 'exec_out',
    targetHandle: 'exec_in',
    type: 'vvs_standard_edge',
    data: { pinType: 'execution' },
  },
  {
    id: 'cx-e-print-score',
    source: 'cx-print-welcome',
    target: 'cx-set-score-init',
    sourceHandle: 'exec_out',
    targetHandle: 'exec_in',
    type: 'vvs_standard_edge',
    data: { pinType: 'execution' },
  },
  {
    id: 'cx-e-update-score',
    source: 'cx-update',
    target: 'cx-set-score-tick',
    sourceHandle: 'exec_out',
    targetHandle: 'exec_in',
    type: 'vvs_standard_edge',
    data: { pinType: 'execution' },
  },
  {
    id: 'cx-e-get-add',
    source: 'cx-get-score',
    target: 'cx-add-score',
    sourceHandle: 'val',
    targetHandle: 'a',
    type: 'vvs_standard_edge',
    data: { pinType: 'data_number' },
  },
  {
    id: 'cx-e-add-set',
    source: 'cx-add-score',
    target: 'cx-set-score-tick',
    sourceHandle: 'result',
    targetHandle: 'val',
    type: 'vvs_standard_edge',
    data: { pinType: 'data_number' },
  },
  {
    id: 'cx-e-damage-call',
    source: 'cx-damage-event',
    target: 'cx-call-apply-damage',
    sourceHandle: 'exec_out',
    targetHandle: 'exec_in',
    type: 'vvs_standard_edge',
    data: { pinType: 'execution' },
  },
  {
    id: 'cx-e-call-branch',
    source: 'cx-call-apply-damage',
    target: 'cx-branch-alive',
    sourceHandle: 'exec_out',
    targetHandle: 'exec_in',
    type: 'vvs_standard_edge',
    data: { pinType: 'execution' },
  },
  {
    id: 'cx-e-alive-branch',
    source: 'cx-get-alive',
    target: 'cx-branch-alive',
    sourceHandle: 'val',
    targetHandle: 'condition',
    type: 'vvs_standard_edge',
    data: { pinType: 'data_boolean' },
  },
  {
    id: 'cx-e-branch-reset',
    source: 'cx-branch-alive',
    target: 'cx-call-reset-game',
    sourceHandle: 'false_exec',
    targetHandle: 'exec_in',
    type: 'vvs_standard_edge',
    data: { pinType: 'execution' },
  },
];

const APPLY_DAMAGE_NODES: VVSNode[] = [
  {
    id: 'cx-fn-entry',
    type: 'vvs_standard_node',
    position: { x: 60, y: 80 },
    data: {
      label: 'ApplyDamage',
      category: 'Events',
      inputs: [],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
    },
  },
  {
    id: 'cx-fn-get',
    type: 'vvs_standard_node',
    position: { x: 60, y: 240 },
    data: {
      label: 'Get PlayerHealth',
      category: 'Variables',
      inputs: [],
      outputs: [{ id: 'val', label: 'Health', type: 'data_number' }],
      inlineValues: {},
    },
  },
  {
    id: 'cx-fn-sub',
    type: 'vvs_standard_node',
    position: { x: 320, y: 160 },
    data: {
      label: 'Math Subtract',
      category: 'Math',
      inputs: [
        { id: 'a', label: 'A', type: 'data_number' },
        { id: 'b', label: 'B', type: 'data_number' },
      ],
      outputs: [{ id: 'result', label: 'Result', type: 'data_number' }],
      inlineValues: { b: 25 },
    },
  },
  {
    id: 'cx-fn-set',
    type: 'vvs_standard_node',
    position: { x: 580, y: 80 },
    data: {
      label: 'Set PlayerHealth',
      category: 'Variables',
      inputs: [
        { id: 'exec_in', label: '', type: 'execution' },
        { id: 'val', label: 'New Health', type: 'data_number' },
      ],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
    },
  },
  {
    id: 'cx-fn-print',
    type: 'vvs_standard_node',
    position: { x: 860, y: 80 },
    data: {
      label: 'Print String',
      category: 'Action',
      inputs: [
        { id: 'exec_in', label: '', type: 'execution' },
        { id: 'in_str', label: 'In String', type: 'data_string' },
      ],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: { in_str: 'Damage applied' },
    },
  },
];

const APPLY_DAMAGE_EDGES: VVSEdge[] = [
  {
    id: 'cx-fn-e1',
    source: 'cx-fn-entry',
    target: 'cx-fn-set',
    sourceHandle: 'exec_out',
    targetHandle: 'exec_in',
    type: 'vvs_standard_edge',
    data: { pinType: 'execution' },
  },
  {
    id: 'cx-fn-e2',
    source: 'cx-fn-get',
    target: 'cx-fn-sub',
    sourceHandle: 'val',
    targetHandle: 'a',
    type: 'vvs_standard_edge',
    data: { pinType: 'data_number' },
  },
  {
    id: 'cx-fn-e3',
    source: 'cx-fn-sub',
    target: 'cx-fn-set',
    sourceHandle: 'result',
    targetHandle: 'val',
    type: 'vvs_standard_edge',
    data: { pinType: 'data_number' },
  },
  {
    id: 'cx-fn-e4',
    source: 'cx-fn-set',
    target: 'cx-fn-print',
    sourceHandle: 'exec_out',
    targetHandle: 'exec_in',
    type: 'vvs_standard_edge',
    data: { pinType: 'execution' },
  },
];

const RESET_GAME_NODES: VVSNode[] = [
  {
    id: 'cx-rg-entry',
    type: 'vvs_standard_node',
    position: { x: 60, y: 100 },
    data: {
      label: 'ResetGame',
      category: 'Events',
      inputs: [],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
    },
  },
  {
    id: 'cx-rg-health',
    type: 'vvs_standard_node',
    position: { x: 340, y: 100 },
    data: {
      label: 'Set PlayerHealth',
      category: 'Variables',
      inputs: [
        { id: 'exec_in', label: '', type: 'execution' },
        { id: 'val', label: 'New Health', type: 'data_number' },
      ],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: { val: 100 },
    },
  },
  {
    id: 'cx-rg-score',
    type: 'vvs_standard_node',
    position: { x: 600, y: 100 },
    data: {
      label: 'Set Score',
      category: 'Variables',
      inputs: [
        { id: 'exec_in', label: '', type: 'execution' },
        { id: 'val', label: 'New Score', type: 'data_number' },
      ],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: { val: 0 },
    },
  },
  {
    id: 'cx-rg-alive',
    type: 'vvs_standard_node',
    position: { x: 860, y: 100 },
    data: {
      label: 'Set IsAlive',
      category: 'Variables',
      inputs: [
        { id: 'exec_in', label: '', type: 'execution' },
        { id: 'val', label: 'New IsAlive', type: 'data_boolean' },
      ],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: { val: true },
    },
  },
  {
    id: 'cx-rg-print',
    type: 'vvs_standard_node',
    position: { x: 1120, y: 100 },
    data: {
      label: 'Print String',
      category: 'Action',
      inputs: [
        { id: 'exec_in', label: '', type: 'execution' },
        { id: 'in_str', label: 'In String', type: 'data_string' },
      ],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: { in_str: 'Game reset' },
    },
  },
];

const RESET_GAME_EDGES: VVSEdge[] = [
  {
    id: 'cx-rg-e1',
    source: 'cx-rg-entry',
    target: 'cx-rg-health',
    sourceHandle: 'exec_out',
    targetHandle: 'exec_in',
    type: 'vvs_standard_edge',
    data: { pinType: 'execution' },
  },
  {
    id: 'cx-rg-e2',
    source: 'cx-rg-health',
    target: 'cx-rg-score',
    sourceHandle: 'exec_out',
    targetHandle: 'exec_in',
    type: 'vvs_standard_edge',
    data: { pinType: 'execution' },
  },
  {
    id: 'cx-rg-e3',
    source: 'cx-rg-score',
    target: 'cx-rg-alive',
    sourceHandle: 'exec_out',
    targetHandle: 'exec_in',
    type: 'vvs_standard_edge',
    data: { pinType: 'execution' },
  },
  {
    id: 'cx-rg-e4',
    source: 'cx-rg-alive',
    target: 'cx-rg-print',
    sourceHandle: 'exec_out',
    targetHandle: 'exec_in',
    type: 'vvs_standard_edge',
    data: { pinType: 'execution' },
  },
];

/** Multi-graph project — function calls via Call Function nodes (mock multifile layout). */
export function createComplexExampleSnapshot(): ProjectSnapshot {
  return {
    version: 2,
    savedAt: new Date().toISOString(),
    projectDetails: {
      moduleName: 'GameSession',
      extendsType: '',
      description: 'Complex example — multi-graph GameSession with imports and function calls',
    },
    variables: [
      { id: 'v1', name: 'PlayerHealth', type: 'number', defaultValue: 100 },
      { id: 'v2', name: 'Score', type: 'number', defaultValue: 0 },
      { id: 'v3', name: 'IsAlive', type: 'boolean', defaultValue: true },
      { id: 'v4', name: 'PlayerName', type: 'string', defaultValue: 'Hero' },
    ],
    events: [
      {
        id: 'evt-damage',
        name: 'damage',
        parameters: [{ id: 'damage', label: 'DamageAmount', type: 'data_number' }],
      },
    ],
    functions: [
      createFunctionSymbol('ApplyDamage', 'f1'),
      createFunctionSymbol('ResetGame', 'f2'),
    ],
    openTabs: [
      { id: 'main', type: 'main', name: 'Main graph' },
      { id: 'f1', type: 'function', name: 'ApplyDamage' },
      { id: 'f2', type: 'function', name: 'ResetGame' },
    ],
    activeGraphTab: 'main',
    targetLanguage: 'python',
    autoCompile: true,
    autoSave: false,
    documents: {
      main: {
        nodes: MAIN_NODES,
        edges: MAIN_EDGES,
        metadata: defaultTabMetadata('main', 'Main graph'),
      },
      f1: {
        nodes: APPLY_DAMAGE_NODES,
        edges: APPLY_DAMAGE_EDGES,
        metadata: defaultTabMetadata('function', 'ApplyDamage'),
      },
      f2: {
        nodes: RESET_GAME_NODES,
        edges: RESET_GAME_EDGES,
        metadata: defaultTabMetadata('function', 'ResetGame'),
      },
    },
    installedLibrary: [],
  };
}
