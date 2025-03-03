/**
 * Data models for the VVS Web flow system
 * These interfaces define the structure of edges, nodes, and execution flow
 * types used throughout the application.
 */

import { Edge as ReactFlowEdge, Node as ReactFlowNode } from 'reactflow';
import { FunctionNodeData } from '../components/flow/nodes/FunctionNode';

/**
 * Enum defining the types of edges in the flow
 */
export enum EdgeType {
  DATA = "data",         // Edge that carries data between nodes
  EXECUTION = "execution" // Edge that defines execution order
}

/**
 * Interface for edge data
 */
export interface EdgeData {
  type: EdgeType;        // Type of the edge
  label?: string;        // Optional label (e.g., "True", "False" for conditional branches)
  sourceHandle: string;  // ID of the source handle
  targetHandle: string;  // ID of the target handle
}

/**
 * Extended Edge type with our custom data
 */
export type VVSEdge = ReactFlowEdge<EdgeData>;

/**
 * Extended Node type with our custom data
 */
export type VVSNode = ReactFlowNode<FunctionNodeData>;

/**
 * Interface for execution port definition
 */
export interface ExecutionPort {
  id: string;           // Unique ID for the port
  name: string;         // Display name
  label?: string;       // Optional label
  description?: string; // Optional description
}

/**
 * Interface for a node's execution context
 */
export interface ExecutionContext {
  currentNodeId: string;                    // ID of the node being executed
  visitedNodes: Set<string>;                // Set of already visited node IDs
  executionStack: string[];                 // Stack of node IDs in execution order
  variables: Map<string, string>;           // Map of variable names to values
  indentation: number;                      // Current indentation level
  conditionalBranches: Map<string, string>; // Map of condition labels to node IDs
}

/**
 * Enum for execution status used in visualization and debugging
 */
export enum ExecutionStatus {
  PENDING = "pending",   // Not yet executed
  RUNNING = "running",   // Currently executing
  COMPLETED = "completed", // Execution completed successfully
  ERROR = "error"        // Execution failed
} 