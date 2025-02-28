import { CustomNodeData, nodeTypes, DataType, NodeCategory, Port } from '../components/nodes/CustomNodes';

// Node template interface using shared types
export interface NodeTemplate {
  type: string;
  title: string;
  description: string;
  category: NodeCategory;
  defaultInputs: Port[];
  defaultOutputs: Port[];
}

// Node categories with proper typing
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

const createBinaryLogicNode = (type: string, title: string, description: string): NodeTemplate => ({
  type,
  title,
  description,
  category: 'logical',
  defaultInputs: [
    createExecPort('exec', 'Exec'),
    createDataPort('a', 'A', 'boolean'),
    createDataPort('b', 'B', 'boolean')
  ],
  defaultOutputs: [
    createExecPort('exec', 'Exec', false),
    createDataPort('result', 'Result', 'boolean', false)
  ]
});

const createUnaryLogicNode = (type: string, title: string, description: string): NodeTemplate => ({
  type,
  title,
  description,
  category: 'logical',
  defaultInputs: [
    createExecPort('exec', 'Exec'),
    createDataPort('value', 'Value', 'boolean')
  ],
  defaultOutputs: [
    createExecPort('exec', 'Exec', false),
    createDataPort('result', 'Result', 'boolean', false)
  ]
});

const createComparisonNode = (type: string, title: string, description: string): NodeTemplate => ({
  type,
  title,
  description,
  category: 'comparison',
  defaultInputs: [
    createExecPort('exec', 'Exec'),
    createDataPort('a', 'A', 'any'),
    createDataPort('b', 'B', 'any')
  ],
  defaultOutputs: [
    createExecPort('exec', 'Exec', false),
    createDataPort('result', 'Result', 'boolean', false)
  ]
});

// Helper function for creating array nodes
const createArrayNode = (type: string, title: string, description: string, inputs: Port[], outputs: Port[]): NodeTemplate => ({
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
    description: 'Controls the flow of execution based on a boolean condition - commonly used for conditional rendering and business logic in web applications',
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
    description: 'Iterates over a range of numbers with a specified step - useful for batch processing data, pagination, or creating animation frames in web apps',
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
    description: 'Stores and retrieves a value in memory - essential for managing application state, form data, and user inputs in web applications',
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
    description: 'Outputs text to the browser console - useful for debugging, logging user actions, and monitoring application state',
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

  // String Operations
  {
    type: nodeTypes.stringLength,
    title: 'String Length',
    description: 'Calculates the number of characters in a string - useful for input validation, text formatting, and content management',
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
    description: 'Combines two strings into one - essential for building dynamic content, URLs, and text templates in web applications',
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

  // Comparison Operations
  createComparisonNode(nodeTypes.equals, 'Equals', 'Checks if two values are exactly the same - fundamental for form validation, user authentication, and data filtering'),
  createComparisonNode(nodeTypes.notEquals, 'Not Equals', 'Checks if two values are different - useful for validation and conditional logic in web forms'),
  createComparisonNode(nodeTypes.greaterThan, 'Greater Than', 'Checks if first value exceeds second - essential for numeric comparisons in sorting and filtering'),
  createComparisonNode(nodeTypes.lessThan, 'Less Than', 'Checks if first value is smaller than second - used in range validation and numeric sorting'),
  createComparisonNode(nodeTypes.greaterThanOrEqual, 'Greater Than or Equal', 'Checks if first value is greater than or equal to second - useful for age verification and numeric range checks'),
  createComparisonNode(nodeTypes.lessThanOrEqual, 'Less Than or Equal', 'Checks if first value is less than or equal to second - commonly used in price filtering and date range validation'),
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

  // Math Operations
  createBinaryMathNode(nodeTypes.add, 'Add', 'Adds two numbers together - fundamental for calculations in shopping carts, analytics, and dynamic sizing'),
  createBinaryMathNode(nodeTypes.subtract, 'Subtract', 'Subtracts second number from first - useful for calculating differences in dates, prices, or quantities'),
  createBinaryMathNode(nodeTypes.multiply, 'Multiply', 'Multiplies two numbers - essential for scaling, calculating totals, and applying multipliers'),
  createBinaryMathNode(nodeTypes.divide, 'Divide', 'Divides first number by second - used for calculating percentages, ratios, and proportional values'),
  createBinaryMathNode(nodeTypes.power, 'Power', 'Raises first number to power of second - useful for exponential calculations and advanced mathematical operations'),
  createUnaryMathNode(nodeTypes.sqrt, 'Square Root', 'Calculates the square root - important for geometric calculations and normalization in animations'),
  createUnaryMathNode(nodeTypes.abs, 'Absolute', 'Returns the absolute (positive) value - useful for calculating distances and differences'),
  createBinaryMathNode(nodeTypes.modulo, 'Modulo', 'Gets remainder of division - commonly used for pagination, cycling through arrays, and creating patterns'),
  
  // Trigonometry Operations
  createUnaryMathNode(nodeTypes.sin, 'Sine', 'Calculates sine of angle in radians - essential for creating smooth animations and wave patterns'),
  createUnaryMathNode(nodeTypes.cos, 'Cosine', 'Calculates cosine of angle in radians - used for circular motion and oscillating animations'),
  createUnaryMathNode(nodeTypes.tan, 'Tangent', 'Calculates tangent of angle in radians - useful for calculating slopes and angles in graphics'),
  createUnaryMathNode(nodeTypes.asin, 'Arcsine', 'Calculates inverse sine in radians - used for finding angles from ratios in geometric calculations'),
  createUnaryMathNode(nodeTypes.acos, 'Arccosine', 'Calculates inverse cosine in radians - helpful for determining angles in collision detection'),
  createUnaryMathNode(nodeTypes.atan, 'Arctangent', 'Calculates inverse tangent in radians - important for calculating angles between points'),
  
  // Logarithmic Operations
  createUnaryMathNode(nodeTypes.ln, 'Natural Log', 'Calculates natural logarithm - useful for scaling values and creating logarithmic animations'),
  createUnaryMathNode(nodeTypes.log10, 'Log Base 10', 'Calculates base-10 logarithm - helpful for creating logarithmic scales in data visualization'),
  createUnaryMathNode(nodeTypes.exp, 'Exponential', 'Calculates e raised to power - used for exponential growth calculations and easing functions'),
  
  // Rounding Operations
  createUnaryMathNode(nodeTypes.floor, 'Floor', 'Rounds down to nearest integer - useful for pixel calculations and ensuring whole number values'),
  createUnaryMathNode(nodeTypes.ceil, 'Ceiling', 'Rounds up to nearest integer - helpful for calculating container sizes and grid layouts'),
  createUnaryMathNode(nodeTypes.round, 'Round', 'Rounds to nearest integer - essential for cleaning up floating point calculations in displays'),

  // Array Operations
  createArrayNode(
    nodeTypes.arrayLength,
    'Array Length',
    'Gets the number of elements in an array - crucial for pagination, batch processing, and collection management',
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
    'Retrieves element at specified index - essential for accessing items in lists, galleries, and data collections',
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
    'Updates element at specified index - useful for modifying items in lists, updating UI elements, and managing state',
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
    'Adds new element to end of array - commonly used for adding items to lists, collecting form data, and building queues',
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
    'Removes and returns last element - useful for stack operations, undo functionality, and managing history',
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
    'Inserts element at specified position - important for adding items at specific positions in lists or menus',
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
    'Removes element at specified index - essential for deleting items from lists, tables, or galleries',
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
    'Extracts a portion of the array - useful for pagination, creating subsets of data, and managing visible items',
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
    'Combines two arrays into one - helpful for merging data sets, combining search results, or building composite lists',
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
    'Locates first element matching a condition - essential for searching through data, finding user records, or filtering content',
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
    'Creates new array with elements that pass a test - crucial for search functionality, data filtering, and content categorization',
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
    'Creates new array by transforming each element - useful for formatting data, updating multiple items, or preparing data for display',
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
    'Combines array elements into single value - essential for calculating totals, aggregating data, or building complex structures',
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
    'Orders array elements using optional comparison function - crucial for sorting tables, organizing content, and improving user experience',
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
    'Reverses the order of array elements - useful for changing display order, implementing undo/redo, or creating animations',
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
    'Combines array elements into string with separator - helpful for creating CSV data, formatting lists, or building paths',
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
    'Checks if array contains specific value - essential for validation, checking permissions, or filtering duplicates',
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
    'Finds first position of value in array - useful for locating items, checking existence, or determining order',
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
    'Finds last position of value in array - helpful for searching from end, finding latest occurrence, or managing duplicates',
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
    'Removes all elements from array - useful for resetting lists, clearing forms, or preparing for new data',
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
    'Checks if array has no elements - essential for validation, error checking, and conditional rendering',
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
  createBinaryLogicNode(nodeTypes.and, 'AND', 'Performs logical AND operation - essential for complex conditions and permission checking'),
  createBinaryLogicNode(nodeTypes.or, 'OR', 'Performs logical OR operation - useful for alternative conditions and fallback logic'),
  createUnaryLogicNode(nodeTypes.not, 'NOT', 'Performs logical NOT operation - important for inverting conditions and toggle states'),
  createBinaryLogicNode(nodeTypes.nand, 'NAND', 'Performs logical NAND operation - useful for complex logic gates and state management'),
  createBinaryLogicNode(nodeTypes.nor, 'NOR', 'Performs logical NOR operation - helpful for exclusive conditions and state validation'),
  createBinaryLogicNode(nodeTypes.xor, 'XOR', 'Performs logical XOR operation - essential for toggle switches and exclusive states'),
  createBinaryLogicNode(nodeTypes.xnor, 'XNOR', 'Performs logical XNOR operation - useful for equality comparison in logic circuits')
];

// NodeRegistry class with improved type safety and organization
export class NodeRegistry {
  static getNodeTemplate(type: string): NodeTemplate | undefined {
    return nodeTemplates.find(template => template.type === type);
  }

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