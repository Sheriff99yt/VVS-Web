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
  
  // String Manipulation
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
  compare: 'compare',
  padStart: 'padStart',
  padEnd: 'padEnd',
  match: 'match',
  search: 'search',
  format: 'format',

  // Function
  function: 'function',

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
  | 'functions'      // Function definitions
  | 'io';            // Input/Output operations

export interface Port {
  id: string;
  label: string;
  dataType: DataType;
  isExec?: boolean;    // Is this an execution pin
  isInput?: boolean;   // Is this an input pin
  isOutput?: boolean;  // Is this an output pin
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
    category = 'functions',
    isPure,
    isEvent,
    description 
  } = data;

  const nodeClass = `custom-node node ${category} ${isPure ? 'pure' : ''} ${isEvent ? 'event' : ''} ${selected ? 'selected' : ''}`;

  return (
    <div className={nodeClass} title={description}>
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
export const FunctionNode = memo((props: NodeProps<CustomNodeData>) => <BaseNode {...props} />);

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

// Map of node types to components - defined at module level
export const customNodes = {
  [nodeTypes.ifStatement]: IfStatementNode,
  [nodeTypes.print]: PrintNode,
  [nodeTypes.variable]: VariableNode,
  [nodeTypes.forLoop]: ForLoopNode,
  [nodeTypes.function]: FunctionNode,
  
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
  [nodeTypes.stringLength]: createBaseNode('String Length'),
  [nodeTypes.concat]: createBaseNode('Concatenate'),
  [nodeTypes.substring]: createBaseNode('Substring'),
  [nodeTypes.trim]: createBaseNode('Trim'),
  [nodeTypes.toUpperCase]: createBaseNode('To Uppercase'),
  [nodeTypes.toLowerCase]: createBaseNode('To Lowercase'),
  [nodeTypes.replace]: createBaseNode('Replace'),
  [nodeTypes.split]: createBaseNode('Split'),
  [nodeTypes.indexOf]: createBaseNode('Index Of'),
  [nodeTypes.lastIndexOf]: createBaseNode('Last Index Of'),
  [nodeTypes.startsWith]: createBaseNode('Starts With'),
  [nodeTypes.endsWith]: createBaseNode('Ends With'),
  [nodeTypes.includes]: createBaseNode('Includes'),
  [nodeTypes.repeat]: createBaseNode('Repeat'),
  [nodeTypes.charAt]: createBaseNode('Char At'),
  [nodeTypes.compare]: createBaseNode('Compare'),
  [nodeTypes.padStart]: createBaseNode('Pad Start'),
  [nodeTypes.padEnd]: createBaseNode('Pad End'),
  [nodeTypes.match]: createBaseNode('Regex Match'),
  [nodeTypes.search]: createBaseNode('Regex Search'),
  [nodeTypes.format]: createBaseNode('Format'),

  // Array operation nodes
  [nodeTypes.arrayLength]: createBaseNode('Array Length'),
  [nodeTypes.arrayGet]: createBaseNode('Array Get'),
  [nodeTypes.arraySet]: createBaseNode('Array Set'),
  [nodeTypes.arrayPush]: createBaseNode('Array Push'),
  [nodeTypes.arrayPop]: createBaseNode('Array Pop'),
  [nodeTypes.arrayInsert]: createBaseNode('Array Insert'),
  [nodeTypes.arrayRemove]: createBaseNode('Array Remove'),
  [nodeTypes.arraySlice]: createBaseNode('Array Slice'),
  [nodeTypes.arrayConcat]: createBaseNode('Array Concat'),
  [nodeTypes.arrayFind]: createBaseNode('Array Find'),
  [nodeTypes.arrayFilter]: createBaseNode('Array Filter'),
  [nodeTypes.arrayMap]: createBaseNode('Array Map'),
  [nodeTypes.arrayReduce]: createBaseNode('Array Reduce'),
  [nodeTypes.arraySort]: createBaseNode('Array Sort'),
  [nodeTypes.arrayReverse]: createBaseNode('Array Reverse'),
  [nodeTypes.arrayJoin]: createBaseNode('Array Join'),
  [nodeTypes.arrayIncludes]: createBaseNode('Array Includes'),
  [nodeTypes.arrayIndexOf]: createBaseNode('Array Index Of'),
  [nodeTypes.arrayLastIndexOf]: createBaseNode('Array Last Index Of'),
  [nodeTypes.arrayClear]: createBaseNode('Array Clear'),
  [nodeTypes.arrayIsEmpty]: createBaseNode('Array Is Empty')
} as const; 