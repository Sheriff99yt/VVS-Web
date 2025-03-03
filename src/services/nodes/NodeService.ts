/**
 * NodeService.ts
 * 
 * Service for managing nodes and connections in the flow editor.
 * Provides utilities for creating, modifying, and arranging nodes.
 */

import { Node, Edge, XYPosition } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';

interface NodeCreationParams {
  id?: string;
  type: string;
  position: XYPosition;
  data: Record<string, any>;
}

interface ConnectionParams {
  id?: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export class NodeService {
  /**
   * Creates a new node with the given parameters
   */
  createNode(params: NodeCreationParams): Node {
    return {
      id: params.id || uuidv4(),
      type: params.type,
      position: { ...params.position },
      data: { ...params.data },
    };
  }

  /**
   * Creates a connection between two nodes
   */
  createConnection(params: ConnectionParams): Edge {
    return {
      id: params.id || uuidv4(),
      source: params.source,
      target: params.target,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle,
    };
  }

  /**
   * Deletes nodes and their connected edges
   */
  deleteNodes(nodeIds: string[], nodes: Node[], edges: Edge[]): { nodes: Node[], edges: Edge[] } {
    // Filter out the nodes to delete
    const updatedNodes = nodes.filter(node => !nodeIds.includes(node.id));
    
    // Filter out edges connected to deleted nodes
    const updatedEdges = edges.filter(edge => 
      !nodeIds.includes(edge.source) && !nodeIds.includes(edge.target)
    );
    
    return { nodes: updatedNodes, edges: updatedEdges };
  }

  /**
   * Duplicates selected nodes and their internal connections
   */
  duplicateNodes(nodeIds: string[], nodes: Node[], edges: Edge[]): { nodes: Node[], edges: Edge[] } {
    // Map of original node IDs to new node IDs
    const idMap: Record<string, string> = {};
    
    // Create duplicates of selected nodes
    const nodesToDuplicate = nodes.filter(node => nodeIds.includes(node.id));
    const duplicatedNodes = nodesToDuplicate.map(node => {
      const newId = uuidv4();
      idMap[node.id] = newId;
      
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + 20,
          y: node.position.y + 20
        }
      };
    });
    
    // Find edges between selected nodes
    const edgesToDuplicate = edges.filter(edge => 
      nodeIds.includes(edge.source) && nodeIds.includes(edge.target)
    );
    
    // Create duplicates of edges between selected nodes
    const duplicatedEdges = edgesToDuplicate.map(edge => ({
      ...edge,
      id: uuidv4(),
      source: idMap[edge.source],
      target: idMap[edge.target]
    }));
    
    return { 
      nodes: [...nodes, ...duplicatedNodes], 
      edges: [...edges, ...duplicatedEdges] 
    };
  }

  /**
   * Aligns selected nodes horizontally or vertically
   */
  alignNodes(nodes: Node[], nodeIds: string[], direction: 'horizontal' | 'vertical'): Node[] {
    const selectedNodes = nodes.filter(node => nodeIds.includes(node.id));
    
    // No nodes to align
    if (selectedNodes.length <= 1) {
      return nodes;
    }
    
    // Calculate the average position
    let avgPosition = 0;
    
    if (direction === 'horizontal') {
      // Calculate average Y position
      avgPosition = selectedNodes.reduce((sum, node) => sum + node.position.y, 0) / selectedNodes.length;
    } else {
      // Calculate average X position
      avgPosition = selectedNodes.reduce((sum, node) => sum + node.position.x, 0) / selectedNodes.length;
    }
    
    // Update positions
    return nodes.map(node => {
      if (nodeIds.includes(node.id)) {
        const newPosition = { ...node.position };
        
        if (direction === 'horizontal') {
          newPosition.y = avgPosition;
        } else {
          newPosition.x = avgPosition;
        }
        
        return {
          ...node,
          position: newPosition
        };
      }
      
      return node;
    });
  }
} 