import { Node } from 'reactflow';
import { BaseNodeData } from '../../nodes/types';
import { pythonConfig } from '../languageConfig';
import { BaseCodeGenerator } from './BaseCodeGenerator';
import { SocketType } from '../../sockets/types';

/**
 * Python code generator implementation
 */
export class PythonCodeGenerator extends BaseCodeGenerator {
  /**
   * Constructor
   * @param nodes The nodes in the graph
   * @param edges The edges connecting the nodes
   */
  constructor(nodes: Node<BaseNodeData>[], edges: any[]) {
    super(nodes, edges, pythonConfig);
  }
  
  /**
   * Add Python-specific imports
   */
  protected addImports(): void {
    // Python doesn't need any standard imports for basic functionality
  }
  
  /**
   * Format user input for Python
   */
  protected formatUserInput(node: Node<BaseNodeData>): string {
    const prompt = this.getInputValue(node.id, 'prompt', '');
    return `input(${prompt})`;
  }
  
  /**
   * Format a comment in Python
   */
  protected formatComment(comment: string): string {
    return `# ${comment}`;
  }
  
  /**
   * Override to provide Python-specific value formatting
   */
  protected formatDefaultValue(value: any, type: SocketType): string {
    // Handle undefined or null values
    if (value === undefined || value === null) {
      return "None";
    }
    
    // Handle different socket types with Python-specific formatting
    switch (type) {
      case SocketType.BOOLEAN:
        // Python uses capitalized True/False
        return value === true ? "True" : "False";
        
      case SocketType.NUMBER:
        // Handle numeric values
        if (typeof value === 'string') {
          // Try to parse string as number
          const num = parseFloat(value);
          if (isNaN(num)) return '0';
          
          // Format integers and floats appropriately for Python
          if (Number.isInteger(num)) {
            return num.toString();
          } else {
            return num.toString();
          }
        }
        return value.toString();
        
      case SocketType.STRING:
        // Ensure strings are properly quoted for Python
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
          return value ? 'True' : 'False';
        } else if (typeof value === 'number') {
          return value.toString();
        } else if (typeof value === 'string') {
          // Escape quotes in the string
          const escaped = value.replace(/"/g, '\\"');
          return `"${escaped}"`;
        } else if (typeof value === 'object') {
          if (value === null) {
            return 'None';
          }
          try {
            // Try to convert to Python dict/list syntax
            const json = JSON.stringify(value);
            // Replace JSON syntax with Python syntax
            return json
              .replace(/"(\w+)":/g, '$1:') // Convert "key": to key:
              .replace(/null/g, 'None')    // Convert null to None
              .replace(/true/g, 'True')    // Convert true to True
              .replace(/false/g, 'False'); // Convert false to False
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
  
  /**
   * Generate code for print node
   */
  protected generatePrintCode(node: Node<BaseNodeData>): void {
    // Use the getInputValue method which now checks properties
    const value = this.getInputValue(node.id, 'value', '"Hello, World!"');
    this.addToCode(`print(${value})`);
  }
  
  /**
   * Generate code for variable definition
   */
  protected generateVariableDefinitionCode(node: Node<BaseNodeData>): void {
    const name = this.getInputValue(node.id, 'name', 'variable');
    const value = this.getInputValue(node.id, 'value', '0');
    
    // Add to variables set to track defined variables
    this.variables.add(name);
    
    this.addToCode(`${name} = ${value}`);
  }
  
  /**
   * Generate code for if statement
   */
  protected generateIfStatementCode(node: Node<BaseNodeData>): void {
    const condition = this.getInputValue(node.id, 'condition', 'True');
    
    this.addToCode(`if ${condition}:`);
    this.increaseIndentation();
    
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
      this.addToCode(`pass  # No true branch connected`);
    }
    
    this.decreaseIndentation();
    
    // Find the false branch flow edge
    const falseEdge = this.edges.find(e => 
      e.source === node.id && e.sourceHandle === 'false_flow'
    );
    
    if (falseEdge) {
      this.addToCode(`else:`);
      this.increaseIndentation();
      
      const falseNode = this.nodes.find(n => n.id === falseEdge.target);
      if (falseNode && !this.processedNodes.has(falseNode.id)) {
        this.processNode(falseNode);
      } else {
        this.addToCode(`pass  # No false branch connected`);
      }
      
      this.decreaseIndentation();
    }
  }
  
  /**
   * Generate code for for loop
   */
  protected generateForLoopCode(node: Node<BaseNodeData>): void {
    const loopVar = this.getInputValue(node.id, 'variable', 'i');
    const rangeStart = this.getInputValue(node.id, 'start', '0');
    const rangeEnd = this.getInputValue(node.id, 'end', '10');
    
    this.addToCode(`for ${loopVar} in range(${rangeStart}, ${rangeEnd}):`);
    this.increaseIndentation();
    
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
      this.addToCode(`pass  # No loop body connected`);
    }
    
    this.decreaseIndentation();
  }
  
  /**
   * Generate code for AND operation
   */
  protected generateAndCode(node: Node<BaseNodeData>): void {
    // Use the input values directly, don't check properties first
    const leftInput = this.getInputValue(node.id, 'a', 'False');
    const rightInput = this.getInputValue(node.id, 'b', 'False');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`${resultVar} = ${leftInput} and ${rightInput}`);
  }
  
  /**
   * Generate code for OR operation
   */
  protected generateOrCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', 'False');
    const rightInput = this.getInputValue(node.id, 'b', 'False');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`${resultVar} = ${leftInput} or ${rightInput}`);
  }
  
  /**
   * Generate code for greater than comparison
   */
  protected generateGreaterThanCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', '0');
    const rightInput = this.getInputValue(node.id, 'b', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`${resultVar} = ${leftInput} > ${rightInput}`);
  }
  
  /**
   * Generate code for less than comparison
   */
  protected generateLessThanCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', '0');
    const rightInput = this.getInputValue(node.id, 'b', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`${resultVar} = ${leftInput} < ${rightInput}`);
  }
  
  /**
   * Generate code for equality comparison
   */
  protected generateEqualCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', '0');
    const rightInput = this.getInputValue(node.id, 'b', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`${resultVar} = ${leftInput} == ${rightInput}`);
  }
  
  /**
   * Generate code for addition
   */
  protected generateAddCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', '0');
    const rightInput = this.getInputValue(node.id, 'b', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`${resultVar} = ${leftInput} + ${rightInput}`);
  }
  
  /**
   * Generate code for subtraction
   */
  protected generateSubtractCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', '0');
    const rightInput = this.getInputValue(node.id, 'b', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`${resultVar} = ${leftInput} - ${rightInput}`);
  }
  
  /**
   * Generate code for multiplication
   */
  protected generateMultiplyCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', '0');
    const rightInput = this.getInputValue(node.id, 'b', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`${resultVar} = ${leftInput} * ${rightInput}`);
  }
  
  /**
   * Generate code for division
   */
  protected generateDivideCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', '0');
    const rightInput = this.getInputValue(node.id, 'b', '1');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`${resultVar} = ${leftInput} / ${rightInput}`);
  }
  
  /**
   * Generate code for variable getter
   */
  protected generateVariableGetterCode(_node: Node<BaseNodeData>): void {
    // No code needed for variable getter, it's handled in getInputValue
  }
  
  /**
   * Generate code for user input
   */
  protected generateUserInputCode(node: Node<BaseNodeData>): void {
    const name = this.getInputValue(node.id, 'name', 'userName');
    const prompt = this.getInputValue(node.id, 'prompt', '');
    
    this.addToCode(`${name} = input(${prompt})`);
    
    // Add to variables set
    this.variables.add(name);
  }
} 