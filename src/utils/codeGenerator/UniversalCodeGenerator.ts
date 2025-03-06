import { Edge, Node } from 'reactflow';
import { BaseNodeData, NodeType } from '../../nodes/types';
import { SocketType, InputWidgetConfig, WidgetType } from '../../sockets/types';
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
  // Add output handlers map for socket processing
  protected socketOutputHandlers: Record<string, (node: Node<BaseNodeData>, socketId: string) => string> = {};
  
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
   * Get the value from an input socket by following the connected edge
   * If the socket is not connected, retrieve its default value from the node data
   * @param nodeId The ID of the node
   * @param socketId The ID or name of the input socket
   * @returns A string representation of the value or a default value
   */
  protected getInputValue(nodeId: string, socketId: string, defaultValue: string = 'undefined'): string {
    // Find the node and socket
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return defaultValue;
    
    const socket = node.data.inputs?.find(s => s.id === socketId);
    if (!socket) return defaultValue;
    
    // Check if there are any edges connected to this socket
    const connectedEdges = this.edges.filter(e => e.target === nodeId && e.targetHandle === socketId);
    if (connectedEdges.length === 0) {
      // No connections, try to get the value from different sources
      
      // First check if the value is in the node's properties
      if (node.data.properties) {
        // Check by socket ID
        if (node.data.properties[socketId] !== undefined && node.data.properties[socketId] !== "undefined") {
          return this.formatDefaultValue(node.data.properties[socketId], socket.type);
        }
        
        // Check by socket name
        if (socket.name && 
            node.data.properties[socket.name.toLowerCase()] !== undefined && 
            node.data.properties[socket.name.toLowerCase()] !== "undefined") {
          return this.formatDefaultValue(node.data.properties[socket.name.toLowerCase()], socket.type);
        }
      }
      
      // Next check if the socket has a default value
      if (socket.defaultValue !== undefined && socket.defaultValue !== "undefined") {
        return this.formatDefaultValue(socket.defaultValue, socket.type);
      }
      
      // If we get here, use type-appropriate defaults instead of 'undefined'
      if (socket.type === SocketType.NUMBER) {
        return '0';
      } else if (socket.type === SocketType.STRING) {
        return '""';
      } else if (socket.type === SocketType.BOOLEAN) {
        return 'false';
      }
      
      return defaultValue;
    }
    
    // Get the source node and socket
    const edge = connectedEdges[0]; // Use the first connection
    const sourceNode = this.nodes.find(n => n.id === edge.source);
    if (!sourceNode) return defaultValue;
    
    const sourceSocket = sourceNode.data.outputs?.find(s => s.id === edge.sourceHandle);
    if (!sourceSocket) return defaultValue;
    
    // Check the source node type to determine how to get the value
    switch (sourceNode.data.type) {
      case NodeType.VARIABLE_GETTER:
        // For variable getters, get the variable name
        const varName = sourceNode.data.properties?.name || 'undefined_var';
        return varName;
        
      case NodeType.ADD:
      case NodeType.SUBTRACT:
      case NodeType.MULTIPLY:
      case NodeType.DIVIDE:
      case NodeType.GREATER_THAN:
      case NodeType.LESS_THAN:
      case NodeType.EQUAL:
      case NodeType.AND:
      case NodeType.OR:
      case NodeType.NOT:
        // Get the appropriate operator template based on node type
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
          case NodeType.GREATER_THAN:
            operatorTemplate = this.config.operators.greaterThan;
            break;
          case NodeType.LESS_THAN:
            operatorTemplate = this.config.operators.lessThan;
            break;
          case NodeType.EQUAL:
            operatorTemplate = this.config.operators.equal;
            break;
          case NodeType.AND:
            operatorTemplate = this.config.operators.and;
            break;
          case NodeType.OR:
            operatorTemplate = this.config.operators.or;
            break;
          case NodeType.NOT:
            // For NOT, we need a special case since it's unary
            const input = this.getInputValue(sourceNode.id, 'input', 'false');
            // Use the language-specific not operator if available
            const notTemplate = this.config.operators.not || '!$value';
            return notTemplate.replace('$value', input);
        }
        return this.processMathOperation(sourceNode, operatorTemplate);
        
      default:
        // For other nodes, get the custom output value if defined
        if (sourceNode.data.properties?.outputValue) {
          return sourceNode.data.properties.outputValue;
        }
        
        // If output socket has a special handler, call it
        if (this.socketOutputHandlers[sourceNode.data.type]) {
          const handler = this.socketOutputHandlers[sourceNode.data.type];
          return handler(sourceNode, sourceSocket.id);
        }
        
        // Fallback to socket name
        return `${sourceNode.data.label}_${sourceSocket.name}`;
    }
  }
  
  /**
   * Format value from an input widget based on socket type and widget configuration
   * This provides more intelligent formatting based on widget customizations
   * @param value The value to format
   * @param type The socket type
   * @param widgetConfig Optional widget configuration
   * @returns Formatted value as a string
   */
  protected formatWidgetValue(
    value: any, 
    type: SocketType, 
    widgetConfig?: InputWidgetConfig
  ): string {
    // Handle undefined or null values
    if (value === undefined || value === null) {
      return 'None';
    }
    
    // Apply widget-specific formatting where needed
    if (widgetConfig) {
      // Handle special widget types
      switch (widgetConfig.widgetType) {
        case WidgetType.COLOR_PICKER:
          // For colors, preserve the string format
          return this.formatDefaultValue(value, SocketType.STRING);
          
        case WidgetType.DROPDOWN:
          // For dropdowns, try to use the option value directly
          if (widgetConfig.options) {
            const option = widgetConfig.options.find(opt => String(opt.value) === String(value));
            if (option) {
              return this.formatDefaultValue(option.value, type);
            }
          }
          break;
          
        case WidgetType.SLIDER:
          // For sliders, ensure numeric formatting
          if (typeof value === 'string') {
            const num = parseFloat(value);
            if (!isNaN(num)) {
              return num.toString();
            }
          }
          break;
          
        case WidgetType.TEXTAREA:
          // For multiline text, handle line breaks
          if (typeof value === 'string' && value.includes('\n')) {
            return this.formatDefaultValue(value.replace(/\n/g, '\\n'), type);
          }
          break;
      }
      
      // Apply precision formatting for numbers if specified
      if (type === SocketType.NUMBER && widgetConfig.precision !== undefined) {
        const num = parseFloat(String(value));
        if (!isNaN(num)) {
          return num.toFixed(widgetConfig.precision);
        }
      }
    }
    
    // Fallback to standard formatting
    return this.formatDefaultValue(value, type);
  }
  
  /**
   * Format a boolean value according to the language's syntax
   */
  protected formatBooleanValue(value: any): string {
    const boolValue = value === true || value === 'true' || value === 1;
    // Use language-specific boolean representation if available
    return boolValue 
      ? (this.config.values?.true || 'true') 
      : (this.config.values?.false || 'false');
  }
  
  /**
   * Format a number value according to the language's syntax
   */
  protected formatNumberValue(value: any): string {
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? '0' : num.toString();
    }
    return value.toString();
  }
  
  /**
   * Format a string value according to the language's syntax
   */
  protected formatStringValue(value: any): string {
    if (typeof value !== 'string') {
      value = value.toString();
    }
    
    // Use language-specific escape sequences if available
    const doubleQuoteEscape = this.config.escapeSequences?.doubleQuote || '\\"';
    const escaped = value.replace(/"/g, doubleQuoteEscape);
    return `"${escaped}"`;
  }
  
  /**
   * Format a multiline text according to the language's syntax
   */
  protected formatMultilineText(value: string): string {
    // For most languages, use multiple string concatenation
    const lines = value.split('\n');
    const newlineChar = this.config.escapeSequences?.newline || '\\n';
    
    // If the language has a specific multiline string format, use it
    // Otherwise fall back to string concatenation with escaped newlines
    const doubleQuoteEscape = this.config.escapeSequences?.doubleQuote || '\\"';
    const formatted = lines.map(line => {
      const escaped = line.replace(/"/g, doubleQuoteEscape);
      return `"${escaped}"`;
    }).join(` + "${newlineChar}" + `);
    
    return formatted;
  }
  
  /**
   * Format default value based on its type
   * @param value The value to format
   * @param type The socket type
   * @returns Formatted value as a string
   */
  protected formatDefaultValue(value: any, type: SocketType): string {
    // Handle "undefined" string value
    if (value === "undefined") {
      // Return appropriate language default based on type
      switch (type) {
        case SocketType.BOOLEAN:
          return this.formatBooleanValue(false);
        case SocketType.NUMBER:
          return this.formatNumberValue(0);
        case SocketType.STRING:
          return this.formatStringValue("");
        default:
          return 'None';
      }
    }
    
    // Don't call formatWidgetValue again - this creates infinite recursion
    switch (type) {
      case SocketType.BOOLEAN:
        return this.formatBooleanValue(value);
      case SocketType.NUMBER:
        return this.formatNumberValue(value);
      case SocketType.STRING:
        if (typeof value === 'string' && value.includes('\n')) {
          return this.formatMultilineText(value);
        } else {
          return this.formatStringValue(value);
        }
      case SocketType.ANY:
      case SocketType.FLOW:
      default:
        // Basic conversion of value to string
        return value !== undefined && value !== null ? String(value) : 'None';
    }
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
    // For Python (and potentially other languages), the colon is already part of the statements
    // so we don't need to add it again here if it was already added with the statement
    if (this.config.formatting.blockStart && this.code[this.code.length - 1] !== this.config.formatting.blockStart) {
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
  
  /**
   * Process a math operation node
   * @param node The operation node
   * @param operatorTemplate The template for the operation from language config
   * @returns The formatted operation expression
   */
  protected processMathOperation(node: Node<BaseNodeData>, operatorTemplate: string): string {
    // Get the left and right input values
    const leftInput = this.getInputValue(node.id, 'a');
    const rightInput = this.getInputValue(node.id, 'b');
    
    // Replace the placeholders in the template
    return operatorTemplate
      .replace('$left', leftInput)
      .replace('$right', rightInput);
  }
} 