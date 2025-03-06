/**
 * Node System Initialization
 * 
 * This file provides functions to initialize the node system,
 * including registering all node types and setting up code generation.
 */

import { registerAllNodes } from './definitions';
import { initializeCodeGeneratorExtension } from '../utils/codeGenerator/UniversalCodeGeneratorExtension';
import { nodeRegistry } from './NodeFactory';

/**
 * Initialize the node system
 * 
 * This function should be called during application initialization
 * to set up the node system, including:
 * 
 * 1. Registering all node types
 * 2. Setting up code generation
 * 3. Initializing any other node-related systems
 */
export function initializeNodeSystem(): void {
  console.log('Initializing Node System...');
  
  // Register all node types
  registerAllNodes();
  
  // Initialize code generator extension
  initializeCodeGeneratorExtension();
  
  console.log(`Node System initialized with ${Object.keys(nodeRegistry).length} node types`);
}

/**
 * Get the node registry for use in components
 * 
 * This is used by the NodeLibrary component to display available nodes
 */
export function getNodeRegistry() {
  return nodeRegistry;
} 