import { Node } from 'reactflow';
import { FunctionDB, NodeFunctionStructure } from '../isolated/db/FunctionDB';

export interface CreateNodeOptions {
  type: string;
  position: { x: number; y: number };
}

export interface NodeData extends NodeFunctionStructure {
  selected?: boolean;
  dragging?: boolean;
}

export class NodeFactory {
  private static db = new FunctionDB();

  static async createNode(options: CreateNodeOptions): Promise<Node<NodeData> | null> {
    try {
      const template = await this.db.getFunctionNode(options.type);
      if (!template) return null;

      return {
        id: crypto.randomUUID(),
        type: 'function',
      position: options.position,
      data: {
          ...template,
          selected: false,
          dragging: false
        }
      };
    } catch (error) {
      console.error('Failed to create node:', error);
      return null;
    }
  }

  static async getNodesByCategory(category: string): Promise<NodeFunctionStructure[]> {
    return this.db.searchFunctionNodesByCategory(category);
  }

  static async getAllNodes(): Promise<NodeFunctionStructure[]> {
    return this.db.getAllFunctionNodes();
  }
}

export default NodeFactory; 