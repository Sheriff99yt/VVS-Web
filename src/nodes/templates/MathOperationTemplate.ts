/**
 * Math Operation Node Template
 * 
 * This template provides a standardized way to create math operation nodes
 * like addition, subtraction, multiplication, and division.
 */

import { NodeType, NodeCategory, BaseNodeData } from '../types';
import { SocketType, WidgetType } from '../../sockets/types';
import { registerNode, NodeRegistrationInfo, CodeGenerationHandler } from '../NodeFactory';

export interface MathOperationNodeConfig {
  type: NodeType;
  label: string;
  description: string;
  operator: string;         // The math operator symbol (e.g., +, -, *, /)
  defaultA?: number;        // Default value for first input, defaults to 0
  defaultB?: number;        // Default value for second input, defaults to 0
  minValue?: number;        // Minimum value constraint, defaults to -Infinity
  maxValue?: number;        // Maximum value constraint, defaults to Infinity
  isInteger?: boolean;      // Whether the inputs should be integers, defaults to false
  precision?: number;       // Number of decimal places, defaults to 2
}

/**
 * Creates a math operation node registration
 * 
 * @param config - Configuration for the math operation node
 * @returns The node registration information
 */
export function createMathOperationNode(config: MathOperationNodeConfig): NodeRegistrationInfo {
  const { 
    type, 
    label, 
    description, 
    operator,
    defaultA = 0,
    defaultB = 0,
    minValue = -Infinity,
    maxValue = Infinity,
    isInteger = false,
    precision = 2
  } = config;
  
  return {
    type,
    label,
    category: NodeCategory.MATH,
    description,
    inputs: [
      {
        id: 'a',
        name: 'A',
        type: SocketType.NUMBER,
        defaultValue: defaultA,
        inputWidget: {
          enabled: true,
          widgetType: WidgetType.NUMBER,
          min: minValue,
          max: maxValue,
          isInteger,
          precision
        }
      },
      {
        id: 'b',
        name: 'B',
        type: SocketType.NUMBER,
        defaultValue: defaultB,
        inputWidget: {
          enabled: true,
          widgetType: WidgetType.NUMBER,
          min: minValue,
          max: maxValue,
          isInteger,
          precision
        }
      }
    ],
    outputs: [
      {
        id: 'result',
        name: 'Result',
        type: SocketType.NUMBER
      }
    ],
    properties: {
      description,
      a: defaultA,
      b: defaultB,
      operator
    },
    // Code generation handler with proper typing
    codeGenerationHandler: ((node, generator) => {
      return generator.processMathOperation(node, operator);
    }) as CodeGenerationHandler
  };
}

/**
 * Registers a standard math operation node
 * 
 * @param config - Configuration for the math operation node
 * @returns The registered node type
 */
export function registerMathOperationNode(config: MathOperationNodeConfig): NodeType {
  const nodeInfo = createMathOperationNode(config);
  return registerNode(nodeInfo);
} 