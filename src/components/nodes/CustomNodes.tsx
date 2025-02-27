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
  
  // Basic Math
  add: 'add',
  subtract: 'subtract',
  multiply: 'multiply',
  divide: 'divide',
  power: 'power',
  sqrt: 'sqrt',
  abs: 'abs',
  modulo: 'modulo',
  
  // Comparison Operators
  equal: 'equal',
  notEqual: 'notEqual',
  greaterThan: 'greaterThan',
  lessThan: 'lessThan',
  greaterEqual: 'greaterEqual',
  lessEqual: 'lessEqual',
  
  // Logical Operators
  and: 'and',
  or: 'or',
  not: 'not',
  logicalXor: 'logicalXor',
  
  // Bitwise Operators
  bitwiseAnd: 'bitwiseAnd',
  bitwiseOr: 'bitwiseOr',
  bitwiseXor: 'bitwiseXor',
  leftShift: 'leftShift',
  rightShift: 'rightShift',
  
  // Trigonometry
  sin: 'sin',
  cos: 'cos',
  tan: 'tan',
  asin: 'asin',
  acos: 'acos',
  atan: 'atan',
  
  // Logarithmic & Exponential
  ln: 'ln',
  log10: 'log10',
  exp: 'exp',
  
  // Rounding
  floor: 'floor',
  ceil: 'ceil',
  round: 'round',
  
  // Function
  function: 'function',

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
} as const;

export type DataType = 'any' | 'number' | 'string' | 'boolean' | 'array';

export interface Port {
  id: string;
  label: string;
  dataType: DataType;
}

// Base node data interface
export interface CustomNodeData {
  title: string;
  inputs?: Port[];
  outputs?: Port[];
  // Additional properties for specific node types
  variableType?: DataType;
  operation?: string;
  initialValue?: string;
}

const BaseNode: React.FC<NodeProps<CustomNodeData>> = ({ data, selected }) => {
  const { title, inputs = [], outputs = [] } = data;

  return (
    <div className={`custom-node ${selected ? 'selected' : ''}`}>
      <div className="node-header">{title}</div>
      <div className="node-content">
        <div className="node-inputs">
          {inputs.map((input, index) => (
            <div key={input.id} className="node-port">
              <Handle
                type="target"
                position={Position.Left}
                id={input.id}
                style={{ top: `${(index + 1) * (100 / (inputs.length + 1))}%` }}
                className={`node-handle node-handle-${input.dataType}`}
                data-type={input.dataType}
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
                style={{ top: `${(index + 1) * (100 / (outputs.length + 1))}%` }}
                className={`node-handle node-handle-${output.dataType}`}
                data-type={output.dataType}
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
} as const; 