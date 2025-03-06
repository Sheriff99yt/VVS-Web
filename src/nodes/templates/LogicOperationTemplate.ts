/**
 * Logic Operation Node Template
 * 
 * This template provides a standardized way to create logic operation nodes
 * like AND, OR, NOT, Greater Than, Less Than, and Equal.
 */

import { NodeType, NodeCategory, BaseNodeData } from '../types';
import { SocketType, WidgetType } from '../../sockets/types';
import { registerNode, NodeRegistrationInfo, CodeGenerationHandler } from '../NodeFactory';

export interface LogicOperationNodeConfig {
  type: NodeType;
  label: string;
  description: string;
  operator: string;           // The logic operator symbol (e.g., &&, ||, !, >, <, ==)
  isBinary: boolean;          // Whether this is a binary operation (two inputs) or unary (one input)
  defaultA?: boolean;         // Default value for first input, defaults to false
  defaultB?: boolean;         // Default value for second input, defaults to false
}

/**
 * Creates a logic operation node registration
 * 
 * @param config - Configuration for the logic operation node
 * @returns The node registration information
 */
export function createLogicOperationNode(config: LogicOperationNodeConfig): NodeRegistrationInfo {
  const { type, label, description, operator, isBinary, defaultA = false, defaultB = false } = config;
  
  // Create inputs array based on whether this is a binary or unary operation
  const inputs = isBinary 
    ? [
        {
          id: 'a',
          name: 'A',
          type: SocketType.BOOLEAN,
          defaultValue: defaultA,
          inputWidget: {
            enabled: true,
            widgetType: WidgetType.CHECKBOX,
            label: 'A'
          }
        },
        {
          id: 'b',
          name: 'B',
          type: SocketType.BOOLEAN,
          defaultValue: defaultB,
          inputWidget: {
            enabled: true,
            widgetType: WidgetType.CHECKBOX,
            label: 'B'
          }
        }
      ]
    : [
        {
          id: 'input',
          name: 'Input',
          type: SocketType.BOOLEAN,
          defaultValue: defaultA,
          inputWidget: {
            enabled: true,
            widgetType: WidgetType.CHECKBOX,
            label: 'Input'
          }
        }
      ];
  
  // Create properties object
  const properties: Record<string, any> = {
    description,
    operator
  };
  
  // Set default values in properties
  if (isBinary) {
    properties.a = defaultA;
    properties.b = defaultB;
  } else {
    properties.input = defaultA;
  }
  
  return {
    type,
    label,
    category: NodeCategory.LOGIC,
    description,
    inputs,
    outputs: [
      {
        id: 'result',
        name: 'Result',
        type: SocketType.BOOLEAN
      }
    ],
    properties,
    // Code generation handler with proper typing
    codeGenerationHandler: ((node, generator) => {
      if (isBinary) {
        return generator.processLogicOperation(node, operator);
      } else {
        return generator.processUnaryLogicOperation(node, operator);
      }
    }) as CodeGenerationHandler
  };
}

/**
 * Registers a standard logic operation node
 * 
 * @param config - Configuration for the logic operation node
 * @returns The registered node type
 */
export function registerLogicOperationNode(config: LogicOperationNodeConfig): NodeType {
  const nodeInfo = createLogicOperationNode(config);
  return registerNode(nodeInfo);
} 