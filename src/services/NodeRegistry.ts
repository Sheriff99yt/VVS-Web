import { nodeTypes, DataType, NodeCategory as NodeCategoryType, Port } from '../components/nodes/CustomNodes';

// Node template interface using shared types
export interface NodeTemplate {
  type: string;
  title: string;
  description: string;
  category: NodeCategoryType;
  defaultInputs: Port[];
  defaultOutputs: Port[];
}

// Node categories with proper typing
export const nodeCategories: { id: NodeCategoryType; label: string }[] = [
  { id: 'flow-control', label: 'Flow Control' },
  { id: 'variables', label: 'Variables' },
  { id: 'io', label: 'Input/Output' },
  { id: 'math', label: 'Mathematics' },
  { id: 'string', label: 'String' },
  { id: 'functions', label: 'Functions' }
];

// Helper functions for creating common port configurations
const createExecPort = (id: string, label: string, isInput = true): Port => ({
  id,
  label,
  dataType: 'any', // Execution ports use 'any' type since they don't carry data
  isExec: true,
  isInput,
  isOutput: !isInput
});

const createDataPort = (id: string, label: string, dataType: DataType, isInput = true): Port => ({
  id,
  label,
  dataType,
  isInput,
  isOutput: !isInput
});

// Helper functions for creating common node configurations
const createBinaryMathNode = (type: string, title: string, description: string): NodeTemplate => ({
  type,
  title,
  description,
  category: 'math',
  defaultInputs: [
    createExecPort('exec', 'Exec'),
    createDataPort('a', 'A', 'number'),
    createDataPort('b', 'B', 'number')
  ],
  defaultOutputs: [
    createExecPort('exec', 'Exec', false),
    createDataPort('result', 'Result', 'number', false)
  ]
});

const createUnaryMathNode = (type: string, title: string, description: string): NodeTemplate => ({
  type,
  title,
  description,
  category: 'math',
  defaultInputs: [
    createExecPort('exec', 'Exec'),
    createDataPort('value', 'Value', 'number')
  ],
  defaultOutputs: [
    createExecPort('exec', 'Exec', false),
    createDataPort('result', 'Result', 'number', false)
  ]
});

// Node templates with improved organization and type safety
export const nodeTemplates: NodeTemplate[] = [
  // Flow Control
  {
    type: nodeTypes.ifStatement,
    title: 'Branch',
    description: 'Executes one of two branches based on a condition',
    category: 'flow-control',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('condition', 'Condition', 'boolean')
    ],
    defaultOutputs: [
      createExecPort('true', 'True', false),
      createExecPort('false', 'False', false)
    ]
  },
  {
    type: nodeTypes.forLoop,
    title: 'For Loop',
    description: 'Executes a block of nodes multiple times',
    category: 'flow-control',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('start', 'Start', 'number'),
      createDataPort('end', 'End', 'number'),
      createDataPort('step', 'Step', 'number')
    ],
    defaultOutputs: [
      createExecPort('loop', 'Loop', false),
      createExecPort('completed', 'Completed', false),
      createDataPort('index', 'Index', 'number', false)
    ]
  },

  // Variables
  {
    type: nodeTypes.variable,
    title: 'Variable',
    description: 'Stores and retrieves a value',
    category: 'variables',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('value', 'Value', 'any')
    ],
    defaultOutputs: [
      createExecPort('exec', 'Exec', false),
      createDataPort('value', 'Value', 'any', false)
    ]
  },

  // Input/Output
  {
    type: nodeTypes.print,
    title: 'Print String',
    description: 'Outputs text to the console',
    category: 'io',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('text', 'Text', 'string'),
      createDataPort('color', 'Color', 'string'),
      createDataPort('duration', 'Duration', 'number')
    ],
    defaultOutputs: [
      createExecPort('exec', 'Exec', false)
    ]
  },

  // Arithmetic Operations
  createBinaryMathNode(nodeTypes.add, 'Add', 'Add two numbers'),
  createBinaryMathNode(nodeTypes.subtract, 'Subtract', 'Subtract B from A'),
  createBinaryMathNode(nodeTypes.multiply, 'Multiply', 'Multiply two numbers'),
  createBinaryMathNode(nodeTypes.divide, 'Divide', 'Divide A by B'),

  // Advanced Math Operations
  createUnaryMathNode(nodeTypes.sqrt, 'Square Root', 'Calculate square root'),
  createUnaryMathNode(nodeTypes.abs, 'Absolute', 'Get absolute value'),
  createUnaryMathNode(nodeTypes.sin, 'Sine', 'Calculate sine'),
  createUnaryMathNode(nodeTypes.cos, 'Cosine', 'Calculate cosine'),
  createUnaryMathNode(nodeTypes.tan, 'Tangent', 'Calculate tangent'),

  // String Operations
  {
    type: nodeTypes.stringLength,
    title: 'String Length',
    description: 'Get string length',
    category: 'string',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('string', 'String', 'string')
    ],
    defaultOutputs: [
      createExecPort('exec', 'Exec', false),
      createDataPort('length', 'Length', 'number', false)
    ]
  },
  {
    type: nodeTypes.concat,
    title: 'Append',
    description: 'Append strings together',
    category: 'string',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('a', 'A', 'string'),
      createDataPort('b', 'B', 'string')
    ],
    defaultOutputs: [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'string', false)
    ]
  },
  {
    type: nodeTypes.substring,
    title: 'Substring',
    description: 'Get portion of string',
    category: 'string',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('string', 'String', 'string'),
      createDataPort('start', 'Start Index', 'number'),
      createDataPort('length', 'Length', 'number')
    ],
    defaultOutputs: [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'string', false),
      createDataPort('success', 'Success', 'boolean', false)
    ]
  }
];

// NodeRegistry class with improved type safety and organization
export class NodeRegistry {
  static getNodeTemplate(type: string): NodeTemplate | undefined {
    return nodeTemplates.find(template => template.type === type);
  }

  static getNodesByCategory(category: NodeCategoryType): NodeTemplate[] {
    return nodeTemplates.filter(template => template.category === category);
  }

  static getAllNodes(): NodeTemplate[] {
    return nodeTemplates;
  }

  static searchNodes(query: string): NodeTemplate[] {
    const searchTerm = query.toLowerCase();
    return nodeTemplates.filter(template => 
      template.title.toLowerCase().includes(searchTerm) || 
      template.description.toLowerCase().includes(searchTerm)
    );
  }

  static getAllCategories(): typeof nodeCategories {
    return nodeCategories;
  }
} 