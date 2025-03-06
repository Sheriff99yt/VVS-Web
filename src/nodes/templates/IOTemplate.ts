/**
 * Input/Output Node Template
 * 
 * This template provides a standardized way to create I/O nodes
 * such as print and user input.
 */

import { NodeType, NodeCategory, BaseNodeData } from '../types';
import { SocketType, WidgetType, SocketDirection, InputWidgetConfig } from '../../sockets/types';
import { registerNode, NodeRegistrationInfo, CodeGenerationHandler } from '../NodeFactory';

// ----------------- Print Node Template -----------------

export interface PrintNodeConfig {
  type: NodeType;
  label: string;
  description: string;
  defaultMessage?: string;
}

/**
 * Creates a print node registration
 * 
 * @param config - Configuration for the print node
 * @returns The node registration information
 */
export function createPrintNode(config: PrintNodeConfig): NodeRegistrationInfo {
  const { 
    type, 
    label, 
    description, 
    defaultMessage = ''
  } = config;
  
  const inputWidget: InputWidgetConfig = {
    enabled: true,
    widgetType: WidgetType.TEXT,
    label: 'Message',
    placeholder: 'Enter message to print'
  };
  
  return {
    type,
    label,
    category: NodeCategory.IO,
    description,
    inputs: [
      {
        id: 'flow_in',
        name: 'Flow In',
        type: SocketType.FLOW,
      },
      {
        id: 'message',
        name: 'Message',
        type: SocketType.STRING,
        defaultValue: defaultMessage,
        inputWidget
      }
    ],
    outputs: [
      {
        id: 'flow_out',
        name: 'Flow Out',
        type: SocketType.FLOW
      }
    ],
    properties: {
      description,
      message: defaultMessage
    },
    // Code generation handler with proper typing
    codeGenerationHandler: ((node, generator) => {
      return generator.generatePrintCode(node);
    }) as CodeGenerationHandler
  };
}

// ----------------- User Input Node Template -----------------

export interface UserInputNodeConfig {
  type: NodeType;
  label: string;
  description: string;
  defaultPrompt?: string;
  defaultVariable?: string;
  outputType?: SocketType;
}

/**
 * Creates a user input node registration
 * 
 * @param config - Configuration for the user input node
 * @returns The node registration information
 */
export function createUserInputNode(config: UserInputNodeConfig): NodeRegistrationInfo {
  const { 
    type, 
    label, 
    description, 
    defaultPrompt = 'Enter value:',
    defaultVariable = 'input',
    outputType = SocketType.STRING
  } = config;
  
  const promptWidget: InputWidgetConfig = {
    enabled: true,
    widgetType: WidgetType.TEXT,
    label: 'Prompt',
    placeholder: 'Enter prompt message'
  };
  
  return {
    type,
    label,
    category: NodeCategory.IO,
    description,
    inputs: [
      {
        id: 'flow_in',
        name: 'Flow In',
        type: SocketType.FLOW,
      },
      {
        id: 'prompt',
        name: 'Prompt',
        type: SocketType.STRING,
        defaultValue: defaultPrompt,
        inputWidget: promptWidget
      }
    ],
    outputs: [
      {
        id: 'flow_out',
        name: 'Flow Out',
        type: SocketType.FLOW
      },
      {
        id: 'value',
        name: 'Value',
        type: outputType
      }
    ],
    properties: {
      description,
      prompt: defaultPrompt,
      variable: defaultVariable,
      outputType
    },
    // Code generation handler with proper typing
    codeGenerationHandler: ((node, generator) => {
      return generator.generateUserInputCode(node);
    }) as CodeGenerationHandler
  };
}

/**
 * Registers a standard print node
 * 
 * @param config - Configuration for the print node
 * @returns The registered node type
 */
export function registerPrintNode(config: PrintNodeConfig): NodeType {
  const nodeInfo = createPrintNode(config);
  return registerNode(nodeInfo);
}

/**
 * Registers a standard user input node
 * 
 * @param config - Configuration for the user input node
 * @returns The registered node type
 */
export function registerUserInputNode(config: UserInputNodeConfig): NodeType {
  const nodeInfo = createUserInputNode(config);
  return registerNode(nodeInfo);
} 