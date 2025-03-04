import { Edge, Node } from 'reactflow';
import { BaseNodeData } from '../../nodes/types';
import { CodeGeneratorFactory } from './CodeGeneratorFactory';
import { getAvailableLanguages } from '../languageConfig';

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
  const generator = CodeGeneratorFactory.createGenerator(language, nodes, edges);
  return generator.generate();
};

/**
 * Get the list of available languages for code generation
 * @returns Array of available language names
 */
export const getAvailableCodeLanguages = (): string[] => {
  return getAvailableLanguages();
};

// Export the factory and individual generators for direct use if needed
export { CodeGeneratorFactory } from './CodeGeneratorFactory';
export { BaseCodeGenerator } from './BaseCodeGenerator';
export { PythonCodeGenerator } from './PythonCodeGenerator';
export { TypeScriptCodeGenerator } from './TypeScriptCodeGenerator';
export { CppCodeGenerator } from './CppCodeGenerator'; 