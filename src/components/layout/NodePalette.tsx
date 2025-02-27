import React from 'react';
import { nodeTypes, DataType } from '../nodes/CustomNodes';
import './NodePalette.css';

interface NodeTemplate {
  type: string;
  title: string;
  description: string;
  category: 'flow-control' | 'variables' | 'io' | 'arithmetic' | 'string' | 'comparison' | 'logical' | 'bitwise' | 'math-advanced' | 'functions';
  defaultInputs?: Array<{ id: string; label: string; dataType: DataType }>;
  defaultOutputs?: Array<{ id: string; label: string; dataType: DataType }>;
}

const nodeTemplates: NodeTemplate[] = [
  // Flow Control
  {
    type: nodeTypes.ifStatement,
    title: 'Conditional (If)',
    description: 'Execute code based on a condition',
    category: 'flow-control',
    defaultInputs: [
      { id: 'condition', label: 'Condition', dataType: 'boolean' }
    ],
    defaultOutputs: [
      { id: 'true', label: 'True', dataType: 'any' },
      { id: 'false', label: 'False', dataType: 'any' }
    ]
  },
  {
    type: nodeTypes.forLoop,
    title: 'Iterator (For)',
    description: 'Iterate over a sequence of values',
    category: 'flow-control',
    defaultInputs: [
      { id: 'start', label: 'Start', dataType: 'number' },
      { id: 'end', label: 'End', dataType: 'number' },
      { id: 'step', label: 'Step', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'body', label: 'Body', dataType: 'any' },
      { id: 'index', label: 'Index', dataType: 'number' }
    ]
  },

  // Variables
  {
    type: nodeTypes.variable,
    title: 'Variable Store',
    description: 'Store and manage variable values',
    category: 'variables',
    defaultInputs: [
      { id: 'value', label: 'Value', dataType: 'any' }
    ],
    defaultOutputs: [
      { id: 'output', label: 'Value', dataType: 'any' }
    ]
  },

  // Input/Output
  {
    type: nodeTypes.print,
    title: 'Console Output',
    description: 'Output values to console',
    category: 'io',
    defaultInputs: [
      { id: 'value', label: 'Value', dataType: 'any' }
    ]
  },

  // Arithmetic
  {
    type: nodeTypes.add,
    title: 'Addition (+)',
    description: 'Add two numeric values',
    category: 'arithmetic',
    defaultInputs: [
      { id: 'a', label: 'A', dataType: 'number' },
      { id: 'b', label: 'B', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.subtract,
    title: 'Subtraction (-)',
    description: 'Subtract numeric values',
    category: 'arithmetic',
    defaultInputs: [
      { id: 'a', label: 'A', dataType: 'number' },
      { id: 'b', label: 'B', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.multiply,
    title: 'Multiplication (*)',
    description: 'Multiply numeric values',
    category: 'arithmetic',
    defaultInputs: [
      { id: 'a', label: 'A', dataType: 'number' },
      { id: 'b', label: 'B', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.divide,
    title: 'Division (/)',
    description: 'Divide numeric values',
    category: 'arithmetic',
    defaultInputs: [
      { id: 'a', label: 'A', dataType: 'number' },
      { id: 'b', label: 'B', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.modulo,
    title: 'Modulus (%)',
    description: 'Calculate remainder of division',
    category: 'arithmetic',
    defaultInputs: [
      { id: 'dividend', label: 'Dividend', dataType: 'number' },
      { id: 'divisor', label: 'Divisor', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },

  // Advanced Math
  {
    type: nodeTypes.power,
    title: 'Exponentiation',
    description: 'Raise base to an exponent',
    category: 'math-advanced',
    defaultInputs: [
      { id: 'base', label: 'Base', dataType: 'number' },
      { id: 'exponent', label: 'Exponent', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.sqrt,
    title: 'Square Root (√)',
    description: 'Calculate square root',
    category: 'math-advanced',
    defaultInputs: [
      { id: 'number', label: 'Number', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.abs,
    title: 'Absolute Value (|x|)',
    description: 'Get absolute value',
    category: 'math-advanced',
    defaultInputs: [
      { id: 'number', label: 'Number', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.sin,
    title: 'Sine (sin)',
    description: 'Calculate sine of angle',
    category: 'math-advanced',
    defaultInputs: [
      { id: 'angle', label: 'Angle', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.cos,
    title: 'Cosine (cos)',
    description: 'Calculate cosine of angle',
    category: 'math-advanced',
    defaultInputs: [
      { id: 'angle', label: 'Angle', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.tan,
    title: 'Tangent (tan)',
    description: 'Calculate tangent of angle',
    category: 'math-advanced',
    defaultInputs: [
      { id: 'angle', label: 'Angle', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.asin,
    title: 'Arc Sine (arcsin)',
    description: 'Calculate inverse sine',
    category: 'math-advanced',
    defaultInputs: [
      { id: 'value', label: 'Value', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.acos,
    title: 'Arc Cosine (arccos)',
    description: 'Calculate inverse cosine',
    category: 'math-advanced',
    defaultInputs: [
      { id: 'value', label: 'Value', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.atan,
    title: 'Arc Tangent (arctan)',
    description: 'Calculate inverse tangent',
    category: 'math-advanced',
    defaultInputs: [
      { id: 'value', label: 'Value', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.ln,
    title: 'Natural Logarithm (ln)',
    description: 'Calculate natural logarithm',
    category: 'math-advanced',
    defaultInputs: [
      { id: 'value', label: 'Value', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.log10,
    title: 'Common Logarithm (log₁₀)',
    description: 'Calculate base-10 logarithm',
    category: 'math-advanced',
    defaultInputs: [
      { id: 'value', label: 'Value', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.exp,
    title: 'Exponential (eˣ)',
    description: 'Calculate exponential function',
    category: 'math-advanced',
    defaultInputs: [
      { id: 'value', label: 'Value', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.floor,
    title: 'Floor (⌊x⌋)',
    description: 'Round down to nearest integer',
    category: 'math-advanced',
    defaultInputs: [
      { id: 'value', label: 'Value', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.ceil,
    title: 'Ceiling (⌈x⌉)',
    description: 'Round up to nearest integer',
    category: 'math-advanced',
    defaultInputs: [
      { id: 'value', label: 'Value', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.round,
    title: 'Round (⌊x⌉)',
    description: 'Round to nearest integer',
    category: 'math-advanced',
    defaultInputs: [
      { id: 'value', label: 'Value', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },

  // String Operations
  {
    type: nodeTypes.stringLength,
    title: 'String Length',
    description: 'Get number of characters',
    category: 'string',
    defaultInputs: [
      { id: 'string', label: 'String', dataType: 'string' }
    ],
    defaultOutputs: [
      { id: 'length', label: 'Length', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.concat,
    title: 'String Concatenate',
    description: 'Join strings together',
    category: 'string',
    defaultInputs: [
      { id: 'string1', label: 'String 1', dataType: 'string' },
      { id: 'string2', label: 'String 2', dataType: 'string' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'string' }
    ]
  },
  {
    type: nodeTypes.substring,
    title: 'Substring Extract',
    description: 'Extract portion of string',
    category: 'string',
    defaultInputs: [
      { id: 'string', label: 'String', dataType: 'string' },
      { id: 'start', label: 'Start', dataType: 'number' },
      { id: 'end', label: 'End', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'string' }
    ]
  },
  {
    type: nodeTypes.trim,
    title: 'String Trim',
    description: 'Remove leading/trailing spaces',
    category: 'string',
    defaultInputs: [
      { id: 'string', label: 'String', dataType: 'string' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'string' }
    ]
  },
  {
    type: nodeTypes.toUpperCase,
    title: 'To Uppercase',
    description: 'Convert to uppercase letters',
    category: 'string',
    defaultInputs: [
      { id: 'string', label: 'String', dataType: 'string' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'string' }
    ]
  },
  {
    type: nodeTypes.toLowerCase,
    title: 'To Lowercase',
    description: 'Convert to lowercase letters',
    category: 'string',
    defaultInputs: [
      { id: 'string', label: 'String', dataType: 'string' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'string' }
    ]
  },
  {
    type: nodeTypes.replace,
    title: 'String Replace',
    description: 'Replace substring with new text',
    category: 'string',
    defaultInputs: [
      { id: 'string', label: 'String', dataType: 'string' },
      { id: 'search', label: 'Search', dataType: 'string' },
      { id: 'replace', label: 'Replace', dataType: 'string' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'string' }
    ]
  },
  {
    type: nodeTypes.split,
    title: 'String Split',
    description: 'Split string into array',
    category: 'string',
    defaultInputs: [
      { id: 'string', label: 'String', dataType: 'string' },
      { id: 'delimiter', label: 'Delimiter', dataType: 'string' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'array' }
    ]
  },
  {
    type: nodeTypes.indexOf,
    title: 'Find First Index',
    description: 'Find first occurrence position',
    category: 'string',
    defaultInputs: [
      { id: 'string', label: 'String', dataType: 'string' },
      { id: 'search', label: 'Search', dataType: 'string' }
    ],
    defaultOutputs: [
      { id: 'index', label: 'Index', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.lastIndexOf,
    title: 'Find Last Index',
    description: 'Find last occurrence position',
    category: 'string',
    defaultInputs: [
      { id: 'string', label: 'String', dataType: 'string' },
      { id: 'search', label: 'Search', dataType: 'string' }
    ],
    defaultOutputs: [
      { id: 'index', label: 'Index', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.startsWith,
    title: 'Starts With Check',
    description: 'Check string beginning',
    category: 'string',
    defaultInputs: [
      { id: 'string', label: 'String', dataType: 'string' },
      { id: 'search', label: 'Search', dataType: 'string' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'boolean' }
    ]
  },
  {
    type: nodeTypes.endsWith,
    title: 'Ends With Check',
    description: 'Check string ending',
    category: 'string',
    defaultInputs: [
      { id: 'string', label: 'String', dataType: 'string' },
      { id: 'search', label: 'Search', dataType: 'string' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'boolean' }
    ]
  },
  {
    type: nodeTypes.includes,
    title: 'Contains Check',
    description: 'Check for substring presence',
    category: 'string',
    defaultInputs: [
      { id: 'string', label: 'String', dataType: 'string' },
      { id: 'search', label: 'Search', dataType: 'string' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'boolean' }
    ]
  },
  {
    type: nodeTypes.repeat,
    title: 'String Repeat',
    description: 'Repeat string multiple times',
    category: 'string',
    defaultInputs: [
      { id: 'string', label: 'String', dataType: 'string' },
      { id: 'count', label: 'Count', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'string' }
    ]
  },
  {
    type: nodeTypes.charAt,
    title: 'Get Character',
    description: 'Get character at position',
    category: 'string',
    defaultInputs: [
      { id: 'string', label: 'String', dataType: 'string' },
      { id: 'index', label: 'Index', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'string' }
    ]
  },
  {
    type: nodeTypes.compare,
    title: 'String Compare',
    description: 'Compare two strings',
    category: 'string',
    defaultInputs: [
      { id: 'string1', label: 'String 1', dataType: 'string' },
      { id: 'string2', label: 'String 2', dataType: 'string' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.padStart,
    title: 'Pad Start',
    description: 'Add padding at start',
    category: 'string',
    defaultInputs: [
      { id: 'string', label: 'String', dataType: 'string' },
      { id: 'length', label: 'Length', dataType: 'number' },
      { id: 'padString', label: 'Pad String', dataType: 'string' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'string' }
    ]
  },
  {
    type: nodeTypes.padEnd,
    title: 'Pad End',
    description: 'Add padding at end',
    category: 'string',
    defaultInputs: [
      { id: 'string', label: 'String', dataType: 'string' },
      { id: 'length', label: 'Length', dataType: 'number' },
      { id: 'padString', label: 'Pad String', dataType: 'string' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'string' }
    ]
  },
  {
    type: nodeTypes.match,
    title: 'Regex Match',
    description: 'Match using regular expression',
    category: 'string',
    defaultInputs: [
      { id: 'string', label: 'String', dataType: 'string' },
      { id: 'pattern', label: 'Pattern', dataType: 'string' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'array' }
    ]
  },
  {
    type: nodeTypes.search,
    title: 'Regex Search',
    description: 'Search using regular expression',
    category: 'string',
    defaultInputs: [
      { id: 'string', label: 'String', dataType: 'string' },
      { id: 'pattern', label: 'Pattern', dataType: 'string' }
    ],
    defaultOutputs: [
      { id: 'index', label: 'Index', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.format,
    title: 'String Format',
    description: 'Format string with values',
    category: 'string',
    defaultInputs: [
      { id: 'template', label: 'Template', dataType: 'string' },
      { id: 'values', label: 'Values', dataType: 'array' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'string' }
    ]
  },

  // Comparison Operators
  {
    type: nodeTypes.equal,
    title: 'Equality (==)',
    description: 'Check if values are equal',
    category: 'comparison',
    defaultInputs: [
      { id: 'a', label: 'A', dataType: 'any' },
      { id: 'b', label: 'B', dataType: 'any' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'boolean' }
    ]
  },
  {
    type: nodeTypes.notEqual,
    title: 'Inequality (!=)',
    description: 'Check if values are not equal',
    category: 'comparison',
    defaultInputs: [
      { id: 'a', label: 'A', dataType: 'any' },
      { id: 'b', label: 'B', dataType: 'any' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'boolean' }
    ]
  },
  {
    type: nodeTypes.greaterThan,
    title: 'Greater Than (>)',
    description: 'Compare if A > B',
    category: 'comparison',
    defaultInputs: [
      { id: 'a', label: 'A', dataType: 'number' },
      { id: 'b', label: 'B', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'boolean' }
    ]
  },
  {
    type: nodeTypes.lessThan,
    title: 'Less Than (<)',
    description: 'Compare if A < B',
    category: 'comparison',
    defaultInputs: [
      { id: 'a', label: 'A', dataType: 'number' },
      { id: 'b', label: 'B', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'boolean' }
    ]
  },
  {
    type: nodeTypes.greaterEqual,
    title: 'Greater Equal (>=)',
    description: 'Compare if A ≥ B',
    category: 'comparison',
    defaultInputs: [
      { id: 'a', label: 'A', dataType: 'number' },
      { id: 'b', label: 'B', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'boolean' }
    ]
  },
  {
    type: nodeTypes.lessEqual,
    title: 'Less Equal (<=)',
    description: 'Compare if A ≤ B',
    category: 'comparison',
    defaultInputs: [
      { id: 'a', label: 'A', dataType: 'number' },
      { id: 'b', label: 'B', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'boolean' }
    ]
  },

  // Logical Operators
  {
    type: nodeTypes.and,
    title: 'Logical AND (∧)',
    description: 'Boolean AND operation',
    category: 'logical',
    defaultInputs: [
      { id: 'a', label: 'A', dataType: 'boolean' },
      { id: 'b', label: 'B', dataType: 'boolean' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'boolean' }
    ]
  },
  {
    type: nodeTypes.or,
    title: 'Logical OR (∨)',
    description: 'Boolean OR operation',
    category: 'logical',
    defaultInputs: [
      { id: 'a', label: 'A', dataType: 'boolean' },
      { id: 'b', label: 'B', dataType: 'boolean' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'boolean' }
    ]
  },
  {
    type: nodeTypes.not,
    title: 'Logical NOT (¬)',
    description: 'Boolean NOT operation',
    category: 'logical',
    defaultInputs: [
      { id: 'value', label: 'Value', dataType: 'boolean' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'boolean' }
    ]
  },
  {
    type: nodeTypes.logicalXor,
    title: 'Logical XOR (⊕)',
    description: 'Boolean XOR operation',
    category: 'logical',
    defaultInputs: [
      { id: 'a', label: 'A', dataType: 'boolean' },
      { id: 'b', label: 'B', dataType: 'boolean' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'boolean' }
    ]
  },

  // Bitwise Operators
  {
    type: nodeTypes.bitwiseAnd,
    title: 'Bitwise AND (&)',
    description: 'Binary AND operation',
    category: 'bitwise',
    defaultInputs: [
      { id: 'a', label: 'A', dataType: 'number' },
      { id: 'b', label: 'B', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.bitwiseOr,
    title: 'Bitwise OR (|)',
    description: 'Binary OR operation',
    category: 'bitwise',
    defaultInputs: [
      { id: 'a', label: 'A', dataType: 'number' },
      { id: 'b', label: 'B', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.bitwiseXor,
    title: 'Bitwise XOR (^)',
    description: 'Binary XOR operation',
    category: 'bitwise',
    defaultInputs: [
      { id: 'a', label: 'A', dataType: 'number' },
      { id: 'b', label: 'B', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.leftShift,
    title: 'Left Shift (<<)',
    description: 'Binary left shift',
    category: 'bitwise',
    defaultInputs: [
      { id: 'value', label: 'Value', dataType: 'number' },
      { id: 'shift', label: 'Shift', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },
  {
    type: nodeTypes.rightShift,
    title: 'Right Shift (>>)',
    description: 'Bitwise right shift',
    category: 'bitwise',
    defaultInputs: [
      { id: 'value', label: 'Value', dataType: 'number' },
      { id: 'shift', label: 'Shift', dataType: 'number' }
    ],
    defaultOutputs: [
      { id: 'result', label: 'Result', dataType: 'number' }
    ]
  },

  // Functions
  {
    type: nodeTypes.function,
    title: 'Function',
    description: 'Define reusable code',
    category: 'functions',
    defaultInputs: [
      { id: 'param1', label: 'Parameter 1', dataType: 'any' }
    ],
    defaultOutputs: [
      { id: 'return', label: 'Return', dataType: 'any' }
    ]
  },
];

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

const NodePalette: React.FC<NodePaletteProps> = ({ onDragStart }) => {
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(
    new Set(['flow-control', 'variables']) // Initially expand flow-control and variables categories
  );
  const [searchQuery, setSearchQuery] = React.useState('');

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const categories = [
    { id: 'flow-control', label: 'Flow Control' },
    { id: 'variables', label: 'Variables' },
    { id: 'io', label: 'Input/Output' },
    { id: 'arithmetic', label: 'Arithmetic' },
    { id: 'string', label: 'String' },
    { id: 'comparison', label: 'Comparison' },
    { id: 'logical', label: 'Logical' },
    { id: 'bitwise', label: 'Bitwise' },
    { id: 'math-advanced', label: 'Advanced Math' },
    { id: 'functions', label: 'Functions' },
  ] as const;

  const filteredNodeTemplates = React.useMemo(() => {
    if (!searchQuery) return nodeTemplates;
    const query = searchQuery.toLowerCase();
    return nodeTemplates.filter(template => 
      template.title.toLowerCase().includes(query) || 
      template.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <div className="node-palette">
      <div className="palette-header">
        <h3>Nodes</h3>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button 
              className="clear-search"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="palette-content">
        {categories.map(category => {
          const categoryNodes = filteredNodeTemplates.filter(
            template => template.category === category.id
          );
          
          if (searchQuery && categoryNodes.length === 0) {
            return null;
          }

          return (
            <div key={category.id} className="node-category">
              <div 
                className={`category-header ${expandedCategories.has(category.id) ? 'expanded' : ''}`}
                onClick={() => toggleCategory(category.id)}
              >
                <span className="category-icon">{expandedCategories.has(category.id) ? '▼' : '▶'}</span>
                {category.label}
                {searchQuery && categoryNodes.length > 0 && (
                  <span className="category-count">({categoryNodes.length})</span>
                )}
              </div>
              <div className={`category-items ${expandedCategories.has(category.id) || searchQuery ? 'expanded' : ''}`}>
                {categoryNodes.map(template => (
                  <div
                    key={template.type}
                    className="node-template"
                    draggable
                    onDragStart={(e) => onDragStart(e, template.type)}
                  >
                    <div className="template-title">{template.title}</div>
                    <div className="template-description">{template.description}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { nodeTemplates };
export type { NodeTemplate };
export default NodePalette; 