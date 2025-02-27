import { nodeTypes } from '../components/nodes/CustomNodes';
import { Deprecated, DeprecatedMethod, DeprecationMetadata } from '../utils/deprecation';
import { PortFactory } from '../core/utils/PortFactory';
import { NodeCategory } from '../components/nodes/types';
import { IPort, INodeTemplate } from '../core/NodeSystem';
import { DataType } from '../core/NodeSystem';

/**
 * @deprecated Use INodeTemplate from new system instead
 * Will be removed in version 2.0.0
 */
export interface NodeTemplate {
  type: string;
  title: string;
  description: string;
  category: NodeCategory;
  defaultInputs: IPort[];
  defaultOutputs: IPort[];
}

/**
 * @deprecated Use new category system instead
 * Will be removed in version 2.0.0
 */
export const categories: { id: NodeCategory; label: string }[] = [
  { id: 'flow-control', label: 'Control Flow' },
  { id: 'variables', label: 'Variables' },
  { id: 'io', label: 'Input/Output' },
  { id: 'math', label: 'Mathematics' },
  { id: 'string', label: 'String' },
  { id: 'logical', label: 'Logical' },
  { id: 'comparison', label: 'Comparison' },
  { id: 'array', label: 'Array' }
];

/**
 * @deprecated Use PortFactory from new system instead
 * Will be removed in version 2.0.0
 */
const createExecPort = (id: string, label: string, isInput = true): IPort => ({
  id,
  label,
  dataType: 'any',
  isExec: true,
  isInput
});

/**
 * @deprecated Use PortFactory from new system instead
 * Will be removed in version 2.0.0
 */
const createDataPort = (id: string, label: string, dataType: DataType, isInput = true): IPort => ({
  id,
  label,
  dataType,
  isInput
});

// Helper functions for creating common node configurations
const createBinaryMathNode = (type: string, title: string, description: string): NodeTemplate => ({
  type,
  title,
  description,
  category: 'math',
  defaultInputs: [
    PortFactory.createExecInput(),
    PortFactory.createDataInput('a', 'A', 'number', true),
    PortFactory.createDataInput('b', 'B', 'number', true)
  ],
  defaultOutputs: [
    PortFactory.createExecOutput(),
    PortFactory.createDataOutput('result', 'Result', 'number')
  ]
});

const createUnaryMathNode = (type: string, title: string, description: string): NodeTemplate => ({
  type,
  title,
  description,
  category: 'math',
  defaultInputs: [
    PortFactory.createExecInput(),
    PortFactory.createDataInput('value', 'Value', 'number', true)
  ],
  defaultOutputs: [
    PortFactory.createExecOutput(),
    PortFactory.createDataOutput('result', 'Result', 'number')
  ]
});

const createBinaryLogicNode = (type: string, title: string, description: string): NodeTemplate => ({
  type,
  title,
  description,
  category: 'logical',
  defaultInputs: [
    PortFactory.createExecInput(),
    PortFactory.createDataInput('a', 'A', 'boolean', true),
    PortFactory.createDataInput('b', 'B', 'boolean', true)
  ],
  defaultOutputs: [
    PortFactory.createExecOutput(),
    PortFactory.createDataOutput('result', 'Result', 'boolean')
  ]
});

const createUnaryLogicNode = (type: string, title: string, description: string): NodeTemplate => ({
  type,
  title,
  description,
  category: 'logical',
  defaultInputs: [
    PortFactory.createExecInput(),
    PortFactory.createDataInput('value', 'Value', 'boolean', true)
  ],
  defaultOutputs: [
    PortFactory.createExecOutput(),
    PortFactory.createDataOutput('result', 'Result', 'boolean')
  ]
});

const createComparisonNode = (type: string, title: string, description: string): NodeTemplate => ({
  type,
  title,
  description,
  category: 'comparison',
  defaultInputs: [
    PortFactory.createExecInput(),
    PortFactory.createDataInput('a', 'A', 'any', true),
    PortFactory.createDataInput('b', 'B', 'any', true)
  ],
  defaultOutputs: [
    PortFactory.createExecOutput(),
    PortFactory.createDataOutput('result', 'Result', 'boolean')
  ]
});

// Helper function for creating array nodes
const createArrayNode = (type: string, title: string, description: string, inputs: IPort[], outputs: IPort[]): NodeTemplate => ({
  type,
  title,
  description,
  category: 'array',
  defaultInputs: inputs,
  defaultOutputs: outputs
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
      PortFactory.createExecInput(),
      PortFactory.createDataInput('condition', 'Condition', 'boolean', true)
    ],
    defaultOutputs: [
      PortFactory.createExecOutput('Then'),
      PortFactory.createExecOutput('Else')
    ]
  },
  {
    type: nodeTypes.forLoop,
    title: 'For Loop',
    description: 'Executes a block of nodes multiple times',
    category: 'flow-control',
    defaultInputs: [
      PortFactory.createExecInput(),
      PortFactory.createDataInput('start', 'Start', 'number', true),
      PortFactory.createDataInput('end', 'End', 'number', true),
      PortFactory.createDataInput('step', 'Step', 'number')
    ],
    defaultOutputs: [
      PortFactory.createExecOutput('Body'),
      PortFactory.createExecOutput('Done'),
      PortFactory.createDataOutput('index', 'Index', 'number')
    ]
  },

  // Variables
  {
    type: nodeTypes.variable,
    title: 'Variable',
    description: 'Stores and retrieves a value',
    category: 'variables',
    defaultInputs: [
      PortFactory.createExecInput(),
      PortFactory.createDataInput('value', 'Value', 'any')
    ],
    defaultOutputs: [
      PortFactory.createExecOutput(),
      PortFactory.createDataOutput('value', 'Value', 'any')
    ]
  },

  // Input/Output
  {
    type: nodeTypes.print,
    title: 'Print String',
    description: 'Outputs text to the console',
    category: 'io',
    defaultInputs: [
      PortFactory.createExecInput(),
      PortFactory.createDataInput('text', 'Text', 'string', true),
      PortFactory.createDataInput('color', 'Color', 'string'),
      PortFactory.createDataInput('duration', 'Duration', 'number')
    ],
    defaultOutputs: [
      PortFactory.createExecOutput()
    ]
  },

  // String Operations
  {
    type: nodeTypes.stringLength,
    title: 'String Length',
    description: 'Get string length',
    category: 'string',
    defaultInputs: [
      PortFactory.createExecInput(),
      PortFactory.createDataInput('string', 'String', 'string', true)
    ],
    defaultOutputs: [
      PortFactory.createExecOutput(),
      PortFactory.createDataOutput('length', 'Length', 'number')
    ]
  },
  {
    type: nodeTypes.concat,
    title: 'Append',
    description: 'Append strings together',
    category: 'string',
    defaultInputs: [
      PortFactory.createExecInput(),
      PortFactory.createDataInput('a', 'A', 'string', true),
      PortFactory.createDataInput('b', 'B', 'string', true)
    ],
    defaultOutputs: [
      PortFactory.createExecOutput(),
      PortFactory.createDataOutput('result', 'Result', 'string')
    ]
  },
  {
    type: nodeTypes.substring,
    title: 'Substring',
    description: 'Get portion of string',
    category: 'string',
    defaultInputs: [
      PortFactory.createExecInput(),
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
  },

  // Additional String Operations
  {
    type: nodeTypes.trim,
    title: 'Trim',
    description: 'Remove whitespace from both ends of a string',
    category: 'string',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('string', 'String', 'string')
    ],
    defaultOutputs: [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'string', false)
    ]
  },
  {
    type: nodeTypes.toUpperCase,
    title: 'To Uppercase',
    description: 'Convert string to uppercase',
    category: 'string',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('string', 'String', 'string')
    ],
    defaultOutputs: [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'string', false)
    ]
  },
  {
    type: nodeTypes.toLowerCase,
    title: 'To Lowercase',
    description: 'Convert string to lowercase',
    category: 'string',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('string', 'String', 'string')
    ],
    defaultOutputs: [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'string', false)
    ]
  },
  {
    type: nodeTypes.replace,
    title: 'Replace',
    description: 'Replace all occurrences of a substring',
    category: 'string',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('string', 'String', 'string'),
      createDataPort('search', 'Search', 'string'),
      createDataPort('replace', 'Replace', 'string')
    ],
    defaultOutputs: [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'string', false)
    ]
  },
  {
    type: nodeTypes.split,
    title: 'Split',
    description: 'Split string into array by delimiter',
    category: 'string',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('string', 'String', 'string'),
      createDataPort('delimiter', 'Delimiter', 'string')
    ],
    defaultOutputs: [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'array', false)
    ]
  },
  {
    type: nodeTypes.indexOf,
    title: 'Index Of',
    description: 'Find the first occurrence of a substring',
    category: 'string',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('string', 'String', 'string'),
      createDataPort('search', 'Search', 'string')
    ],
    defaultOutputs: [
      createExecPort('exec', 'Exec', false),
      createDataPort('index', 'Index', 'number', false)
    ]
  },
  {
    type: nodeTypes.lastIndexOf,
    title: 'Last Index Of',
    description: 'Find the last occurrence of a substring',
    category: 'string',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('string', 'String', 'string'),
      createDataPort('search', 'Search', 'string')
    ],
    defaultOutputs: [
      createExecPort('exec', 'Exec', false),
      createDataPort('index', 'Index', 'number', false)
    ]
  },
  {
    type: nodeTypes.startsWith,
    title: 'Starts With',
    description: 'Check if string starts with substring',
    category: 'string',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('string', 'String', 'string'),
      createDataPort('search', 'Search', 'string')
    ],
    defaultOutputs: [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'boolean', false)
    ]
  },
  {
    type: nodeTypes.endsWith,
    title: 'Ends With',
    description: 'Check if string ends with substring',
    category: 'string',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('string', 'String', 'string'),
      createDataPort('search', 'Search', 'string')
    ],
    defaultOutputs: [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'boolean', false)
    ]
  },
  {
    type: nodeTypes.includes,
    title: 'Includes',
    description: 'Check if string contains substring',
    category: 'string',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('string', 'String', 'string'),
      createDataPort('search', 'Search', 'string')
    ],
    defaultOutputs: [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'boolean', false)
    ]
  },
  {
    type: nodeTypes.repeat,
    title: 'Repeat',
    description: 'Repeat a string multiple times',
    category: 'string',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('string', 'String', 'string'),
      createDataPort('count', 'Count', 'number')
    ],
    defaultOutputs: [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'string', false)
    ]
  },
  {
    type: nodeTypes.charAt,
    title: 'Char At',
    description: 'Get character at specified index',
    category: 'string',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('string', 'String', 'string'),
      createDataPort('index', 'Index', 'number')
    ],
    defaultOutputs: [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'string', false)
    ]
  },
  {
    type: nodeTypes.padStart,
    title: 'Pad Start',
    description: 'Pad string from start to target length',
    category: 'string',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('string', 'String', 'string'),
      createDataPort('length', 'Target Length', 'number'),
      createDataPort('pad', 'Pad String', 'string')
    ],
    defaultOutputs: [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'string', false)
    ]
  },
  {
    type: nodeTypes.padEnd,
    title: 'Pad End',
    description: 'Pad string from end to target length',
    category: 'string',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('string', 'String', 'string'),
      createDataPort('length', 'Target Length', 'number'),
      createDataPort('pad', 'Pad String', 'string')
    ],
    defaultOutputs: [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'string', false)
    ]
  },
  {
    type: nodeTypes.match,
    title: 'Regex Match',
    description: 'Match string against regular expression',
    category: 'string',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('string', 'String', 'string'),
      createDataPort('pattern', 'Pattern', 'string')
    ],
    defaultOutputs: [
      createExecPort('exec', 'Exec', false),
      createDataPort('matches', 'Matches', 'array', false),
      createDataPort('success', 'Success', 'boolean', false)
    ]
  },
  {
    type: nodeTypes.search,
    title: 'Regex Search',
    description: 'Search string using regular expression',
    category: 'string',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('string', 'String', 'string'),
      createDataPort('pattern', 'Pattern', 'string')
    ],
    defaultOutputs: [
      createExecPort('exec', 'Exec', false),
      createDataPort('index', 'Index', 'number', false),
      createDataPort('found', 'Found', 'boolean', false)
    ]
  },
  {
    type: nodeTypes.format,
    title: 'Format',
    description: 'Format string with placeholders',
    category: 'string',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('template', 'Template', 'string'),
      createDataPort('values', 'Values', 'array')
    ],
    defaultOutputs: [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'string', false)
    ]
  },

  // Array Operations
  createArrayNode(
    nodeTypes.arrayLength,
    'Array Length',
    'Get the length of an array',
    [
      createExecPort('exec', 'Exec'),
      createDataPort('array', 'Array', 'array')
    ],
    [
      createExecPort('exec', 'Exec', false),
      createDataPort('length', 'Length', 'number', false)
    ]
  ),
  createArrayNode(
    nodeTypes.arrayGet,
    'Array Get',
    'Get element at index',
    [
      createExecPort('exec', 'Exec'),
      createDataPort('array', 'Array', 'array'),
      createDataPort('index', 'Index', 'number')
    ],
    [
      createExecPort('exec', 'Exec', false),
      createDataPort('element', 'Element', 'any', false)
    ]
  ),
  createArrayNode(
    nodeTypes.arraySet,
    'Array Set',
    'Set element at index',
    [
      createExecPort('exec', 'Exec'),
      createDataPort('array', 'Array', 'array'),
      createDataPort('index', 'Index', 'number'),
      createDataPort('value', 'Value', 'any')
    ],
    [
      createExecPort('exec', 'Exec', false)
    ]
  ),
  createArrayNode(
    nodeTypes.arrayPush,
    'Array Push',
    'Add element to end of array',
    [
      createExecPort('exec', 'Exec'),
      createDataPort('array', 'Array', 'array'),
      createDataPort('value', 'Value', 'any')
    ],
    [
      createExecPort('exec', 'Exec', false),
      createDataPort('length', 'New Length', 'number', false)
    ]
  ),
  createArrayNode(
    nodeTypes.arrayPop,
    'Array Pop',
    'Remove and return last element',
    [
      createExecPort('exec', 'Exec'),
      createDataPort('array', 'Array', 'array')
    ],
    [
      createExecPort('exec', 'Exec', false),
      createDataPort('element', 'Popped Element', 'any', false)
    ]
  ),
  createArrayNode(
    nodeTypes.arrayInsert,
    'Array Insert',
    'Insert element at index',
    [
      createExecPort('exec', 'Exec'),
      createDataPort('array', 'Array', 'array'),
      createDataPort('index', 'Index', 'number'),
      createDataPort('value', 'Value', 'any')
    ],
    [
      createExecPort('exec', 'Exec', false),
      createDataPort('length', 'New Length', 'number', false)
    ]
  ),
  createArrayNode(
    nodeTypes.arrayRemove,
    'Array Remove',
    'Remove element at index',
    [
      createExecPort('exec', 'Exec'),
      createDataPort('array', 'Array', 'array'),
      createDataPort('index', 'Index', 'number')
    ],
    [
      createExecPort('exec', 'Exec', false),
      createDataPort('element', 'Removed Element', 'any', false)
    ]
  ),
  createArrayNode(
    nodeTypes.arraySlice,
    'Array Slice',
    'Get a portion of the array',
    [
      createExecPort('exec', 'Exec'),
      createDataPort('array', 'Array', 'array'),
      createDataPort('start', 'Start', 'number'),
      createDataPort('end', 'End', 'number')
    ],
    [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'array', false)
    ]
  ),
  createArrayNode(
    nodeTypes.arrayConcat,
    'Array Concat',
    'Combine two arrays',
    [
      createExecPort('exec', 'Exec'),
      createDataPort('array1', 'Array 1', 'array'),
      createDataPort('array2', 'Array 2', 'array')
    ],
    [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'array', false)
    ]
  ),
  createArrayNode(
    nodeTypes.arrayFind,
    'Array Find',
    'Find first element matching predicate',
    [
      createExecPort('exec', 'Exec'),
      createDataPort('array', 'Array', 'array'),
      createDataPort('predicate', 'Predicate', 'function')
    ],
    [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'any', false),
      createDataPort('found', 'Found', 'boolean', false)
    ]
  ),
  createArrayNode(
    nodeTypes.arrayFilter,
    'Array Filter',
    'Filter array by predicate',
    [
      createExecPort('exec', 'Exec'),
      createDataPort('array', 'Array', 'array'),
      createDataPort('predicate', 'Predicate', 'function')
    ],
    [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'array', false)
    ]
  ),
  createArrayNode(
    nodeTypes.arrayMap,
    'Array Map',
    'Transform array elements',
    [
      createExecPort('exec', 'Exec'),
      createDataPort('array', 'Array', 'array'),
      createDataPort('transform', 'Transform', 'function')
    ],
    [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'array', false)
    ]
  ),
  createArrayNode(
    nodeTypes.arrayReduce,
    'Array Reduce',
    'Reduce array to single value',
    [
      createExecPort('exec', 'Exec'),
      createDataPort('array', 'Array', 'array'),
      createDataPort('reducer', 'Reducer', 'function'),
      createDataPort('initial', 'Initial Value', 'any')
    ],
    [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'any', false)
    ]
  ),
  createArrayNode(
    nodeTypes.arraySort,
    'Array Sort',
    'Sort array with optional comparator',
    [
      createExecPort('exec', 'Exec'),
      createDataPort('array', 'Array', 'array'),
      createDataPort('comparator', 'Comparator', 'function', true)
    ],
    [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'array', false)
    ]
  ),
  createArrayNode(
    nodeTypes.arrayReverse,
    'Array Reverse',
    'Reverse array order',
    [
      createExecPort('exec', 'Exec'),
      createDataPort('array', 'Array', 'array')
    ],
    [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'array', false)
    ]
  ),
  createArrayNode(
    nodeTypes.arrayJoin,
    'Array Join',
    'Join array elements with separator',
    [
      createExecPort('exec', 'Exec'),
      createDataPort('array', 'Array', 'array'),
      createDataPort('separator', 'Separator', 'string')
    ],
    [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'string', false)
    ]
  ),
  createArrayNode(
    nodeTypes.arrayIncludes,
    'Array Includes',
    'Check if array contains value',
    [
      createExecPort('exec', 'Exec'),
      createDataPort('array', 'Array', 'array'),
      createDataPort('value', 'Value', 'any')
    ],
    [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'boolean', false)
    ]
  ),
  createArrayNode(
    nodeTypes.arrayIndexOf,
    'Array Index Of',
    'Find first index of value',
    [
      createExecPort('exec', 'Exec'),
      createDataPort('array', 'Array', 'array'),
      createDataPort('value', 'Value', 'any')
    ],
    [
      createExecPort('exec', 'Exec', false),
      createDataPort('index', 'Index', 'number', false)
    ]
  ),
  createArrayNode(
    nodeTypes.arrayLastIndexOf,
    'Array Last Index Of',
    'Find last index of value',
    [
      createExecPort('exec', 'Exec'),
      createDataPort('array', 'Array', 'array'),
      createDataPort('value', 'Value', 'any')
    ],
    [
      createExecPort('exec', 'Exec', false),
      createDataPort('index', 'Index', 'number', false)
    ]
  ),
  createArrayNode(
    nodeTypes.arrayClear,
    'Array Clear',
    'Remove all elements',
    [
      createExecPort('exec', 'Exec'),
      createDataPort('array', 'Array', 'array')
    ],
    [
      createExecPort('exec', 'Exec', false)
    ]
  ),
  createArrayNode(
    nodeTypes.arrayIsEmpty,
    'Array Is Empty',
    'Check if array has no elements',
    [
      createExecPort('exec', 'Exec'),
      createDataPort('array', 'Array', 'array')
    ],
    [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'boolean', false)
    ]
  ),

  // Logical Operations
  createBinaryLogicNode(nodeTypes.and, 'AND', 'Logical AND operation'),
  createBinaryLogicNode(nodeTypes.or, 'OR', 'Logical OR operation'),
  createUnaryLogicNode(nodeTypes.not, 'NOT', 'Logical NOT operation'),
  createBinaryLogicNode(nodeTypes.nand, 'NAND', 'Logical NAND operation'),
  createBinaryLogicNode(nodeTypes.nor, 'NOR', 'Logical NOR operation'),
  createBinaryLogicNode(nodeTypes.xor, 'XOR', 'Logical XOR operation'),
  createBinaryLogicNode(nodeTypes.xnor, 'XNOR', 'Logical XNOR operation'),

  // Comparison Operations
  createComparisonNode(nodeTypes.equals, 'Equals', 'Check if two values are equal'),
  createComparisonNode(nodeTypes.notEquals, 'Not Equals', 'Check if two values are not equal'),
  createComparisonNode(nodeTypes.greaterThan, 'Greater Than', 'Check if A is greater than B'),
  createComparisonNode(nodeTypes.lessThan, 'Less Than', 'Check if A is less than B'),
  createComparisonNode(nodeTypes.greaterThanOrEqual, 'Greater Than or Equal', 'Check if A is greater than or equal to B'),
  createComparisonNode(nodeTypes.lessThanOrEqual, 'Less Than or Equal', 'Check if A is less than or equal to B'),
  {
    type: nodeTypes.between,
    title: 'Between',
    description: 'Check if a value is between min and max (inclusive)',
    category: 'comparison',
    defaultInputs: [
      createExecPort('exec', 'Exec'),
      createDataPort('value', 'Value', 'number'),
      createDataPort('min', 'Min', 'number'),
      createDataPort('max', 'Max', 'number')
    ],
    defaultOutputs: [
      createExecPort('exec', 'Exec', false),
      createDataPort('result', 'Result', 'boolean', false)
    ]
  },
];

/**
 * @deprecated Use NodeFactory from new system instead
 * Will be removed in version 2.0.0
 */
@Deprecated({
  version: '1.0.0',
  message: 'Use NodeFactory from new system instead',
  removalVersion: '2.0.0',
  alternatives: ['NodeFactory']
})
export class NodeRegistry {
  /**
   * @deprecated Use NodeFactory.createNode() instead
   */
  @DeprecatedMethod({
    version: '1.0.0',
    message: 'Use NodeFactory.createNode() instead',
    removalVersion: '2.0.0'
  })
  static getNodeTemplate(type: string): NodeTemplate | undefined {
    return nodeTemplates.find(template => template.type === type);
  }

  /**
   * @deprecated Use NodeFactory.getNodesByCategory() instead
   */
  @DeprecatedMethod({
    version: '1.0.0',
    message: 'Use NodeFactory.getNodesByCategory() instead',
    removalVersion: '2.0.0'
  })
  static getNodesByCategory(category: NodeCategory): NodeTemplate[] {
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

  static getAllCategories(): typeof categories {
    return categories;
  }
} 