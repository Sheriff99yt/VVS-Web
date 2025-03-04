import { Edge, Node } from 'reactflow';
import { BaseNodeData, NodeType } from '../../nodes/types';
import { SocketType } from '../../sockets/types';
import { LanguageConfig } from '../languageConfig';

/**
 * Abstract base class for all language-specific code generators
 */
export abstract class BaseCodeGenerator {
  protected nodes: Node<BaseNodeData>[];
  protected edges: Edge[];
  protected code: string = '';
  protected indentationLevel: number = 0;
  protected processedNodes: Set<string> = new Set();
  protected variables: Set<string> = new Set();
  protected functions: Set<string> = new Set();
  protected config: LanguageConfig;
  
  /**
   * Constructor
   * @param nodes The nodes in the graph
   * @param edges The edges connecting the nodes
   * @param config The language configuration
   */
  constructor(nodes: Node<BaseNodeData>[], edges: Edge[], config: LanguageConfig) {
    this.nodes = nodes;
    this.edges = edges;
    this.config = config;
  }
  
  /**
   * Main method to generate code from the graph
   * @returns The generated code
   */
  generate(): string {
    this.code = '';
    this.indentationLevel = 0;
    this.processedNodes.clear();
    this.variables.clear();
    this.functions.clear();
    
    // If there are no nodes, return empty code
    if (this.nodes.length === 0) {
      return this.formatComment('No nodes in the graph');
    }
    
    // Add a header to the generated code
    this.addToCode(this.formatComment(`Generated ${this.config.name} code from VVS Web`) + '\n');
    
    // Add language-specific imports or includes
    this.addImports();
    
    // Process the main code (nodes not inside functions)
    const entryPoints = this.findEntryNodes();
    
    if (entryPoints.length === 0) {
      this.addToCode(this.formatComment('No entry points found!'));
    } else {
      // Process each entry point
      entryPoints.forEach(node => {
        this.processNode(node);
      });
    }
    
    return this.formatCode(this.code);
  }
  
  /**
   * Add language-specific imports or includes
   * Override in language-specific implementations
   */
  protected abstract addImports(): void;
  
  /**
   * Format the generated code
   * Override in language-specific implementations if needed
   */
  protected formatCode(code: string): string {
    return code;
  }
  
  /**
   * Format a comment
   * @param comment The comment text
   * @returns Formatted comment
   */
  protected formatComment(comment: string): string {
    return this.config.syntax.lineComment.replace('$comment', comment);
  }
  
  /**
   * Find entry nodes (nodes with no flow inputs)
   */
  protected findEntryNodes(): Node<BaseNodeData>[] {
    return this.nodes.filter(node => {
      // Check if this node has any flow inputs
      const hasFlowInputs = node.data.inputs.some(input => input.type === SocketType.FLOW);
      
      // If it has flow inputs, check if they are all connected
      if (hasFlowInputs) {
        const flowInputs = node.data.inputs.filter(input => input.type === SocketType.FLOW);
        const connectedFlowInputs = flowInputs.filter(input => 
          this.edges.some(e => e.target === node.id && e.targetHandle === input.id)
        );
        
        // If no flow inputs are connected, this is an entry point
        return connectedFlowInputs.length === 0;
      }
      
      // If it has no flow inputs or outputs, it might be a standalone node like a variable definition
      return true;
    });
  }
  
  /**
   * Add node comment to the code if it exists
   * @param node The node to check for comments
   */
  protected addNodeCommentToCode(node: Node<BaseNodeData>): void {
    if (node.data.properties?.comment) {
      const comment = node.data.properties.comment.trim();
      if (comment) {
        this.addToCode(this.formatComment(comment));
      }
    }
  }
  
  /**
   * Process a node and add its code to the output
   */
  protected processNode(node: Node<BaseNodeData>): void {
    // Skip if already processed
    if (this.processedNodes.has(node.id)) return;
    
    // Mark as processed to avoid cycles
    this.processedNodes.add(node.id);
    
    // Add node comment if it exists
    this.addNodeCommentToCode(node);
    
    // Generate code based on node type
    switch (node.data.type) {
      case NodeType.IF_STATEMENT:
        this.generateIfStatementCode(node);
        break;
      case NodeType.FOR_LOOP:
        this.generateForLoopCode(node);
        break;
      case NodeType.AND:
        this.generateAndCode(node);
        break;
      case NodeType.OR:
        this.generateOrCode(node);
        break;
      case NodeType.GREATER_THAN:
        this.generateGreaterThanCode(node);
        break;
      case NodeType.LESS_THAN:
        this.generateLessThanCode(node);
        break;
      case NodeType.EQUAL:
        this.generateEqualCode(node);
        break;
      case NodeType.ADD:
        this.generateAddCode(node);
        break;
      case NodeType.SUBTRACT:
        this.generateSubtractCode(node);
        break;
      case NodeType.MULTIPLY:
        this.generateMultiplyCode(node);
        break;
      case NodeType.DIVIDE:
        this.generateDivideCode(node);
        break;
      case NodeType.VARIABLE_DEFINITION:
        this.generateVariableDefinitionCode(node);
        break;
      case NodeType.VARIABLE_GETTER:
        this.generateVariableGetterCode(node);
        break;
      case NodeType.PRINT:
        this.generatePrintCode(node);
        break;
      case NodeType.USER_INPUT:
        this.generateUserInputCode(node);
        break;
      default:
        this.addToCode(this.formatComment(`Unsupported node type: ${node.data.type}`));
    }
    
    // Process flow output connections
    this.processFlowOutputs(node);
  }
  
  /**
   * Process flow outputs of a node
   */
  protected processFlowOutputs(node: Node<BaseNodeData>): void {
    // Find all flow outputs
    const flowOutputs = node.data.outputs.filter(output => output.type === SocketType.FLOW);
    
    // For each flow output, find connected nodes and process them
    flowOutputs.forEach(output => {
      // Find edges connected to this output
      const connectedEdges = this.edges.filter(e => 
        e.source === node.id && e.sourceHandle === output.id
      );
      
      // Process each connected node
      connectedEdges.forEach(edge => {
        const targetNode = this.nodes.find(n => n.id === edge.target);
        if (targetNode && !this.processedNodes.has(targetNode.id)) {
          this.processNode(targetNode);
        }
      });
    });
  }
  
  /**
   * Add code to the output with proper indentation
   */
  protected addToCode(code: string): void {
    const indent = '  '.repeat(this.indentationLevel);
    this.code += code.split('\n').map(line => line ? indent + line : line).join('\n') + '\n';
  }
  
  /**
   * Increase the indentation level
   */
  protected increaseIndentation(): void {
    this.indentationLevel++;
  }
  
  /**
   * Decrease the indentation level
   */
  protected decreaseIndentation(): void {
    if (this.indentationLevel > 0) {
      this.indentationLevel--;
    }
  }
  
  /**
   * Format user input in the target language
   */
  protected abstract formatUserInput(node: Node<BaseNodeData>): string;
  
  /**
   * Get the value from an input socket by following the connected edge
   * If the socket is not connected, retrieve its default value from the node data
   * @param nodeId The ID of the node
   * @param socketId The ID or name of the input socket
   * @returns A string representation of the value or a default value
   */
  protected getInputValue(nodeId: string, socketId: string, defaultValue: string = 'None'): string {
    // Find the node
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return defaultValue;
    
    // Find the socket by ID or by name
    const socket = node.data.inputs.find(s => 
      s.id === socketId || s.name.toLowerCase() === socketId.toLowerCase()
    );
    if (!socket) return defaultValue;
    
    // Find the edge that connects to this input socket
    const edge = this.edges.find(e => 
      e.target === nodeId && e.targetHandle === socket.id
    );
    
    // If no edge is connected, use the socket's default value if available
    if (!edge) {
      // First check if the socket has a default value set (from the input widget)
      if (socket.defaultValue !== undefined) {
        return this.formatDefaultValue(socket.defaultValue, socket.type);
      }
      
      // If no default value in socket, try to find a matching property in node.data.properties
      // This is particularly useful for nodes like IF_STATEMENT that store condition in properties
      if (node.data.properties && Object.keys(node.data.properties).length > 0) {
        // Try to find a matching property using the socket id or name
        const propertyKey = socketId.toLowerCase();
        const propertyValue = node.data.properties[propertyKey] || node.data.properties[socket.name.toLowerCase()];
        
        if (propertyValue !== undefined) {
          return propertyValue.toString();
        }
      }
      
      return defaultValue;
    }
    
    // Find the source node and socket
    const sourceNode = this.nodes.find(n => n.id === edge.source);
    if (!sourceNode) return defaultValue;
    
    const sourceSocket = sourceNode.data.outputs.find(s => s.id === edge.sourceHandle);
    if (!sourceSocket) return defaultValue;
    
    // Generate code for the source node if it hasn't been processed yet
    if (!this.processedNodes.has(sourceNode.id)) {
      this.processNode(sourceNode);
    }
    
    // Return the appropriate value based on the node type
    switch (sourceNode.data.type) {
      case NodeType.VARIABLE_DEFINITION:
        // Use the same property lookup logic we use elsewhere
        return this.getInputValue(sourceNode.id, 'name', defaultValue);
        
      case NodeType.VARIABLE_GETTER:
        // Use the same property lookup logic we use elsewhere
        return this.getInputValue(sourceNode.id, 'name', defaultValue);
        
      case NodeType.USER_INPUT:
        return this.formatUserInput(sourceNode);
        
      case NodeType.ADD:
      case NodeType.SUBTRACT:
      case NodeType.MULTIPLY:
      case NodeType.DIVIDE:
      case NodeType.AND:
      case NodeType.OR:
      case NodeType.GREATER_THAN:
      case NodeType.LESS_THAN:
      case NodeType.EQUAL:
        // For operations, we need to generate a variable to hold the result
        const opVarName = `_temp_${sourceNode.id.replace(/-/g, '_')}`;
        return opVarName;
        
      default:
        return defaultValue;
    }
  }
  
  /**
   * Format default value based on its type
   * @param value The value to format
   * @param type The socket type
   * @returns Formatted value as a string
   */
  protected formatDefaultValue(value: any, type: SocketType): string {
    // Handle undefined or null values
    if (value === undefined || value === null) {
      return 'None';
    }
    
    // Handle different socket types
    switch (type) {
      case SocketType.BOOLEAN:
        // Ensure boolean values are properly formatted
        return value === true ? 'true' : 'false';
        
      case SocketType.NUMBER:
        // Handle numeric values
        if (typeof value === 'string') {
          // Try to parse string as number
          const num = parseFloat(value);
          return isNaN(num) ? '0' : num.toString();
        }
        return value.toString();
        
      case SocketType.STRING:
        // Ensure strings are properly quoted
        if (typeof value === 'string') {
          // Escape quotes in the string
          const escaped = value.replace(/"/g, '\\"');
          return `"${escaped}"`;
        }
        // Convert non-string values to quoted strings
        return `"${value.toString()}"`;
        
      case SocketType.ANY:
        // Handle any type based on the actual value type
        if (typeof value === 'boolean') {
          return value ? 'true' : 'false';
        } else if (typeof value === 'number') {
          return value.toString();
        } else if (typeof value === 'string') {
          // Escape quotes in the string
          const escaped = value.replace(/"/g, '\\"');
          return `"${escaped}"`;
        } else if (typeof value === 'object') {
          try {
            // Try to stringify objects
            return JSON.stringify(value);
          } catch (e) {
            return '{}';
          }
        }
        // Fallback for other types
        return value.toString();
        
      default:
        // Default fallback
        return value.toString();
    }
  }
  
  // Abstract methods for specific node code generation
  protected abstract generateIfStatementCode(node: Node<BaseNodeData>): void;
  protected abstract generateForLoopCode(node: Node<BaseNodeData>): void;
  protected abstract generateAndCode(node: Node<BaseNodeData>): void;
  protected abstract generateOrCode(node: Node<BaseNodeData>): void;
  protected abstract generateGreaterThanCode(node: Node<BaseNodeData>): void;
  protected abstract generateLessThanCode(node: Node<BaseNodeData>): void;
  protected abstract generateEqualCode(node: Node<BaseNodeData>): void;
  protected abstract generateAddCode(node: Node<BaseNodeData>): void;
  protected abstract generateSubtractCode(node: Node<BaseNodeData>): void;
  protected abstract generateMultiplyCode(node: Node<BaseNodeData>): void;
  protected abstract generateDivideCode(node: Node<BaseNodeData>): void;
  protected abstract generateVariableDefinitionCode(node: Node<BaseNodeData>): void;
  protected abstract generateVariableGetterCode(node: Node<BaseNodeData>): void;
  protected abstract generatePrintCode(node: Node<BaseNodeData>): void;
  protected abstract generateUserInputCode(node: Node<BaseNodeData>): void;
} 