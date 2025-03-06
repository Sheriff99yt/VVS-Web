/**
 * Control Flow Node Template
 * 
 * This template provides a standardized way to create control flow nodes
 * such as if statements and for loops.
 */

import { NodeType, NodeCategory, BaseNodeData } from '../types';
import { SocketType, WidgetType, SocketDirection, InputWidgetConfig } from '../../sockets/types';
import { registerNode, NodeRegistrationInfo, CodeGenerationHandler } from '../NodeFactory';

// ----------------- If Statement Node Template -----------------

export interface IfStatementNodeConfig {
  type: NodeType;
  label: string;
  description: string;
  defaultCondition?: boolean;
}

/**
 * Creates an if statement node registration
 * 
 * @param config - Configuration for the if statement node
 * @returns The node registration information
 */
export function createIfStatementNode(config: IfStatementNodeConfig): NodeRegistrationInfo {
  const { 
    type, 
    label, 
    description, 
    defaultCondition = false
  } = config;
  
  const conditionWidget: InputWidgetConfig = {
    enabled: true,
    widgetType: WidgetType.CHECKBOX,
    label: 'Condition'
  };
  
  return {
    type,
    label,
    category: NodeCategory.PROCESS_FLOW,
    description,
    inputs: [
      {
        id: 'flow_in',
        name: 'Flow In',
        type: SocketType.FLOW
      },
      {
        id: 'condition',
        name: 'Condition',
        type: SocketType.BOOLEAN,
        defaultValue: defaultCondition,
        inputWidget: conditionWidget
      }
    ],
    outputs: [
      {
        id: 'true_branch',
        name: 'True',
        type: SocketType.FLOW
      },
      {
        id: 'false_branch',
        name: 'False',
        type: SocketType.FLOW
      }
    ],
    properties: {
      description,
      condition: defaultCondition
    },
    // Code generation handler with proper typing
    codeGenerationHandler: ((node, generator) => {
      return generator.generateIfStatementCode(node);
    }) as CodeGenerationHandler
  };
}

// ----------------- For Loop Node Template -----------------

export interface ForLoopNodeConfig {
  type: NodeType;
  label: string;
  description: string;
  defaultStart?: number;
  defaultEnd?: number;
  defaultStep?: number;
  defaultLoopVariable?: string;
}

/**
 * Creates a for loop node registration
 * 
 * @param config - Configuration for the for loop node
 * @returns The node registration information
 */
export function createForLoopNode(config: ForLoopNodeConfig): NodeRegistrationInfo {
  const { 
    type, 
    label, 
    description, 
    defaultStart = 0,
    defaultEnd = 10,
    defaultStep = 1,
    defaultLoopVariable = 'i'
  } = config;
  
  const startWidget: InputWidgetConfig = {
    enabled: true,
    widgetType: WidgetType.NUMBER,
    label: 'Start',
    isInteger: true
  };
  
  const endWidget: InputWidgetConfig = {
    enabled: true,
    widgetType: WidgetType.NUMBER,
    label: 'End',
    isInteger: true
  };
  
  const stepWidget: InputWidgetConfig = {
    enabled: true,
    widgetType: WidgetType.NUMBER,
    label: 'Step',
    isInteger: true
  };
  
  const variableWidget: InputWidgetConfig = {
    enabled: true,
    widgetType: WidgetType.TEXT,
    label: 'Loop Variable',
    placeholder: 'Enter variable name'
  };
  
  return {
    type,
    label,
    category: NodeCategory.PROCESS_FLOW,
    description,
    inputs: [
      {
        id: 'flow_in',
        name: 'Flow In',
        type: SocketType.FLOW
      },
      {
        id: 'start',
        name: 'Start',
        type: SocketType.NUMBER,
        defaultValue: defaultStart,
        inputWidget: startWidget
      },
      {
        id: 'end',
        name: 'End',
        type: SocketType.NUMBER,
        defaultValue: defaultEnd,
        inputWidget: endWidget
      },
      {
        id: 'step',
        name: 'Step',
        type: SocketType.NUMBER,
        defaultValue: defaultStep,
        inputWidget: stepWidget
      },
      {
        id: 'loop_variable',
        name: 'Variable',
        type: SocketType.STRING,
        defaultValue: defaultLoopVariable,
        inputWidget: variableWidget
      }
    ],
    outputs: [
      {
        id: 'loop_body',
        name: 'Loop Body',
        type: SocketType.FLOW
      },
      {
        id: 'flow_out',
        name: 'Flow Out',
        type: SocketType.FLOW
      },
      {
        id: 'current_index',
        name: 'Current Index',
        type: SocketType.NUMBER
      }
    ],
    properties: {
      description,
      start: defaultStart,
      end: defaultEnd,
      step: defaultStep,
      loop_variable: defaultLoopVariable
    },
    // Code generation handler with proper typing
    codeGenerationHandler: ((node, generator) => {
      return generator.generateForLoopCode(node);
    }) as CodeGenerationHandler
  };
}

/**
 * Registers a standard if statement node
 * 
 * @param config - Configuration for the if statement node
 * @returns The registered node type
 */
export function registerIfStatementNode(config: IfStatementNodeConfig): NodeType {
  const nodeInfo = createIfStatementNode(config);
  return registerNode(nodeInfo);
}

/**
 * Registers a standard for loop node
 * 
 * @param config - Configuration for the for loop node
 * @returns The registered node type
 */
export function registerForLoopNode(config: ForLoopNodeConfig): NodeType {
  const nodeInfo = createForLoopNode(config);
  return registerNode(nodeInfo);
} 