/**
 * CodeGenerationError
 * 
 * A specialized error class for code generation errors that provides more detailed
 * information about the error context, including the specific node that caused the error,
 * the operation that failed, and suggestions for resolving the issue.
 */

export enum ErrorSeverity {
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum ErrorSource {
  SYNTAX_PATTERN = 'syntax_pattern',
  DEPENDENCY_RESOLUTION = 'dependency_resolution',
  NODE_EXECUTION = 'node_execution',
  TYPE_VALIDATION = 'type_validation',
  CONNECTION = 'connection',
  INITIALIZATION = 'initialization'
}

export class CodeGenerationError extends Error {
  /** The ID of the node that caused the error (if applicable) */
  public nodeId?: string;
  
  /** The label of the node that caused the error (if applicable) */
  public nodeLabel?: string;
  
  /** The function ID of the node that caused the error (if applicable) */
  public functionId?: number;
  
  /** The severity of the error */
  public severity: ErrorSeverity;
  
  /** The source of the error */
  public source: ErrorSource;
  
  /** Suggestions for fixing the error */
  public suggestions: string[];
  
  /** Any additional context information */
  public context: Record<string, any>;

  constructor(
    message: string,
    source: ErrorSource,
    options: {
      nodeId?: string;
      nodeLabel?: string;
      functionId?: number;
      severity?: ErrorSeverity;
      suggestions?: string[];
      context?: Record<string, any>;
    } = {}
  ) {
    super(message);
    
    // Standard error properties
    this.name = 'CodeGenerationError';
    
    // Error source and severity
    this.source = source;
    this.severity = options.severity || ErrorSeverity.ERROR;
    
    // Node information
    this.nodeId = options.nodeId;
    this.nodeLabel = options.nodeLabel;
    this.functionId = options.functionId;
    
    // Resolution assistance
    this.suggestions = options.suggestions || [];
    this.context = options.context || {};
    
    // Ensure the stack trace points to the caller
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CodeGenerationError);
    }
  }

  /**
   * Creates a formatted error message with all relevant details
   */
  public getDetailedMessage(): string {
    let details: string[] = [
      `[${this.severity.toUpperCase()}] ${this.message}`
    ];
    
    if (this.nodeLabel) {
      details.push(`Node: ${this.nodeLabel}${this.nodeId ? ` (ID: ${this.nodeId})` : ''}`);
    }
    
    if (this.functionId) {
      details.push(`Function ID: ${this.functionId}`);
    }
    
    details.push(`Error Source: ${this.source}`);
    
    if (this.suggestions.length > 0) {
      details.push('Suggestions:');
      this.suggestions.forEach(suggestion => {
        details.push(`  - ${suggestion}`);
      });
    }
    
    // Add any additional context information
    if (Object.keys(this.context).length > 0) {
      details.push('Additional Context:');
      for (const [key, value] of Object.entries(this.context)) {
        details.push(`  ${key}: ${JSON.stringify(value)}`);
      }
    }
    
    return details.join('\n');
  }

  /**
   * Factory method for creating a syntax pattern error
   */
  public static syntaxPatternError(
    message: string,
    options: {
      nodeId?: string;
      nodeLabel?: string;
      functionId?: number;
      patternType?: string;
      severity?: ErrorSeverity;
    }
  ): CodeGenerationError {
    const suggestions = [
      'Check if the syntax pattern exists for the function',
      'Verify the syntax pattern format is correct',
      'Ensure all required placeholders are present in the pattern'
    ];
    
    if (options.patternType) {
      suggestions.push(`Make sure the pattern type "${options.patternType}" is appropriate for this function`);
    }
    
    return new CodeGenerationError(message, ErrorSource.SYNTAX_PATTERN, {
      ...options,
      suggestions,
      context: { patternType: options.patternType }
    });
  }

  /**
   * Factory method for creating a dependency resolution error
   */
  public static dependencyError(
    message: string,
    options: {
      nodeId?: string;
      nodeLabel?: string;
      dependencyNodeIds?: string[];
      circular?: boolean;
      severity?: ErrorSeverity;
    }
  ): CodeGenerationError {
    const suggestions = [
      'Check for circular dependencies between nodes',
      'Ensure all required input connections are present',
      'Verify that the node graph is properly connected'
    ];
    
    if (options.circular) {
      suggestions.push('Restructure the node graph to remove circular references');
    }
    
    return new CodeGenerationError(message, ErrorSource.DEPENDENCY_RESOLUTION, {
      ...options,
      suggestions,
      context: { 
        dependencyNodeIds: options.dependencyNodeIds,
        circular: options.circular 
      }
    });
  }

  /**
   * Factory method for creating a node execution error
   */
  public static executionError(
    message: string,
    options: {
      nodeId?: string;
      nodeLabel?: string;
      executionPath?: string[];
      severity?: ErrorSeverity;
    }
  ): CodeGenerationError {
    return new CodeGenerationError(message, ErrorSource.NODE_EXECUTION, {
      ...options,
      suggestions: [
        'Check the execution connections between nodes',
        'Ensure control flow nodes have all required execution outputs connected',
        'Verify that there are no disconnected execution inputs or outputs'
      ],
      context: { executionPath: options.executionPath }
    });
  }

  /**
   * Factory method for creating a type validation error
   */
  public static typeError(
    message: string,
    options: {
      nodeId?: string;
      nodeLabel?: string;
      portId?: string;
      expectedType?: string;
      actualType?: string;
      severity?: ErrorSeverity;
    }
  ): CodeGenerationError {
    return new CodeGenerationError(message, ErrorSource.TYPE_VALIDATION, {
      ...options,
      suggestions: [
        'Check the types of connected ports',
        'Add a type conversion node if necessary',
        'Verify that the connection is connecting compatible types'
      ],
      context: {
        portId: options.portId,
        expectedType: options.expectedType,
        actualType: options.actualType
      }
    });
  }

  /**
   * Factory method for creating a connection error
   */
  public static connectionError(
    message: string,
    options: {
      nodeId?: string;
      nodeLabel?: string;
      sourceNodeId?: string;
      targetNodeId?: string;
      sourcePortId?: string;
      targetPortId?: string;
      severity?: ErrorSeverity;
    }
  ): CodeGenerationError {
    return new CodeGenerationError(message, ErrorSource.CONNECTION, {
      ...options,
      suggestions: [
        'Check if the connection is properly formed',
        'Verify that both the source and target ports exist',
        'Ensure that all required connections are present'
      ],
      context: {
        sourceNodeId: options.sourceNodeId,
        targetNodeId: options.targetNodeId,
        sourcePortId: options.sourcePortId,
        targetPortId: options.targetPortId
      }
    });
  }

  /**
   * Factory method for creating an initialization error
   */
  public static initializationError(
    message: string,
    options: {
      functionIds?: number[];
      severity?: ErrorSeverity;
    } = {}
  ): CodeGenerationError {
    return new CodeGenerationError(message, ErrorSource.INITIALIZATION, {
      ...options,
      suggestions: [
        'Check that the syntax database service is properly configured',
        'Verify that all required function definitions exist in the database',
        'Ensure that the language is properly defined'
      ],
      context: { functionIds: options.functionIds }
    });
  }
} 