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
const createUnaryMathNode = (title: string) => 
  memo((props: NodeProps<CustomNodeData>) => <BaseNode {...props} />);

// Create a generic math node for operations with two inputs
const createBinaryMathNode = (title: string) => 
  memo((props: NodeProps<CustomNodeData>) => <BaseNode {...props} />);

// Basic nodes
export const IfStatementNode = memo((props: NodeProps<CustomNodeData>) => <BaseNode {...props} />);
export const PrintNode = memo((props: NodeProps<CustomNodeData>) => <BaseNode {...props} />);
export const VariableNode = memo((props: NodeProps<CustomNodeData>) => <BaseNode {...props} />);
export const ForLoopNode = memo((props: NodeProps<CustomNodeData>) => <BaseNode {...props} />);

// Math nodes
export const AddNode = createBinaryMathNode('Add');
export const SubtractNode = createBinaryMathNode('Subtract');
export const MultiplyNode = createBinaryMathNode('Multiply');
export const DivideNode = createBinaryMathNode('Divide');
export const PowerNode = createBinaryMathNode('Power');
export const SqrtNode = createUnaryMathNode('Square Root');
export const AbsNode = createUnaryMathNode('Absolute');
export const ModuloNode = createBinaryMathNode('Modulo');

// Trigonometry nodes
export const SinNode = createUnaryMathNode('Sine');
export const CosNode = createUnaryMathNode('Cosine');
export const TanNode = createUnaryMathNode('Tangent');
export const AsinNode = createUnaryMathNode('Arcsine');
export const AcosNode = createUnaryMathNode('Arccosine');
export const AtanNode = createUnaryMathNode('Arctangent');

// Logarithmic nodes
export const LnNode = createUnaryMathNode('Natural Log');
export const Log10Node = createUnaryMathNode('Log Base 10');
export const ExpNode = createUnaryMathNode('Exponential');

// Rounding nodes
export const FloorNode = createUnaryMathNode('Floor');
export const CeilNode = createUnaryMathNode('Ceiling');
export const RoundNode = createUnaryMathNode('Round');

// Helper function to create base nodes
const createBaseNode = (title: string) => memo((props: NodeProps<CustomNodeData>) => (
  <BaseNode {...props} data={{ ...props.data, title }} />
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

// Map of node types to components
export const customNodes = {
  [nodeTypes.ifStatement]: IfStatementNode,
  [nodeTypes.print]: PrintNode,
  [nodeTypes.variable]: VariableNode,
  [nodeTypes.forLoop]: ForLoopNode,
  
  // Math nodes
  [nodeTypes.add]: AddNode,
  [nodeTypes.subtract]: SubtractNode,
  [nodeTypes.multiply]: MultiplyNode,
  [nodeTypes.divide]: DivideNode,
  [nodeTypes.power]: PowerNode,
  [nodeTypes.sqrt]: SqrtNode,
  [nodeTypes.abs]: AbsNode,
  [nodeTypes.modulo]: ModuloNode,
  
  // Trigonometry nodes
  [nodeTypes.sin]: SinNode,
  [nodeTypes.cos]: CosNode,
  [nodeTypes.tan]: TanNode,
  [nodeTypes.asin]: AsinNode,
  [nodeTypes.acos]: AcosNode,
  [nodeTypes.atan]: AtanNode,
  
  // Logarithmic nodes
  [nodeTypes.ln]: LnNode,
  [nodeTypes.log10]: Log10Node,
  [nodeTypes.exp]: ExpNode,
  
  // Rounding nodes
  [nodeTypes.floor]: FloorNode,
  [nodeTypes.ceil]: CeilNode,
  [nodeTypes.round]: RoundNode,

  // String operation nodes
  [nodeTypes.stringLength]: createStringToNumberNode('String Length', 'Get the length of a string'),
  [nodeTypes.concat]: createBinaryStringNode('Concatenate', 'Join two strings together'),
  [nodeTypes.substring]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Substring',
      description: 'Extract a portion of a string',
      category: 'string' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'string', label: 'String', dataType: 'string' as DataType },
        { id: 'start', label: 'Start', dataType: 'number' as DataType },
        { id: 'length', label: 'Length', dataType: 'number' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'result', label: 'Result', dataType: 'string' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.trim]: createUnaryStringNode('Trim', 'Remove whitespace from both ends of a string'),
  [nodeTypes.toUpperCase]: createUnaryStringNode('To Uppercase', 'Convert string to uppercase'),
  [nodeTypes.toLowerCase]: createUnaryStringNode('To Lowercase', 'Convert string to lowercase'),
  [nodeTypes.replace]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Replace',
      description: 'Replace all occurrences of a substring',
      category: 'string' as NodeCategory,
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
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.split]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Split',
      description: 'Split string into array by delimiter',
      category: 'string' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'string', label: 'String', dataType: 'string' as DataType },
        { id: 'delimiter', label: 'Delimiter', dataType: 'string' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'result', label: 'Result', dataType: 'array' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.indexOf]: createBinaryStringNode('Index Of', 'Find the first occurrence of a substring'),
  [nodeTypes.lastIndexOf]: createBinaryStringNode('Last Index Of', 'Find the last occurrence of a substring'),
  [nodeTypes.startsWith]: createStringToBooleanNode('Starts With', 'Check if string starts with substring'),
  [nodeTypes.endsWith]: createStringToBooleanNode('Ends With', 'Check if string ends with substring'),
  [nodeTypes.includes]: createStringToBooleanNode('Includes', 'Check if string contains substring'),
  [nodeTypes.repeat]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Repeat',
      description: 'Repeat a string multiple times',
      category: 'string' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'string', label: 'String', dataType: 'string' as DataType },
        { id: 'count', label: 'Count', dataType: 'number' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'result', label: 'Result', dataType: 'string' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.charAt]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Char At',
      description: 'Get character at specified index',
      category: 'string' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'string', label: 'String', dataType: 'string' as DataType },
        { id: 'index', label: 'Index', dataType: 'number' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'result', label: 'Result', dataType: 'string' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.padStart]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Pad Start',
      description: 'Pad string from start to target length',
      category: 'string' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'string', label: 'String', dataType: 'string' as DataType },
        { id: 'length', label: 'Target Length', dataType: 'number' as DataType },
        { id: 'pad', label: 'Pad String', dataType: 'string' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'result', label: 'Result', dataType: 'string' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.padEnd]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Pad End',
      description: 'Pad string from end to target length',
      category: 'string' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'string', label: 'String', dataType: 'string' as DataType },
        { id: 'length', label: 'Target Length', dataType: 'number' as DataType },
        { id: 'pad', label: 'Pad String', dataType: 'string' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'result', label: 'Result', dataType: 'string' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.match]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Regex Match',
      description: 'Match string against regular expression',
      category: 'string' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'string', label: 'String', dataType: 'string' as DataType },
        { id: 'pattern', label: 'Pattern', dataType: 'string' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'matches', label: 'Matches', dataType: 'array' as DataType },
        { id: 'success', label: 'Success', dataType: 'boolean' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.search]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Regex Search',
      description: 'Search string using regular expression',
      category: 'string' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'string', label: 'String', dataType: 'string' as DataType },
        { id: 'pattern', label: 'Pattern', dataType: 'string' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'index', label: 'Index', dataType: 'number' as DataType },
        { id: 'found', label: 'Found', dataType: 'boolean' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.format]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Format',
      description: 'Format string with placeholders',
      category: 'string' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'template', label: 'Template', dataType: 'string' as DataType },
        { id: 'values', label: 'Values', dataType: 'array' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'result', label: 'Result', dataType: 'string' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),

  // Array operation nodes
  [nodeTypes.arrayLength]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Array Length',
      description: 'Get the length of an array',
      category: 'array' as NodeCategory,
      inputs: [
        { id: 'array', label: 'Array', dataType: 'array' as DataType }
      ],
      outputs: [
        { id: 'length', label: 'Length', dataType: 'number' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.arrayGet]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Array Get',
      description: 'Get element at index',
      category: 'array' as NodeCategory,
      inputs: [
        { id: 'array', label: 'Array', dataType: 'array' as DataType },
        { id: 'index', label: 'Index', dataType: 'number' as DataType }
      ],
      outputs: [
        { id: 'element', label: 'Element', dataType: 'any' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.arraySet]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Array Set',
      description: 'Set element at index',
      category: 'array' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'array', label: 'Array', dataType: 'array' as DataType },
        { id: 'index', label: 'Index', dataType: 'number' as DataType },
        { id: 'value', label: 'Value', dataType: 'any' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.arrayPush]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Array Push',
      description: 'Add element to end of array',
      category: 'array' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'array', label: 'Array', dataType: 'array' as DataType },
        { id: 'value', label: 'Value', dataType: 'any' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'length', label: 'New Length', dataType: 'number' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.arrayPop]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Array Pop',
      description: 'Remove and return last element',
      category: 'array' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'array', label: 'Array', dataType: 'array' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'element', label: 'Popped Element', dataType: 'any' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.arrayInsert]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Array Insert',
      description: 'Insert element at index',
      category: 'array' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'array', label: 'Array', dataType: 'array' as DataType },
        { id: 'index', label: 'Index', dataType: 'number' as DataType },
        { id: 'value', label: 'Value', dataType: 'any' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'length', label: 'New Length', dataType: 'number' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.arrayRemove]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Array Remove',
      description: 'Remove element at index',
      category: 'array' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'array', label: 'Array', dataType: 'array' as DataType },
        { id: 'index', label: 'Index', dataType: 'number' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'element', label: 'Removed Element', dataType: 'any' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.arraySlice]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Array Slice',
      description: 'Get a portion of the array',
      category: 'array' as NodeCategory,
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
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.arrayConcat]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Array Concat',
      description: 'Combine two arrays',
      category: 'array' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'array1', label: 'Array 1', dataType: 'array' as DataType },
        { id: 'array2', label: 'Array 2', dataType: 'array' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'result', label: 'Result', dataType: 'array' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.arrayFind]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Array Find',
      description: 'Find first element matching predicate',
      category: 'array' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'array', label: 'Array', dataType: 'array' as DataType },
        { id: 'predicate', label: 'Predicate', dataType: 'function' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'result', label: 'Result', dataType: 'any' as DataType },
        { id: 'found', label: 'Found', dataType: 'boolean' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.arrayFilter]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Array Filter',
      description: 'Filter array by predicate',
      category: 'array' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'array', label: 'Array', dataType: 'array' as DataType },
        { id: 'predicate', label: 'Predicate', dataType: 'function' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'result', label: 'Result', dataType: 'array' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.arrayMap]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Array Map',
      description: 'Transform array elements',
      category: 'array' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'array', label: 'Array', dataType: 'array' as DataType },
        { id: 'transform', label: 'Transform', dataType: 'function' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'result', label: 'Result', dataType: 'array' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.arrayReduce]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Array Reduce',
      description: 'Reduce array to single value',
      category: 'array' as NodeCategory,
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
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.arraySort]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Array Sort',
      description: 'Sort array with optional comparator',
      category: 'array' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'array', label: 'Array', dataType: 'array' as DataType },
        { id: 'comparator', label: 'Comparator', dataType: 'function' as DataType, isOptional: true }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'result', label: 'Result', dataType: 'array' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.arrayReverse]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Array Reverse',
      description: 'Reverse array order',
      category: 'array' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'array', label: 'Array', dataType: 'array' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'result', label: 'Result', dataType: 'array' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.arrayJoin]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Array Join',
      description: 'Join array elements with separator',
      category: 'array' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'array', label: 'Array', dataType: 'array' as DataType },
        { id: 'separator', label: 'Separator', dataType: 'string' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'result', label: 'Result', dataType: 'string' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.arrayIncludes]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Array Includes',
      description: 'Check if array contains value',
      category: 'array' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'array', label: 'Array', dataType: 'array' as DataType },
        { id: 'value', label: 'Value', dataType: 'any' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'result', label: 'Result', dataType: 'boolean' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.arrayIndexOf]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Array Index Of',
      description: 'Find first index of value',
      category: 'array' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'array', label: 'Array', dataType: 'array' as DataType },
        { id: 'value', label: 'Value', dataType: 'any' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'index', label: 'Index', dataType: 'number' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.arrayLastIndexOf]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Array Last Index Of',
      description: 'Find last index of value',
      category: 'array' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'array', label: 'Array', dataType: 'array' as DataType },
        { id: 'value', label: 'Value', dataType: 'any' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'index', label: 'Index', dataType: 'number' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.arrayClear]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Array Clear',
      description: 'Remove all elements',
      category: 'array' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'array', label: 'Array', dataType: 'array' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),
  [nodeTypes.arrayIsEmpty]: memo((props: NodeProps<CustomNodeData>) => {
    const data = useMemo(() => ({
      ...props.data,
      title: 'Array Is Empty',
      description: 'Check if array has no elements',
      category: 'array' as NodeCategory,
      inputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'array', label: 'Array', dataType: 'array' as DataType }
      ],
      outputs: [
        { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
        { id: 'result', label: 'Is Empty', dataType: 'boolean' as DataType }
      ]
    }), [props.data]);
    return <BaseNode {...props} data={data} />;
  }),

  // Logical operation nodes
  [nodeTypes.and]: createBaseNode('AND'),
  [nodeTypes.or]: createBaseNode('OR'),
  [nodeTypes.not]: createBaseNode('NOT'),
  [nodeTypes.nand]: createBaseNode('NAND'),
  [nodeTypes.nor]: createBaseNode('NOR'),
  [nodeTypes.xor]: createBaseNode('XOR'),
  [nodeTypes.xnor]: createBaseNode('XNOR'),

  // Comparison operation nodes
  [nodeTypes.equals]: createBaseNode('Equals'),
  [nodeTypes.notEquals]: createBaseNode('Not Equals'),
  [nodeTypes.greaterThan]: createBaseNode('Greater Than'),
  [nodeTypes.lessThan]: createBaseNode('Less Than'),
  [nodeTypes.greaterThanOrEqual]: createBaseNode('Greater Than or Equal'),
  [nodeTypes.lessThanOrEqual]: createBaseNode('Less Than or Equal'),
  [nodeTypes.between]: createBaseNode('Between')
} as const; 