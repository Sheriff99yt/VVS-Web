/**
 * NodeService.test.ts
 * 
 * Tests for the node management service.
 * Verifies node creation, connection management, and node operations.
 */

import { NodeService } from '../../services/nodes/NodeService';
import { Node, Edge } from 'reactflow';

describe('NodeService', () => {
  let nodeService: NodeService;
  
  beforeEach(() => {
    // Create a new instance for each test
    nodeService = new NodeService();
  });
  
  describe('createNode', () => {
    it('creates a node with the specified type and position', () => {
      // Create a node
      const node = nodeService.createNode({
        type: 'input',
        position: { x: 100, y: 200 },
        data: { label: 'Input Node' }
      });
      
      // Verify node properties
      expect(node.id).toBeDefined();
      expect(node.type).toBe('input');
      expect(node.position.x).toBe(100);
      expect(node.position.y).toBe(200);
      expect(node.data.label).toBe('Input Node');
    });
    
    it('creates a node with a unique ID', () => {
      // Create multiple nodes
      const node1 = nodeService.createNode({ type: 'input', position: { x: 0, y: 0 }, data: {} });
      const node2 = nodeService.createNode({ type: 'input', position: { x: 0, y: 0 }, data: {} });
      const node3 = nodeService.createNode({ type: 'input', position: { x: 0, y: 0 }, data: {} });
      
      // Verify each node has a unique ID
      expect(node1.id).not.toBe(node2.id);
      expect(node1.id).not.toBe(node3.id);
      expect(node2.id).not.toBe(node3.id);
    });
    
    it('creates a node with the provided ID if specified', () => {
      // Create a node with a specific ID
      const node = nodeService.createNode({
        id: 'custom-id',
        type: 'input',
        position: { x: 0, y: 0 },
        data: {}
      });
      
      // Verify the node has the specified ID
      expect(node.id).toBe('custom-id');
    });
  });
  
  describe('createConnection', () => {
    it('creates a connection between two nodes', () => {
      // Create source and target nodes
      const sourceNode = nodeService.createNode({ type: 'input', position: { x: 0, y: 0 }, data: {} });
      const targetNode = nodeService.createNode({ type: 'output', position: { x: 200, y: 0 }, data: {} });
      
      // Create a connection
      const edge = nodeService.createConnection({
        source: sourceNode.id,
        target: targetNode.id,
        sourceHandle: 'output',
        targetHandle: 'input'
      });
      
      // Verify connection properties
      expect(edge.id).toBeDefined();
      expect(edge.source).toBe(sourceNode.id);
      expect(edge.target).toBe(targetNode.id);
      expect(edge.sourceHandle).toBe('output');
      expect(edge.targetHandle).toBe('input');
    });
    
    it('creates a connection with a unique ID', () => {
      // Create source and target nodes
      const sourceNode = nodeService.createNode({ type: 'input', position: { x: 0, y: 0 }, data: {} });
      const targetNode = nodeService.createNode({ type: 'output', position: { x: 200, y: 0 }, data: {} });
      
      // Create multiple connections
      const edge1 = nodeService.createConnection({ source: sourceNode.id, target: targetNode.id });
      const edge2 = nodeService.createConnection({ source: sourceNode.id, target: targetNode.id });
      
      // Verify each connection has a unique ID
      expect(edge1.id).not.toBe(edge2.id);
    });
    
    it('creates a connection with the provided ID if specified', () => {
      // Create source and target nodes
      const sourceNode = nodeService.createNode({ type: 'input', position: { x: 0, y: 0 }, data: {} });
      const targetNode = nodeService.createNode({ type: 'output', position: { x: 200, y: 0 }, data: {} });
      
      // Create a connection with a specific ID
      const edge = nodeService.createConnection({
        id: 'custom-edge-id',
        source: sourceNode.id,
        target: targetNode.id
      });
      
      // Verify the connection has the specified ID
      expect(edge.id).toBe('custom-edge-id');
    });
  });
  
  describe('deleteNodes', () => {
    it('deletes the specified nodes and their connections', () => {
      // Create nodes
      const node1 = nodeService.createNode({ type: 'input', position: { x: 0, y: 0 }, data: {} });
      const node2 = nodeService.createNode({ type: 'process', position: { x: 100, y: 0 }, data: {} });
      const node3 = nodeService.createNode({ type: 'output', position: { x: 200, y: 0 }, data: {} });
      
      // Create connections
      const edge1 = nodeService.createConnection({ source: node1.id, target: node2.id });
      const edge2 = nodeService.createConnection({ source: node2.id, target: node3.id });
      
      // Initial nodes and edges
      const initialNodes: Node[] = [node1, node2, node3];
      const initialEdges: Edge[] = [edge1, edge2];
      
      // Delete node2
      const { nodes: updatedNodes, edges: updatedEdges } = nodeService.deleteNodes(
        [node2.id],
        initialNodes,
        initialEdges
      );
      
      // Verify node2 is deleted
      expect(updatedNodes).toHaveLength(2);
      expect(updatedNodes.find((n: Node) => n.id === node2.id)).toBeUndefined();
      
      // Verify connections to/from node2 are deleted
      expect(updatedEdges).toHaveLength(0);
    });
  });
  
  describe('duplicateNodes', () => {
    it('creates duplicates of the specified nodes', () => {
      // Create nodes
      const node1 = nodeService.createNode({ 
        type: 'input', 
        position: { x: 0, y: 0 }, 
        data: { label: 'Input' } 
      });
      
      // Initial nodes
      const initialNodes: Node[] = [node1];
      
      // Duplicate node1
      const { nodes: updatedNodes } = nodeService.duplicateNodes(
        [node1.id],
        initialNodes,
        []
      );
      
      // Verify a new node is created
      expect(updatedNodes).toHaveLength(2);
      
      // Find the duplicated node
      const duplicatedNode = updatedNodes.find((n: Node) => n.id !== node1.id);
      
      // Verify the duplicated node has the same properties but different ID
      expect(duplicatedNode).toBeDefined();
      expect(duplicatedNode?.type).toBe(node1.type);
      expect(duplicatedNode?.data.label).toBe(node1.data.label);
      
      // Verify the position is offset slightly
      expect(duplicatedNode?.position.x).toBeGreaterThan(node1.position.x);
      expect(duplicatedNode?.position.y).toBeGreaterThan(node1.position.y);
    });
    
    it('duplicates connections between selected nodes', () => {
      // Create nodes
      const node1 = nodeService.createNode({ type: 'input', position: { x: 0, y: 0 }, data: {} });
      const node2 = nodeService.createNode({ type: 'output', position: { x: 100, y: 0 }, data: {} });
      
      // Create a connection
      const edge = nodeService.createConnection({ source: node1.id, target: node2.id });
      
      // Initial nodes and edges
      const initialNodes: Node[] = [node1, node2];
      const initialEdges: Edge[] = [edge];
      
      // Duplicate both nodes
      const { nodes: updatedNodes, edges: updatedEdges } = nodeService.duplicateNodes(
        [node1.id, node2.id],
        initialNodes,
        initialEdges
      );
      
      // Verify two new nodes are created
      expect(updatedNodes).toHaveLength(4);
      
      // Verify a new connection is created
      expect(updatedEdges).toHaveLength(2);
      
      // Find the duplicated nodes
      const duplicatedNodes = updatedNodes.filter((n: Node) => n.id !== node1.id && n.id !== node2.id);
      
      // Find the duplicated connection
      const duplicatedEdge = updatedEdges.find((e: Edge) => e.id !== edge.id);
      
      // Verify the duplicated connection connects the duplicated nodes
      expect(duplicatedEdge).toBeDefined();
      expect(duplicatedNodes.map((n: Node) => n.id)).toContain(duplicatedEdge?.source);
      expect(duplicatedNodes.map((n: Node) => n.id)).toContain(duplicatedEdge?.target);
    });
  });
  
  describe('alignNodes', () => {
    it('aligns nodes horizontally', () => {
      // Create nodes at different vertical positions
      const node1 = nodeService.createNode({ type: 'input', position: { x: 0, y: 0 }, data: {} });
      const node2 = nodeService.createNode({ type: 'process', position: { x: 100, y: 50 }, data: {} });
      const node3 = nodeService.createNode({ type: 'output', position: { x: 200, y: 100 }, data: {} });
      
      // Initial nodes
      const initialNodes: Node[] = [node1, node2, node3];
      
      // Align nodes horizontally
      const alignedNodes = nodeService.alignNodes(
        initialNodes,
        [node1.id, node2.id, node3.id],
        'horizontal'
      );
      
      // Calculate the expected Y position (average of all nodes)
      const expectedY = (0 + 50 + 100) / 3;
      
      // Verify all nodes have the same Y position
      expect(alignedNodes[0].position.y).toBeCloseTo(expectedY);
      expect(alignedNodes[1].position.y).toBeCloseTo(expectedY);
      expect(alignedNodes[2].position.y).toBeCloseTo(expectedY);
      
      // Verify X positions are unchanged
      expect(alignedNodes[0].position.x).toBe(0);
      expect(alignedNodes[1].position.x).toBe(100);
      expect(alignedNodes[2].position.x).toBe(200);
    });
    
    it('aligns nodes vertically', () => {
      // Create nodes at different horizontal positions
      const node1 = nodeService.createNode({ type: 'input', position: { x: 0, y: 0 }, data: {} });
      const node2 = nodeService.createNode({ type: 'process', position: { x: 50, y: 100 }, data: {} });
      const node3 = nodeService.createNode({ type: 'output', position: { x: 100, y: 200 }, data: {} });
      
      // Initial nodes
      const initialNodes: Node[] = [node1, node2, node3];
      
      // Align nodes vertically
      const alignedNodes = nodeService.alignNodes(
        initialNodes,
        [node1.id, node2.id, node3.id],
        'vertical'
      );
      
      // Calculate the expected X position (average of all nodes)
      const expectedX = (0 + 50 + 100) / 3;
      
      // Verify all nodes have the same X position
      expect(alignedNodes[0].position.x).toBeCloseTo(expectedX);
      expect(alignedNodes[1].position.x).toBeCloseTo(expectedX);
      expect(alignedNodes[2].position.x).toBeCloseTo(expectedX);
      
      // Verify Y positions are unchanged
      expect(alignedNodes[0].position.y).toBe(0);
      expect(alignedNodes[1].position.y).toBe(100);
      expect(alignedNodes[2].position.y).toBe(200);
    });
  });
}); 