import { EnhancedStateManager } from '../EnhancedStateManager';
import { SystemState, NodeState, ConnectionState, IPort } from '../../types';

describe('EnhancedStateManager Integration', () => {
    let manager: EnhancedStateManager;
    const initialState: SystemState = {
        nodes: {},
        connections: {},
        selectedNodeIds: [],
        version: 1,
        timestamp: Date.now()
    };

    beforeEach(() => {
        manager = new EnhancedStateManager(initialState);
    });

    describe('Batch Operations', () => {
        test('should process node updates in batch', async () => {
            const node1: NodeState = {
                id: 'node1',
                type: 'test',
                inputs: [],
                outputs: [],
                position: { x: 0, y: 0 }
            };

            const node2: NodeState = {
                id: 'node2',
                type: 'test',
                inputs: [],
                outputs: [],
                position: { x: 100, y: 0 }
            };

            // Add initial nodes
            await manager.updateNode('node1', node1);
            await manager.updateNode('node2', node2);

            // Update nodes in batch
            await manager.updateNode('node1', { type: 'updated1' });
            await manager.updateNode('node2', { type: 'updated2' });

            // Wait for batch processing
            await new Promise(resolve => setTimeout(resolve, 200));

            const state = manager.getCurrentState();
            expect(state.nodes['node1'].type).toBe('updated1');
            expect(state.nodes['node2'].type).toBe('updated2');
        });

        test('should handle connection operations in batch', async () => {
            const node1: NodeState = {
                id: 'node1',
                type: 'test',
                inputs: [{ 
                    id: 'input1', 
                    name: 'Input 1',
                    label: 'Input 1',
                    dataType: 'number',
                    isInput: true
                }],
                outputs: [{ 
                    id: 'output1',
                    name: 'Output 1',
                    label: 'Output 1',
                    dataType: 'number',
                    isInput: false
                }],
                position: { x: 0, y: 0 }
            };

            const node2: NodeState = {
                id: 'node2',
                type: 'test',
                inputs: [{ 
                    id: 'input2',
                    name: 'Input 2',
                    label: 'Input 2',
                    dataType: 'number',
                    isInput: true
                }],
                outputs: [{ 
                    id: 'output2',
                    name: 'Output 2',
                    label: 'Output 2',
                    dataType: 'number',
                    isInput: false
                }],
                position: { x: 100, y: 0 }
            };

            // Add initial nodes and wait for them to be processed
            await manager.updateNode('node1', node1);
            await manager.updateNode('node2', node2);
            await new Promise(resolve => setTimeout(resolve, 200));

            // Create connection
            const connection: ConnectionState = {
                id: 'conn1',
                sourceNodeId: 'node1',
                targetNodeId: 'node2',
                sourcePortId: 'output1',
                targetPortId: 'input2'
            };

            await manager.addConnection(connection);
            await new Promise(resolve => setTimeout(resolve, 200));

            // Verify connection was added
            const stateWithConnection = manager.getCurrentState();
            expect(stateWithConnection.connections['conn1']).toBeDefined();

            // Remove connection
            await manager.removeConnection('conn1');
            await new Promise(resolve => setTimeout(resolve, 200));

            // Verify connection was removed
            const finalState = manager.getCurrentState();
            expect(finalState.connections['conn1']).toBeUndefined();
        });

        test('should merge multiple updates for the same node', async () => {
            // Add initial node
            await manager.updateNode('node1', {
                id: 'node1',
                type: 'test',
                inputs: [],
                outputs: [],
                position: { x: 0, y: 0 }
            });

            // Send multiple updates quickly
            await manager.updateNode('node1', { type: 'update1' });
            await manager.updateNode('node1', { type: 'update2' });
            await manager.updateNode('node1', { type: 'update3' });

            // Wait for batch processing
            await new Promise(resolve => setTimeout(resolve, 200));

            const state = manager.getCurrentState();
            expect(state.nodes['node1'].type).toBe('update3');
        });

        test('should handle errors and rollback transactions', async () => {
            // Add initial node
            await manager.updateNode('node1', {
                id: 'node1',
                type: 'test',
                inputs: [],
                outputs: [],
                position: { x: 0, y: 0 }
            });

            // Create an invalid connection to trigger error
            const invalidConnection: ConnectionState = {
                id: 'conn1',
                sourceNodeId: 'node1',
                targetNodeId: 'nonexistent',
                sourcePortId: 'output1',
                targetPortId: 'input1'
            };

            // Attempt to add invalid connection
            await expect(manager.addConnection(invalidConnection)).rejects.toThrow();

            // Verify state wasn't corrupted
            const state = manager.getCurrentState();
            expect(Object.keys(state.connections)).toHaveLength(0);
        });
    });

    describe('Performance Monitoring', () => {
        test('should track batch metrics', async () => {
            // Add multiple nodes quickly
            for (let i = 0; i < 5; i++) {
                await manager.updateNode(`node${i}`, {
                    id: `node${i}`,
                    type: 'test',
                    inputs: [],
                    outputs: [],
                    position: { x: i * 100, y: 0 }
                });
            }

            // Wait for batch processing
            await new Promise(resolve => setTimeout(resolve, 200));

            const metrics = manager.getBatchMetrics();
            expect(metrics.totalOperations).toBeGreaterThan(0);
            expect(metrics.averageProcessingTime).toBeGreaterThan(0);
        });
    });
}); 