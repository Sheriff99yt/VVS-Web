/**
 * ExecutionFlowValidation.test.ts
 * 
 * Tests for the execution flow validation system.
 * Verifies detection of cycles, disconnected nodes, and execution order.
 */

import { validateExecutionFlow } from '../../services/validation/ExecutionFlowValidator';
import { Node, Edge } from 'reactflow';

describe('Execution Flow Validation', () => {
  // Test helper to create a node with a specified ID
  const createNode = (id: string): Node => ({
    id,
    type: 'default',
    position: { x: 0, y: 0 },
    data: {}
  });
  
  // Test helper to create an edge between nodes
  const createEdge = (source: string, target: string): Edge => ({
    id: `${source}-${target}`,
    source,
    target
  });
  
  describe('validateExecutionFlow', () => {
    it('detects cycles in the execution flow', () => {
      // Create nodes
      const node1 = createNode('1');
      const node2 = createNode('2');
      const node3 = createNode('3');
      
      // Create edges forming a cycle: 1 -> 2 -> 3 -> 1
      const edge1 = createEdge('1', '2');
      const edge2 = createEdge('2', '3');
      const edge3 = createEdge('3', '1');
      
      const nodes = [node1, node2, node3];
      const edges = [edge1, edge2, edge3];
      
      // Validate execution flow
      const result = validateExecutionFlow(nodes, edges);
      
      // Expect validation to fail due to cycle
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        type: 'cycle',
        message: expect.stringContaining('cycle')
      }));
    });
    
    it('detects disconnected nodes', () => {
      // Create nodes
      const node1 = createNode('1');
      const node2 = createNode('2');
      const node3 = createNode('3'); // Disconnected node
      
      // Create edge connecting only node1 and node2
      const edge1 = createEdge('1', '2');
      
      const nodes = [node1, node2, node3];
      const edges = [edge1];
      
      // Validate execution flow
      const result = validateExecutionFlow(nodes, edges);
      
      // Expect validation to fail due to disconnected node
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        type: 'disconnected',
        nodeId: '3',
        message: expect.stringContaining('disconnected')
      }));
    });
    
    it('validates a correct execution flow', () => {
      // Create nodes in a valid directed acyclic graph
      const node1 = createNode('1'); // Entry point
      const node2 = createNode('2');
      const node3 = createNode('3');
      const node4 = createNode('4'); // Exit point
      
      // Create edges forming a tree: 1 -> 2 -> 4, 1 -> 3 -> 4
      const edge1 = createEdge('1', '2');
      const edge2 = createEdge('1', '3');
      const edge3 = createEdge('2', '4');
      const edge4 = createEdge('3', '4');
      
      const nodes = [node1, node2, node3, node4];
      const edges = [edge1, edge2, edge3, edge4];
      
      // Validate execution flow
      const result = validateExecutionFlow(nodes, edges);
      
      // Expect validation to pass
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects nodes with multiple inputs for single-input nodes', () => {
      // Create nodes
      const node1 = createNode('1');
      const node2 = createNode('2');
      const node3 = createNode('3');
      const node4 = createNode('4');
      
      // Create edges with node3 having multiple inputs
      const edge1 = createEdge('1', '3');
      const edge2 = createEdge('2', '3');
      const edge3 = createEdge('3', '4');
      
      const nodes = [node1, node2, node3, node4];
      const edges = [edge1, edge2, edge3];
      
      // Configure node3 as single-input node
      node3.data.maxInputs = 1;
      
      // Validate execution flow
      const result = validateExecutionFlow(nodes, edges);
      
      // Expect validation to fail due to multiple inputs
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        type: 'tooManyInputs',
        nodeId: '3',
        message: expect.stringContaining('inputs')
      }));
    });
    
    it('detects missing required inputs', () => {
      // Create nodes
      const node1 = createNode('1');
      const node2 = createNode('2');
      
      // No edge connecting the nodes
      const nodes = [node1, node2];
      const edges: Edge[] = [];
      
      // Configure node2 to require at least one input
      node2.data.minInputs = 1;
      
      // Validate execution flow
      const result = validateExecutionFlow(nodes, edges);
      
      // Expect validation to fail due to missing inputs
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        type: 'missingInputs',
        nodeId: '2',
        message: expect.stringContaining('inputs')
      }));
    });
    
    it('validates execution order and flags nodes that execute too early', () => {
      // Create nodes
      const node1 = createNode('1'); // Input data provider
      const node2 = createNode('2'); // Data processor 1
      const node3 = createNode('3'); // Data processor 2
      const node4 = createNode('4'); // Output that requires both processors
      
      // Create edges - node4 needs both node2 and node3 results
      const edge1 = createEdge('1', '2');
      const edge2 = createEdge('1', '3');
      const edge3 = createEdge('2', '4');
      
      // Missing edge from node3 to node4
      const nodes = [node1, node2, node3, node4];
      const edges = [edge1, edge2, edge3];
      
      // Set dependencies - node4 requires input from both node2 and node3
      node4.data.dependencies = ['2', '3'];
      
      // Validate execution flow
      const result = validateExecutionFlow(nodes, edges);
      
      // Expect validation to fail due to missing dependency connection
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        type: 'missingDependency',
        nodeId: '4',
        dependencyId: '3',
        message: expect.stringContaining('dependency')
      }));
    });
  });
}); 