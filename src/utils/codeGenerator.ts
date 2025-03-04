import { Edge, Node } from 'reactflow';
import { BaseNodeData, NodeType } from '../nodes/types';
import { SocketType } from '../sockets/types';

/**
 * CodeGenerator class responsible for generating Python code from node graphs
 */
export class CodeGenerator {
  private nodes: Node<BaseNodeData>[];
  private edges: Edge[];
  private code: string = '';
  private indentationLevel: number = 0;
  private processedNodes: Set<string> = new Set();
  private variables: Set<string> = new Set();
  private functions: Set<string> = new Set();
  
  /**
   * Constructor
   * @param nodes The nodes in the graph
   * @param edges The edges connecting the nodes
   */
  constructor(nodes: Node<BaseNodeData>[], edges: Edge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }
  
  /**
   * Main method to generate code from the graph
   * @returns The generated Python code
   */
  generate(): string {
    this.code = '';
    this.indentationLevel = 0;
    this.processedNodes.clear();
    this.variables.clear();
    this.functions.clear();
    
    // If there are no nodes, return empty code
    if (this.nodes.length === 0) {
      return '# No nodes in the graph\n';
    }
    
    // Add a header to the generated code
    this.addToCode('# Generated Python code from VVS Web\n');
    
    // First, process function definitions
    this.nodes
      .filter(node => node.data.type === NodeType.FUNCTION_DEFINITION)
      .forEach(node => this.processNode(node));
    
    // Then process the main code (nodes not inside functions)
    const entryPoints = this.findEntryNodes();
    
    if (entryPoints.length === 0) {
      this.addToCode('\n# Warning: No clear entry points found in graph\n');
      
      // Process any remaining nodes
      this.nodes
        .filter(node => !this.processedNodes.has(node.id))
        .forEach(node => this.processNode(node));
    } else {
      // Process each entry point
      entryPoints.forEach(node => this.processNode(node));
    }
    
    return this.code;
  }
  
  /**
   * Find potential entry points in the graph
   * Entry points are nodes that have no incoming flow connections
   */
  private findEntryNodes(): Node<BaseNodeData>[] {
    // Set of nodes with incoming flow connections
    const nodesWithIncomingFlows = new Set<string>();
    
    // Check edges to find nodes with incoming flow connections
    this.edges.forEach(edge => {
      const targetNode = this.nodes.find(n => n.id === edge.target);
      if (!targetNode) return;
      
      // Find the target socket
      const targetSocket = targetNode.data.inputs.find(s => s.id === edge.targetHandle);
      if (targetSocket?.type === 'flow') {
        nodesWithIncomingFlows.add(edge.target);
      }
    });
    
    // Return nodes that don't have incoming flow connections
    return this.nodes.filter(node => !nodesWithIncomingFlows.has(node.id));
  }
  
  /**
   * Process a single node and generate code for it
   * This is a stub implementation that will be expanded for each node type
   */
  private processNode(node: Node<BaseNodeData>): void {
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
        this.addToCode(`# Code generation for ${node.data.type} not implemented yet\n`);
        break;
    }
    
    // Find and process the next flow node
    this.processNextFlowNode(node);
  }
  
  /**
   * Find and process the next node in the flow
   */
  private processNextFlowNode(node: Node<BaseNodeData>): void {
    // Find outgoing flow edges
    const flowEdges = this.edges.filter(edge => {
      if (edge.source !== node.id) return false;
      
      // Find the source socket
      const sourceSocket = node.data.outputs.find(s => s.id === edge.sourceHandle);
      return sourceSocket?.type === 'flow';
    });
    
    // Process each connected flow node
    flowEdges.forEach(edge => {
      const nextNode = this.nodes.find(n => n.id === edge.target);
      if (nextNode && !this.processedNodes.has(nextNode.id)) {
        this.processNode(nextNode);
      }
    });
  }
  
  /**
   * Get the value from an input socket by following the connected edge
   * @param nodeId The ID of the node
   * @param socketId The ID of the input socket
   * @returns A string representation of the value or a default value
   */
  private getInputValue(nodeId: string, socketId: string, defaultValue: string = 'None'): string {
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
        return `input(${sourceNode.data.properties?.prompt ? `"${sourceNode.data.properties.prompt}"` : ''})`;
        
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
  
  // Helper to add code with proper indentation
  private addToCode(code: string): void {
    const indent = '    '.repeat(this.indentationLevel);
    this.code += code.split('\n').map(line => line ? indent + line : line).join('\n');
  }
  
  // Helper to increase indentation level
  private increaseIndent(): void {
    this.indentationLevel++;
  }
  
  // Helper to decrease indentation level
  private decreaseIndent(): void {
    if (this.indentationLevel > 0) {
      this.indentationLevel--;
    }
  }
  
  // Basic implementation for print node
  private generatePrintCode(node: Node<BaseNodeData>): void {
    const textToPrint = node.data.properties?.text || 'Hello World';
    const valueInput = this.getInputValue(node.id, 'value', undefined);
    
    if (valueInput && valueInput !== 'None') {
      this.addToCode(`print(${valueInput})\n`);
    } else {
      this.addToCode(`print("${textToPrint}")\n`);
    }
  }
  
  // Basic implementation for variable definition
  private generateVariableDefinitionCode(node: Node<BaseNodeData>): void {
    const varName = node.data.properties?.name || 'variable';
    const valueInput = this.getInputValue(node.id, 'value', undefined);
    const varValue = valueInput !== undefined && valueInput !== 'None' 
      ? valueInput 
      : (node.data.properties?.value || '0');
    
    this.variables.add(varName);
    this.addToCode(`${varName} = ${varValue}\n`);
  }
  
  // Basic implementation for if statement
  private generateIfStatementCode(node: Node<BaseNodeData>): void {
    const conditionInput = this.getInputValue(node.id, 'condition', undefined);
    const condition = conditionInput !== undefined && conditionInput !== 'None' 
      ? conditionInput 
      : (node.data.properties?.condition || 'True');
    
    this.addToCode(`if ${condition}:\n`);
    this.increaseIndent();
    
    // Find the true branch flow edge
    const trueEdge = this.edges.find(e => 
      e.source === node.id && e.sourceHandle === 'true_flow'
    );
    
    if (trueEdge) {
      const trueNode = this.nodes.find(n => n.id === trueEdge.target);
      if (trueNode && !this.processedNodes.has(trueNode.id)) {
        this.processNode(trueNode);
      }
    } else {
      this.addToCode(`pass  # No true branch connected\n`);
    }
    
    this.decreaseIndent();
    
    // Find the false branch flow edge
    const falseEdge = this.edges.find(e => 
      e.source === node.id && e.sourceHandle === 'false_flow'
    );
    
    if (falseEdge) {
      this.addToCode(`else:\n`);
      this.increaseIndent();
      
      const falseNode = this.nodes.find(n => n.id === falseEdge.target);
      if (falseNode && !this.processedNodes.has(falseNode.id)) {
        this.processNode(falseNode);
      } else {
        this.addToCode(`pass  # No false branch connected\n`);
      }
      
      this.decreaseIndent();
    }
  }
  
  // Basic implementation for for loop
  private generateForLoopCode(node: Node<BaseNodeData>): void {
    const loopVar = node.data.properties?.variable || 'i';
    const rangeStart = node.data.properties?.start || '0';
    const rangeEnd = node.data.properties?.end || '10';
    
    this.addToCode(`for ${loopVar} in range(${rangeStart}, ${rangeEnd}):\n`);
    this.increaseIndent();
    
    // Find the loop body flow edge
    const bodyEdge = this.edges.find(e => 
      e.source === node.id && e.sourceHandle === 'loop_body'
    );
    
    if (bodyEdge) {
      const bodyNode = this.nodes.find(n => n.id === bodyEdge.target);
      if (bodyNode && !this.processedNodes.has(bodyNode.id)) {
        this.processNode(bodyNode);
      }
    } else {
      this.addToCode(`pass  # No loop body connected\n`);
    }
    
    this.decreaseIndent();
  }
  
  // Implementation for AND logic operation
  private generateAndCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', 'False');
    const rightInput = this.getInputValue(node.id, 'right', 'False');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`${resultVar} = ${leftInput} and ${rightInput}\n`);
  }
  
  // Implementation for OR logic operation
  private generateOrCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', 'False');
    const rightInput = this.getInputValue(node.id, 'right', 'False');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`${resultVar} = ${leftInput} or ${rightInput}\n`);
  }
  
  // Implementation for GREATER_THAN logic operation
  private generateGreaterThanCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', '0');
    const rightInput = this.getInputValue(node.id, 'right', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`${resultVar} = ${leftInput} > ${rightInput}\n`);
  }
  
  // Implementation for LESS_THAN logic operation
  private generateLessThanCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', '0');
    const rightInput = this.getInputValue(node.id, 'right', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`${resultVar} = ${leftInput} < ${rightInput}\n`);
  }
  
  // Implementation for EQUAL logic operation
  private generateEqualCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', '0');
    const rightInput = this.getInputValue(node.id, 'right', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`${resultVar} = ${leftInput} == ${rightInput}\n`);
  }
  
  // Implementation for ADD math operation
  private generateAddCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', '0');
    const rightInput = this.getInputValue(node.id, 'right', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`${resultVar} = ${leftInput} + ${rightInput}\n`);
  }
  
  // Implementation for SUBTRACT math operation
  private generateSubtractCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', '0');
    const rightInput = this.getInputValue(node.id, 'right', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`${resultVar} = ${leftInput} - ${rightInput}\n`);
  }
  
  // Implementation for MULTIPLY math operation
  private generateMultiplyCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', '0');
    const rightInput = this.getInputValue(node.id, 'right', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`${resultVar} = ${leftInput} * ${rightInput}\n`);
  }
  
  // Implementation for DIVIDE math operation
  private generateDivideCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', '0');
    const rightInput = this.getInputValue(node.id, 'right', '1');  // Default to 1 to avoid division by zero
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`${resultVar} = ${leftInput} / ${rightInput}\n`);
  }
  
  // Implementation for VARIABLE_GETTER
  private generateVariableGetterCode(_node: Node<BaseNodeData>): void {
    // No code needed for variable getter, it's handled in getInputValue
  }
  
  // Implementation for USER_INPUT
  private generateUserInputCode(node: Node<BaseNodeData>): void {
    const prompt = node.data.properties?.prompt || 'Enter a value: ';
    const varName = node.data.properties?.variableName || `input_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`${varName} = input("${prompt}")\n`);
    
    // Add type conversion if specified
    const dataType = node.data.properties?.dataType || 'string';
    if (dataType === 'number') {
      this.addToCode(`try:\n`);
      this.increaseIndent();
      this.addToCode(`${varName} = float(${varName})\n`);
      this.decreaseIndent();
      this.addToCode(`except ValueError:\n`);
      this.increaseIndent();
      this.addToCode(`print("Error: Invalid number input")\n`);
      this.addToCode(`${varName} = 0\n`);
      this.decreaseIndent();
    }
  }
  
  // Implementation for FUNCTION_DEFINITION
  private generateFunctionDefinitionCode(node: Node<BaseNodeData>): void {
    const funcName = node.data.properties?.name || 'unnamed_function';
    const params = node.data.properties?.parameters || '';
    
    this.functions.add(funcName);
    
    this.addToCode(`\ndef ${funcName}(${params}):\n`);
    this.increaseIndent();
    
    // Find the function body flow edge
    const bodyEdge = this.edges.find(e => 
      e.source === node.id && e.sourceHandle === 'body_flow'
    );
    
    if (bodyEdge) {
      const bodyNode = this.nodes.find(n => n.id === bodyEdge.target);
      if (bodyNode && !this.processedNodes.has(bodyNode.id)) {
        this.processNode(bodyNode);
      }
    } else {
      this.addToCode(`pass  # Empty function\n`);
    }
    
    // Add return statement if there's a return value
    const returnEdge = this.edges.find(e => 
      e.target === node.id && e.targetHandle === 'return_value'
    );
    
    if (returnEdge) {
      const returnValue = this.getInputValue(node.id, 'return_value', 'None');
      this.addToCode(`return ${returnValue}\n`);
    }
    
    this.decreaseIndent();
    this.addToCode(`\n`);  // Add extra line after function definition
  }
  
  // Implementation for FUNCTION_CALL
  private generateFunctionCallCode(node: Node<BaseNodeData>): void {
    const funcName = node.data.properties?.name || 'unnamed_function';
    let args = node.data.properties?.arguments || '';
    
    // Check for connected argument inputs
    const argInputs = node.data.inputs.filter(socket => 
      socket.id !== 'flow_in' && socket.type !== SocketType.FLOW
    );
    
    if (argInputs.length > 0 && !args) {
      // Build arguments from connected inputs
      const argValues = argInputs.map(socket => {
        const value = this.getInputValue(node.id, socket.id, undefined);
        return value !== undefined && value !== 'None' ? value : '';
      }).filter(arg => arg !== '');
      
      if (argValues.length > 0) {
        args = argValues.join(', ');
      }
    }
    
    // Check if we need to store the result
    const hasResultOutput = node.data.outputs.some(s => s.id === 'result');
    const resultVar = hasResultOutput ? `_result_${node.id.replace(/-/g, '_')}` : '';
    
    if (hasResultOutput) {
      this.addToCode(`${resultVar} = `);
    }
    
    this.addToCode(`${funcName}(${args})\n`);
  }
}

/**
 * Generate Python code from a node graph
 * @param nodes The nodes in the graph
 * @param edges The edges connecting the nodes
 * @returns The generated Python code
 */
export const generatePythonCode = (
  nodes: Node<BaseNodeData>[],
  edges: Edge[]
): string => {
  const generator = new CodeGenerator(nodes, edges);
  return generator.generate();
}; 