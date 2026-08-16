export type AgentToolSafety = 'safe' | 'write';

export interface AgentToolParameter {
  name: string;
  type: 'string' | 'number' | 'object';
  description: string;
  required?: boolean;
}

export interface AgentToolDef {
  name: string;
  description: string;
  safety: AgentToolSafety;
  parameters: AgentToolParameter[];
}

/** Same names as Go MCP where they map cleanly. Live canvas is the source of truth. */
export const AGENT_TOOLS: readonly AgentToolDef[] = [
  {
    name: 'list_available_nodes',
    description: 'List spawnable node kinds from the core syntax registry (leftover kinds hidden).',
    safety: 'safe',
    parameters: [],
  },
  {
    name: 'list_syntax_packs',
    description: 'List syntax pack catalog metadata (id, version, family).',
    safety: 'safe',
    parameters: [],
  },
  {
    name: 'list_classes',
    description: 'List class symbols on the live project canvas.',
    safety: 'safe',
    parameters: [],
  },
  {
    name: 'get_graph',
    description: 'Read the active, specified, or class-home graph document from the live canvas.',
    safety: 'safe',
    parameters: [
      { name: 'tab_id', type: 'string', description: 'Graph tab id (defaults to activeGraphTab)' },
      {
        name: 'class_id',
        type: 'string',
        description: 'Class id — resolves to the class home graph when tab_id is omitted',
      },
    ],
  },
  {
    name: 'generate_code',
    description: 'Transpile the live project snapshot with the client codegen path.',
    safety: 'safe',
    parameters: [],
  },
  {
    name: 'add_class',
    description: 'Create a class with a program-entry bootstrap on the live canvas.',
    safety: 'write',
    parameters: [
      { name: 'name', type: 'string', description: 'Display name for the new class', required: true },
    ],
  },
  {
    name: 'add_node',
    description: 'Spawn a registry node kind onto a graph tab. Leftover kinds are refused.',
    safety: 'write',
    parameters: [
      { name: 'kind_id', type: 'string', description: 'Core pack kindId e.g. action_print', required: true },
      { name: 'x', type: 'number', description: 'Canvas X position' },
      { name: 'y', type: 'number', description: 'Canvas Y position' },
      { name: 'tab_id', type: 'string', description: 'Graph tab id (defaults to activeGraphTab)' },
      {
        name: 'class_id',
        type: 'string',
        description: 'Class id — targets the class home graph when tab_id is omitted',
      },
    ],
  },
  {
    name: 'remove_node',
    description: 'Remove a node and its connected edges from a graph tab.',
    safety: 'write',
    parameters: [
      { name: 'node_id', type: 'string', description: 'Node id to remove', required: true },
      { name: 'tab_id', type: 'string', description: 'Graph tab id (defaults to activeGraphTab)' },
      {
        name: 'class_id',
        type: 'string',
        description: 'Class id — targets the class home graph when tab_id is omitted',
      },
    ],
  },
  {
    name: 'connect_pins',
    description: 'Connect an output pin to an input pin using client pin compatibility.',
    safety: 'write',
    parameters: [
      { name: 'source', type: 'string', description: 'Source node id', required: true },
      { name: 'target', type: 'string', description: 'Target node id', required: true },
      { name: 'source_handle', type: 'string', description: 'Source output pin id', required: true },
      { name: 'target_handle', type: 'string', description: 'Target input pin id', required: true },
      { name: 'tab_id', type: 'string', description: 'Graph tab id (defaults to activeGraphTab)' },
      {
        name: 'class_id',
        type: 'string',
        description: 'Class id — targets the class home graph when tab_id is omitted',
      },
    ],
  },
] as const;

export const AGENT_TOOL_NAMES = AGENT_TOOLS.map((t) => t.name);

export function getAgentTool(name: string): AgentToolDef | undefined {
  return AGENT_TOOLS.find((t) => t.name === name);
}

export function isWriteTool(name: string): boolean {
  return getAgentTool(name)?.safety === 'write';
}

/** OpenAI-compatible tools array for chat completions. */
export function agentToolsForChatCompletions(): Array<{
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, { type: string; description: string }>;
      required: string[];
    };
  };
}> {
  return AGENT_TOOLS.map((tool) => {
    const properties: Record<string, { type: string; description: string }> = {};
    const required: string[] = [];
    for (const param of tool.parameters) {
      properties[param.name] = { type: param.type, description: param.description };
      if (param.required) required.push(param.name);
    }
    return {
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties,
          required,
        },
      },
    };
  });
}
