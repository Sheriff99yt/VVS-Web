/**
 * Variable Nodes
 * 
 * Defines all variable-related nodes using the templates
 */

import { NodeType } from '../types';
import { SocketType } from '../../sockets/types';
import { 
  createVariableDefinitionNode,
  createVariableGetterNode,
  registerVariableDefinitionNode,
  registerVariableGetterNode,
  VariableDefinitionNodeConfig as VarDefConfig,
  VariableGetterNodeConfig as VarGetConfig
} from '../templates/VariableTemplate';

// Variable Definition configurations for different types
export const VariableDefinitionNodeConfig: VarDefConfig = {
  type: NodeType.VARIABLE_DEFINITION,
  label: 'Variable Definition',
  description: 'Defines a variable with a name and value.',
  defaultName: 'myVar',
  defaultValue: '',
  defaultValueType: SocketType.STRING
};

// Variable Getter configuration
export const VariableGetterNodeConfig: VarGetConfig = {
  type: NodeType.VARIABLE_GETTER,
  label: 'Variable Getter',
  description: 'Gets the value of a variable by name.',
  defaultName: 'myVar',
  valueType: SocketType.STRING
};

// Create nodes from configurations
export const VariableDefinitionNode = createVariableDefinitionNode(VariableDefinitionNodeConfig);
export const VariableGetterNode = createVariableGetterNode(VariableGetterNodeConfig);

/**
 * Register all variable nodes
 */
export function registerVariableNodes(): void {
  registerVariableDefinitionNode(VariableDefinitionNodeConfig);
  registerVariableGetterNode(VariableGetterNodeConfig);
  console.log('Registered Variable nodes');
} 