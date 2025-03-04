import { Edge, Node } from 'reactflow';
import { BaseNodeData } from '../nodes/types';
import { generateCode, getAvailableCodeLanguages } from './codeGenerator/index';

/**
 * Generate Python code from a node graph
 * @param nodes The nodes in the graph
 * @param edges The edges connecting the nodes
 * @returns The generated Python code
 * @deprecated Use generateCode from './codeGenerator/index' instead
 */
export const generatePythonCode = (
  nodes: Node<BaseNodeData>[],
  edges: Edge[]
): string => {
  return generateCode(nodes, edges, 'Python');
};

// Re-export the new functions for backward compatibility
export { generateCode, getAvailableCodeLanguages }; 