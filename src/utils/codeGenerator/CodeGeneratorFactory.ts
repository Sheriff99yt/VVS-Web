import { Edge, Node } from 'reactflow';
import { BaseNodeData } from '../../nodes/types';
import { BaseCodeGenerator } from './BaseCodeGenerator';
import { EnhancedUniversalCodeGenerator } from './UniversalCodeGeneratorExtension';
import { pythonConfig, typeScriptConfig, cppConfig } from '../languageConfig';

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
    // Use the enhanced universal code generator with the appropriate language config
    switch (language.toLowerCase()) {
      case 'python':
        return new EnhancedUniversalCodeGenerator(nodes, edges, pythonConfig);
      case 'typescript':
        return new EnhancedUniversalCodeGenerator(nodes, edges, typeScriptConfig);
      case 'c++':
        return new EnhancedUniversalCodeGenerator(nodes, edges, cppConfig);
      default:
        // Default to Python if language is not supported
        console.warn(`Language '${language}' not supported, defaulting to Python`);
        return new EnhancedUniversalCodeGenerator(nodes, edges, pythonConfig);
    }
  }
} 