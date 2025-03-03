/**
 * TypeValidator
 * 
 * A service that handles type validation for connections between nodes
 * in the VVS Web flow system. It provides methods to check if connections
 * between different data types are valid and offers helper functions for
 * identifying type compatibility.
 */

import { Node, Edge } from 'reactflow';
import { FunctionNodeData } from '../../components/flow/nodes/FunctionNode';
import { EdgeType } from '../../models/flow';

export enum TypeCompatibilityResult {
  COMPATIBLE = 'compatible',         // Types are directly compatible
  COMPATIBLE_WITH_CONVERSION = 'compatible_with_conversion', // Types can be converted automatically
  INCOMPATIBLE = 'incompatible',     // Types are not compatible
  UNKNOWN = 'unknown'                // Cannot determine compatibility
}

export interface TypeValidationError {
  message: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourcePortId: string;
  targetPortId: string;
  sourceType: string;
  targetType: string;
  severity: 'error' | 'warning';
}

export class TypeValidator {
  // Type compatibility matrix - maps source types to compatible target types
  private typeCompatibilityMatrix: Map<string, Set<string>> = new Map();
  
  // Map of types that can be automatically converted between each other
  private autoConversionTypes: Map<string, Set<string>> = new Map();
  
  // Validation errors
  private errors: TypeValidationError[] = [];
  
  constructor() {
    this.initializeTypeCompatibility();
  }
  
  /**
   * Initialize the type compatibility matrix with default rules
   */
  private initializeTypeCompatibility(): void {
    // Direct compatibility (same type)
    this.addTypeCompatibility('string', ['string']);
    this.addTypeCompatibility('number', ['number']);
    this.addTypeCompatibility('boolean', ['boolean']);
    this.addTypeCompatibility('array', ['array']);
    this.addTypeCompatibility('object', ['object']);
    this.addTypeCompatibility('any', ['any', 'string', 'number', 'boolean', 'array', 'object']);
    
    // 'any' type is compatible with any other type
    this.addTypeCompatibility('string', ['any']);
    this.addTypeCompatibility('number', ['any']);
    this.addTypeCompatibility('boolean', ['any']);
    this.addTypeCompatibility('array', ['any']);
    this.addTypeCompatibility('object', ['any']);
    
    // Auto-conversion compatibility
    this.addAutoConversion('number', ['string']);
    this.addAutoConversion('string', ['number']);
    this.addAutoConversion('boolean', ['string']);
  }
  
  /**
   * Add compatible types to the compatibility matrix
   */
  private addTypeCompatibility(sourceType: string, targetTypes: string[]): void {
    if (!this.typeCompatibilityMatrix.has(sourceType)) {
      this.typeCompatibilityMatrix.set(sourceType, new Set<string>());
    }
    
    const compatibleTypes = this.typeCompatibilityMatrix.get(sourceType);
    targetTypes.forEach(type => compatibleTypes?.add(type));
  }
  
  /**
   * Add auto-conversion types to the matrix
   */
  private addAutoConversion(sourceType: string, targetTypes: string[]): void {
    if (!this.autoConversionTypes.has(sourceType)) {
      this.autoConversionTypes.set(sourceType, new Set<string>());
    }
    
    const convertibleTypes = this.autoConversionTypes.get(sourceType);
    targetTypes.forEach(type => convertibleTypes?.add(type));
  }
  
  /**
   * Check if two types are compatible
   * @param sourceType Source port type
   * @param targetType Target port type
   * @returns Result of type compatibility check
   */
  public checkTypeCompatibility(sourceType: string, targetType: string): TypeCompatibilityResult {
    // Normalize types to lowercase
    const source = sourceType.toLowerCase();
    const target = targetType.toLowerCase();
    
    // Check direct compatibility
    if (this.isDirectlyCompatible(source, target)) {
      return TypeCompatibilityResult.COMPATIBLE;
    }
    
    // Check if types can be automatically converted
    if (this.canAutoConvert(source, target)) {
      return TypeCompatibilityResult.COMPATIBLE_WITH_CONVERSION;
    }
    
    // Types are not compatible
    return TypeCompatibilityResult.INCOMPATIBLE;
  }
  
  /**
   * Check if a source type is directly compatible with a target type
   */
  private isDirectlyCompatible(sourceType: string, targetType: string): boolean {
    const compatibleTypes = this.typeCompatibilityMatrix.get(sourceType);
    return compatibleTypes?.has(targetType) || false;
  }
  
  /**
   * Check if a source type can be automatically converted to a target type
   */
  private canAutoConvert(sourceType: string, targetType: string): boolean {
    const convertibleTypes = this.autoConversionTypes.get(sourceType);
    return convertibleTypes?.has(targetType) || false;
  }
  
  /**
   * Validate connections between nodes
   * @param nodes Array of nodes in the flow
   * @param edges Array of edges connecting the nodes
   * @returns Array of validation errors
   */
  public validateConnections(nodes: Node<FunctionNodeData>[], edges: Edge[]): TypeValidationError[] {
    this.errors = [];
    
    // Check each edge for type compatibility
    for (const edge of edges) {
      // Skip execution edges
      if (edge.data?.type === EdgeType.EXECUTION) {
        continue;
      }
      
      const sourceNode = nodes.find(node => node.id === edge.source);
      const targetNode = nodes.find(node => node.id === edge.target);
      
      if (!sourceNode || !targetNode) {
        continue;
      }
      
      // Get source and target ports
      const sourcePortId = edge.sourceHandle?.replace('output-', '') || '';
      const targetPortId = edge.targetHandle?.replace('input-', '') || '';
      
      const sourceOutputs = sourceNode.data.outputs || [];
      const targetInputs = targetNode.data.inputs || [];
      
      const sourcePort = sourceOutputs.find(output => output.id === sourcePortId);
      const targetPort = targetInputs.find(input => input.id === targetPortId);
      
      if (!sourcePort || !targetPort) {
        continue;
      }
      
      // Check type compatibility
      const compatibility = this.checkTypeCompatibility(sourcePort.type, targetPort.type);
      
      if (compatibility === TypeCompatibilityResult.INCOMPATIBLE) {
        this.errors.push({
          message: `Type mismatch: Cannot connect '${sourcePort.type}' to '${targetPort.type}'`,
          sourceNodeId: sourceNode.id,
          targetNodeId: targetNode.id,
          sourcePortId,
          targetPortId,
          sourceType: sourcePort.type,
          targetType: targetPort.type,
          severity: 'error'
        });
      } else if (compatibility === TypeCompatibilityResult.COMPATIBLE_WITH_CONVERSION) {
        this.errors.push({
          message: `Type conversion required: '${sourcePort.type}' will be converted to '${targetPort.type}'`,
          sourceNodeId: sourceNode.id,
          targetNodeId: targetNode.id,
          sourcePortId,
          targetPortId,
          sourceType: sourcePort.type,
          targetType: targetPort.type,
          severity: 'warning'
        });
      }
    }
    
    return this.errors;
  }
  
  /**
   * Check if a connection would be valid before it's created
   * @param sourceNode Source node
   * @param targetNode Target node
   * @param sourcePortId Source port ID
   * @param targetPortId Target port ID
   * @returns Whether the connection would be valid
   */
  public canConnect(
    sourceNode: Node<FunctionNodeData>, 
    targetNode: Node<FunctionNodeData>,
    sourcePortId: string,
    targetPortId: string
  ): {valid: boolean, result: TypeCompatibilityResult, message: string} {
    // Find the output port on the source node
    const sourcePort = sourceNode.data.outputs?.find(
      output => output.id === sourcePortId.replace('output-', '')
    );
    
    // Find the input port on the target node
    const targetPort = targetNode.data.inputs?.find(
      input => input.id === targetPortId.replace('input-', '')
    );
    
    // If either port is not found, connection is invalid
    if (!sourcePort || !targetPort) {
      return {
        valid: false, 
        result: TypeCompatibilityResult.UNKNOWN,
        message: 'Invalid port'
      };
    }
    
    // Check type compatibility
    const compatibility = this.checkTypeCompatibility(sourcePort.type, targetPort.type);
    
    switch (compatibility) {
      case TypeCompatibilityResult.COMPATIBLE:
        return {
          valid: true, 
          result: compatibility,
          message: 'Types are compatible'
        };
        
      case TypeCompatibilityResult.COMPATIBLE_WITH_CONVERSION:
        return {
          valid: true, 
          result: compatibility,
          message: `Type conversion required: '${sourcePort.type}' will be converted to '${targetPort.type}'`
        };
        
      case TypeCompatibilityResult.INCOMPATIBLE:
        return {
          valid: false, 
          result: compatibility,
          message: `Type mismatch: Cannot connect '${sourcePort.type}' to '${targetPort.type}'`
        };
        
      default:
        return {
          valid: false, 
          result: TypeCompatibilityResult.UNKNOWN,
          message: 'Cannot determine type compatibility'
        };
    }
  }
  
  /**
   * Get the conversion function name for a type conversion
   * @param sourceType Source type
   * @param targetType Target type
   * @returns The name of the conversion function to use
   */
  public getConversionFunction(sourceType: string, targetType: string): string | null {
    // Only return a conversion function if the types can be converted
    if (!this.canAutoConvert(sourceType.toLowerCase(), targetType.toLowerCase())) {
      return null;
    }
    
    // Map of conversion functions
    const conversionMap: Record<string, Record<string, string>> = {
      'number': {
        'string': 'str',
      },
      'string': {
        'number': 'float',
      },
      'boolean': {
        'string': 'str',
      }
    };
    
    return conversionMap[sourceType.toLowerCase()]?.[targetType.toLowerCase()] || null;
  }
  
  /**
   * Get all validation errors
   */
  public getErrors(): TypeValidationError[] {
    return this.errors;
  }
  
  /**
   * Clear all validation errors
   */
  public clearErrors(): void {
    this.errors = [];
  }
} 