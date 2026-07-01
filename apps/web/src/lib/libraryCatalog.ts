import { LibraryAsset } from '@/types/libraryAsset';
import { GraphDocument } from '@/lib/graphDefaults';

export const LIBRARY_CATALOG: LibraryAsset[] = [
  {
    id: '1',
    title: 'Advanced Character Controller',
    author: 'GameDevPro',
    type: 'Scripts',
    downloads: '12.4k',
    likes: '3.2k',
    description:
      'A complete character controller graph with jumping, crouching, sprinting, and camera sway.',
    tags: ['Player', 'Movement'],
    importKind: 'function_graph',
    previewCode: `def move_character(self, input_vector):\n    self.velocity = input_vector * self.speed\n    if self.is_jumping:\n        self.apply_jump_impulse()`,
  },
  {
    id: '2',
    title: 'PostgreSQL Database Node',
    author: 'DataSys',
    type: 'Node packs',
    downloads: '8.1k',
    likes: '1.5k',
    description: 'Custom node for high performance SQL queries from your graphs.',
    tags: ['Database', 'SQL'],
    importKind: 'node_pack_only',
    previewCode: `# Node pack: SQL Query\n# Adds "Execute Query" node to spawn catalog (mock)`,
  },
  {
    id: '3',
    title: 'Inventory System Template',
    author: 'RPGMaster',
    type: 'Templates',
    downloads: '22.3k',
    likes: '5.9k',
    description:
      'Grid-based inventory system with drag-and-drop, item stacking, and weight limits.',
    tags: ['UI', 'Inventory'],
    importKind: 'template_graph',
    previewCode: `class InventorySystem:\n    def __init__(self):\n        self.slots = []\n    def add_item(self, item):\n        self.slots.append(item)`,
  },
  {
    id: '4',
    title: 'Math Utilities Pack',
    author: 'MathGenius',
    type: 'Node packs',
    downloads: '4.5k',
    likes: '890',
    description: 'Over 50+ optimized math nodes for vectors, quaternions, and matrix math.',
    tags: ['Math', 'Vectors'],
    importKind: 'node_pack_only',
    previewCode: `# Node pack: Vector Add, Dot Product, Cross Product (mock)`,
  },
  {
    id: '5',
    title: 'Multiplayer Lobby System',
    author: 'NetCodeHero',
    type: 'Scripts',
    downloads: '6.7k',
    likes: '1.2k',
    description: 'Multiplayer lobby with team selection and ready-up mechanics.',
    tags: ['Multiplayer', 'Network'],
    importKind: 'function_graph',
    previewCode: `def on_player_ready(self, player_id):\n    self.ready_players.add(player_id)\n    if self.all_ready():\n        self.start_match()`,
  },
  {
    id: '6',
    title: 'OpenAI GPT-4 Chat Node',
    author: 'AI_Wizard',
    type: 'Node packs',
    downloads: '15.2k',
    likes: '4.1k',
    description: 'Stream LLM responses into your app using this asynchronous node.',
    tags: ['AI', 'LLM'],
    importKind: 'node_pack_only',
    previewCode: `# Node pack: LLM Chat Request (mock async node)`,
  },
];

export function getLibraryAsset(id: string): LibraryAsset | undefined {
  return LIBRARY_CATALOG.find((a) => a.id === id);
}

function baseEventNode(id: string, label: string, x: number, y: number) {
  return {
    id,
    type: 'vvs_standard_node' as const,
    position: { x, y },
    data: {
      label,
      category: 'Events',
      inputs: [],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
      inlineValues: {},
    },
  };
}

function printNode(id: string, text: string, x: number, y: number) {
  return {
    id,
    type: 'vvs_standard_node' as const,
    position: { x, y },
    data: {
      label: 'Print String',
      category: 'Action',
      inputs: [
        { id: 'exec_in', label: '', type: 'execution' as const },
        { id: 'in_str', label: 'In String', type: 'data_string' as const },
      ],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
      inlineValues: { in_str: text },
    },
  };
}

/** Mock graph documents bundled with community assets */
export const LIBRARY_GRAPH_FIXTURES: Record<string, GraphDocument> = {
  '1': {
    nodes: [
      baseEventNode('lib1-start', 'Character Controller', 80, 80),
      printNode('lib1-print', 'Character controller initialized', 360, 80),
    ],
    edges: [
      {
        id: 'lib1-e1',
        source: 'lib1-start',
        target: 'lib1-print',
        sourceHandle: 'exec_out',
        targetHandle: 'exec_in',
        type: 'vvs_standard_edge',
        data: { pinType: 'execution' },
      },
    ],
  },
  '3': {
    nodes: [
      baseEventNode('lib3-start', 'On Start', 80, 80),
      printNode('lib3-print', 'Inventory template loaded', 360, 80),
    ],
    edges: [
      {
        id: 'lib3-e1',
        source: 'lib3-start',
        target: 'lib3-print',
        sourceHandle: 'exec_out',
        targetHandle: 'exec_in',
        type: 'vvs_standard_edge',
        data: { pinType: 'execution' },
      },
    ],
  },
  '5': {
    nodes: [
      baseEventNode('lib5-start', 'Lobby Ready', 80, 80),
      printNode('lib5-print', 'All players ready — starting match', 360, 80),
    ],
    edges: [
      {
        id: 'lib5-e1',
        source: 'lib5-start',
        target: 'lib5-print',
        sourceHandle: 'exec_out',
        targetHandle: 'exec_in',
        type: 'vvs_standard_edge',
        data: { pinType: 'execution' },
      },
    ],
  },
};
