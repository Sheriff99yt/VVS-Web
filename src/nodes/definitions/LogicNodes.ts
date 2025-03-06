/**
 * Logic Operation Nodes Definitions
 * 
 * This file contains the definitions for all logic operation nodes in the system.
 */

import { NodeType } from '../types';
import { 
  createLogicOperationNode, 
  registerLogicOperationNode,
  LogicOperationNodeConfig
} from '../templates/LogicOperationTemplate';

// AND Node
export const AndNodeConfig: LogicOperationNodeConfig = {
  type: NodeType.AND,
  label: 'AND',
  description: 'Performs a logical AND operation on two boolean inputs. Returns true only if both inputs are true.',
  operator: 'and',
  isBinary: true,
  defaultA: false,
  defaultB: false
};

// OR Node
export const OrNodeConfig: LogicOperationNodeConfig = {
  type: NodeType.OR,
  label: 'OR',
  description: 'Performs a logical OR operation on two boolean inputs. Returns true if either input is true.',
  operator: 'or',
  isBinary: true,
  defaultA: false,
  defaultB: false
};

// NOT Node
export const NotNodeConfig: LogicOperationNodeConfig = {
  type: NodeType.NOT,
  label: 'NOT',
  description: 'Performs a logical NOT operation on a boolean input. Inverts the boolean value.',
  operator: 'not',
  isBinary: false,
  defaultA: false
};

// Greater Than Node
export const GreaterThanNodeConfig: LogicOperationNodeConfig = {
  type: NodeType.GREATER_THAN,
  label: 'Greater Than',
  description: 'Checks if the first input is greater than the second. Returns a boolean result.',
  operator: 'greaterThan',
  isBinary: true,
  defaultA: false,
  defaultB: false
};

// Less Than Node
export const LessThanNodeConfig: LogicOperationNodeConfig = {
  type: NodeType.LESS_THAN,
  label: 'Less Than',
  description: 'Checks if the first input is less than the second. Returns a boolean result.',
  operator: 'lessThan',
  isBinary: true,
  defaultA: false,
  defaultB: false
};

// Equal Node
export const EqualNodeConfig: LogicOperationNodeConfig = {
  type: NodeType.EQUAL,
  label: 'Equal',
  description: 'Checks if two inputs are equal. Returns a boolean result.',
  operator: 'equal',
  isBinary: true,
  defaultA: false,
  defaultB: false
};

// Create nodes from configurations
export const AndNode = createLogicOperationNode(AndNodeConfig);
export const OrNode = createLogicOperationNode(OrNodeConfig);
export const NotNode = createLogicOperationNode(NotNodeConfig);
export const GreaterThanNode = createLogicOperationNode(GreaterThanNodeConfig);
export const LessThanNode = createLogicOperationNode(LessThanNodeConfig);
export const EqualNode = createLogicOperationNode(EqualNodeConfig);

// Array of all logic operation nodes
export const logicNodes = [
  AndNode,
  OrNode,
  NotNode,
  GreaterThanNode,
  LessThanNode,
  EqualNode
];

/**
 * Register all logic operation nodes
 */
export function registerLogicNodes(): void {
  registerLogicOperationNode(AndNodeConfig);
  registerLogicOperationNode(OrNodeConfig);
  registerLogicOperationNode(NotNodeConfig);
  registerLogicOperationNode(GreaterThanNodeConfig);
  registerLogicOperationNode(LessThanNodeConfig);
  registerLogicOperationNode(EqualNodeConfig);
  console.log('Registered Logic Operation nodes');
} 