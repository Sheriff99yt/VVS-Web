import { Node, Edge } from 'reactflow';
import { NodeData } from './NodeFactory';

export type Language = 'python' | 'javascript' | 'cpp' | 'pseudocode';

interface CodeGeneratorOptions {
  language: Language;
}

export class CodeGenerator {
  private language: Language;

  constructor(options: CodeGeneratorOptions) {
    this.language = options.language;
  }

  generateCode(nodes: Node<NodeData>[], edges: Edge[]): string {
    // For now, return a placeholder
    return `// Generated ${this.language} code\n// Nodes: ${nodes.length}\n// Edges: ${edges.length}\n`;
  }
}

export default CodeGenerator; 