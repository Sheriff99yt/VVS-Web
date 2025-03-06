/**
 * Node Factory System
 * 
 * This file implements a centralized system for creating and registering node types
 * in the Visual Visual Scripting (VVS) application. It handles:
 * 
 * 1. Registering node types
 * 2. Creating node templates
 * 3. Managing code generation handlers
 * 4. Ensuring consistency between node definitions and code generation
 */

import { Node } from 'reactflow';
import { NodeType, NodeCategory, NODE_CATEGORIES, BaseNodeData } from './types';
import { SocketDefinition, createSocketDefinition, SocketType, SocketDirection, InputWidgetConfig } from '../sockets/types';

// Type for the node registration information
export interface NodeRegistrationInfo {
  type: NodeType;                          // The node type enum value
  label: string;                           // Display label for the node
  category: NodeCategory | string;         // The category this node belongs to
  inputs: SocketDefinitionInfo[];          // Input socket definitions
  outputs: SocketDefinitionInfo[];         // Output socket definitions
  properties?: Record<string, any>;        // Default properties
  description?: string;                    // Node description
  codeGenerationHandler?: CodeGenerationHandler; // Code generation function
}

// Interface for simplified socket definition info
export interface SocketDefinitionInfo {
  id: string;
  name: string;
  type: SocketType;
  defaultValue?: any;
  inputWidget?: Partial<InputWidgetConfig>;
}

// Type for code generation handler function
export type CodeGenerationHandler = (
  node: Node<BaseNodeData>,
  generator: any
) => void;

// Registry to store all registered nodes
export interface NodeRegistry {
  [key: string]: {
    type: NodeType;
    label: string;
    category: NodeCategory | string;
    createNodeData: () => BaseNodeData;
    codeGenerationHandler?: CodeGenerationHandler;
  };
}

// The node registry - will be populated by registerNode calls
export const nodeRegistry: NodeRegistry = {};

// Code generation handlers registry
export const codeGenerationHandlers: Record<string, CodeGenerationHandler> = {};

/**
 * Register a new node type in the system
 * 
 * @param nodeInfo Node registration information
 * @returns The registered node type
 */
export function registerNode(nodeInfo: NodeRegistrationInfo): NodeType {
  const { type, label, category, inputs, outputs, properties = {}, description, codeGenerationHandler } = nodeInfo;
  
  // Create the node template registration
  nodeRegistry[type] = {
    type,
    label,
    category: category as NodeCategory,
    createNodeData: () => {
      // Convert simplified socket info to full socket definitions
      const inputSockets = inputs.map(input => {
        const { id, name, type, defaultValue, inputWidget } = input;
        return createSocketDefinition(
          id, 
          name, 
          type, 
          SocketDirection.INPUT, 
          defaultValue,
          inputWidget
        );
      });
      
      const outputSockets = outputs.map(output => {
        const { id, name, type, defaultValue } = output;
        return createSocketDefinition(
          id, 
          name, 
          type, 
          SocketDirection.OUTPUT, 
          defaultValue
        );
      });
      
      // Create full properties with description if provided
      const fullProperties = { ...properties };
      if (description) {
        fullProperties.description = description;
      }
      
      // Create initial property values from socket default values
      inputs.forEach(input => {
        if (input.defaultValue !== undefined) {
          fullProperties[input.id] = input.defaultValue;
        }
      });
      
      // Return the complete node data
      return {
        type,
        label,
        category: category as NodeCategory,
        inputs: inputSockets,
        outputs: outputSockets,
        properties: fullProperties
      };
    }
  };
  
  // Register the code generation handler if provided
  if (codeGenerationHandler) {
    codeGenerationHandlers[type] = codeGenerationHandler;
  }
  
  // Return the node type for convenience
  return type;
}

/**
 * Get all registered node types
 * 
 * @returns Array of all registered node types
 */
export function getRegisteredNodeTypes(): NodeType[] {
  return Object.keys(nodeRegistry) as NodeType[];
}

/**
 * Get a node template by type
 * 
 * @param type The node type to retrieve
 * @returns The node template or undefined if not found
 */
export function getNodeTemplate(type: NodeType) {
  return nodeRegistry[type];
}

/**
 * Get a code generation handler by node type
 * 
 * @param type The node type to retrieve the handler for
 * @returns The code generation handler or undefined if not registered
 */
export function getCodeGenerationHandler(type: NodeType) {
  return codeGenerationHandlers[type];
}

/**
 * Register all nodes in a category
 * 
 * Helper function to register multiple nodes at once
 * 
 * @param nodes Array of node registration information
 * @returns Array of registered node types
 */
export function registerNodes(nodes: NodeRegistrationInfo[]): NodeType[] {
  return nodes.map(node => registerNode(node));
} 