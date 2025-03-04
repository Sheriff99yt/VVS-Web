import { Node } from 'reactflow';
import { SocketDefinition } from '../sockets/types';

/**
 * Base node data interface
 * All nodes will extend this interface
 */
export interface BaseNodeData {
  label: string;
  type: NodeType;
  inputs: SocketDefinition[];
  outputs: SocketDefinition[];
  properties?: Record<string, any>;
}

/**
 * Node type enum - categorizes the different types of nodes
 * used in the system following MVP specifications
 */
export enum NodeType {
  // Process Flow nodes
  IF_STATEMENT = 'if_statement',
  FOR_LOOP = 'for_loop',
  
  // Logic Operation nodes
  AND = 'and',
  OR = 'or',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  EQUAL = 'equal',
  
  // Math Operation nodes
  ADD = 'add',
  SUBTRACT = 'subtract',
  MULTIPLY = 'multiply',
  DIVIDE = 'divide',
  
  // Variable nodes
  VARIABLE_DEFINITION = 'variable_definition',
  VARIABLE_GETTER = 'variable_getter',
  
  // Input/Output nodes
  PRINT = 'print',
  USER_INPUT = 'user_input',
  
  // Function nodes
  FUNCTION_DEFINITION = 'function_definition',
  FUNCTION_CALL = 'function_call',
}

/**
 * Node category enum - groups node types into categories
 */
export enum NodeCategory {
  PROCESS_FLOW = 'Process Flow',
  LOGIC = 'Logic Operations',
  MATH = 'Math Operations',
  VARIABLES = 'Variables',
  IO = 'Input/Output',
  FUNCTION = 'Function',
}

/**
 * Node category definition
 * Maps node types to categories and provides display information
 */
export interface NodeCategoryDefinition {
  id: NodeCategory;
  label: string;
  nodeTypes: NodeType[];
  color: string;
}

/**
 * Custom type for ReactFlow nodes with our data structure
 */
export type VVSNode = Node<BaseNodeData>;

/**
 * Node type to category mapping
 */
export const NODE_CATEGORIES: NodeCategoryDefinition[] = [
  {
    id: NodeCategory.PROCESS_FLOW,
    label: 'Process Flow',
    nodeTypes: [NodeType.IF_STATEMENT, NodeType.FOR_LOOP],
    color: '#FF5722',
  },
  {
    id: NodeCategory.LOGIC,
    label: 'Logic Operations',
    nodeTypes: [
      NodeType.AND,
      NodeType.OR,
      NodeType.GREATER_THAN,
      NodeType.LESS_THAN,
      NodeType.EQUAL,
    ],
    color: '#2196F3',
  },
  {
    id: NodeCategory.MATH,
    label: 'Math Operations',
    nodeTypes: [
      NodeType.ADD,
      NodeType.SUBTRACT,
      NodeType.MULTIPLY,
      NodeType.DIVIDE,
    ],
    color: '#9C27B0',
  },
  {
    id: NodeCategory.VARIABLES,
    label: 'Variables',
    nodeTypes: [NodeType.VARIABLE_DEFINITION, NodeType.VARIABLE_GETTER],
    color: '#4CAF50',
  },
  {
    id: NodeCategory.IO,
    label: 'Input/Output',
    nodeTypes: [NodeType.PRINT, NodeType.USER_INPUT],
    color: '#FFC107',
  },
  {
    id: NodeCategory.FUNCTION,
    label: 'Function',
    nodeTypes: [NodeType.FUNCTION_DEFINITION, NodeType.FUNCTION_CALL],
    color: '#673AB7',
  },
]; 