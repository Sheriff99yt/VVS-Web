import { Node } from 'reactflow';
import { BaseNodeData } from '../../nodes/types';
import { typeScriptConfig } from '../languageConfig';
import { BaseCodeGenerator } from './BaseCodeGenerator';

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
    const prompt = node.data.properties?.prompt 
      ? `"${node.data.properties.prompt}"` 
      : '""';
    return `prompt(${prompt})`;
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
    const name = node.data.properties?.name || 'variable';
    const value = this.getInputValue(node.id, 'value', '0');
    
    // Add to variables set to track defined variables
    this.variables.add(name);
    
    this.addToCode(`let ${name} = ${value};`);
  }
  
  /**
   * Generate code for if statement
   */
  protected generateIfStatementCode(node: Node<BaseNodeData>): void {
    const conditionInput = this.getInputValue(node.id, 'condition', undefined);
    const condition = conditionInput !== undefined && conditionInput !== 'None' 
      ? conditionInput 
      : (node.data.properties?.condition || 'true');
    
    this.addToCode(`if (${condition}) {`);
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
      this.addToCode(`// No true branch connected`);
    }
    
    this.decreaseIndent();
    this.addToCode(`}`);
    
    // Find the false branch flow edge
    const falseEdge = this.edges.find(e => 
      e.source === node.id && e.sourceHandle === 'false_flow'
    );
    
    if (falseEdge) {
      this.addToCode(`else {`);
      this.increaseIndent();
      
      const falseNode = this.nodes.find(n => n.id === falseEdge.target);
      if (falseNode && !this.processedNodes.has(falseNode.id)) {
        this.processNode(falseNode);
      } else {
        this.addToCode(`// No false branch connected`);
      }
      
      this.decreaseIndent();
      this.addToCode(`}`);
    }
  }
  
  /**
   * Generate code for for loop
   */
  protected generateForLoopCode(node: Node<BaseNodeData>): void {
    const loopVar = node.data.properties?.variable || 'i';
    const rangeStart = node.data.properties?.start || '0';
    const rangeEnd = node.data.properties?.end || '10';
    
    this.addToCode(`for (let ${loopVar} = ${rangeStart}; ${loopVar} < ${rangeEnd}; ${loopVar}++) {`);
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
      this.addToCode(`// No loop body connected`);
    }
    
    this.decreaseIndent();
    this.addToCode(`}`);
  }
  
  /**
   * Generate code for AND operation
   */
  protected generateAndCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', 'true');
    const rightInput = this.getInputValue(node.id, 'right', 'true');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`const ${resultVar} = ${leftInput} && ${rightInput};`);
  }
  
  /**
   * Generate code for OR operation
   */
  protected generateOrCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', 'false');
    const rightInput = this.getInputValue(node.id, 'right', 'false');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`const ${resultVar} = ${leftInput} || ${rightInput};`);
  }
  
  /**
   * Generate code for greater than comparison
   */
  protected generateGreaterThanCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', '0');
    const rightInput = this.getInputValue(node.id, 'right', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`const ${resultVar} = ${leftInput} > ${rightInput};`);
  }
  
  /**
   * Generate code for less than comparison
   */
  protected generateLessThanCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', '0');
    const rightInput = this.getInputValue(node.id, 'right', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`const ${resultVar} = ${leftInput} < ${rightInput};`);
  }
  
  /**
   * Generate code for equality comparison
   */
  protected generateEqualCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', '0');
    const rightInput = this.getInputValue(node.id, 'right', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`const ${resultVar} = ${leftInput} === ${rightInput};`);
  }
  
  /**
   * Generate code for addition
   */
  protected generateAddCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', '0');
    const rightInput = this.getInputValue(node.id, 'right', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`const ${resultVar} = ${leftInput} + ${rightInput};`);
  }
  
  /**
   * Generate code for subtraction
   */
  protected generateSubtractCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', '0');
    const rightInput = this.getInputValue(node.id, 'right', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`const ${resultVar} = ${leftInput} - ${rightInput};`);
  }
  
  /**
   * Generate code for multiplication
   */
  protected generateMultiplyCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', '0');
    const rightInput = this.getInputValue(node.id, 'right', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`const ${resultVar} = ${leftInput} * ${rightInput};`);
  }
  
  /**
   * Generate code for division
   */
  protected generateDivideCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', '0');
    const rightInput = this.getInputValue(node.id, 'right', '1');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`const ${resultVar} = ${leftInput} / ${rightInput};`);
  }
  
  /**
   * Generate code for variable getter
   */
  protected generateVariableGetterCode(node: Node<BaseNodeData>): void {
    // No code needed for variable getter, it's handled in getInputValue
  }
  
  /**
   * Generate code for user input
   */
  protected generateUserInputCode(node: Node<BaseNodeData>): void {
    const name = node.data.properties?.name || 'userInput';
    const prompt = node.data.properties?.prompt 
      ? `"${node.data.properties.prompt}"` 
      : '""';
    
    this.addToCode(`const ${name} = prompt(${prompt});`);
    
    // Add to variables set
    this.variables.add(name);
  }
  
  /**
   * Generate code for function definition
   */
  protected generateFunctionDefinitionCode(node: Node<BaseNodeData>): void {
    const name = node.data.properties?.name || 'myFunction';
    const params = node.data.properties?.parameters || '';
    
    // Add to functions set
    this.functions.add(name);
    
    this.addToCode(`function ${name}(${params}) {`);
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
      this.addToCode(`// No function body connected`);
    }
    
    this.decreaseIndent();
    this.addToCode(`}`);
    this.addToCode(''); // Add empty line after function
  }
  
  /**
   * Generate code for function call
   */
  protected generateFunctionCallCode(node: Node<BaseNodeData>): void {
    const name = node.data.properties?.name || 'myFunction';
    const args = node.data.properties?.arguments || '';
    
    this.addToCode(`${name}(${args});`);
  }
} 