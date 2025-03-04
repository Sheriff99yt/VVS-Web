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
    
    // First, process function definitions
    this.nodes
      .filter(node => node.data.type === NodeType.FUNCTION_DEFINITION)
      .forEach(node => this.processNode(node));
    
    // Then process the main code (nodes not inside functions)
    const entryPoints = this.findEntryNodes();
    
    if (entryPoints.length === 0) {
      this.addToCode('\n' + this.formatComment('Warning: No clear entry points found in graph') + '\n');
      
      // Process any remaining nodes
      this.nodes
        .filter(node => !this.processedNodes.has(node.id))
        .forEach(node => this.processNode(node));
    } else {
      // Process each entry point
      entryPoints.forEach(node => this.processNode(node));
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
   * Find entry nodes (nodes with no incoming flow connections)
   * @returns Array of entry nodes
   */
  protected findEntryNodes(): Node<BaseNodeData>[] {
    // Get all nodes that are targets of flow connections
    const targetNodeIds = new Set<string>();
    
    this.edges.forEach(edge => {
      const sourceNode = this.nodes.find(n => n.id === edge.source);
      if (sourceNode) {
        const sourceSocket = sourceNode.data.outputs.find(s => s.id === edge.sourceHandle);
        if (sourceSocket && sourceSocket.type === SocketType.FLOW) {
          targetNodeIds.add(edge.target);
        }
      }
    });
    
    // Find nodes that have flow outputs but are not targets of flow connections
    return this.nodes.filter(node => {
      const hasFlowOutput = node.data.outputs.some(s => s.type === SocketType.FLOW);
      return hasFlowOutput && !targetNodeIds.has(node.id);
    });
  }
  
  /**
   * Process a single node and generate code for it
   * This is a stub implementation that will be expanded for each node type
   */
  protected processNode(node: Node<BaseNodeData>): void {
    // Skip if already processed
    if (this.processedNodes.has(node.id)) {
      return;
    }
    
    // Mark as processed
    this.processedNodes.add(node.id);
    
    // Generate code based on node type
    switch (node.data.type) {
      case NodeType.PRINT:
        this.generatePrintCode(node);
        break;
      
      case NodeType.VARIABLE_DEFINITION:
        this.generateVariableDefinitionCode(node);
        break;
      
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
        
      case NodeType.VARIABLE_GETTER:
        this.generateVariableGetterCode(node);
        break;
        
      case NodeType.USER_INPUT:
        this.generateUserInputCode(node);
        break;
        
      case NodeType.FUNCTION_DEFINITION:
        this.generateFunctionDefinitionCode(node);
        break;
        
      case NodeType.FUNCTION_CALL:
        this.generateFunctionCallCode(node);
        break;
        
      // Placeholder for other node types
      default:
        this.addToCode(this.formatComment(`Code generation for ${node.data.type} not implemented yet`) + '\n');
        break;
    }
    
    // Find and process the next flow node
    this.processNextFlowNode(node);
  }
  
  /**
   * Process the next node in the flow
   * @param node The current node
   */
  protected processNextFlowNode(node: Node<BaseNodeData>): void {
    // Find flow output sockets
    const flowOutputs = node.data.outputs.filter(s => s.type === SocketType.FLOW);
    
    // For each flow output, find connected nodes and process them
    flowOutputs.forEach(socket => {
      const edge = this.edges.find(e => 
        e.source === node.id && e.sourceHandle === socket.id
      );
      
      if (edge) {
        const nextNode = this.nodes.find(n => n.id === edge.target);
        if (nextNode && !this.processedNodes.has(nextNode.id)) {
          this.processNode(nextNode);
        }
      }
    });
  }
  
  /**
   * Get the value from an input socket by following the connected edge
   * @param nodeId The ID of the node
   * @param socketId The ID of the input socket
   * @returns A string representation of the value or a default value
   */
  protected getInputValue(nodeId: string, socketId: string, defaultValue: string = 'None'): string {
    // Find the edge that connects to this input socket
    const edge = this.edges.find(e => 
      e.target === nodeId && e.targetHandle === socketId
    );
    
    if (!edge) return defaultValue;
    
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
        return sourceNode.data.properties?.name || defaultValue;
        
      case NodeType.VARIABLE_GETTER:
        return sourceNode.data.properties?.name || defaultValue;
        
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
   * Format user input based on language
   * @param node The user input node
   * @returns Formatted user input code
   */
  protected abstract formatUserInput(node: Node<BaseNodeData>): string;
  
  /**
   * Add code to the output with proper indentation
   * @param code The code to add
   */
  protected addToCode(code: string): void {
    const lines = code.split('\n');
    lines.forEach(line => {
      if (line.trim() !== '') {
        this.code += this.getIndentation() + line + '\n';
      } else {
        this.code += '\n';
      }
    });
  }
  
  /**
   * Get the current indentation string
   * @returns Indentation string
   */
  protected getIndentation(): string {
    return this.config.formatting.indentation.repeat(this.indentationLevel);
  }
  
  /**
   * Increase the indentation level
   */
  protected increaseIndent(): void {
    this.indentationLevel++;
  }
  
  /**
   * Decrease the indentation level
   */
  protected decreaseIndent(): void {
    if (this.indentationLevel > 0) {
      this.indentationLevel--;
    }
  }
  
  // Abstract methods for node-specific code generation
  protected abstract generatePrintCode(node: Node<BaseNodeData>): void;
  protected abstract generateVariableDefinitionCode(node: Node<BaseNodeData>): void;
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
  protected abstract generateVariableGetterCode(node: Node<BaseNodeData>): void;
  protected abstract generateUserInputCode(node: Node<BaseNodeData>): void;
  protected abstract generateFunctionDefinitionCode(node: Node<BaseNodeData>): void;
  protected abstract generateFunctionCallCode(node: Node<BaseNodeData>): void;
} 