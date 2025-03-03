/**
 * ExecutionFlowValidator.ts
 * 
 * Validates the execution flow of a node graph.
 * Checks for cycles, disconnected nodes, and execution order constraints.
 */

import { Node, Edge } from 'reactflow';

export interface ValidationError {
  type: string;
  message: string;
  nodeId?: string;
  dependencyId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validates the execution flow of a node graph
 * @param nodes The nodes in the graph
 * @param edges The edges connecting the nodes
 * @returns A validation result with errors if any
 */
export function validateExecutionFlow(nodes: Node[], edges: Edge[]): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Check for cycles
  const cycleErrors = detectCycles(nodes, edges);
  errors.push(...cycleErrors);
  
  // Check for disconnected nodes
  const disconnectedErrors = detectDisconnectedNodes(nodes, edges);
  errors.push(...disconnectedErrors);
  
  // Check for input/output constraints
  const connectionErrors = validateNodeConnections(nodes, edges);
  errors.push(...connectionErrors);
  
  // Check dependencies
  const dependencyErrors = validateDependencies(nodes, edges);
  errors.push(...dependencyErrors);
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Detects cycles in the graph using DFS
 */
function detectCycles(nodes: Node[], edges: Edge[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  // Build adjacency list
  const adjacencyList = buildAdjacencyList(nodes, edges);
  
  // Run DFS from each unvisited node
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      detectCyclesDFS(node.id, adjacencyList, visited, recursionStack, errors);
    }
  });
  
  return errors;
}

/**
 * DFS helper function for cycle detection
 */
function detectCyclesDFS(
  nodeId: string,
  adjacencyList: Map<string, string[]>,
  visited: Set<string>,
  recursionStack: Set<string>,
  errors: ValidationError[]
): void {
  visited.add(nodeId);
  recursionStack.add(nodeId);
  
  const neighbors = adjacencyList.get(nodeId) || [];
  for (const neighbor of neighbors) {
    if (!visited.has(neighbor)) {
      detectCyclesDFS(neighbor, adjacencyList, visited, recursionStack, errors);
    } else if (recursionStack.has(neighbor)) {
      // Found a cycle
      errors.push({
        type: 'cycle',
        message: `Detected cycle involving node ${neighbor}`,
        nodeId: neighbor
      });
    }
  }
  
  recursionStack.delete(nodeId);
}

/**
 * Detects disconnected nodes in the graph
 */
function detectDisconnectedNodes(nodes: Node[], edges: Edge[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Create sets of nodes that have incoming or outgoing connections
  const connectedNodes = new Set<string>();
  
  edges.forEach(edge => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });
  
  // Find nodes that are not connected
  nodes.forEach(node => {
    if (!connectedNodes.has(node.id)) {
      errors.push({
        type: 'disconnected',
        message: `Node ${node.id} is disconnected from the flow`,
        nodeId: node.id
      });
    }
  });
  
  return errors;
}

/**
 * Validates node connections based on input/output constraints
 */
function validateNodeConnections(nodes: Node[], edges: Edge[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Count inputs and outputs for each node
  const inputCounts = new Map<string, number>();
  const outputCounts = new Map<string, number>();
  
  edges.forEach(edge => {
    // Count incoming edges
    const targetInputCount = inputCounts.get(edge.target) || 0;
    inputCounts.set(edge.target, targetInputCount + 1);
    
    // Count outgoing edges
    const sourceOutputCount = outputCounts.get(edge.source) || 0;
    outputCounts.set(edge.source, sourceOutputCount + 1);
  });
  
  // Check nodes against their constraints
  nodes.forEach(node => {
    const minInputs = node.data?.minInputs || 0;
    const maxInputs = node.data?.maxInputs;
    const minOutputs = node.data?.minOutputs || 0;
    const maxOutputs = node.data?.maxOutputs;
    
    const inputCount = inputCounts.get(node.id) || 0;
    const outputCount = outputCounts.get(node.id) || 0;
    
    // Check minimum inputs
    if (inputCount < minInputs) {
      errors.push({
        type: 'missingInputs',
        message: `Node ${node.id} requires at least ${minInputs} inputs but has ${inputCount}`,
        nodeId: node.id
      });
    }
    
    // Check maximum inputs
    if (maxInputs !== undefined && inputCount > maxInputs) {
      errors.push({
        type: 'tooManyInputs',
        message: `Node ${node.id} allows at most ${maxInputs} inputs but has ${inputCount}`,
        nodeId: node.id
      });
    }
    
    // Check minimum outputs
    if (outputCount < minOutputs) {
      errors.push({
        type: 'missingOutputs',
        message: `Node ${node.id} requires at least ${minOutputs} outputs but has ${outputCount}`,
        nodeId: node.id
      });
    }
    
    // Check maximum outputs
    if (maxOutputs !== undefined && outputCount > maxOutputs) {
      errors.push({
        type: 'tooManyOutputs',
        message: `Node ${node.id} allows at most ${maxOutputs} outputs but has ${outputCount}`,
        nodeId: node.id
      });
    }
  });
  
  return errors;
}

/**
 * Validates dependencies between nodes
 */
function validateDependencies(nodes: Node[], edges: Edge[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Build a map of direct connections
  const directConnections = new Map<string, Set<string>>();
  
  edges.forEach(edge => {
    const sources = directConnections.get(edge.target) || new Set<string>();
    sources.add(edge.source);
    directConnections.set(edge.target, sources);
  });
  
  // Check each node for dependencies
  nodes.forEach(node => {
    const dependencies = node.data?.dependencies || [];
    const sources = directConnections.get(node.id) || new Set<string>();
    
    // Check if all dependencies are directly connected
    dependencies.forEach((dependencyId: string) => {
      if (!sources.has(dependencyId)) {
        errors.push({
          type: 'missingDependency',
          message: `Node ${node.id} requires a direct connection from dependency ${dependencyId}`,
          nodeId: node.id,
          dependencyId
        });
      }
    });
  });
  
  return errors;
}

/**
 * Builds an adjacency list representation of the graph
 */
function buildAdjacencyList(nodes: Node[], edges: Edge[]): Map<string, string[]> {
  const adjacencyList = new Map<string, string[]>();
  
  // Initialize empty arrays for each node
  nodes.forEach(node => {
    adjacencyList.set(node.id, []);
  });
  
  // Add edges to the adjacency list
  edges.forEach(edge => {
    const neighbors = adjacencyList.get(edge.source) || [];
    neighbors.push(edge.target);
    adjacencyList.set(edge.source, neighbors);
  });
  
  return adjacencyList;
} 