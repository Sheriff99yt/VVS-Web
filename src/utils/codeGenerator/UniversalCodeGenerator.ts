import { Edge, Node } from 'reactflow';
import { BaseNodeData, NodeType } from '../../nodes/types';
import { SocketType } from '../../sockets/types';
import { LanguageConfig } from '../languageConfig';

/**
 * A universal code generator that works with any language configuration
 */
export class UniversalCodeGenerator {
  protected nodes: Node<BaseNodeData>[];
  protected edges: Edge[];
  protected config: LanguageConfig;
  protected code: string = '';
  protected indentationLevel: number = 0;
  protected processedNodes: Set<string> = new Set();
  protected variables: Set<string> = new Set();
  protected functions: Set<string> = new Set();
  
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
   * Generate code for the given language
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
    
    // Add header comment
    this.addToCode(this.formatComment(`Generated ${this.config.name} code from VVS Web`) + '\n');
    
    // Add standard imports
    this.addImports();
    
    // For languages that require special handling
    const languageName = this.config.name.toLowerCase();
    const isJava = languageName === 'java';
    const isGo = languageName === 'go';
    
    // Process all nodes (starting with entry points)
    this.processEntryPoints();
    
    // Add closing code for languages that need it
    if (isJava) {
      this.addJavaClosing();
    } else if (isGo) {
      this.addGoClosing();
    }
    
    return this.code;
  }
  
  /**
   * Add standard imports for the language
   */
  protected addImports(): void {
    if (this.config.standardImports && this.config.standardImports.length > 0) {
      for (const importStatement of this.config.standardImports) {
        this.addToCode(importStatement);
        this.addLineEnd();
      }
      this.addToCode('\n');
    }
  }
  
  /**
   * Process all entry points in the graph
   * Entry points are nodes that have no incoming connections to their flow inputs
   */
  protected processEntryPoints(): void {
    // Find all nodes without incoming flow connections (entry points)
    const entryPoints = this.findEntryPoints();
    
    // If no entry points found, just process all nodes
    if (entryPoints.length === 0) {
      for (const node of this.nodes) {
        this.processNode(node);
      }
      return;
    }
    
    // Process each entry point
    for (const entryPoint of entryPoints) {
      this.processNode(entryPoint);
    }
  }
  
  /**
   * Find all entry points (nodes without incoming flow connections)
   * @returns Array of entry point nodes
   */
  protected findEntryPoints(): Node<BaseNodeData>[] {
    // Get all nodes with flow inputs
    const nodesWithFlowInputs = this.nodes.filter(node => 
      node.data.inputs && node.data.inputs.some(input => input.type === SocketType.FLOW)
    );
    
    // Get all target node IDs from flow connections
    const flowTargetIds = new Set<string>();
    this.edges.forEach(edge => {
      const sourceNode = this.nodes.find(n => n.id === edge.source);
      if (sourceNode) {
        const sourceOutput = sourceNode.data.outputs?.find(o => o.id === edge.sourceHandle);
        if (sourceOutput && sourceOutput.type === SocketType.FLOW) {
          flowTargetIds.add(edge.target);
        }
      }
    });
    
    // Return nodes with flow inputs that have no incoming flow connections
    return nodesWithFlowInputs.filter(node => !flowTargetIds.has(node.id));
  }
  
  /**
   * Process a node based on its type
   * @param node The node to process
   */
  protected processNode(node: Node<BaseNodeData>): void {
    // Skip if already processed
    if (this.processedNodes.has(node.id)) return;
    
    // Add node comment if available
    if (node.data.properties?.comment) {
      this.addToCode(this.formatComment(node.data.properties.comment));
      this.addLineEnd();
    }
    
    // Mark as processed
    this.processedNodes.add(node.id);
    
    // Process based on node type
    switch (node.data.type) {
      case NodeType.VARIABLE_DEFINITION:
        this.processVariableDefinition(node);
        break;
      case NodeType.VARIABLE_GETTER:
        // Variable getters are handled inline when used
        break;
      case NodeType.IF_STATEMENT:
        this.processIfStatement(node);
        break;
      case NodeType.FOR_LOOP:
        this.processForLoop(node);
        break;
      case NodeType.PRINT:
        this.processPrint(node);
        break;
      case NodeType.USER_INPUT:
        this.processInput(node);
        break;
      // Math operations
      case NodeType.ADD:
      case NodeType.SUBTRACT:
      case NodeType.MULTIPLY:
      case NodeType.DIVIDE:
        // Math operations are handled inline when used
        break;
      // Logic operations
      case NodeType.AND:
      case NodeType.OR:
      case NodeType.GREATER_THAN:
      case NodeType.LESS_THAN:
      case NodeType.EQUAL:
        // Logic operations are handled inline when used
        break;
      default:
        this.addToCode(this.formatComment(`Unsupported node type: ${node.data.type}`));
        this.addLineEnd();
    }
  }
  
  /**
   * Process a variable definition node
   * @param node The variable definition node
   */
  protected processVariableDefinition(node: Node<BaseNodeData>): void {
    const name = this.getInputValue(node.id, 'name', 'variable');
    const value = this.getInputValue(node.id, 'value', '0');
    
    this.variables.add(name);
    
    let code = this.config.syntax.variableDefinition
      .replace('$name', name)
      .replace('$value', value);
    
    // Add type hints for statically typed languages
    if (this.config.name.toLowerCase() === 'java') {
      // Try to determine the type from the value
      let type = 'Object';
      if (value.startsWith('"') || value.startsWith("'")) {
        type = 'String';
      } else if (value === 'true' || value === 'false') {
        type = 'boolean';
      } else if (!isNaN(Number(value))) {
        // Check if it's likely a decimal
        type = value.includes('.') ? 'double' : 'int';
      }
      
      code = code.replace('$type', type);
    }
    
    this.addToCode(code);
    this.addLineEnd();
    
    // Process connected flow output
    this.processFlowOutput(node);
  }
  
  /**
   * Process an if statement node
   * @param node The if statement node
   */
  protected processIfStatement(node: Node<BaseNodeData>): void {
    const condition = this.getInputValue(node.id, 'condition', 'true');
    
    // If statement
    const ifCode = this.config.syntax.ifStatement.replace('$condition', condition);
    this.addToCode(ifCode);
    
    // If block
    this.addBlockStart();
    this.processOutputSocket(node, 'then');
    this.addBlockEnd();
    
    // Check if else path is connected
    if (this.isOutputConnected(node, 'else')) {
      this.addToCode(this.config.syntax.elseStatement);
      this.addBlockStart();
      this.processOutputSocket(node, 'else');
      this.addBlockEnd();
    }
    
    // Process connected flow output
    this.processFlowOutput(node);
  }
  
  /**
   * Process a for loop node
   * @param node The for loop node
   */
  protected processForLoop(node: Node<BaseNodeData>): void {
    const variable = this.getInputValue(node.id, 'variable', 'i');
    const start = this.getInputValue(node.id, 'start', '0');
    const end = this.getInputValue(node.id, 'end', '10');
    
    // Add variable to known variables
    this.variables.add(variable);
    
    // For loop
    const forCode = this.config.syntax.forLoop
      .replace('$variable', variable)
      .replace('$start', start)
      .replace('$end', end);
    
    this.addToCode(forCode);
    
    // Loop body
    this.addBlockStart();
    this.processOutputSocket(node, 'body');
    this.addBlockEnd();
    
    // Process connected flow output
    this.processFlowOutput(node);
  }
  
  /**
   * Process a print node
   * @param node The print node
   */
  protected processPrint(node: Node<BaseNodeData>): void {
    const value = this.getInputValue(node.id, 'value', '""');
    
    const printCode = this.config.syntax.print.replace('$value', value);
    this.addToCode(printCode);
    this.addLineEnd();
    
    // Process connected flow output
    this.processFlowOutput(node);
  }
  
  /**
   * Process an input node
   * @param node The input node
   */
  protected processInput(node: Node<BaseNodeData>): void {
    const prompt = this.getInputValue(node.id, 'prompt', '""');
    const variable = this.getInputValue(node.id, 'variable', 'userInput');
    
    // Add variable to known variables
    this.variables.add(variable);
    
    const languageName = this.config.name.toLowerCase();
    
    if (languageName === 'go') {
      // Special handling for Go input
      this.addToCode(`fmt.Print(${prompt})`);
      this.addLineEnd();
      this.addToCode(`${variable}, _ := reader.ReadString('\\n')`);
      this.addLineEnd();
      this.addToCode(`${variable} = strings.TrimSpace(${variable})`);
      this.addLineEnd();
    } else {
      // Default handling for other languages
      const inputCode = this.config.syntax.variableDefinition
        .replace('$name', variable)
        .replace('$value', this.config.syntax.input.replace('$prompt', prompt))
        .replace('$variable', variable)
        .replace('$type', 'String'); // For languages that need type
      
      this.addToCode(inputCode);
      this.addLineEnd();
    }
    
    // Process connected flow output
    this.processFlowOutput(node);
  }
  
  /**
   * Process a function definition node
   * @param node The function definition node
   */
  protected processFunctionDefinition(node: Node<BaseNodeData>): void {
    const name = this.getInputValue(node.id, 'name', 'myFunction');
    const parameters = this.getInputValue(node.id, 'parameters', '');
    
    // Add function to known functions
    this.functions.add(name);
    
    const functionCode = this.config.syntax.functionDefinition
      .replace('$name', name)
      .replace('$parameters', parameters);
    
    this.addToCode(functionCode);
    
    // Function body
    this.addBlockStart();
    this.processOutputSocket(node, 'body');
    this.addBlockEnd();
    
    // Add extra line after function definition
    this.addToCode('\n');
    
    // Process connected flow output
    this.processFlowOutput(node);
  }
  
  /**
   * Process a function call node
   * @param node The function call node
   */
  protected processFunctionCall(node: Node<BaseNodeData>): void {
    const name = this.getInputValue(node.id, 'name', 'myFunction');
    const arguments_ = this.getInputValue(node.id, 'arguments', '');
    
    const callCode = this.config.syntax.functionCall
      .replace('$name', name)
      .replace('$arguments', arguments_);
    
    this.addToCode(callCode);
    this.addLineEnd();
    
    // Process connected flow output
    this.processFlowOutput(node);
  }
  
  /**
   * Process connected flow output
   * @param node The node with flow output
   */
  protected processFlowOutput(node: Node<BaseNodeData>): void {
    // Find flow output socket
    const flowOutput = node.data.outputs?.find(output => output.type === SocketType.FLOW);
    if (!flowOutput) return;
    
    // Find connected edge
    const edge = this.edges.find(e => 
      e.source === node.id && e.sourceHandle === flowOutput.id
    );
    if (!edge) return;
    
    // Find target node
    const targetNode = this.nodes.find(n => n.id === edge.target);
    if (!targetNode) return;
    
    // Process target node
    this.processNode(targetNode);
  }
  
  /**
   * Process a specific output socket
   * @param node The node
   * @param socketName The name of the output socket
   */
  protected processOutputSocket(node: Node<BaseNodeData>, socketName: string): void {
    // Find the socket by name
    const socket = node.data.outputs?.find(output => 
      output.type === SocketType.FLOW && output.name === socketName
    );
    if (!socket) return;
    
    // Find connected edge
    const edge = this.edges.find(e => 
      e.source === node.id && e.sourceHandle === socket.id
    );
    if (!edge) return;
    
    // Find target node
    const targetNode = this.nodes.find(n => n.id === edge.target);
    if (!targetNode) return;
    
    // Process target node
    this.processNode(targetNode);
  }
  
  /**
   * Check if an output socket is connected
   * @param node The node
   * @param socketName The name of the output socket
   * @returns True if the socket is connected, false otherwise
   */
  protected isOutputConnected(node: Node<BaseNodeData>, socketName: string): boolean {
    // Find the socket by name
    const socket = node.data.outputs?.find(output => 
      output.type === SocketType.FLOW && output.name === socketName
    );
    if (!socket) return false;
    
    // Check if any edge is connected to this socket
    return this.edges.some(e => 
      e.source === node.id && e.sourceHandle === socket.id
    );
  }
  
  /**
   * Get the value of an input socket
   * @param nodeId The node ID
   * @param inputName The name of the input socket
   * @param defaultValue The default value if not found
   * @returns The value of the input
   */
  protected getInputValue(nodeId: string, inputName: string, defaultValue: string): string {
    // Find the node
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return defaultValue;
    
    // Find the socket by name
    const socket = node.data.inputs?.find(input => input.name === inputName);
    if (!socket) return defaultValue;
    
    // Check if socket has a default value
    if (socket.defaultValue !== undefined && socket.defaultValue !== null) {
      if (typeof socket.defaultValue === 'string') {
        // For strings, wrap in quotes if not already
        if (socket.type === SocketType.STRING && 
            !socket.defaultValue.startsWith('"') && 
            !socket.defaultValue.startsWith("'")) {
          return `"${socket.defaultValue}"`;
        }
        return socket.defaultValue;
      }
      return String(socket.defaultValue);
    }
    
    // Check if socket is connected
    const edge = this.edges.find(e => 
      e.target === nodeId && e.targetHandle === socket.id
    );
    
    if (!edge) return defaultValue;
    
    // Find source node and socket
    const sourceNode = this.nodes.find(n => n.id === edge.source);
    if (!sourceNode) return defaultValue;
    
    const sourceSocket = sourceNode.data.outputs?.find(output => 
      output.id === edge.sourceHandle
    );
    if (!sourceSocket) return defaultValue;
    
    // Process based on source node type
    switch (sourceNode.data.type) {
      case NodeType.VARIABLE_GETTER:
        return this.getInputValue(sourceNode.id, 'name', 'unknown_var');
      case NodeType.ADD:
        return this.processMathOperation(sourceNode, this.config.operators.add);
      case NodeType.SUBTRACT:
        return this.processMathOperation(sourceNode, this.config.operators.subtract);
      case NodeType.MULTIPLY:
        return this.processMathOperation(sourceNode, this.config.operators.multiply);
      case NodeType.DIVIDE:
        return this.processMathOperation(sourceNode, this.config.operators.divide);
      case NodeType.AND:
        return this.processMathOperation(sourceNode, this.config.operators.and);
      case NodeType.OR:
        return this.processMathOperation(sourceNode, this.config.operators.or);
      case NodeType.GREATER_THAN:
        return this.processMathOperation(sourceNode, this.config.operators.greaterThan);
      case NodeType.LESS_THAN:
        return this.processMathOperation(sourceNode, this.config.operators.lessThan);
      case NodeType.EQUAL:
        return this.processMathOperation(sourceNode, this.config.operators.equal);
      case NodeType.USER_INPUT:
        return this.getInputValue(sourceNode.id, 'variable', 'userInput');
      default:
        // For other node types, use the output value if available
        if (sourceSocket.defaultValue !== undefined && sourceSocket.defaultValue !== null) {
          return String(sourceSocket.defaultValue);
        }
        return defaultValue;
    }
  }
  
  /**
   * Process a math operation
   * @param node The math operation node
   * @param operatorTemplate The template for the operator
   * @returns The formatted math operation
   */
  protected processMathOperation(node: Node<BaseNodeData>, operatorTemplate: string): string {
    const left = this.getInputValue(node.id, 'left', '0');
    const right = this.getInputValue(node.id, 'right', '0');
    
    return operatorTemplate
      .replace('$left', left)
      .replace('$right', right);
  }
  
  /**
   * Format a comment
   * @param comment The comment text
   * @returns The formatted comment
   */
  protected formatComment(comment: string): string {
    return this.config.syntax.lineComment.replace('$comment', comment);
  }
  
  /**
   * Add code with proper indentation
   * @param code The code to add
   */
  protected addToCode(code: string): void {
    const indent = this.config.formatting.indentation.repeat(this.indentationLevel);
    this.code += code.split('\n').map(line => line ? indent + line : line).join('\n');
  }
  
  /**
   * Add a line ending (statement end + newline)
   */
  protected addLineEnd(): void {
    if (this.config.formatting.statementEnd) {
      this.code += this.config.formatting.statementEnd;
    }
    this.code += '\n';
  }
  
  /**
   * Add block start and increase indentation
   */
  protected addBlockStart(): void {
    if (this.config.formatting.blockStart) {
      this.code += this.config.formatting.blockStart;
    }
    this.code += '\n';
    this.indentationLevel++;
  }
  
  /**
   * Decrease indentation and add block end
   */
  protected addBlockEnd(): void {
    this.indentationLevel--;
    if (this.config.formatting.blockEnd) {
      this.addToCode(this.config.formatting.blockEnd);
      this.code += '\n';
    }
  }
  
  /**
   * Add Java-specific closing code
   */
  protected addJavaClosing(): void {
    this.indentationLevel = 1; // For closing the main method
    this.addToCode("}\n");
    
    this.indentationLevel = 0; // For closing the class
    this.addToCode("}\n");
  }
  
  /**
   * Add Go-specific closing code
   */
  protected addGoClosing(): void {
    this.indentationLevel = 1; // For closing the main function
    this.addToCode("}\n");
  }
} 