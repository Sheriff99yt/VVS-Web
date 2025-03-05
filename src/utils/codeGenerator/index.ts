import { Edge, Node } from 'reactflow';
import { BaseNodeData } from '../../nodes/types';
import { LanguageRegistry } from './languageRegistry';
import { UniversalCodeGenerator } from './UniversalCodeGenerator';

/**
 * Generate code from a node graph in the specified language
 * @param nodes The nodes in the graph
 * @param edges The edges connecting the nodes
 * @param language The target language (defaults to Python)
 * @returns The generated code
 */
export const generateCode = (
  nodes: Node<BaseNodeData>[],
  edges: Edge[],
  language: string = 'Python'
): string => {
  // Get language configuration
  const config = LanguageRegistry.getConfigWithFallback(language);
  
  // Create and use the universal generator
  const generator = new UniversalCodeGenerator(nodes, edges, config);
  return generator.generate();
};

/**
 * Get available languages for code generation
 * @returns Array of available language names
 */
export const getAvailableCodeLanguages = (): string[] => {
  return LanguageRegistry.getAvailableLanguages();
};

// Export for direct use
export { LanguageRegistry } from './languageRegistry';
export { UniversalCodeGenerator } from './UniversalCodeGenerator'; 