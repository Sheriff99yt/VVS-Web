import { Node, Edge } from 'reactflow';
import { CustomNodeData } from '../components/nodes/CustomNodes';

interface ClipboardData {
  nodes: Node<CustomNodeData>[];
  edges: Edge[];
}

export class ClipboardService {
  private static clipboard: ClipboardData | null = null;

  /**
   * Copy nodes and edges to clipboard
   * @param nodes Nodes to copy
   * @param edges Edges to copy
   */
  static copy(nodes: Node<CustomNodeData>[], edges: Edge[]): void {
    this.clipboard = {
      nodes: nodes.map(node => ({ ...node, data: { ...node.data } })), // Deep copy of node data
      edges: edges.map(edge => ({ ...edge }))
    };
  }

  /**
   * Create new nodes and edges from clipboard data with updated positions and IDs
   * @param targetPosition The target position where to paste the nodes (mouse position)
   * @returns New nodes and edges with updated positions and IDs, or null if clipboard is empty
   */
  static createFromClipboard(targetPosition: { x: number; y: number }): ClipboardData | null {
    if (!this.clipboard) return null;

    // Calculate the bounding box of the clipboard nodes
    const bounds = this.clipboard.nodes.reduce(
      (acc, node) => ({
        minX: Math.min(acc.minX, node.position.x),
        minY: Math.min(acc.minY, node.position.y),
        maxX: Math.max(acc.maxX, node.position.x),
        maxY: Math.max(acc.maxY, node.position.y)
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );

    // Calculate the center of the bounding box
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    // Create a map to track new IDs
    const idMap = new Map<string, string>();

    // Create new nodes with updated positions
    const newNodes = this.clipboard.nodes.map(node => {
      const newId = `${node.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      idMap.set(node.id, newId);

      // Calculate relative position from the center
      const relativeX = node.position.x - centerX;
      const relativeY = node.position.y - centerY;

      return {
        ...node,
        id: newId,
        position: {
          x: targetPosition.x + relativeX,
          y: targetPosition.y + relativeY
        },
        selected: true,
        data: { ...node.data } // Deep copy of node data
      };
    });

    // Create new edges with updated references
    const newEdges = this.clipboard.edges
      .filter(edge => idMap.has(edge.source) && idMap.has(edge.target))
      .map(edge => ({
        ...edge,
        id: `${edge.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: idMap.get(edge.source)!,
        target: idMap.get(edge.target)!,
        selected: true
      }));

    return { nodes: newNodes, edges: newEdges };
  }

  static hasData(): boolean {
    return this.clipboard !== null;
  }

  /**
   * Creates a duplicate of the provided nodes and edges centered at the target position
   * @param nodes The nodes to duplicate
   * @param edges The edges to duplicate
   * @param targetPosition The target position where to center the duplicated nodes (mouse position)
   * @returns New nodes and edges with unique IDs and updated positions
   */
  static duplicateElements(
    nodes: Node<CustomNodeData>[],
    edges: Edge[],
    targetPosition: { x: number; y: number }
  ): ClipboardData {
    // Calculate the bounding box of the nodes
    const bounds = nodes.reduce(
      (acc, node) => ({
        minX: Math.min(acc.minX, node.position.x),
        minY: Math.min(acc.minY, node.position.y),
        maxX: Math.max(acc.maxX, node.position.x),
        maxY: Math.max(acc.maxY, node.position.y)
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );

    // Calculate the center of the bounding box
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    // Create a map for tracking new IDs
    const idMap = new Map<string, string>();
    
    // Create duplicates of nodes with new IDs and positions
    const duplicatedNodes = nodes.map(node => {
      const newId = `${node.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      idMap.set(node.id, newId);
      
      // Calculate relative position from the center
      const relativeX = node.position.x - centerX;
      const relativeY = node.position.y - centerY;

      return {
        ...node,
        id: newId,
        position: {
          x: targetPosition.x + relativeX,
          y: targetPosition.y + relativeY
        },
        selected: true,
        data: { ...node.data }
      };
    });

    // Create duplicates of edges between the duplicated nodes
    const duplicatedEdges = edges
      .filter(edge => 
        idMap.has(edge.source) && idMap.has(edge.target)
      )
      .map(edge => ({
        ...edge,
        id: `${edge.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: idMap.get(edge.source)!,
        target: idMap.get(edge.target)!,
        selected: true
      }));

    return {
      nodes: duplicatedNodes,
      edges: duplicatedEdges
    };
  }
} 