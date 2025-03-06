/**
 * Variable Node Template
 * 
 * This template provides a standardized way to create variable-related nodes
 * such as variable definitions and variable getters.
 */

import { NodeType, NodeCategory, BaseNodeData } from '../types';
import { SocketType, WidgetType, SocketDirection, InputWidgetConfig } from '../../sockets/types';
import { registerNode, NodeRegistrationInfo, CodeGenerationHandler } from '../NodeFactory';

// ----------------- Variable Definition Node Template -----------------

export interface VariableDefinitionNodeConfig {
  type: NodeType;
  label: string;
  description: string;
  defaultName?: string;
  defaultValueType?: SocketType;
  defaultValue?: any;
}

/**
 * Creates a variable definition node registration
 * 
 * @param config - Configuration for the variable definition node
 * @returns The node registration information
 */
export function createVariableDefinitionNode(config: VariableDefinitionNodeConfig): NodeRegistrationInfo {
  const { 
    type, 
    label, 
    description, 
    defaultName = 'myVar',
    defaultValueType = SocketType.STRING,
    defaultValue = defaultValueType === SocketType.STRING ? '' : 
                   defaultValueType === SocketType.NUMBER ? 0 : 
                   defaultValueType === SocketType.BOOLEAN ? false : null
  } = config;
  
  // Configure the appropriate input widget based on the value type
  let valueWidget: InputWidgetConfig;
  
  switch (defaultValueType) {
    case SocketType.STRING:
      valueWidget = {
        enabled: true,
        widgetType: WidgetType.TEXT,
        label: 'Value',
        placeholder: 'Enter text value'
      };
      break;
    case SocketType.NUMBER:
      valueWidget = {
        enabled: true,
        widgetType: WidgetType.NUMBER,
        label: 'Value'
      };
      break;
    case SocketType.BOOLEAN:
      valueWidget = {
        enabled: true,
        widgetType: WidgetType.CHECKBOX,
        label: 'Value'
      };
      break;
    default:
      valueWidget = {
        enabled: true,
        widgetType: WidgetType.TEXT,
        label: 'Value'
      };
  }
  
  const nameWidget: InputWidgetConfig = {
    enabled: true,
    widgetType: WidgetType.TEXT,
    label: 'Name',
    placeholder: 'Enter variable name'
  };
  
  return {
    type,
    label,
    category: NodeCategory.VARIABLES,
    description,
    inputs: [
      {
        id: 'flow_in',
        name: 'Flow In',
        type: SocketType.FLOW
      },
      {
        id: 'name',
        name: 'Name',
        type: SocketType.STRING,
        defaultValue: defaultName,
        inputWidget: nameWidget
      },
      {
        id: 'value',
        name: 'Value',
        type: defaultValueType,
        defaultValue: defaultValue,
        inputWidget: valueWidget
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
      name: defaultName,
      value: defaultValue,
      valueType: defaultValueType
    },
    // Code generation handler with proper typing
    codeGenerationHandler: ((node, generator) => {
      return generator.generateVariableDefinitionCode(node);
    }) as CodeGenerationHandler
  };
}

// ----------------- Variable Getter Node Template -----------------

export interface VariableGetterNodeConfig {
  type: NodeType;
  label: string;
  description: string;
  defaultName?: string;
  valueType?: SocketType;
}

/**
 * Creates a variable getter node registration
 * 
 * @param config - Configuration for the variable getter node
 * @returns The node registration information
 */
export function createVariableGetterNode(config: VariableGetterNodeConfig): NodeRegistrationInfo {
  const { 
    type, 
    label, 
    description, 
    defaultName = 'myVar',
    valueType = SocketType.STRING
  } = config;
  
  const nameWidget: InputWidgetConfig = {
    enabled: true,
    widgetType: WidgetType.TEXT,
    label: 'Variable Name',
    placeholder: 'Enter variable name'
  };
  
  return {
    type,
    label,
    category: NodeCategory.VARIABLES,
    description,
    inputs: [
      {
        id: 'name',
        name: 'Name',
        type: SocketType.STRING,
        defaultValue: defaultName,
        inputWidget: nameWidget
      }
    ],
    outputs: [
      {
        id: 'value',
        name: 'Value',
        type: valueType
      }
    ],
    properties: {
      description,
      name: defaultName,
      valueType
    },
    // Code generation handler with proper typing
    codeGenerationHandler: ((node, generator) => {
      return generator.generateVariableGetterCode(node);
    }) as CodeGenerationHandler
  };
}

/**
 * Registers a standard variable definition node
 * 
 * @param config - Configuration for the variable definition node
 * @returns The registered node type
 */
export function registerVariableDefinitionNode(config: VariableDefinitionNodeConfig): NodeType {
  const nodeInfo = createVariableDefinitionNode(config);
  return registerNode(nodeInfo);
}

/**
 * Registers a standard variable getter node
 * 
 * @param config - Configuration for the variable getter node
 * @returns The registered node type
 */
export function registerVariableGetterNode(config: VariableGetterNodeConfig): NodeType {
  const nodeInfo = createVariableGetterNode(config);
  return registerNode(nodeInfo);
} 