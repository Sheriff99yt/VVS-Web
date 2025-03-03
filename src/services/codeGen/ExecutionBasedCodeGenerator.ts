import { Node, Edge } from 'reactflow';
import { FunctionNodeData } from '../../components/flow/nodes/FunctionNode';
import { DependencyResolver } from './DependencyResolver';
import { SyntaxDatabaseService } from '../database/SyntaxDatabaseService';
import { SyntaxPattern, PatternType } from '../../models/syntax';
import { CodeGenerationError, ErrorSeverity, ErrorSource } from './CodeGenerationError';
import { EdgeType, ExecutionContext } from '../../models/flow';
import { TypeConversionService } from './TypeConversionService';
import { TypeValidator, TypeCompatibilityResult } from '../validation/TypeValidator';

/**
 * Enhanced FunctionNodeData to include syntax-related properties
 */
interface ExtendedFunctionNodeData extends FunctionNodeData {
  functionId?: number; // References the function definition in syntax database
  requiredImports?: string[]; // Specific imports required by this node
  defaultValue?: any; // Default value for input nodes
  type?: string; // Data type for node inputs/outputs
}

// Define possible errors that can be returned during code generation
export interface CodeGenerationResult {
  code: string;
  errors: CodeGenerationError[];
  warnings: CodeGenerationError[];
}

export class ExecutionBasedCodeGenerator {
  private nodes: Node<ExtendedFunctionNodeData>[];
  private edges: Edge[];
  private nodeOutputs: Map<string, string> = new Map();
  private indentationLevel = 0;
  private readonly INDENT = '    '; // Python uses 4 spaces
  private dependencyResolver: DependencyResolver;
  private syntaxDbService?: SyntaxDatabaseService;
  private languageId: number = 1; // Default to Python (assuming ID 1 is Python)
  private syntaxPatterns: Map<number, SyntaxPattern> = new Map();
  private importStatements: Set<string> = new Set();
  private errors: CodeGenerationError[] = [];
  private warnings: CodeGenerationError[] = [];
  
  // New fields for execution flow
  private executionContext: ExecutionContext = {
    currentNodeId: '',
    visitedNodes: new Set<string>(),
    executionStack: [],
    variables: new Map<string, string>(),
    indentation: 0,
    conditionalBranches: new Map<string, string>()
  };
  
  private typeConversionService: TypeConversionService = new TypeConversionService();
  private typeValidator: TypeValidator = new TypeValidator();
  
  constructor(
    nodes: Node<FunctionNodeData>[], 
    edges: Edge[], 
    syntaxDbService?: SyntaxDatabaseService,
    languageId: number = 1
  ) {
    this.nodes = nodes as Node<ExtendedFunctionNodeData>[];
    this.edges = edges;
    this.dependencyResolver = new DependencyResolver(nodes, edges);
    this.syntaxDbService = syntaxDbService;
    this.languageId = languageId;
    this.dependencyResolver.resolve();
  }
  
  /**
   * Initialize the code generator by loading syntax patterns
   */
  public async initialize(): Promise<void> {
    if (!this.syntaxDbService) {
      console.warn('SyntaxDatabaseService not provided, using default patterns');
      return;
    }
    
    try {
      // Load syntax patterns for all function nodes
      for (const node of this.nodes) {
        if (node.data.functionId) {
          const functionId = node.data.functionId;
          
          // Skip if we already have this pattern
          if (this.syntaxPatterns.has(functionId)) {
            continue;
          }
          
          // Get the syntax pattern from the database
          const pattern = await this.syntaxDbService.getSyntaxPattern(
            functionId,
            this.languageId
          );
          
          if (pattern) {
            this.syntaxPatterns.set(functionId, pattern);
            
            // Process imports
            if (pattern.additionalImports && pattern.additionalImports.length > 0) {
              pattern.additionalImports.forEach(importStmt => {
                this.importStatements.add(importStmt);
              });
              
              // Also add to node data for traceability
              node.data.requiredImports = pattern.additionalImports;
            }
          } else {
            this.addError(
              `Syntax pattern not found for function ID ${functionId}`,
              node => node.id === '',
              ErrorSeverity.ERROR
            );
          }
        }
      }
    } catch (error) {
      console.error('Error initializing code generator:', error);
      this.addError(
        `Failed to initialize code generator: ${error}`,
        node => node.id === '',
        ErrorSeverity.ERROR
      );
    }
  }
  
  /**
   * Generate code from the node graph
   */
  public async generateCode(): Promise<CodeGenerationResult> {
    // Reset state
    this.nodeOutputs.clear();
    this.importStatements.clear();
    this.errors = [];
    this.warnings = [];
    this.indentationLevel = 0;
    this.executionContext = {
      currentNodeId: '',
      visitedNodes: new Set<string>(),
      executionStack: [],
      variables: new Map<string, string>(),
      indentation: 0,
      conditionalBranches: new Map<string, string>()
    };
    
    // Initialize if not already done
    if (this.syntaxPatterns.size === 0) {
      await this.initialize();
    }
    
    try {
      let code = '';
      
      // Generate import statements
      code += this.generateImportStatements();
      
      // Check if there are execution flow nodes
      const hasExecutionNodes = this.nodes.some(node => node.data.hasExecutionPorts);
      
      if (hasExecutionNodes) {
        // Generate execution-based code
        code += this.generateExecutionBasedCode();
      } else {
        // Fall back to simple data flow based generation
        code += this.generateSimpleDataFlowCode();
      }
      
      return {
        code,
        errors: this.errors,
        warnings: this.warnings
      };
    } catch (error) {
      console.error('Error generating code:', error);
      this.addError(
        `Code generation failed: ${error}`,
        node => node.id === '',
        ErrorSeverity.ERROR
      );
      
      return {
        code: `# Code generation failed: ${error}`,
        errors: this.errors,
        warnings: this.warnings
      };
    }
  }
  
  /**
   * Generate code based on simple data flow, without considering execution flow
   */
  private generateSimpleDataFlowCode(): string {
    let code = '\n# Data Flow Based Generation\n\n';
    
    // Get execution order from dependency resolver
    const executionOrder = this.dependencyResolver.getExecutionOrder();
    
    // Generate code for each node in order
    for (const node of executionOrder) {
      if (!this.nodeOutputs.has(node.id)) {
        const nodeCode = this.generateNodeCode(node);
        if (nodeCode) {
          code += nodeCode;
        }
      }
    }
    
    return code;
  }
  
  /**
   * Generate import statements based on collected requirements
   */
  private generateImportStatements(): string {
    if (this.importStatements.size === 0) {
      return '';
    }
    
    // Get additional imports from the dependency resolver
    const resolverImports = this.dependencyResolver.getRequiredImports();
    resolverImports.forEach(importStmt => {
      this.importStatements.add(importStmt);
    });
    
    // Sort imports for consistency
    const sortedImports = Array.from(this.importStatements).sort();
    
    // Build import block
    let importBlock = '# Required Imports\n';
    sortedImports.forEach(importStmt => {
      importBlock += `${importStmt}\n`;
    });
    
    return importBlock + '\n';
  }
  
  /**
   * Generate execution-based code that follows execution paths
   */
  private generateExecutionBasedCode(): string {
    let code = '\n# Execution Flow Based Generation\n\n';
    
    // Find entry nodes (nodes with execution inputs but no incoming execution edges)
    const entryNodes = this.findExecutionEntryNodes();
    
    if (entryNodes.length === 0) {
      this.addWarning(
        'No execution entry points found, falling back to data flow based generation',
        node => node.id === '',
        ErrorSeverity.WARNING
      );
      return this.generateSimpleDataFlowCode();
    }
    
    // Generate main function that coordinates execution
    code += this.generateMainFunction(entryNodes);
    
    return code;
  }
  
  /**
   * Find nodes that are entry points for execution flow
   */
  private findExecutionEntryNodes(): Node<ExtendedFunctionNodeData>[] {
    // Get entry points from dependency resolver
    const entryPointIds = this.dependencyResolver.getExecutionEntryPoints();
    const entryNodes = entryPointIds
      .map(id => this.nodes.find(node => node.id === id))
      .filter(Boolean) as Node<ExtendedFunctionNodeData>[];
    
    if (entryNodes.length === 0) {
      // Fall back to input nodes if no execution entry points
      return this.nodes.filter(node => node.type === 'input');
    }
    
    return entryNodes;
  }
  
  /**
   * Generate a main function that coordinates execution flow
   */
  private generateMainFunction(entryNodes: Node<ExtendedFunctionNodeData>[]): string {
    let mainCode = '# Main execution function\ndef main():\n';
    this.indentationLevel = 1;
    
    // First, collect and declare all input variables
    const inputNodes = this.nodes.filter(node => node.type === 'input');
    if (inputNodes.length > 0) {
      mainCode += this.indent() + '# Input variables\n';
      for (const inputNode of inputNodes) {
        const variableName = this.generateVariableName(inputNode);
        // Use default value or type-based default, with fallback
        const defaultValue = (inputNode.data.defaultValue !== undefined) 
          ? inputNode.data.defaultValue 
          : this.getDefaultValueForType(inputNode.data.type || 'String');
        mainCode += this.indent() + `${variableName} = ${JSON.stringify(defaultValue)}\n`;
        this.nodeOutputs.set(inputNode.id, variableName);
      }
      mainCode += '\n';
    }
    
    // Follow execution path from each entry node
    for (const entryNode of entryNodes) {
      mainCode += this.indent() + `# Start execution from ${entryNode.data.label}\n`;
      const executionCode = this.followExecutionPath(entryNode);
      mainCode += executionCode;
    }
    
    // If main function has no content, add a pass statement
    if (mainCode.trim().endsWith('def main():')) {
      mainCode += this.indent() + 'pass\n';
    }
    
    // Add call to main at the end
    mainCode += '\n\n# Execute the program\nif __name__ == "__main__":\n    main()\n';
    
    return mainCode;
  }
  
  /**
   * Follow execution path starting from a specific node
   */
  private followExecutionPath(startNode: Node<ExtendedFunctionNodeData>): string {
    // Reset execution context
    this.executionContext.currentNodeId = startNode.id;
    this.executionContext.visitedNodes = new Set<string>();
    this.executionContext.executionStack = [startNode.id];
    this.executionContext.indentation = this.indentationLevel;
    
    let code = '';
    
    // Process the start node
    if (!this.nodeOutputs.has(startNode.id) && startNode.data.functionId) {
      const nodeCode = this.generateNodeCode(startNode);
      if (nodeCode) {
        code += nodeCode;
      }
    }
    
    // Find next execution nodes and follow them
    let currentNode = startNode;
    const visited = new Set<string>([startNode.id]);
    
    const processNode = (node: Node<ExtendedFunctionNodeData>, visited: Set<string>): string => {
      if (visited.has(node.id)) {
        return '';
      }
      
      visited.add(node.id);
      let nodeCode = '';
      
      // If this is a control flow node, handle it specially
      if (this.isControlFlowNode(node)) {
        nodeCode += this.handleControlFlowNode(node, visited);
      } else {
        // Generate code for this node
        if (!this.nodeOutputs.has(node.id) && node.data.functionId) {
          const code = this.generateNodeCode(node);
          if (code) {
            nodeCode += code;
          }
        }
        
        // Find next nodes and process them
        const nextNodes = this.findNextExecutionNodes(node);
        for (const nextNode of nextNodes) {
          nodeCode += processNode(nextNode, visited);
        }
      }
      
      return nodeCode;
    };
    
    // Process next nodes in execution path
    const nextNodes = this.findNextExecutionNodes(currentNode);
    for (const nextNode of nextNodes) {
      code += processNode(nextNode, visited);
    }
    
    return code;
  }
  
  /**
   * Generate code for a specific node and its dependencies
   */
  private generateNodeCode(node: Node<ExtendedFunctionNodeData>, visited: Set<string> = new Set()): string {
    // Skip already processed nodes
    if (this.nodeOutputs.has(node.id) || visited.has(node.id)) {
      return '';
    }
    
    visited.add(node.id);
    
    // If this is an input node, handle it directly
    if (node.type === 'input') {
      const variableName = this.generateVariableName(node);
      // Use default value or type-based default, with fallback
      const defaultValue = (node.data.defaultValue !== undefined) 
        ? node.data.defaultValue 
        : this.getDefaultValueForType(node.data.type || 'String');
      
      // Store the output for other nodes to reference
      this.nodeOutputs.set(node.id, variableName);
      
      // No code to generate for input nodes as they are handled in the main function
      return '';
    }
    
    // For standard function nodes, make sure their input dependencies are processed first
    const dependencies = this.dependencyResolver.getDependenciesForNode(node.id);
    let dependencyCode = '';
    
    for (const dependency of dependencies) {
      if (!this.nodeOutputs.has(dependency.id) && !visited.has(dependency.id)) {
        const depCode = this.generateNodeCode(dependency, new Set(visited));
        if (depCode) {
          dependencyCode += depCode;
        }
      }
    }
    
    // Now generate code for this node
    let nodeCode = '';
    
    try {
      nodeCode = this.generateNodeSpecificCode(node);
    } catch (error) {
      console.error(`Error generating code for node ${node.id}:`, error);
      this.addError(
        `Failed to generate code for ${node.data.label}: ${error}`,
        node,
        ErrorSeverity.ERROR
      );
      nodeCode = this.indent() + `# ERROR: Failed to generate code for ${node.data.label}\n`;
    }
    
    return dependencyCode + nodeCode;
  }
  
  /**
   * Process dependencies for a node, ensuring they have been evaluated
   */
  private processDependencies(node: Node<ExtendedFunctionNodeData>): void {
    const dependencies = this.dependencyResolver.getDependenciesForNode(node.id);
    
    for (const dependency of dependencies) {
      if (!this.nodeOutputs.has(dependency.id)) {
        this.generateNodeCode(dependency);
      }
    }
  }
  
  /**
   * Generate code specific to a given node type
   */
  private generateNodeSpecificCode(node: Node<ExtendedFunctionNodeData>): string {
    // Skip nodes without function IDs (like input nodes)
    if (!node.data.functionId) {
      return '';
    }
    
    // Ensure all dependencies have been processed
    this.processDependencies(node);
    
    // Get or create a variable name for this node's output
    const outputVar = this.generateVariableName(node);
    
    // Get data dependencies for this node's inputs
    const inputValues = this.getInputValuesForNode(node);
    
    // Get the syntax pattern for this node
    const pattern = this.syntaxPatterns.get(node.data.functionId);
    
    if (!pattern) {
      this.addError(
        `Syntax pattern not found for function ID ${node.data.functionId}`,
        node,
        ErrorSeverity.ERROR
      );
      return this.indent() + `# ERROR: Missing syntax pattern for ${node.data.label}\n`;
    }
    
    // Apply the pattern to generate code
    const code = this.applySyntaxPattern(node, inputValues, outputVar);
    
    // Store the output variable for use by other nodes
    this.nodeOutputs.set(node.id, outputVar);
    
    // Add a comment for clarity
    return this.indent() + `# ${node.data.label}\n` + code;
  }
  
  /**
   * Apply a syntax pattern to generate code for a node
   */
  private applySyntaxPattern(
    node: Node<ExtendedFunctionNodeData>, 
    inputValues: Record<string, string>,
    outputVar: string
  ): string {
    const patternId = node.data.functionId;
    if (!patternId) {
      throw new Error(`Node ${node.id} has no function ID`);
    }
    
    const syntaxPattern = this.syntaxPatterns.get(patternId);
    if (!syntaxPattern) {
      throw new Error(`Syntax pattern not found for function ID ${patternId}`);
    }
    
    // Extract the pattern and its type
    const { pattern, patternType } = syntaxPattern;
    
    // Create array of arguments by replacing placeholders with values
    let code = '';
    let formattedPattern = pattern;
    
    // Replace placeholders ({0}, {1}, etc.) with actual values
    const placeholders = pattern.match(/\{\d+\}/g) || [];
    for (const placeholder of placeholders) {
      const index = parseInt(placeholder.substring(1, placeholder.length - 1), 10);
      const inputIndexes = Object.keys(inputValues);
      
      if (index < inputIndexes.length) {
        const inputKey = inputIndexes[index];
        const inputValue = inputValues[inputKey];
        formattedPattern = formattedPattern.replace(placeholder, inputValue);
      } else {
        this.addWarning(
          `Placeholder ${placeholder} not found in inputs for node ${node.data.label}`,
          node,
          ErrorSeverity.WARNING
        );
        // Use a default value
        formattedPattern = formattedPattern.replace(placeholder, '""');
      }
    }
    
    // Now generate code based on pattern type
    switch (patternType) {
      case PatternType.EXPRESSION:
        code = this.indent() + `${outputVar} = ${formattedPattern}\n`;
        break;
        
      case PatternType.STATEMENT:
        code = this.indent() + `${formattedPattern}\n`;
        break;
        
      case PatternType.BLOCK:
        // For blocks, we need to indent the content
        const lines = formattedPattern.split('\n');
        code = this.indent() + lines[0] + '\n';
        
        // Increase indentation for block content
        this.indentationLevel++;
        
        // Add remaining lines with proper indentation
        for (let i = 1; i < lines.length; i++) {
          code += this.indent() + lines[i] + '\n';
        }
        
        // Restore indentation
        this.indentationLevel--;
        break;
        
      default:
        throw new Error(`Unknown pattern type: ${patternType}`);
    }
    
    return code;
  }
  
  /**
   * Handle a control flow node (if, for, while, etc.)
   */
  private handleControlFlowNode(node: Node<ExtendedFunctionNodeData>, visited: Set<string>): string {
    let code = '';
    
    // Make sure dependencies are processed
    this.processDependencies(node);
    
    // Get input values for the node
    const inputValues = this.getInputValuesForNode(node);
    
    // Check the type of control flow
    const functionId = node.data.functionId;
    if (!functionId) {
      this.addError(
        `Control flow node ${node.data.label} has no function ID`,
        node,
        ErrorSeverity.ERROR
      );
      return '';
    }
    
    // Get syntax pattern
    const syntaxPattern = this.syntaxPatterns.get(functionId);
    if (!syntaxPattern) {
      this.addError(
        `Syntax pattern not found for function ID ${functionId}`,
        node,
        ErrorSeverity.ERROR
      );
      return '';
    }
    
    // Get condition value and body code
    let conditionValue = '';
    
    // Handle conditional branches (if node)
    if (node.data.label.toLowerCase().includes('if')) {
      // Get the condition from inputs
      const conditionInputId = Object.keys(inputValues)[0]; // First input should be condition
      if (conditionInputId) {
        conditionValue = inputValues[conditionInputId];
      }
      
      // Get the true and false execution outputs
      const trueOutputId = node.data.executionOutputs?.find(o => o.label?.toLowerCase() === 'true')?.id;
      const falseOutputId = node.data.executionOutputs?.find(o => o.label?.toLowerCase() === 'false')?.id;
      
      // Find edges for true and false paths
      const trueEdge = trueOutputId && this.findExecutionEdgeBySourceHandle(`exec-output-${trueOutputId}`);
      const falseEdge = falseOutputId && this.findExecutionEdgeBySourceHandle(`exec-output-${falseOutputId}`);
      
      // Generate if statement
      code += this.indent() + `# ${node.data.label}\n`;
      code += this.indent() + `if ${conditionValue}:\n`;
      
      // Increase indentation for if body
      this.indentationLevel++;
      
      // Generate code for the true branch
      if (trueEdge) {
        const trueTargetNode = this.nodes.find(n => n.id === trueEdge.target);
        if (trueTargetNode && !visited.has(trueTargetNode.id)) {
          const trueCode = this.generateNodeCode(trueTargetNode, visited);
          if (trueCode) {
            code += trueCode;
          } else {
            code += this.indent() + 'pass  # No operations in true branch\n';
          }
          
          // Follow the execution path
          const nextNodes = this.findNextExecutionNodes(trueTargetNode);
          for (const nextNode of nextNodes) {
            if (!visited.has(nextNode.id)) {
              const nextCode = this.generateNodeCode(nextNode, visited);
              if (nextCode) {
                code += nextCode;
              }
            }
          }
        } else {
          code += this.indent() + 'pass  # Empty true branch\n';
        }
      } else {
        code += this.indent() + 'pass  # No true branch defined\n';
      }
      
      // Decrease indentation after if body
      this.indentationLevel--;
      
      // Generate code for the false branch if it exists
      if (falseEdge) {
        code += this.indent() + 'else:\n';
        
        // Increase indentation for else body
        this.indentationLevel++;
        
        const falseTargetNode = this.nodes.find(n => n.id === falseEdge.target);
        if (falseTargetNode && !visited.has(falseTargetNode.id)) {
          const falseCode = this.generateNodeCode(falseTargetNode, visited);
          if (falseCode) {
            code += falseCode;
          } else {
            code += this.indent() + 'pass  # No operations in false branch\n';
          }
          
          // Follow the execution path
          const nextNodes = this.findNextExecutionNodes(falseTargetNode);
          for (const nextNode of nextNodes) {
            if (!visited.has(nextNode.id)) {
              const nextCode = this.generateNodeCode(nextNode, visited);
              if (nextCode) {
                code += nextCode;
              }
            }
          }
        } else {
          code += this.indent() + 'pass  # Empty false branch\n';
        }
        
        // Decrease indentation after else body
        this.indentationLevel--;
      }
      
      return code;
    }
    
    // Handle loops (for, while)
    if (node.data.label.toLowerCase().includes('for')) {
      // Get loop variable and sequence
      const inputIndexes = Object.keys(inputValues);
      const loopVarInputId = inputIndexes[0]; // First input is the loop variable
      const sequenceInputId = inputIndexes[1]; // Second input is the sequence
      
      if (loopVarInputId && sequenceInputId) {
        const loopVar = inputValues[loopVarInputId];
        const sequence = inputValues[sequenceInputId];
        
        // Generate for loop
        code += this.indent() + `# ${node.data.label}\n`;
        code += this.indent() + `for ${loopVar} in ${sequence}:\n`;
        
        // Increase indentation for loop body
        this.indentationLevel++;
        
        // Get the loop body execution output
        const bodyOutputId = node.data.executionOutputs?.find(o => o.label?.toLowerCase() === 'body')?.id;
        const bodyEdge = bodyOutputId && this.findExecutionEdgeBySourceHandle(`exec-output-${bodyOutputId}`);
        
        // Generate code for the loop body
        if (bodyEdge) {
          const bodyTargetNode = this.nodes.find(n => n.id === bodyEdge.target);
          if (bodyTargetNode && !visited.has(bodyTargetNode.id)) {
            const bodyCode = this.generateNodeCode(bodyTargetNode, visited);
            if (bodyCode) {
              code += bodyCode;
            } else {
              code += this.indent() + 'pass  # No operations in loop body\n';
            }
            
            // Follow the execution path
            const nextNodes = this.findNextExecutionNodes(bodyTargetNode);
            for (const nextNode of nextNodes) {
              if (!visited.has(nextNode.id)) {
                const nextCode = this.generateNodeCode(nextNode, visited);
                if (nextCode) {
                  code += nextCode;
                }
              }
            }
          } else {
            code += this.indent() + 'pass  # Empty loop body\n';
          }
        } else {
          code += this.indent() + 'pass  # No loop body defined\n';
        }
        
        // Decrease indentation after loop body
        this.indentationLevel--;
        
        return code;
      }
    }
    
    // If we can't handle it as a special control flow, fall back to regular node code
    code += this.generateNodeSpecificCode(node);
    
    return code;
  }
  
  /**
   * Find an execution edge by source handle
   */
  private findExecutionEdgeBySourceHandle(sourceHandle: string): Edge | undefined {
    return this.edges.find(edge => edge.sourceHandle === sourceHandle);
  }
  
  /**
   * Find the next nodes in the execution flow
   */
  private findNextExecutionNodes(node: Node<ExtendedFunctionNodeData>): Node<ExtendedFunctionNodeData>[] {
    // Skip if the node has no execution outputs
    if (!node.data.hasExecutionPorts || !node.data.executionOutputs || node.data.executionOutputs.length === 0) {
      return [];
    }
    
    // If this is a control flow node, we don't directly follow execution path (handled specially)
    if (this.isControlFlowNode(node)) {
      return [];
    }
    
    // Find edges that connect from this node's execution outputs
    const nextNodes: Node<ExtendedFunctionNodeData>[] = [];
    
    // Check each execution output
    for (const output of node.data.executionOutputs) {
      const sourceHandle = `exec-output-${output.id}`;
      
      // Find edges from this output
      const edges = this.edges.filter(edge => 
        edge.source === node.id && 
        edge.sourceHandle === sourceHandle &&
        edge.data?.type === EdgeType.EXECUTION
      );
      
      // Add target nodes
      for (const edge of edges) {
        const targetNode = this.nodes.find(n => n.id === edge.target);
        if (targetNode) {
          nextNodes.push(targetNode);
        }
      }
    }
    
    return nextNodes;
  }
  
  /**
   * Get input values for a node
   */
  private getInputValuesForNode(node: Node<ExtendedFunctionNodeData>): Record<string, string> {
    const inputValues: Record<string, string> = {};
    
    // Handle nodes without inputs
    if (!node.data.inputs) {
      return inputValues;
    }
    
    // Get data dependencies from the resolver
    const dataDependencies = this.dependencyResolver.getDataDependenciesForNode(node.id);
    
    // Process each input port
    for (const input of node.data.inputs) {
      const inputId = `input-${input.id}`;
      
      // Check if we have a data dependency for this input
      const sourcePath = dataDependencies.get(inputId);
      
      if (sourcePath) {
        // Parse the source path (format: "nodeId:outputId")
        const [sourceNodeId, sourceOutputId] = sourcePath.split(':');
        
        // Get the output value of the source node
        const sourceOutputValue = this.nodeOutputs.get(sourceNodeId);
        
        if (sourceOutputValue) {
          // Get source node to check its output type
          const sourceNode = this.nodes.find(n => n.id === sourceNodeId);
          if (sourceNode) {
            // Find the actual output port
            const outputPort = sourceNode.data.outputs?.find(
              output => output.id === sourceOutputId.replace('output-', '')
            );
            
            if (outputPort && outputPort.type !== input.type) {
              // Types don't match, check if conversion is needed
              const compatibility = this.typeValidator.checkTypeCompatibility(
                outputPort.type,
                input.type
              );
              
              if (compatibility === TypeCompatibilityResult.COMPATIBLE_WITH_CONVERSION) {
                // Apply type conversion
                inputValues[inputId] = this.typeConversionService.getConversionCode(
                  sourceOutputValue,
                  outputPort.type,
                  input.type
                );
              } else {
                // Just use the value as-is (it's either compatible or we can't convert)
                inputValues[inputId] = sourceOutputValue;
              }
            } else {
              // Types match, use the value directly
              inputValues[inputId] = sourceOutputValue;
            }
          } else {
            // If source node not found, just use the value
            inputValues[inputId] = sourceOutputValue;
          }
        } else {
          // Source node hasn't been processed yet, this is an error
          this.addError(
            `Input ${input.name} references an unprocessed node`,
            node,
            ErrorSeverity.ERROR
          );
          
          // Use a default value
          inputValues[inputId] = this.getDefaultValueForType(input.type);
        }
      } else {
        // No source connected, use a default value
        const defaultValue = this.getDefaultValueForType(input.type);
        inputValues[inputId] = defaultValue;
        
        // Warn about missing required inputs
        if (input.required) {
          this.addWarning(
            `Required input ${input.name} has no connected source`,
            node,
            ErrorSeverity.WARNING
          );
        }
      }
    }
    
    return inputValues;
  }
  
  /**
   * Generate a variable name for a node
   */
  private generateVariableName(node: Node<ExtendedFunctionNodeData>): string {
    // For input nodes, use a cleaner name based on the label
    if (node.type === 'input') {
      return node.data.label
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_');
    }
    
    // For other nodes, use a name based on the function and node ID
    const functionName = node.data.label
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_');
    
    return `${functionName}_${node.id.replace(/-/g, '_')}`;
  }
  
  /**
   * Get the default value for a given type
   */
  private getDefaultValueForType(type: string): string {
    switch (type?.toLowerCase()) {
      case 'string':
        return '""';
      case 'number':
      case 'integer':
        return '0';
      case 'boolean':
        return 'False';
      case 'array':
      case 'list':
        return '[]';
      case 'object':
      case 'dictionary':
        return '{}';
      case 'any':
      default:
        return 'None';
    }
  }
  
  /**
   * Check if a node is a control flow node
   */
  private isControlFlowNode(node: Node<ExtendedFunctionNodeData>): boolean {
    // Check if the category is "Control Flow"
    if (node.data.category === 'Control Flow') {
      return true;
    }
    
    // Check if the label contains control flow keywords
    const label = node.data.label.toLowerCase();
    return (
      label.includes('if') ||
      label.includes('for') ||
      label.includes('while') ||
      label.includes('switch') ||
      label.includes('conditional')
    );
  }
  
  /**
   * Check if we should increase indentation for nodes that follow this one
   */
  private shouldIncreaseIndentForNextNodes(node: Node<ExtendedFunctionNodeData>): boolean {
    // Control flow nodes typically increase indentation
    if (this.isControlFlowNode(node)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Get the current indentation as a string
   */
  private indent(): string {
    return this.INDENT.repeat(this.indentationLevel);
  }
  
  /**
   * Add an error to the error list
   */
  private addError(message: string, nodeOrFunc: Node<ExtendedFunctionNodeData> | ((node: Node<ExtendedFunctionNodeData>) => boolean), severity: ErrorSeverity): void {
    // Create the error with the correct source based on severity
    const source = severity === ErrorSeverity.WARNING ? 
      ErrorSource.NODE_EXECUTION : 
      ErrorSource.NODE_EXECUTION;
    
    // Create options object with nodeId if available
    const options = {
      nodeId: typeof nodeOrFunc === 'function' ? undefined : nodeOrFunc.id,
      nodeLabel: typeof nodeOrFunc === 'function' ? undefined : nodeOrFunc.data.label,
      severity
    };
    
    const error = new CodeGenerationError(message, source, options);
    
    if (severity === ErrorSeverity.WARNING) {
      this.warnings.push(error);
    } else {
      this.errors.push(error);
    }
  }
  
  /**
   * Add a warning to the warning list
   */
  private addWarning(message: string, nodeOrFunc: Node<ExtendedFunctionNodeData> | ((node: Node<ExtendedFunctionNodeData>) => boolean), severity: ErrorSeverity): void {
    this.addError(message, nodeOrFunc, severity);
  }
} 