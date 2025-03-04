import { Node } from 'reactflow';
import { BaseNodeData } from '../../nodes/types';
import { cppConfig } from '../languageConfig';
import { BaseCodeGenerator } from './BaseCodeGenerator';
import { SocketType } from '../../sockets/types';

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
    const varName = this.getInputValue(node.id, 'name', 'userInput');
    return varName;
  }
  
  /**
   * Format a comment in C++
   */
  protected formatComment(comment: string): string {
    return `// ${comment}`;
  }
  
  /**
   * Override to provide C++-specific value formatting
   */
  protected formatDefaultValue(value: any, type: SocketType): string {
    // Handle undefined or null values
    if (value === undefined || value === null) {
      return "nullptr";
    }
    
    // Handle different socket types with C++-specific formatting
    switch (type) {
      case SocketType.BOOLEAN:
        // C++ uses lowercase true/false
        return value === true ? "true" : "false";
        
      case SocketType.NUMBER:
        // Handle numeric values with C++ specifics
        if (typeof value === 'string') {
          // Try to parse string as number
          const num = parseFloat(value);
          if (isNaN(num)) return '0';
          
          // Format integers and floats appropriately for C++
          if (Number.isInteger(num)) {
            return num.toString();
          } else {
            // Ensure float values have decimal point for C++
            return num.toString().includes('.') ? num.toString() : `${num}.0`;
          }
        }
        
        // For numeric values, ensure proper C++ formatting
        if (typeof value === 'number') {
          if (Number.isInteger(value)) {
            return value.toString();
          } else {
            // Ensure float values have decimal point for C++
            return value.toString().includes('.') ? value.toString() : `${value}.0`;
          }
        }
        
        return value.toString();
        
      case SocketType.STRING:
        // Ensure strings are properly quoted for C++
        if (typeof value === 'string') {
          // Escape quotes and special characters for C++
          const escaped = value
            .replace(/\\/g, '\\\\')   // Backslash
            .replace(/"/g, '\\"')     // Double quote
            .replace(/\n/g, '\\n')    // Newline
            .replace(/\r/g, '\\r')    // Carriage return
            .replace(/\t/g, '\\t');   // Tab
          return `"${escaped}"`;
        }
        // Convert non-string values to quoted strings
        return `"${value.toString()}"`;
        
      case SocketType.ANY:
        // Handle any type based on the actual value type
        if (typeof value === 'boolean') {
          return value ? 'true' : 'false';
        } else if (typeof value === 'number') {
          if (Number.isInteger(value)) {
            return value.toString();
          } else {
            // Ensure float values have decimal point for C++
            return value.toString().includes('.') ? value.toString() : `${value}.0`;
          }
        } else if (typeof value === 'string') {
          // Escape quotes and special characters for C++
          const escaped = value
            .replace(/\\/g, '\\\\')   // Backslash
            .replace(/"/g, '\\"')     // Double quote
            .replace(/\n/g, '\\n')    // Newline
            .replace(/\r/g, '\\r')    // Carriage return
            .replace(/\t/g, '\\t');   // Tab
          return `"${escaped}"`;
        } else if (typeof value === 'object') {
          if (value === null) {
            return 'nullptr';
          }
          try {
            // Try to convert to C++ map/vector syntax (simplified)
            return 'std::map<std::string, std::string>()'; // Placeholder
          } catch (e) {
            return '{}';
          }
        } else if (value === undefined) {
          return 'nullptr';
        }
        // Fallback for other types
        return value.toString();
        
      default:
        // Default fallback
        return value.toString();
    }
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
    
    // Insert main function after includes
    const beforeMain = lines.slice(0, insertIndex).join('\n');
    const afterMain = lines.slice(insertIndex).join('\n');
    return beforeMain + '\n' + mainFunctionCode + this.getIndentation() + afterMain + returnCode;
  }
  
  /**
   * Get the current indentation string
   */
  private getIndentation(): string {
    return '  '.repeat(this.indentationLevel);
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
    const name = this.getInputValue(node.id, 'name', 'variable');
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
    
    this.addToCode(`for (int ${loopVar} = ${rangeStart}; ${loopVar} < ${rangeEnd}; ${loopVar}++) {`);
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
    
    this.addToCode(`bool ${resultVar} = ${leftInput} && ${rightInput};`);
  }
  
  /**
   * Generate code for OR operation
   */
  protected generateOrCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', 'false');
    const rightInput = this.getInputValue(node.id, 'b', 'false');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`bool ${resultVar} = ${leftInput} || ${rightInput};`);
  }
  
  /**
   * Generate code for greater than comparison
   */
  protected generateGreaterThanCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', '0');
    const rightInput = this.getInputValue(node.id, 'b', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`bool ${resultVar} = ${leftInput} > ${rightInput};`);
  }
  
  /**
   * Generate code for less than comparison
   */
  protected generateLessThanCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', '0');
    const rightInput = this.getInputValue(node.id, 'b', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`bool ${resultVar} = ${leftInput} < ${rightInput};`);
  }
  
  /**
   * Generate code for equality comparison
   */
  protected generateEqualCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', '0');
    const rightInput = this.getInputValue(node.id, 'b', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`bool ${resultVar} = ${leftInput} == ${rightInput};`);
  }
  
  /**
   * Generate code for addition
   */
  protected generateAddCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', '0');
    const rightInput = this.getInputValue(node.id, 'b', '0');
    
    // Determine if we need auto type or can use a specific type
    let resultType = "auto";
    
    // First check if the inputs are literals, then if they're variables
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    this.addToCode(`${resultType} ${resultVar} = ${leftInput} + ${rightInput};`);
  }
  
  /**
   * Generate code for subtraction
   */
  protected generateSubtractCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', '0');
    const rightInput = this.getInputValue(node.id, 'b', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    // Use auto for type inference as operands could be of any numeric type
    this.addToCode(`auto ${resultVar} = ${leftInput} - ${rightInput};`);
  }
  
  /**
   * Generate code for multiplication
   */
  protected generateMultiplyCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', '0');
    const rightInput = this.getInputValue(node.id, 'b', '0');
    const resultVar = `_temp_${node.id.replace(/-/g, '_')}`;
    
    // Use auto for type inference as operands could be of any numeric type
    this.addToCode(`auto ${resultVar} = ${leftInput} * ${rightInput};`);
  }
  
  /**
   * Generate code for division
   */
  protected generateDivideCode(node: Node<BaseNodeData>): void {
    const leftInput = this.getInputValue(node.id, 'a', '0');
    const rightInput = this.getInputValue(node.id, 'b', '1');
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
    const name = this.getInputValue(node.id, 'name', 'userInput');
    const prompt = this.getInputValue(node.id, 'prompt', '');
    
    // Determine the type based on how the variable is used
    // Default to string for maximum compatibility
    const type = 'string';
    
    if (prompt) {
      this.addToCode(`cout << ${prompt} << endl;`);
    }
    
    this.addToCode(`${type} ${name};`);
    this.addToCode(`cin >> ${name};`);
    
    // Add to variables set
    this.variables.add(name);
  }
} 