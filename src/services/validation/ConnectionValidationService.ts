/**
 * ConnectionValidationService
 * 
 * A service that integrates with ReactFlow to validate connections
 * between nodes based on their types. It provides methods for
 * validating connections as they are being created and for
 * highlighting invalid connections.
 */

import { Node, Edge, Connection } from 'reactflow';
import { FunctionNodeData } from '../../components/flow/nodes/FunctionNode';
import { TypeValidator, TypeValidationError, TypeCompatibilityResult } from './TypeValidator';
import { EdgeType } from '../../models/flow';

export interface ConnectionValidationResult {
  isValid: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info' | 'none';
  sourceNodeId: string;
  targetNodeId: string;
  sourcePortId: string;
  targetPortId: string;
}

export class ConnectionValidationService {
  private typeValidator: TypeValidator;
  private validationResults: Map<string, ConnectionValidationResult> = new Map();
  
  constructor() {
    this.typeValidator = new TypeValidator();
  }
  
  /**
   * Validate a connection between two nodes
   * @param connection Connection object from ReactFlow
   * @param nodes Array of nodes in the flow
   * @returns Whether the connection is valid
   */
  public validateConnection(connection: Connection, nodes: Node<FunctionNodeData>[]): boolean {
    // If missing required connection data, reject
    if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) {
      return false;
    }
    
    // Allow execution connections by default
    if (this.isExecutionConnection(connection)) {
      return true;
    }
    
    // Find the source and target nodes
    const sourceNode = nodes.find(node => node.id === connection.source);
    const targetNode = nodes.find(node => node.id === connection.target);
    
    if (!sourceNode || !targetNode) {
      return false;
    }
    
    // Validate the connection using the TypeValidator
    const validationResult = this.typeValidator.canConnect(
      sourceNode,
      targetNode,
      connection.sourceHandle,
      connection.targetHandle
    );
    
    return validationResult.valid;
  }
  
  /**
   * Check if a connection is an execution connection
   */
  private isExecutionConnection(connection: Connection): boolean {
    return connection.sourceHandle?.startsWith('exec-') || connection.targetHandle?.startsWith('exec-') || false;
  }
  
  /**
   * Validate all connections in the flow
   * @param nodes Array of nodes in the flow
   * @param edges Array of edges in the flow
   * @returns Array of validation errors
   */
  public validateAllConnections(nodes: Node<FunctionNodeData>[], edges: Edge[]): TypeValidationError[] {
    // Clear previous validation results
    this.validationResults.clear();
    
    // Validate all connections
    const validationErrors = this.typeValidator.validateConnections(nodes, edges);
    
    // Store validation results for each edge
    edges.forEach(edge => {
      // Skip execution edges
      if (edge.data?.type === EdgeType.EXECUTION) {
        return;
      }
      
      const edgeId = edge.id;
      const error = validationErrors.find(err => 
        err.sourceNodeId === edge.source && 
        err.targetNodeId === edge.target &&
        err.sourcePortId === edge.sourceHandle?.replace('output-', '') &&
        err.targetPortId === edge.targetHandle?.replace('input-', '')
      );
      
      if (error) {
        this.validationResults.set(edgeId, {
          isValid: error.severity !== 'error',
          message: error.message,
          severity: error.severity,
          sourceNodeId: error.sourceNodeId,
          targetNodeId: error.targetNodeId,
          sourcePortId: error.sourcePortId,
          targetPortId: error.targetPortId
        });
      } else {
        this.validationResults.set(edgeId, {
          isValid: true,
          message: 'Connection is valid',
          severity: 'none',
          sourceNodeId: edge.source,
          targetNodeId: edge.target,
          sourcePortId: edge.sourceHandle?.replace('output-', '') || '',
          targetPortId: edge.targetHandle?.replace('input-', '') || ''
        });
      }
    });
    
    return validationErrors;
  }
  
  /**
   * Get the validation result for an edge
   * @param edgeId ID of the edge
   * @returns Validation result for the edge
   */
  public getValidationResultForEdge(edgeId: string): ConnectionValidationResult | undefined {
    return this.validationResults.get(edgeId);
  }
  
  /**
   * Get all validation results
   * @returns Map of edge IDs to validation results
   */
  public getAllValidationResults(): Map<string, ConnectionValidationResult> {
    return this.validationResults;
  }
  
  /**
   * Check if an edge is a valid connection
   * @param edge Edge to check
   * @returns Whether the edge is valid
   */
  public isEdgeValid(edge: Edge): boolean {
    // Execution edges are always valid
    if (edge.data?.type === EdgeType.EXECUTION) {
      return true;
    }
    
    const result = this.validationResults.get(edge.id);
    return result?.isValid || false;
  }
  
  /**
   * Get the style for an edge based on its validation result
   * @param edge Edge to get style for
   * @returns Style object for the edge
   */
  public getEdgeStyle(edge: Edge): React.CSSProperties {
    // Default style
    const defaultStyle: React.CSSProperties = {};
    
    // Execution edges have a different style
    if (edge.data?.type === EdgeType.EXECUTION) {
      return {
        ...defaultStyle,
        strokeWidth: 2,
        stroke: '#555',
        strokeDasharray: '5,5',
      };
    }
    
    const result = this.validationResults.get(edge.id);
    if (!result) {
      return defaultStyle;
    }
    
    // Style based on validation result
    switch (result.severity) {
      case 'error':
        return {
          ...defaultStyle,
          stroke: '#ff0000',
          strokeWidth: 2,
        };
      case 'warning':
        return {
          ...defaultStyle,
          stroke: '#ffcc00',
          strokeWidth: 2,
        };
      default:
        return defaultStyle;
    }
  }
} 