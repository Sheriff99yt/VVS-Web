/**
 * Universal Code Generator Extension
 * 
 * This file extends the BaseCodeGenerator to integrate with the Node Factory system.
 * It adds support for handling code generation through registered handlers.
 */

import { Node, Edge } from 'reactflow';
import { BaseNodeData, NodeType } from '../../nodes/types';
import { BaseCodeGenerator } from './BaseCodeGenerator';
import { getCodeGenerationHandler } from '../../nodes/NodeFactory';
import { LanguageConfig } from '../languageConfig';
import { SocketType } from '../../sockets/types';

/**
 * Enhanced Universal Code Generator that integrates with Node Factory
 * 
 * This class extends the BaseCodeGenerator to add support
 * for code generation handlers registered through the Node Factory.
 */
export class EnhancedUniversalCodeGenerator extends BaseCodeGenerator {
  /**
   * Constructor
   * @param nodes The nodes in the graph
   * @param edges The edges connecting the nodes
   * @param config The language configuration
   */
  constructor(nodes: Node<BaseNodeData>[], edges: Edge[], config: LanguageConfig) {
    super(nodes, edges, config);
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
    
    // Process all nodes (starting with entry points)
    const entryPoints = this.findEntryNodes();
    
    // If no entry points found, just process all nodes
    if (entryPoints.length === 0) {
      for (const node of this.nodes) {
        this.processNode(node);
      }
    } else {
      // Process each entry point
      for (const entryNode of entryPoints) {
        this.processNode(entryNode);
      }
    }
    
    return this.formatCode(this.code);
  }
  
  /**
   * Add standard imports for the language
   */
  protected addImports(): void {
    if (this.config.standardImports && this.config.standardImports.length > 0) {
      for (const importStatement of this.config.standardImports) {
        this.addToCode(importStatement);
        this.addToCode('\n');
      }
      this.addToCode('\n');
    }
  }
  
  /**
   * Process a node using registered handlers if available
   * @param node The node to process
   */
  protected processNode(node: Node<BaseNodeData>): void {
    // If already processed, skip
    if (this.processedNodes.has(node.id)) {
      return;
    }
    
    // Mark as processed
    this.processedNodes.add(node.id);
    
    // Get node comments if available
    this.addNodeCommentToCode(node);
    
    // Check if there's a registered handler for this node type
    const handler = getCodeGenerationHandler(node.data.type);
    
    if (handler) {
      // Use the registered handler
      handler(node, this);
      
      // Process flow outputs after handling the node
      this.processFlowOutputs(node);
    } else {
      // Handle based on node type
      switch (node.data.type) {
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
        case NodeType.VARIABLE_DEFINITION:
          this.generateVariableDefinitionCode(node);
          break;
        case NodeType.VARIABLE_GETTER:
          this.generateVariableGetterCode(node);
          break;
        case NodeType.PRINT:
          this.generatePrintCode(node);
          break;
        case NodeType.USER_INPUT:
          this.generateUserInputCode(node);
          break;
        default:
          this.addToCode(this.formatComment(`Unsupported node type: ${node.data.type}`));
          this.addToCode('\n');
      }
    }
  }
  
  /**
   * Process math operations
   * @param node The node to process
   * @param operator The operator to use
   */
  processMathOperation(node: Node<BaseNodeData>, operator: string): void {
    const a = this.getInputValue(node.id, 'a', '0');
    const b = this.getInputValue(node.id, 'b', '0');
    
    let operationCode = '';
    switch (operator) {
      case '+':
        operationCode = this.config.operators.add.replace('$left', a).replace('$right', b);
        break;
      case '-':
        operationCode = this.config.operators.subtract.replace('$left', a).replace('$right', b);
        break;
      case '*':
        operationCode = this.config.operators.multiply.replace('$left', a).replace('$right', b);
        break;
      case '/':
        operationCode = this.config.operators.divide.replace('$left', a).replace('$right', b);
        break;
      default:
        operationCode = `${a} ${operator} ${b}`;
    }
    
    this.addToCode(operationCode);
  }
  
  /**
   * Process logic operations
   * @param node The node to process
   * @param operator The operator to use
   */
  processLogicOperation(node: Node<BaseNodeData>, operator: string): void {
    const a = this.getInputValue(node.id, 'a', 'false');
    const b = this.getInputValue(node.id, 'b', 'false');
    
    let operationCode = '';
    switch (operator) {
      case 'and':
        operationCode = this.config.operators.and.replace('$left', a).replace('$right', b);
        break;
      case 'or':
        operationCode = this.config.operators.or.replace('$left', a).replace('$right', b);
        break;
      case 'greaterThan':
        operationCode = this.config.operators.greaterThan.replace('$left', a).replace('$right', b);
        break;
      case 'lessThan':
        operationCode = this.config.operators.lessThan.replace('$left', a).replace('$right', b);
        break;
      case 'equal':
        operationCode = this.config.operators.equal.replace('$left', a).replace('$right', b);
        break;
      default:
        operationCode = `${a} ${operator} ${b}`;
    }
    
    this.addToCode(operationCode);
  }
  
  /**
   * Process unary logic operations (like NOT)
   * @param node The node to process
   * @param operator The operator to use
   */
  processUnaryLogicOperation(node: Node<BaseNodeData>, operator: string): void {
    const input = this.getInputValue(node.id, 'input', 'false');
    
    let operationCode = '';
    if (operator === 'not' && this.config.operators.not) {
      operationCode = this.config.operators.not.replace('$value', input);
    } else {
      operationCode = `${operator} ${input}`;
    }
    
    this.addToCode(operationCode);
  }
  
  // Required abstract method implementations
  protected generateIfStatementCode(node: Node<BaseNodeData>): void {
    const condition = this.getInputValue(node.id, 'condition', 'true');
    
    const ifCode = this.config.syntax.ifStatement.replace('$condition', condition);
    this.addToCode(ifCode);
    this.addToCode('\n');
    
    this.increaseIndentation();
    this.processFlowOutputs(node);
    this.decreaseIndentation();
  }
  
  protected generateForLoopCode(node: Node<BaseNodeData>): void {
    const variable = node.data.properties?.variable || 'i';
    const start = this.getInputValue(node.id, 'start', '0');
    const end = this.getInputValue(node.id, 'end', '10');
    const step = this.getInputValue(node.id, 'step', '1');
    
    const forCode = this.config.syntax.forLoop
      .replace('$variable', variable)
      .replace('$start', start)
      .replace('$end', end)
      .replace('$step', step);
    
    this.addToCode(forCode);
    this.addToCode('\n');
    
    this.increaseIndentation();
    this.processFlowOutputs(node);
    this.decreaseIndentation();
  }
  
  protected generateAndCode(node: Node<BaseNodeData>): void {
    this.processLogicOperation(node, 'and');
  }
  
  protected generateOrCode(node: Node<BaseNodeData>): void {
    this.processLogicOperation(node, 'or');
  }
  
  protected generateGreaterThanCode(node: Node<BaseNodeData>): void {
    this.processLogicOperation(node, 'greaterThan');
  }
  
  protected generateLessThanCode(node: Node<BaseNodeData>): void {
    this.processLogicOperation(node, 'lessThan');
  }
  
  protected generateEqualCode(node: Node<BaseNodeData>): void {
    this.processLogicOperation(node, 'equal');
  }
  
  protected generateAddCode(node: Node<BaseNodeData>): void {
    this.processMathOperation(node, '+');
  }
  
  protected generateSubtractCode(node: Node<BaseNodeData>): void {
    this.processMathOperation(node, '-');
  }
  
  protected generateMultiplyCode(node: Node<BaseNodeData>): void {
    this.processMathOperation(node, '*');
  }
  
  protected generateDivideCode(node: Node<BaseNodeData>): void {
    this.processMathOperation(node, '/');
  }
  
  protected generateVariableDefinitionCode(node: Node<BaseNodeData>): void {
    const name = this.getInputValue(node.id, 'name', 'variable');
    const value = this.getInputValue(node.id, 'value', '0');
    
    const varCode = this.config.syntax.variableDefinition
      .replace('$name', name)
      .replace('$value', value);
    
    this.addToCode(varCode);
    this.addToCode('\n');
    
    this.variables.add(name);
    this.processFlowOutputs(node);
  }
  
  protected generateVariableGetterCode(node: Node<BaseNodeData>): void {
    const name = this.getInputValue(node.id, 'name', 'variable');
    this.addToCode(name);
  }
  
  protected generatePrintCode(node: Node<BaseNodeData>): void {
    const value = this.getInputValue(node.id, 'value', '""');
    
    const printCode = this.config.syntax.print.replace('$value', value);
    this.addToCode(printCode);
    this.addToCode('\n');
    
    this.processFlowOutputs(node);
  }
  
  protected generateUserInputCode(node: Node<BaseNodeData>): void {
    this.addToCode(this.formatUserInput(node));
    this.addToCode('\n');
    
    this.processFlowOutputs(node);
  }
  
  protected formatUserInput(node: Node<BaseNodeData>): string {
    const prompt = this.getInputValue(node.id, 'prompt', '"Enter a value: "');
    const variable = node.data.properties?.variable || 'input_value';
    
    const inputCode = this.config.syntax.input
      .replace('$prompt', prompt)
      .replace('$variable', variable);
    
    return inputCode;
  }
}

/**
 * Initialize the Universal Code Generator extension
 * 
 * This should be called during application initialization
 */
export function initializeCodeGeneratorExtension(): void {
  console.log('Enhanced Universal Code Generator initialized with Node Factory integration');
} 