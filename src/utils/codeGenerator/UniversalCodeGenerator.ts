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
    
    // Remove quotes from variable names (they should never be quoted)
    const cleanName = this.cleanValue(name, 'string');
    
    this.variables.add(cleanName);
    
    let code = this.config.syntax.variableDefinition;
    
    // Handle type inference for statically typed languages
    const languageName = this.config.name.toLowerCase();
    
    if (languageName === 'java') {
      // Try to determine the type from the value
      let type = 'Object';
      
      // Store original value without quotes for numeric checking
      const numericValue = this.cleanValue(value, 'string');
      
      if (value.startsWith('"') || value.startsWith("'")) {
        type = 'String';
      } else if (value === 'true' || value === 'false') {
        type = 'boolean';
      } else if (!isNaN(Number(numericValue))) {
        // Use the cleaned value for numeric checks
        // Check if it's likely a decimal
        type = numericValue.includes('.') ? 'double' : 'int';
      }
      
      code = code.replace('$type', type);
    } 
    else if (languageName === 'c++') {
      // Determine the C++ type
      let type = 'auto';
      
      // Store original value without quotes for numeric checking
      const numericValue = this.cleanValue(value, 'string');
      
      if (value.startsWith('"') || value.startsWith("'")) {
        type = 'std::string';
      } else if (value === 'true' || value === 'false') {
        type = 'bool';
      } else if (!isNaN(Number(numericValue))) {
        // Use the cleaned value for numeric checks
        // Check if it's likely a decimal
        type = numericValue.includes('.') ? 'double' : 'int';
      }
      
      code = code.replace('$type', type);
    }
    
    // Replace other template variables
    code = code.replace('$name', cleanName)
               .replace('$value', value);
    
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
    
    // Clean variable name by removing quotes
    const cleanVariable = this.cleanValue(variable, 'string');
    
    // Add variable to known variables
    this.variables.add(cleanVariable);
    
    // For loop - handle all occurrences of $variable in the template
    let forCode = this.config.syntax.forLoop
      .replace(/\$variable/g, cleanVariable)
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
    const prompt = this.getInputValue(node.id, 'prompt', '"Enter a value: "');
    const variableName = node.data.properties?.variableName || 'input';
    
    const languageName = this.config.name.toLowerCase();
    
    if (languageName === 'python') {
      // Python input
      const code = `${variableName} = ${this.config.syntax.input.replace('$prompt', prompt)}`;
      this.addToCode(code);
      this.addLineEnd();
    } 
    else if (languageName === 'typescript' || languageName === 'javascript') {
      // JavaScript/TypeScript prompt
      this.addToCode(`const ${variableName} = prompt(${prompt});`);
      this.addLineEnd();
    } 
    else if (languageName === 'java') {
      // Java input
      this.addToCode(`System.out.print(${prompt});`);
      this.addLineEnd();
      this.addToCode(`String ${variableName} = scanner.nextLine();`);
      this.addLineEnd();
    } 
    else if (languageName === 'c++') {
      // C++ input
      this.addToCode(`std::cout << ${prompt};`);
      this.addLineEnd();
      this.addToCode(`std::string ${variableName};`);
      this.addLineEnd();
      this.addToCode(`std::getline(std::cin, ${variableName});`);
      this.addLineEnd();
    } 
    else if (languageName === 'go') {
      // Go input handling
      this.addToCode(`fmt.Print(${prompt});`);
      this.addLineEnd();
      this.addToCode(`${variableName}, _ := reader.ReadString('\\n');`);
      this.addLineEnd();
      this.addToCode(`${variableName} = strings.TrimSpace(${variableName});`);
      this.addLineEnd();
    } 
    else {
      // Generic fallback
      this.addToCode(`// Input: ${prompt} -> ${variableName}`);
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
    const connections = this.getConnectionsFromOutput(node.id, socketName);
    
    for (const connection of connections) {
      const targetNode = this.nodes.find(n => n.id === connection.target);
      if (targetNode && !this.processedNodes.has(targetNode.id)) {
        this.processNode(targetNode);
      }
    }
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
   * Get the value for an input socket, either from a connected node or default value
   * @param nodeId The ID of the node
   * @param inputName The name of the input socket
   * @param defaultValue Default value if no connection or value is found
   * @returns The value for the input
   */
  protected getInputValue(nodeId: string, inputName: string, defaultValue: string): string {
    // Find the node
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return defaultValue;
    
    // Find the input socket
    const input = node.data.inputs?.find(i => i.name === inputName || i.id === inputName);
    if (!input) return defaultValue;
    
    // Check if this input is connected to an output
    const connection = this.edges.find(
      edge => edge.target === nodeId && edge.targetHandle === input.id
    );
    
    if (connection) {
      // Find the source node of the connection
      const sourceNode = this.nodes.find(n => n.id === connection.source);
      if (!sourceNode) return input.defaultValue || defaultValue;
      
      // Find the source socket
      const sourceSocket = sourceNode.data.outputs?.find(o => o.id === connection.sourceHandle);
      if (!sourceSocket) return input.defaultValue || defaultValue;
      
      // If it's a variable getter or variable definition, return the variable name
      if (sourceNode.data.type === NodeType.VARIABLE_GETTER) {
        const varName = this.getInputValue(sourceNode.id, 'name', 'unknown');
        return varName.replace(/["']/g, ''); // Remove quotes from variable names
      }
      
      if (sourceNode.data.type === NodeType.VARIABLE_DEFINITION) {
        const varName = this.getInputValue(sourceNode.id, 'name', 'unknown');
        return varName.replace(/["']/g, ''); // Remove quotes from variable names
      }
      
      // For math operations, process the operation and return result
      if (
        sourceNode.data.type === NodeType.ADD ||
        sourceNode.data.type === NodeType.SUBTRACT ||
        sourceNode.data.type === NodeType.MULTIPLY ||
        sourceNode.data.type === NodeType.DIVIDE
      ) {
        let operatorTemplate = '';
        switch (sourceNode.data.type) {
          case NodeType.ADD:
            operatorTemplate = this.config.operators.add;
            break;
          case NodeType.SUBTRACT:
            operatorTemplate = this.config.operators.subtract;
            break;
          case NodeType.MULTIPLY:
            operatorTemplate = this.config.operators.multiply;
            break;
          case NodeType.DIVIDE:
            operatorTemplate = this.config.operators.divide;
            break;
        }
        return this.processMathOperation(sourceNode, operatorTemplate);
      }
      
      // For logic operations, process the operation and return result
      if (
        sourceNode.data.type === NodeType.AND ||
        sourceNode.data.type === NodeType.OR ||
        sourceNode.data.type === NodeType.GREATER_THAN ||
        sourceNode.data.type === NodeType.LESS_THAN ||
        sourceNode.data.type === NodeType.EQUAL
      ) {
        let operatorTemplate = '';
        switch (sourceNode.data.type) {
          case NodeType.AND:
            operatorTemplate = this.config.operators.and;
            break;
          case NodeType.OR:
            operatorTemplate = this.config.operators.or;
            break;
          case NodeType.GREATER_THAN:
            operatorTemplate = this.config.operators.greaterThan;
            break;
          case NodeType.LESS_THAN:
            operatorTemplate = this.config.operators.lessThan;
            break;
          case NodeType.EQUAL:
            operatorTemplate = this.config.operators.equal;
            break;
        }
        return this.processMathOperation(sourceNode, operatorTemplate);
      }
      
      // For user input, return the variable name
      if (sourceNode.data.type === NodeType.USER_INPUT) {
        const varName = sourceNode.data.properties?.variableName || 'input';
        return varName;
      }
    }
    
    // If no valid connection, return default value from the input socket
    return input.defaultValue || defaultValue;
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
  
  /**
   * Get all connections from a specific output socket of a node
   * @param nodeId The node ID
   * @param socketName The name of the output socket
   * @returns Array of connections from the output socket
   */
  protected getConnectionsFromOutput(nodeId: string, socketName: string): Edge[] {
    // Find the node
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return [];
    
    // Find the socket by name
    const socket = node.data.outputs?.find(output => 
      output.name === socketName || output.id === socketName
    );
    if (!socket) return [];
    
    // Find all connected edges
    return this.edges.filter(edge => 
      edge.source === nodeId && edge.sourceHandle === socket.id
    );
  }
  
  /**
   * Clean a value by removing quotes if it's a string
   * @param value The value to clean
   * @param type Optional type hint (force string cleaning)
   * @returns The cleaned value
   */
  protected cleanValue(value: string, type?: string): string {
    if (!value) return '';
    
    // Always remove quotes for string type
    if (type === 'string' || 
        (value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      // Remove surrounding quotes
      return value.replace(/^["']|["']$/g, '');
    }
    
    return value;
  }
} 