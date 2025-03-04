import { Node } from 'reactflow';
import { BaseNodeData } from '../../nodes/types';
import { cppConfig } from '../languageConfig';
import { BaseCodeGenerator } from './BaseCodeGenerator';

/**
 * C++ code generator implementation
 */
export class CppCodeGenerator extends BaseCodeGenerator {
  /**
   * Constructor
   * @param nodes The nodes in the graph
   * @param edges The edges connecting the nodes
   */
  constructor(nodes: Node<BaseNodeData>[], edges: any[]) {
    super(nodes, edges, cppConfig);
  }
  
  /**
   * Add C++-specific imports
   */
  protected addImports(): void {
    this.addToCode('#include <iostream>');
    this.addToCode('#include <string>');
    this.addToCode('');
    this.addToCode('using namespace std;');
    this.addToCode('');
  }
  
  /**
   * Format user input for C++
   */
  protected formatUserInput(node: Node<BaseNodeData>): string {
    const varName = node.data.properties?.name || 'userInput';
    return varName;
  }
  
  /**
   * Format the generated code with proper main function
   */
  protected formatCode(code: string): string {
    // Check if there's already a main function in the code
    if (code.includes('int main(')) {
      return code;
    }
    
    // Add a main function wrapper if there isn't one
    const mainFunctionCode = '\nint main() {\n';
    const returnCode = '    return 0;\n}\n';
    
    // Insert the main function after the includes and before any other code
    const lines = code.split('\n');
    let insertIndex = 0;
    
    // Find where to insert the main function (after includes and using statements)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#include') || lines[i].startsWith('using namespace')) {
        insertIndex = i + 1;
      } else if (lines[i].trim() !== '') {
        break;
      }
    }
    
    // Skip any empty lines
    while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
      insertIndex++;
    }
    
    // If we have function definitions, put main at the end
    const hasFunctionDefs = this.functions.size > 0;
    if (hasFunctionDefs) {
      // Add main function at the end
      return code + mainFunctionCode + returnCode;
    } else {
      // Insert main function after includes
      const beforeMain = lines.slice(0, insertIndex).join('\n');
      const afterMain = lines.slice(insertIndex).join('\n');
      return beforeMain + '\n' + mainFunctionCode + this.getIndentation() + afterMain + returnCode;
    }
  }
  
  /**
   * Generate code for print node
   */
  protected generatePrintCode(node: Node<BaseNodeData>): void {
    const value = this.getInputValue(node.id, 'value', '"Hello, World!"');
    this.addToCode(`cout << ${value} << endl;`);
  }
  
  /**
   * Generate code for variable definition
   */
  protected generateVariableDefinitionCode(node: Node<BaseNodeData>): void {
    const name = node.data.properties?.name || 'variable';
    const value = this.getInputValue(node.id, 'value', '0');
    
    // Add to variables set to track defined variables
    this.variables.add(name);
    
    // Determine the type based on the value
    let type = 'int';
    if (value.startsWith('"') && value.endsWith('"')) {
      type = 'string';
    } else if (value === 'true' || value === 'false') {
      type = 'bool';
    } else if (value.includes('.')) {
      type = 'double';
    }
    
    this.addToCode(`${type} ${name} = ${value};`);
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
    
    this.addToCode(`for (int ${loopVar} = ${rangeStart}; ${loopVar} < ${rangeEnd}; ${loopVar}++) {`);
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
    
    this.addToCode(`bool ${resultVar} = ${leftInput} && ${rightInput};`);
  }
  
  /**
   * Generate code for OR operation
   */
  protected generateOrCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', 'false');
    const rightInput = this.getInputValue(node.id, 'right', 'false');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`bool ${resultVar} = ${leftInput} || ${rightInput};`);
  }
  
  /**
   * Generate code for greater than comparison
   */
  protected generateGreaterThanCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', '0');
    const rightInput = this.getInputValue(node.id, 'right', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`bool ${resultVar} = ${leftInput} > ${rightInput};`);
  }
  
  /**
   * Generate code for less than comparison
   */
  protected generateLessThanCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', '0');
    const rightInput = this.getInputValue(node.id, 'right', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`bool ${resultVar} = ${leftInput} < ${rightInput};`);
  }
  
  /**
   * Generate code for equality comparison
   */
  protected generateEqualCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', '0');
    const rightInput = this.getInputValue(node.id, 'right', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`bool ${resultVar} = ${leftInput} == ${rightInput};`);
  }
  
  /**
   * Generate code for addition
   */
  protected generateAddCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', '0');
    const rightInput = this.getInputValue(node.id, 'right', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    // Try to determine the type
    let type = 'int';
    if (leftInput.includes('"') || rightInput.includes('"')) {
      type = 'string';
    } else if (leftInput.includes('.') || rightInput.includes('.')) {
      type = 'double';
    }
    
    this.addToCode(`${type} ${resultVar} = ${leftInput} + ${rightInput};`);
  }
  
  /**
   * Generate code for subtraction
   */
  protected generateSubtractCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', '0');
    const rightInput = this.getInputValue(node.id, 'right', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    // Try to determine the type
    let type = 'int';
    if (leftInput.includes('.') || rightInput.includes('.')) {
      type = 'double';
    }
    
    this.addToCode(`${type} ${resultVar} = ${leftInput} - ${rightInput};`);
  }
  
  /**
   * Generate code for multiplication
   */
  protected generateMultiplyCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', '0');
    const rightInput = this.getInputValue(node.id, 'right', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    // Try to determine the type
    let type = 'int';
    if (leftInput.includes('.') || rightInput.includes('.')) {
      type = 'double';
    }
    
    this.addToCode(`${type} ${resultVar} = ${leftInput} * ${rightInput};`);
  }
  
  /**
   * Generate code for division
   */
  protected generateDivideCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'left', '0');
    const rightInput = this.getInputValue(node.id, 'right', '1');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    // Division in C++ should generally use double to avoid integer division issues
    this.addToCode(`double ${resultVar} = ${leftInput} / ${rightInput};`);
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
    const name = node.data.properties?.name || 'userInput';
    const prompt = node.data.properties?.prompt || '';
    
    // Determine the type based on how the variable is used
    // Default to string for maximum compatibility
    const type = 'string';
    
    if (prompt) {
      this.addToCode(`cout << "${prompt}" << endl;`);
    }
    
    this.addToCode(`${type} ${name};`);
    this.addToCode(`cin >> ${name};`);
    
    // Add to variables set
    this.variables.add(name);
  }
  
  /**
   * Generate code for function definition
   */
  protected generateFunctionDefinitionCode(node: Node<BaseNodeData>): void {
    const name = node.data.properties?.name || 'myFunction';
    const params = node.data.properties?.parameters || '';
    const returnType = node.data.properties?.returnType || 'void';
    
    // Add to functions set
    this.functions.add(name);
    
    this.addToCode(`${returnType} ${name}(${params}) {`);
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