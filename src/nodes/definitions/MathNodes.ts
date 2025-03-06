/**
 * Math Operation Nodes Definitions
 * 
 * This file contains the definitions for all math operation nodes in the system.
 */

import { NodeType } from '../types';
import { 
  createMathOperationNode, 
  registerMathOperationNode,
  MathOperationNodeConfig 
} from '../templates/MathOperationTemplate';

// Addition Node
export const AddNodeConfig: MathOperationNodeConfig = {
  type: NodeType.ADD,
  label: 'Add',
  description: 'Adds two numbers together',
  operator: '+',
  defaultA: 0,
  defaultB: 0
};

// Subtraction Node
export const SubtractNodeConfig: MathOperationNodeConfig = {
  type: NodeType.SUBTRACT,
  label: 'Subtract',
  description: 'Subtracts the second number from the first',
  operator: '-',
  defaultA: 0,
  defaultB: 0
};

// Multiplication Node
export const MultiplyNodeConfig: MathOperationNodeConfig = {
  type: NodeType.MULTIPLY,
  label: 'Multiply',
  description: 'Multiplies two numbers together',
  operator: '*',
  defaultA: 0,
  defaultB: 0
};

// Division Node
export const DivideNodeConfig: MathOperationNodeConfig = {
  type: NodeType.DIVIDE,
  label: 'Divide',
  description: 'Divides the first number by the second',
  operator: '/',
  defaultA: 0,
  defaultB: 1, // Default to 1 to avoid division by zero
  minValue: -1000000,
  maxValue: 1000000
};

// Create nodes from configurations
export const AddNode = createMathOperationNode(AddNodeConfig);
export const SubtractNode = createMathOperationNode(SubtractNodeConfig);
export const MultiplyNode = createMathOperationNode(MultiplyNodeConfig);
export const DivideNode = createMathOperationNode(DivideNodeConfig);

// Array of all math operation nodes
export const mathNodes = [
  AddNode,
  SubtractNode,
  MultiplyNode,
  DivideNode
];

/**
 * Register all math operation nodes
 */
export function registerMathNodes(): void {
  registerMathOperationNode(AddNodeConfig);
  registerMathOperationNode(SubtractNodeConfig);
  registerMathOperationNode(MultiplyNodeConfig);
  registerMathOperationNode(DivideNodeConfig);
  console.log('Registered Math Operation nodes');
} 