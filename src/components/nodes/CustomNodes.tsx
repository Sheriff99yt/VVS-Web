import React, { memo, useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import './CustomNodes.css';

// Common node types
export const nodeTypes = {
  // Control Flow
  ifStatement: 'ifStatement',
  forLoop: 'forLoop',
  
  // Output
  print: 'print',
  
  // Variables
  variable: 'variable',
  
  // Math Operations
  add: 'add',
  subtract: 'subtract',
  multiply: 'multiply',
  divide: 'divide',
  power: 'power',
  sqrt: 'sqrt',
  abs: 'abs',
  modulo: 'modulo',
  sin: 'sin',
  cos: 'cos',
  tan: 'tan',
  asin: 'asin',
  acos: 'acos',
  atan: 'atan',
  ln: 'ln',
  log10: 'log10',
  exp: 'exp',
  floor: 'floor',
  ceil: 'ceil',
  round: 'round',
  
  // Logical Operations
  and: 'and',
  or: 'or',
  not: 'not',
  nand: 'nand',
  nor: 'nor',
  xor: 'xor',
  xnor: 'xnor',
  
  // Comparison Operations
  equals: 'equals',
  notEquals: 'notEquals',
  greaterThan: 'greaterThan',
  lessThan: 'lessThan',
  greaterThanOrEqual: 'greaterThanOrEqual',
  lessThanOrEqual: 'lessThanOrEqual',
  between: 'between',
  
  // String Operations
  stringLength: 'stringLength',
  concat: 'concat',
  substring: 'substring',
  trim: 'trim',
  toUpperCase: 'toUpperCase',
  toLowerCase: 'toLowerCase',
  replace: 'replace',
  split: 'split',
  indexOf: 'indexOf',
  lastIndexOf: 'lastIndexOf',
  startsWith: 'startsWith',
  endsWith: 'endsWith',
  includes: 'includes',
  repeat: 'repeat',
  charAt: 'charAt',
  padStart: 'padStart',
  padEnd: 'padEnd',
  match: 'match',
  search: 'search',
  format: 'format',

  // Array Operations
  arrayLength: 'arrayLength',
  arrayGet: 'arrayGet',
  arraySet: 'arraySet',
  arrayPush: 'arrayPush',
  arrayPop: 'arrayPop',
  arrayInsert: 'arrayInsert',
  arrayRemove: 'arrayRemove',
  arraySlice: 'arraySlice',
  arrayConcat: 'arrayConcat',
  arrayFind: 'arrayFind',
  arrayFilter: 'arrayFilter',
  arrayMap: 'arrayMap',
  arrayReduce: 'arrayReduce',
  arraySort: 'arraySort',
  arrayReverse: 'arrayReverse',
  arrayJoin: 'arrayJoin',
  arrayIncludes: 'arrayIncludes',
  arrayIndexOf: 'arrayIndexOf',
  arrayLastIndexOf: 'arrayLastIndexOf',
  arrayClear: 'arrayClear',
  arrayIsEmpty: 'arrayIsEmpty'
} as const;

export type DataType = 
  | 'number'      // Float
  | 'integer'     // Integer
  | 'boolean'     // Binary
  | 'string'      // String
  | 'vector'      // Vector
  | 'transform'   // Transform
  | 'rotator'     // Rotator
  | 'color'       // Linear Color
  | 'struct'      // Structure
  | 'class'       // Class Reference
  | 'array'       // Array type
  | 'function'    // Function type
  | 'any';        // Wildcard

export type NodeCategory = 
  | 'flow-control'    // Control flow nodes
  | 'pure-function'   // Pure functions (green)
  | 'impure-function' // Impure functions (blue)
  | 'variables'       // Variable nodes
  | 'event'          // Event nodes
  | 'comment'        // Comment nodes
  | 'math'           // Mathematics operations
  | 'string'         // String operations
  | 'logical'        // Logical operations
  | 'comparison'     // Comparison operations
  | 'array'          // Array operations
  | 'io';            // Input/Output operations

export interface Port {
  id: string;
  label: string;
  dataType: DataType;
  isExec?: boolean;    // Is this an execution pin
  isInput?: boolean;   // Is this an input pin
  isOutput?: boolean;  // Is this an output pin
  isOptional?: boolean; // Is this an optional port
}

// Base node data interface
export interface CustomNodeData {
  title: string;
  inputs?: Port[];
  outputs?: Port[];
  category?: NodeCategory;
  // Additional properties for specific node types
  variableType?: DataType;
  operation?: string;
  initialValue?: string;
  isPure?: boolean;    // Is this a pure function
  isEvent?: boolean;   // Is this an event node
  description?: string; // Node description/comment
}

const BaseNode: React.FC<NodeProps<CustomNodeData>> = ({ data, selected }) => {
  const { 
    title, 
    inputs = [], 
    outputs = [], 
    category = 'math',
    isPure,
    isEvent,
    description 
  } = data;

  const nodeClass = `custom-node node ${category} ${isPure ? 'pure' : ''} ${isEvent ? 'event' : ''} ${selected ? 'selected' : ''}`;

  return (
    <div className={nodeClass}>
      {description && <div className="node-tooltip">{description}</div>}
      <div className="node-header">{title}</div>
      <div className="node-content">
        <div className="node-inputs">
          {inputs.map((input, index) => (
            <div key={input.id} className="node-port">
              <Handle
                type="target"
                position={Position.Left}
                id={input.id}
                style={{ 
                  top: `${(index + 1) * (100 / (inputs.length + 1))}%`,
                  ...(input.isExec ? { backgroundColor: '#FFFFFF' } : {})
                }}
                className={`node-handle ${input.isExec ? 'exec-handle' : `node-handle-${input.dataType}`}`}
                data-type={input.dataType}
                data-exec={input.isExec}
              />
              <span className="port-label">{input.label}</span>
              <div className="port-tooltip">
                {input.isExec ? 'Execution Input' : `${input.label} (${input.dataType})`}
              </div>
            </div>
          ))}
        </div>
        <div className="node-outputs">
          {outputs.map((output, index) => (
            <div key={output.id} className="node-port">
              <span className="port-label">{output.label}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={output.id}
                style={{ 
                  top: `${(index + 1) * (100 / (outputs.length + 1))}%`,
                  ...(output.isExec ? { backgroundColor: '#FFFFFF' } : {})
                }}
                className={`node-handle ${output.isExec ? 'exec-handle' : `node-handle-${output.dataType}`}`}
                data-type={output.dataType}
                data-exec={output.isExec}
              />
              <div className="port-tooltip">
                {output.isExec ? 'Execution Output' : `${output.label} (${output.dataType})`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Create a generic math node for operations with one input
const createUnaryMathNode = (title: string, description: string) => 
  memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title,
      description,
      category: 'math' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'value', label: 'Value', dataType: 'number' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'result', label: 'Result', dataType: 'number' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  });

// Create a generic math node for operations with two inputs
const createBinaryMathNode = (title: string, description: string) => 
  memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title,
      description,
      category: 'math' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'a', label: 'A', dataType: 'number' as DataType },
        { id: 'b', label: 'B', dataType: 'number' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'result', label: 'Result', dataType: 'number' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  });

// Basic nodes
export const IfStatementNode = memo((props: NodeProps<CustomNodeData>) => <BaseNode {...props} />);
export const PrintNode = memo((props: NodeProps<CustomNodeData>) => <BaseNode {...props} />);
export const VariableNode = memo((props: NodeProps<CustomNodeData>) => <BaseNode {...props} />);
export const ForLoopNode = memo((props: NodeProps<CustomNodeData>) => <BaseNode {...props} />);

// Math nodes
export const AddNode = createBinaryMathNode('Add', 'Adds two numbers together - fundamental for calculations in shopping carts, analytics, and dynamic sizing');
export const SubtractNode = createBinaryMathNode('Subtract', 'Subtracts second number from first - useful for calculating differences in dates, prices, or quantities');
export const MultiplyNode = createBinaryMathNode('Multiply', 'Multiplies two numbers - essential for scaling, calculating totals, and applying multipliers');
export const DivideNode = createBinaryMathNode('Divide', 'Divides first number by second - used for calculating percentages, ratios, and proportional values');
export const PowerNode = createBinaryMathNode('Power', 'Raises first number to power of second - useful for exponential calculations and advanced mathematical operations');
export const SqrtNode = createUnaryMathNode('Square Root', 'Calculates the square root - important for geometric calculations and normalization in animations');
export const AbsNode = createUnaryMathNode('Absolute', 'Returns the absolute (positive) value - useful for calculating distances and differences');
export const ModuloNode = createBinaryMathNode('Modulo', 'Gets remainder of division - commonly used for pagination, cycling through arrays, and creating patterns');

// Trigonometry nodes
export const SinNode = createUnaryMathNode('Sine', 'Calculates sine of angle in radians - essential for creating smooth animations and wave patterns');
export const CosNode = createUnaryMathNode('Cosine', 'Calculates cosine of angle in radians - used for circular motion and oscillating animations');
export const TanNode = createUnaryMathNode('Tangent', 'Calculates tangent of angle in radians - useful for calculating slopes and angles in graphics');
export const AsinNode = createUnaryMathNode('Arcsine', 'Calculates inverse sine in radians - used for finding angles from ratios in geometric calculations');
export const AcosNode = createUnaryMathNode('Arccosine', 'Calculates inverse cosine in radians - helpful for determining angles in collision detection');
export const AtanNode = createUnaryMathNode('Arctangent', 'Calculates inverse tangent in radians - important for calculating angles between points');

// Logarithmic nodes
export const LnNode = createUnaryMathNode('Natural Log', 'Calculates natural logarithm - useful for scaling values and creating logarithmic animations');
export const Log10Node = createUnaryMathNode('Log Base 10', 'Calculates base-10 logarithm - helpful for creating logarithmic scales in data visualization');
export const ExpNode = createUnaryMathNode('Exponential', 'Calculates e raised to power - used for exponential growth calculations and easing functions');

// Rounding nodes
export const FloorNode = createUnaryMathNode('Floor', 'Rounds down to nearest integer - useful for pixel calculations and ensuring whole number values');
export const CeilNode = createUnaryMathNode('Ceiling', 'Rounds up to nearest integer - helpful for calculating container sizes and grid layouts');
export const RoundNode = createUnaryMathNode('Round', 'Rounds to nearest integer - essential for cleaning up floating point calculations in displays');

// Helper function to create base nodes
const createBaseNode = (title: string, description: string) => memo((props: NodeProps<CustomNodeData>) => (
  <BaseNode {...props} data={{ ...props.data, title, description }} />
));

// Create a string node with a single input
const createUnaryStringNode = (title: string, description: string) => 
  memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title,
      description,
      category: 'string' as NodeCategory,
      inputs: [
        {
          id: 'exec',
          label: 'Exec',
          dataType: 'any' as DataType,
          isExec: true,
          isInput: true
        },
        {
          id: 'string',
          label: 'String',
          dataType: 'string' as DataType,
          isInput: true
        }
      ],
      outputs: [
        {
          id: 'exec',
          label: 'Exec',
          dataType: 'any' as DataType,
          isExec: true,
          isOutput: true
        },
        {
          id: 'result',
          label: 'Result',
          dataType: 'string' as DataType,
          isOutput: true
        }
      ]
    }), [props.data]);

    return <BaseNode {...props} data={data} />;
  });

// Create a string node with two string inputs
const createBinaryStringNode = (title: string, description: string) => 
  memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title,
      description,
      category: 'string' as NodeCategory,
      inputs: [
        {
          id: 'exec',
          label: 'Exec',
          dataType: 'any' as DataType,
          isExec: true,
          isInput: true
        },
        {
          id: 'a',
          label: 'A',
          dataType: 'string' as DataType,
          isInput: true
        },
        {
          id: 'b',
          label: 'B',
          dataType: 'string' as DataType,
          isInput: true
        }
      ],
      outputs: [
        {
          id: 'exec',
          label: 'Exec',
          dataType: 'any' as DataType,
          isExec: true,
          isOutput: true
        },
        {
          id: 'result',
          label: 'Result',
          dataType: 'string' as DataType,
          isOutput: true
        }
      ]
    }), [props.data]);

    return <BaseNode {...props} data={data} />;
  });

// Create a string node that returns a number
const createStringToNumberNode = (title: string, description: string) => 
  memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title,
      description,
      category: 'string' as NodeCategory,
      inputs: [
        {
          id: 'exec',
          label: 'Exec',
          dataType: 'any' as DataType,
          isExec: true,
          isInput: true
        },
        {
          id: 'string',
          label: 'String',
          dataType: 'string' as DataType,
          isInput: true
        }
      ],
      outputs: [
        {
          id: 'exec',
          label: 'Exec',
          dataType: 'any' as DataType,
          isExec: true,
          isOutput: true
        },
        {
          id: 'result',
          label: 'Result',
          dataType: 'number' as DataType,
          isOutput: true
        }
      ]
    }), [props.data]);

    return <BaseNode {...props} data={data} />;
  });

// Create a string node that returns a boolean
const createStringToBooleanNode = (title: string, description: string) => 
  memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title,
      description,
      category: 'string' as NodeCategory,
      inputs: [
        {
          id: 'exec',
          label: 'Exec',
          dataType: 'any' as DataType,
          isExec: true,
          isInput: true
        },
        {
          id: 'string',
          label: 'String',
          dataType: 'string' as DataType,
          isInput: true
        }
      ],
      outputs: [
        {
          id: 'exec',
          label: 'Exec',
          dataType: 'any' as DataType,
          isExec: true,
          isOutput: true
        },
        {
          id: 'result',
          label: 'Result',
          dataType: 'boolean' as DataType,
          isOutput: true
        }
      ]
    }), [props.data]);

    return <BaseNode {...props} data={data} />;
  });

// Node registration helper functions
interface NodeDefinition {
  title: string;
  description: string;
}

const registerControlFlowNodes = (definitions: Record<string, NodeDefinition>) => {
  const nodes: Record<string, React.FC<NodeProps<CustomNodeData>>> = {};
  Object.entries(definitions).forEach(([type, { title, description }]) => {
    nodes[type] = createBaseNode(title, description);
  });
  return nodes;
};

const registerMathNodes = (definitions: Record<string, NodeDefinition>) => {
  const nodes: Record<string, React.FC<NodeProps<CustomNodeData>>> = {};
  Object.entries(definitions).forEach(([type, { title, description }]) => {
    nodes[type] = type.includes('sqrt') || type.includes('abs')
      ? createUnaryMathNode(title, description)
      : createBinaryMathNode(title, description);
  });
  return nodes;
};

const registerUnaryMathNodes = (definitions: Record<string, NodeDefinition>) => {
  const nodes: Record<string, React.FC<NodeProps<CustomNodeData>>> = {};
  Object.entries(definitions).forEach(([type, { title, description }]) => {
    nodes[type] = createUnaryMathNode(title, description);
  });
  return nodes;
};

// Logical node configurations
const logicalNodeConfigs = {
  [nodeTypes.and]: {
    title: 'AND',
    description: 'Performs logical AND operation - essential for complex conditions and permission checking',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'a', label: 'A', dataType: 'boolean' as DataType },
      { id: 'b', label: 'B', dataType: 'boolean' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'boolean' as DataType }
    ]
  },
  [nodeTypes.or]: {
    title: 'OR',
    description: 'Performs logical OR operation - useful for alternative conditions and fallback logic',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'a', label: 'A', dataType: 'boolean' as DataType },
      { id: 'b', label: 'B', dataType: 'boolean' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'boolean' as DataType }
    ]
  },
  [nodeTypes.not]: {
    title: 'NOT',
    description: 'Performs logical NOT operation - important for inverting conditions and toggle states',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'value', label: 'Value', dataType: 'boolean' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'boolean' as DataType }
    ]
  },
  [nodeTypes.nand]: {
    title: 'NAND',
    description: 'Performs logical NAND operation - useful for complex logic gates and state management',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'a', label: 'A', dataType: 'boolean' as DataType },
      { id: 'b', label: 'B', dataType: 'boolean' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'boolean' as DataType }
    ]
  },
  [nodeTypes.nor]: {
    title: 'NOR',
    description: 'Performs logical NOR operation - essential for exclusive condition checking',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'a', label: 'A', dataType: 'boolean' as DataType },
      { id: 'b', label: 'B', dataType: 'boolean' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'boolean' as DataType }
    ]
  },
  [nodeTypes.xor]: {
    title: 'XOR',
    description: 'Performs logical XOR operation - useful for toggle states and exclusive selections',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'a', label: 'A', dataType: 'boolean' as DataType },
      { id: 'b', label: 'B', dataType: 'boolean' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'boolean' as DataType }
    ]
  },
  [nodeTypes.xnor]: {
    title: 'XNOR',
    description: 'Performs logical XNOR operation - essential for equality comparison in logic circuits',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'a', label: 'A', dataType: 'boolean' as DataType },
      { id: 'b', label: 'B', dataType: 'boolean' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'boolean' as DataType }
    ]
  }
};

// Comparison node configurations
const comparisonNodeConfigs = {
  [nodeTypes.equals]: {
    title: 'Equals',
    description: 'Check if values are equal - fundamental for validation and conditional logic',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'a', label: 'A', dataType: 'any' as DataType },
      { id: 'b', label: 'B', dataType: 'any' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'boolean' as DataType }
    ]
  },
  [nodeTypes.notEquals]: {
    title: 'Not Equals',
    description: 'Check if values are different - useful for change detection and validation',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'a', label: 'A', dataType: 'any' as DataType },
      { id: 'b', label: 'B', dataType: 'any' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'boolean' as DataType }
    ]
  },
  [nodeTypes.greaterThan]: {
    title: 'Greater Than',
    description: 'Check if first value is greater - essential for numeric comparisons and thresholds',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'a', label: 'A', dataType: 'number' as DataType },
      { id: 'b', label: 'B', dataType: 'number' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'boolean' as DataType }
    ]
  },
  [nodeTypes.lessThan]: {
    title: 'Less Than',
    description: 'Check if first value is smaller - useful for range validation and limits',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'a', label: 'A', dataType: 'number' as DataType },
      { id: 'b', label: 'B', dataType: 'number' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'boolean' as DataType }
    ]
  },
  [nodeTypes.greaterThanOrEqual]: {
    title: 'Greater Than or Equal',
    description: 'Check if first value is greater or equal - essential for inclusive range checks',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'a', label: 'A', dataType: 'number' as DataType },
      { id: 'b', label: 'B', dataType: 'number' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'boolean' as DataType }
    ]
  },
  [nodeTypes.lessThanOrEqual]: {
    title: 'Less Than or Equal',
    description: 'Check if first value is smaller or equal - useful for inclusive limit checks',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'a', label: 'A', dataType: 'number' as DataType },
      { id: 'b', label: 'B', dataType: 'number' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'boolean' as DataType }
    ]
  },
  [nodeTypes.between]: {
    title: 'Between',
    description: 'Check if value is within range - essential for range validation and filtering',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'value', label: 'Value', dataType: 'number' as DataType },
      { id: 'min', label: 'Min', dataType: 'number' as DataType },
      { id: 'max', label: 'Max', dataType: 'number' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'boolean' as DataType }
    ]
  }
};

// Create a logical node
const createLogicalNode = (title: string, description: string, config: {
  inputs: Port[],
  outputs: Port[]
}) => memo((props: NodeProps<CustomNodeData>) => {
  const data = useMemo(() => ({
    ...props.data,
    title,
    description,
    category: 'logical' as NodeCategory,
    inputs: config.inputs,
    outputs: config.outputs
  }), [props.data]);
  return <BaseNode {...props} data={data} />;
});

// Create a comparison node
const createComparisonNode = (title: string, description: string, config: {
  inputs: Port[],
  outputs: Port[]
}) => memo((props: NodeProps<CustomNodeData>) => {
  const data = useMemo(() => ({
    ...props.data,
    title,
    description,
    category: 'comparison' as NodeCategory,
    inputs: config.inputs,
    outputs: config.outputs
  }), [props.data]);
  return <BaseNode {...props} data={data} />;
});

// Register logical nodes helper function
const registerLogicalNodes = (configs: Record<string, {
  title: string,
  description: string,
  inputs: Port[],
  outputs: Port[]
}>) => {
  const nodes: Record<string, React.FC<NodeProps<CustomNodeData>>> = {};
  Object.entries(configs).forEach(([type, config]) => {
    nodes[type] = createLogicalNode(config.title, config.description, {
      inputs: config.inputs,
      outputs: config.outputs
    });
  });
  return nodes;
};

// Register comparison nodes helper function
const registerComparisonNodes = (configs: Record<string, {
  title: string,
  description: string,
  inputs: Port[],
  outputs: Port[]
}>) => {
  const nodes: Record<string, React.FC<NodeProps<CustomNodeData>>> = {};
  Object.entries(configs).forEach(([type, config]) => {
    nodes[type] = createComparisonNode(config.title, config.description, {
      inputs: config.inputs,
      outputs: config.outputs
    });
  });
  return nodes;
};

// Create a generic array node
const createArrayNode = (title: string, description: string, config: {
  inputs: Port[],
  outputs: Port[]
}) => memo((props: NodeProps<CustomNodeData>) => {
  const data = useMemo(() => ({
    ...props.data,
    title,
    description,
    category: 'array' as NodeCategory,
    inputs: config.inputs,
    outputs: config.outputs
  }), [props.data]);
  return <BaseNode {...props} data={data} />;
});

// Array node definitions with standard configurations
const arrayNodeConfigs = {
  [nodeTypes.arrayLength]: {
    title: 'Array Length',
    description: 'Get the length of an array - useful for pagination and dynamic list rendering',
    inputs: [
      { id: 'array', label: 'Array', dataType: 'array' as DataType }
    ],
    outputs: [
      { id: 'length', label: 'Length', dataType: 'number' as DataType }
    ]
  },
  [nodeTypes.arrayGet]: {
    title: 'Array Get',
    description: 'Get element at index - essential for accessing list items and dynamic content',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'array', label: 'Array', dataType: 'array' as DataType },
      { id: 'index', label: 'Index', dataType: 'number' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'element', label: 'Element', dataType: 'any' as DataType }
    ]
  },
  [nodeTypes.arraySet]: {
    title: 'Array Set',
    description: 'Set element at index - crucial for updating list items and managing state',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'array', label: 'Array', dataType: 'array' as DataType },
      { id: 'index', label: 'Index', dataType: 'number' as DataType },
      { id: 'value', label: 'Value', dataType: 'any' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true }
    ]
  },
  [nodeTypes.arrayPush]: {
    title: 'Array Push',
    description: 'Add element to end of array - commonly used for adding items to lists and collecting form data',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'array', label: 'Array', dataType: 'array' as DataType },
      { id: 'value', label: 'Value', dataType: 'any' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'length', label: 'New Length', dataType: 'number' as DataType }
    ]
  },
  [nodeTypes.arrayPop]: {
    title: 'Array Pop',
    description: 'Remove and return last element - useful for stack operations and undo functionality',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'array', label: 'Array', dataType: 'array' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'element', label: 'Popped Element', dataType: 'any' as DataType }
    ]
  },
  [nodeTypes.arrayInsert]: {
    title: 'Array Insert',
    description: 'Insert element at specific index - useful for adding items at specific positions in lists',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'array', label: 'Array', dataType: 'array' as DataType },
      { id: 'index', label: 'Index', dataType: 'number' as DataType },
      { id: 'value', label: 'Value', dataType: 'any' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true }
    ]
  },
  [nodeTypes.arrayRemove]: {
    title: 'Array Remove',
    description: 'Remove element at index - essential for deleting items from lists',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'array', label: 'Array', dataType: 'array' as DataType },
      { id: 'index', label: 'Index', dataType: 'number' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'element', label: 'Removed Element', dataType: 'any' as DataType }
    ]
  },
  [nodeTypes.arraySlice]: {
    title: 'Array Slice',
    description: 'Extract a portion of an array - useful for pagination and creating subarrays',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'array', label: 'Array', dataType: 'array' as DataType },
      { id: 'start', label: 'Start', dataType: 'number' as DataType },
      { id: 'end', label: 'End', dataType: 'number' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'array' as DataType }
    ]
  },
  [nodeTypes.arrayConcat]: {
    title: 'Array Concat',
    description: 'Combine two arrays - essential for merging lists and combining data sets',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'array1', label: 'Array 1', dataType: 'array' as DataType },
      { id: 'array2', label: 'Array 2', dataType: 'array' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'array' as DataType }
    ]
  },
  [nodeTypes.arrayFind]: {
    title: 'Array Find',
    description: 'Find first element matching condition - useful for searching items in lists',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'array', label: 'Array', dataType: 'array' as DataType },
      { id: 'predicate', label: 'Predicate', dataType: 'function' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'any' as DataType }
    ]
  },
  [nodeTypes.arrayFilter]: {
    title: 'Array Filter',
    description: 'Filter array based on condition - essential for search functionality and data filtering',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'array', label: 'Array', dataType: 'array' as DataType },
      { id: 'predicate', label: 'Predicate', dataType: 'function' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'array' as DataType }
    ]
  },
  [nodeTypes.arrayMap]: {
    title: 'Array Map',
    description: 'Transform each element - useful for data transformation and UI rendering',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'array', label: 'Array', dataType: 'array' as DataType },
      { id: 'transform', label: 'Transform', dataType: 'function' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'array' as DataType }
    ]
  },
  [nodeTypes.arrayReduce]: {
    title: 'Array Reduce',
    description: 'Reduce array to single value - essential for calculations on lists like sum or average',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'array', label: 'Array', dataType: 'array' as DataType },
      { id: 'reducer', label: 'Reducer', dataType: 'function' as DataType },
      { id: 'initial', label: 'Initial Value', dataType: 'any' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'any' as DataType }
    ]
  },
  [nodeTypes.arraySort]: {
    title: 'Array Sort',
    description: 'Sort array elements - useful for ordering lists and data presentation',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'array', label: 'Array', dataType: 'array' as DataType },
      { id: 'comparator', label: 'Comparator', dataType: 'function' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'array' as DataType }
    ]
  },
  [nodeTypes.arrayReverse]: {
    title: 'Array Reverse',
    description: 'Reverse array order - useful for changing display order and stack operations',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'array', label: 'Array', dataType: 'array' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'array' as DataType }
    ]
  },
  [nodeTypes.arrayJoin]: {
    title: 'Array Join',
    description: 'Join array elements into string - essential for creating CSV data and text display',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'array', label: 'Array', dataType: 'array' as DataType },
      { id: 'separator', label: 'Separator', dataType: 'string' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'string' as DataType }
    ]
  },
  [nodeTypes.arrayIncludes]: {
    title: 'Array Includes',
    description: 'Check if array includes element - useful for search and validation',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'array', label: 'Array', dataType: 'array' as DataType },
      { id: 'element', label: 'Element', dataType: 'any' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'boolean' as DataType }
    ]
  },
  [nodeTypes.arrayIndexOf]: {
    title: 'Array Index Of',
    description: 'Find first index of element - useful for finding item positions in lists',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'array', label: 'Array', dataType: 'array' as DataType },
      { id: 'element', label: 'Element', dataType: 'any' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'number' as DataType }
    ]
  },
  [nodeTypes.arrayLastIndexOf]: {
    title: 'Array Last Index Of',
    description: 'Find last index of element - useful for finding last occurrence in lists',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'array', label: 'Array', dataType: 'array' as DataType },
      { id: 'element', label: 'Element', dataType: 'any' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'number' as DataType }
    ]
  },
  [nodeTypes.arrayClear]: {
    title: 'Array Clear',
    description: 'Remove all elements - useful for resetting lists and clearing selections',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'array', label: 'Array', dataType: 'array' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true }
    ]
  },
  [nodeTypes.arrayIsEmpty]: {
    title: 'Array Is Empty',
    description: 'Check if array is empty - useful for validation and conditional rendering',
    inputs: [
      { id: 'array', label: 'Array', dataType: 'array' as DataType }
    ],
    outputs: [
      { id: 'result', label: 'Is Empty', dataType: 'boolean' as DataType }
    ]
  }
};

// Register array nodes helper function
const registerArrayNodes = (configs: Record<string, {
  title: string,
  description: string,
  inputs: Port[],
  outputs: Port[]
}>) => {
  const nodes: Record<string, React.FC<NodeProps<CustomNodeData>>> = {};
  Object.entries(configs).forEach(([type, config]) => {
    nodes[type] = createArrayNode(config.title, config.description, {
      inputs: config.inputs,
      outputs: config.outputs
    });
  });
  return nodes;
};

// Node definitions
const controlFlowDefs = {
  [nodeTypes.ifStatement]: {
    title: 'Branch',
    description: 'Controls the flow of execution based on a boolean condition - commonly used for conditional rendering and business logic in web applications'
  },
  [nodeTypes.print]: {
    title: 'Print String',
    description: 'Outputs text to the browser console - useful for debugging, logging user actions, and monitoring application state'
  },
  [nodeTypes.variable]: {
    title: 'Variable',
    description: 'Stores and retrieves a value in memory - essential for managing application state, form data, and user inputs in web applications'
  },
  [nodeTypes.forLoop]: {
    title: 'For Loop',
    description: 'Iterates over a range of numbers with a specified step - useful for batch processing data, pagination, or creating animation frames in web apps'
  }
};

const mathDefs = {
  [nodeTypes.add]: {
    title: 'Add',
    description: 'Adds two numbers together - fundamental for calculations in shopping carts, analytics, and dynamic sizing'
  },
  [nodeTypes.subtract]: {
    title: 'Subtract',
    description: 'Subtracts second number from first - useful for calculating differences in dates, prices, or quantities'
  },
  [nodeTypes.multiply]: {
    title: 'Multiply',
    description: 'Multiplies two numbers - essential for scaling, calculating totals, and applying multipliers'
  },
  [nodeTypes.divide]: {
    title: 'Divide',
    description: 'Divides first number by second - used for calculating percentages, ratios, and proportional values'
  }
};

const trigDefs = {
  [nodeTypes.sin]: {
    title: 'Sine',
    description: 'Calculates sine of angle in radians - essential for creating smooth animations and wave patterns'
  },
  [nodeTypes.cos]: {
    title: 'Cosine',
    description: 'Calculates cosine of angle in radians - used for circular motion and oscillating animations'
  },
  [nodeTypes.tan]: {
    title: 'Tangent',
    description: 'Calculates tangent of angle in radians - useful for calculating slopes and angles in graphics'
  }
};

const stringNodeConfigs = {
  [nodeTypes.stringLength]: {
    title: 'String Length',
    description: 'Get length of string - useful for input validation and text limits',
    inputs: [
      { id: 'string', label: 'String', dataType: 'string' as DataType }
    ],
    outputs: [
      { id: 'length', label: 'Length', dataType: 'number' as DataType }
    ]
  },
  [nodeTypes.concat]: {
    title: 'Concatenate',
    description: 'Join two strings together - essential for combining text content and building dynamic strings',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'a', label: 'A', dataType: 'string' as DataType },
      { id: 'b', label: 'B', dataType: 'string' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'string' as DataType }
    ]
  },
  [nodeTypes.substring]: {
    title: 'Substring',
    description: 'Extract part of string - useful for text truncation and content previews',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'string', label: 'String', dataType: 'string' as DataType },
      { id: 'start', label: 'Start', dataType: 'number' as DataType },
      { id: 'end', label: 'End', dataType: 'number' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'string' as DataType }
    ]
  },
  [nodeTypes.trim]: {
    title: 'Trim',
    description: 'Remove whitespace from start and end - essential for cleaning user input',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'string', label: 'String', dataType: 'string' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'string' as DataType }
    ]
  },
  [nodeTypes.toUpperCase]: {
    title: 'To Upper Case',
    description: 'Convert string to uppercase - useful for text styling and normalization',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'string', label: 'String', dataType: 'string' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'string' as DataType }
    ]
  },
  [nodeTypes.toLowerCase]: {
    title: 'To Lower Case',
    description: 'Convert string to lowercase - essential for case-insensitive comparisons',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'string', label: 'String', dataType: 'string' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'string' as DataType }
    ]
  },
  [nodeTypes.replace]: {
    title: 'Replace',
    description: 'Replace text in string - useful for content formatting and dynamic updates',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'string', label: 'String', dataType: 'string' as DataType },
      { id: 'search', label: 'Search', dataType: 'string' as DataType },
      { id: 'replace', label: 'Replace', dataType: 'string' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'string' as DataType }
    ]
  },
  [nodeTypes.split]: {
    title: 'Split',
    description: 'Split string into array - essential for parsing CSV and structured text',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'string', label: 'String', dataType: 'string' as DataType },
      { id: 'separator', label: 'Separator', dataType: 'string' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'array' as DataType }
    ]
  },
  [nodeTypes.indexOf]: {
    title: 'Index Of',
    description: 'Find position of substring - useful for text searching and validation',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'string', label: 'String', dataType: 'string' as DataType },
      { id: 'search', label: 'Search', dataType: 'string' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'number' as DataType }
    ]
  },
  [nodeTypes.lastIndexOf]: {
    title: 'Last Index Of',
    description: 'Find last position of substring - useful for file extensions and path parsing',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'string', label: 'String', dataType: 'string' as DataType },
      { id: 'search', label: 'Search', dataType: 'string' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'number' as DataType }
    ]
  },
  [nodeTypes.startsWith]: {
    title: 'Starts With',
    description: 'Check if string starts with substring - essential for prefix validation',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'string', label: 'String', dataType: 'string' as DataType },
      { id: 'search', label: 'Search', dataType: 'string' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'boolean' as DataType }
    ]
  },
  [nodeTypes.endsWith]: {
    title: 'Ends With',
    description: 'Check if string ends with substring - useful for file type validation',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'string', label: 'String', dataType: 'string' as DataType },
      { id: 'search', label: 'Search', dataType: 'string' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'boolean' as DataType }
    ]
  },
  [nodeTypes.includes]: {
    title: 'Includes',
    description: 'Check if string contains substring - essential for search and filtering',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'string', label: 'String', dataType: 'string' as DataType },
      { id: 'search', label: 'Search', dataType: 'string' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'boolean' as DataType }
    ]
  },
  [nodeTypes.repeat]: {
    title: 'Repeat',
    description: 'Repeat string multiple times - useful for creating separators and patterns',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'string', label: 'String', dataType: 'string' as DataType },
      { id: 'count', label: 'Count', dataType: 'number' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'string' as DataType }
    ]
  },
  [nodeTypes.charAt]: {
    title: 'Char At',
    description: 'Get character at position - essential for character-by-character processing',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'string', label: 'String', dataType: 'string' as DataType },
      { id: 'index', label: 'Index', dataType: 'number' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'string' as DataType }
    ]
  },
  [nodeTypes.padStart]: {
    title: 'Pad Start',
    description: 'Add padding at start - useful for number formatting and alignment',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'string', label: 'String', dataType: 'string' as DataType },
      { id: 'length', label: 'Length', dataType: 'number' as DataType },
      { id: 'pad', label: 'Pad', dataType: 'string' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'string' as DataType }
    ]
  },
  [nodeTypes.padEnd]: {
    title: 'Pad End',
    description: 'Add padding at end - essential for text alignment and formatting',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'string', label: 'String', dataType: 'string' as DataType },
      { id: 'length', label: 'Length', dataType: 'number' as DataType },
      { id: 'pad', label: 'Pad', dataType: 'string' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'string' as DataType }
    ]
  },
  [nodeTypes.match]: {
    title: 'Match',
    description: 'Match string against pattern - useful for validation and extraction',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'string', label: 'String', dataType: 'string' as DataType },
      { id: 'pattern', label: 'Pattern', dataType: 'string' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'array' as DataType }
    ]
  },
  [nodeTypes.search]: {
    title: 'Search',
    description: 'Search string with pattern - essential for advanced text searching',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'string', label: 'String', dataType: 'string' as DataType },
      { id: 'pattern', label: 'Pattern', dataType: 'string' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'number' as DataType }
    ]
  },
  [nodeTypes.format]: {
    title: 'Format',
    description: 'Format string with values - useful for creating dynamic messages',
    inputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'template', label: 'Template', dataType: 'string' as DataType },
      { id: 'values', label: 'Values', dataType: 'array' as DataType }
    ],
    outputs: [
      { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
      { id: 'result', label: 'Result', dataType: 'string' as DataType }
    ]
  }
};

// Create a string node
const createStringNode = (title: string, description: string, config: {
  inputs: Port[],
  outputs: Port[]
}) => memo((props: NodeProps<CustomNodeData>) => {
  const data = useMemo(() => ({
    ...props.data,
    title,
    description,
    category: 'string' as NodeCategory,
    inputs: config.inputs,
    outputs: config.outputs
  }), [props.data]);
  return <BaseNode {...props} data={data} />;
});

// Register string nodes helper function
const registerStringNodes = (configs: Record<string, {
  title: string,
  description: string,
  inputs: Port[],
  outputs: Port[]
}>) => {
  const nodes: Record<string, React.FC<NodeProps<CustomNodeData>>> = {};
  Object.entries(configs).forEach(([type, config]) => {
    nodes[type] = createStringNode(config.title, config.description, {
      inputs: config.inputs,
      outputs: config.outputs
    });
  });
  return nodes;
};

export const customNodes = {
  ...registerControlFlowNodes(controlFlowDefs),
  ...registerMathNodes(mathDefs),
  ...registerUnaryMathNodes(trigDefs),
  ...registerLogicalNodes(logicalNodeConfigs),
  ...registerComparisonNodes(comparisonNodeConfigs),
  ...registerArrayNodes(arrayNodeConfigs),
  ...registerStringNodes(stringNodeConfigs),
} as const; 