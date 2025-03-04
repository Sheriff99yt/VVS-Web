import { Node } from 'reactflow';
import { BaseNodeData } from '../../nodes/types';
import { typeScriptConfig } from '../languageConfig';
import { BaseCodeGenerator } from './BaseCodeGenerator';
import { SocketType } from '../../sockets/types';

/**
 * TypeScript code generator implementation
 */
export class TypeScriptCodeGenerator extends BaseCodeGenerator {
  /**
   * Constructor
   * @param nodes The nodes in the graph
   * @param edges The edges connecting the nodes
   */
  constructor(nodes: Node<BaseNodeData>[], edges: any[]) {
    super(nodes, edges, typeScriptConfig);
  }
  
  /**
   * Add TypeScript-specific imports
   */
  protected addImports(): void {
    // No standard imports needed for basic TypeScript functionality
  }
  
  /**
   * Format user input for TypeScript
   */
  protected formatUserInput(node: Node<BaseNodeData>): string {
    const prompt = this.getInputValue(node.id, 'prompt', '""');
    return `prompt(${prompt})`;
  }
  
  /**
   * Format a comment in TypeScript
   */
  protected formatComment(comment: string): string {
    return `// ${comment}`;
  }
  
  /**
   * Override to provide TypeScript-specific value formatting
   */
  protected formatDefaultValue(value: any, type: SocketType): string {
    // Handle undefined or null values
    if (value === undefined) {
      return "undefined";
    }
    if (value === null) {
      return "null";
    }
    
    // Handle different socket types with TypeScript-specific formatting
    switch (type) {
      case SocketType.BOOLEAN:
        // TypeScript uses lowercase true/false
        return value === true ? "true" : "false";
        
      case SocketType.NUMBER:
        // Handle numeric values
        if (typeof value === 'string') {
          // Try to parse string as number
          const num = parseFloat(value);
          return isNaN(num) ? '0' : num.toString();
        }
        return value.toString();
        
      case SocketType.STRING:
        // Ensure strings are properly quoted for TypeScript
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
            // For objects, use JSON.stringify which works well in TypeScript
            return JSON.stringify(value);
          } catch (e) {
            return '{}';
          }
        } else if (value === undefined) {
          return 'undefined';
        }
        // Fallback for other types
        return value.toString();
        
      default:
        // Default fallback
        return value.toString();
    }
  }
  
  /**
   * Format the generated code with proper closing braces
   */
  protected formatCode(code: string): string {
    // Add a note about browser compatibility for prompt
    return code + '\n' + this.formatComment('Note: prompt() requires a browser environment');
  }
  
  /**
   * Generate code for print node
   */
  protected generatePrintCode(node: Node<BaseNodeData>): void {
    const value = this.getInputValue(node.id, 'value', '"Hello, World!"');
    this.addToCode(`console.log(${value});`);
  }
  
  /**
   * Generate code for variable definition
   */
  protected generateVariableDefinitionCode(node: Node<BaseNodeData>): void {
    const name = this.getInputValue(node.id, 'name', 'variable');
    const value = this.getInputValue(node.id, 'value', '0');
    
    // Add to variables set to track defined variables
    this.variables.add(name);
    
    this.addToCode(`let ${name} = ${value};`);
  }
  
  /**
   * Generate code for if statement
   */
  protected generateIfStatementCode(node: Node<BaseNodeData>): void {
    const condition = this.getInputValue(node.id, 'condition', 'true');
    
    this.addToCode(`if (${condition}) {`);
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
      this.addToCode(`// No true branch connected`);
    }
    
    this.decreaseIndentation();
    this.addToCode(`}`);
    
    // Find the false branch flow edge
    const falseEdge = this.edges.find(e => 
      e.source === node.id && e.sourceHandle === 'false_flow'
    );
    
    if (falseEdge) {
      this.addToCode(`else {`);
      this.increaseIndentation();
      
      const falseNode = this.nodes.find(n => n.id === falseEdge.target);
      if (falseNode && !this.processedNodes.has(falseNode.id)) {
        this.processNode(falseNode);
      } else {
        this.addToCode(`// No false branch connected`);
      }
      
      this.decreaseIndentation();
      this.addToCode(`}`);
    }
  }
  
  /**
   * Generate code for for loop
   */
  protected generateForLoopCode(node: Node<BaseNodeData>): void {
    const loopVar = this.getInputValue(node.id, 'variable', 'i');
    const rangeStart = this.getInputValue(node.id, 'start', '0');
    const rangeEnd = this.getInputValue(node.id, 'end', '10');
    
    this.addToCode(`for (let ${loopVar} = ${rangeStart}; ${loopVar} < ${rangeEnd}; ${loopVar}++) {`);
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
      this.addToCode(`// No loop body connected`);
    }
    
    this.decreaseIndentation();
    this.addToCode(`}`);
  }
  
  /**
   * Generate code for AND operation
   */
  protected generateAndCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', 'true');
    const rightInput = this.getInputValue(node.id, 'b', 'true');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`const ${resultVar} = ${leftInput} && ${rightInput};`);
  }
  
  /**
   * Generate code for OR operation
   */
  protected generateOrCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', 'false');
    const rightInput = this.getInputValue(node.id, 'b', 'false');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`const ${resultVar} = ${leftInput} || ${rightInput};`);
  }
  
  /**
   * Generate code for greater than comparison
   */
  protected generateGreaterThanCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', '0');
    const rightInput = this.getInputValue(node.id, 'b', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`const ${resultVar} = ${leftInput} > ${rightInput};`);
  }
  
  /**
   * Generate code for less than comparison
   */
  protected generateLessThanCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', '0');
    const rightInput = this.getInputValue(node.id, 'b', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`const ${resultVar} = ${leftInput} < ${rightInput};`);
  }
  
  /**
   * Generate code for equality comparison
   */
  protected generateEqualCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', '0');
    const rightInput = this.getInputValue(node.id, 'b', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`const ${resultVar} = ${leftInput} === ${rightInput};`);
  }
  
  /**
   * Generate code for addition
   */
  protected generateAddCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', '0');
    const rightInput = this.getInputValue(node.id, 'b', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`const ${resultVar} = ${leftInput} + ${rightInput};`);
  }
  
  /**
   * Generate code for subtraction
   */
  protected generateSubtractCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', '0');
    const rightInput = this.getInputValue(node.id, 'b', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`const ${resultVar} = ${leftInput} - ${rightInput};`);
  }
  
  /**
   * Generate code for multiplication
   */
  protected generateMultiplyCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', '0');
    const rightInput = this.getInputValue(node.id, 'b', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`const ${resultVar} = ${leftInput} * ${rightInput};`);
  }
  
  /**
   * Generate code for division
   */
  protected generateDivideCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', '0');
    const rightInput = this.getInputValue(node.id, 'b', '1');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`const ${resultVar} = ${leftInput} / ${rightInput};`);
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
    const name = this.getInputValue(node.id, 'name', 'userInput');
    const prompt = this.getInputValue(node.id, 'prompt', '""');
    
    this.addToCode(`const ${name} = prompt(${prompt});`);
    
    // Add to variables set
    this.variables.add(name);
  }
} 