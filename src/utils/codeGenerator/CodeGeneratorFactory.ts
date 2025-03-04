import { Edge, Node } from 'reactflow';
import { BaseNodeData } from '../../nodes/types';
import { BaseCodeGenerator } from './BaseCodeGenerator';
import { PythonCodeGenerator } from './PythonCodeGenerator';
import { TypeScriptCodeGenerator } from './TypeScriptCodeGenerator';
import { CppCodeGenerator } from './CppCodeGenerator';

/**
 * Factory class to create the appropriate code generator based on the selected language
 */
export class CodeGeneratorFactory {
  /**
   * Create a code generator for the specified language
   * @param language The target language
   * @param nodes The nodes in the graph
   * @param edges The edges connecting the nodes
   * @returns A code generator for the specified language
   */
  static createGenerator(
    language: string,
    nodes: Node<BaseNodeData>[],
    edges: Edge[]
  ): BaseCodeGenerator {
    switch (language.toLowerCase()) {
      case 'python':
        return new PythonCodeGenerator(nodes, edges);
      case 'typescript':
        return new TypeScriptCodeGenerator(nodes, edges);
      case 'c++':
        return new CppCodeGenerator(nodes, edges);
      default:
        // Default to Python if language is not supported
        console.warn(`Language '${language}' not supported, defaulting to Python`);
        return new PythonCodeGenerator(nodes, edges);
    }
  }
} 