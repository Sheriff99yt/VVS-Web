import { NodeMemoryTrackerImpl, type NodeMemoryTracker } from '../NodeMemoryTracker';
import { NodeState } from '../../types';

describe('NodeMemoryTracker', () => {
    let tracker: NodeMemoryTracker;
    let mockNode: NodeState;

    beforeEach(() => {
        tracker = new NodeMemoryTrackerImpl();
        mockNode = {
            id: 'test-node',
            type: 'test-type',
            inputs: [],
            outputs: [],
            position: { x: 0, y: 0 }
        };
    });

    describe('trackNode', () => {
        it('should track new node', () => {
            tracker.trackNode(mockNode);
            const stats = tracker.getStats();
            expect(stats.totalNodes).toBe(1);
            expect(stats.details?.nodeTypes['test-type']).toBe(1);
        });

        it('should track multiple nodes of same type', () => {
            const node2 = { ...mockNode, id: 'test-node-2' };
            tracker.trackNode(mockNode);
            tracker.trackNode(node2);
            const stats = tracker.getStats();
            expect(stats.totalNodes).toBe(2);
            expect(stats.details?.nodeTypes['test-type']).toBe(2);
        });

        it('should track nodes of different types', () => {
            const node2 = { ...mockNode, id: 'test-node-2', type: 'other-type' };
            tracker.trackNode(mockNode);
            tracker.trackNode(node2);
            const stats = tracker.getStats();
            expect(stats.totalNodes).toBe(2);
            expect(stats.details?.nodeTypes['test-type']).toBe(1);
            expect(stats.details?.nodeTypes['other-type']).toBe(1);
        });

        it('should handle cleanup function', () => {
            const cleanup = jest.fn();
            tracker.trackNode(mockNode, cleanup);
            tracker.disposeNode(mockNode.id);
            expect(cleanup).toHaveBeenCalled();
        });

        it('should handle multiple cleanups for same node', () => {
            const cleanup1 = jest.fn();
            const cleanup2 = jest.fn();
            tracker.trackNode(mockNode, cleanup1);
            tracker.trackNode(mockNode, cleanup2);
            tracker.disposeNode(mockNode.id);
            expect(cleanup1).toHaveBeenCalled();
            expect(cleanup2).toHaveBeenCalled();
        });
    });

    describe('disposeNode', () => {
        it('should remove node from tracking', () => {
            tracker.trackNode(mockNode);
            tracker.disposeNode(mockNode.id);
            const stats = tracker.getStats();
            expect(stats.totalNodes).toBe(0);
            expect(stats.details?.nodeTypes['test-type']).toBe(0);
        });

        it('should handle non-existent node', () => {
            expect(() => tracker.disposeNode('non-existent')).not.toThrow();
        });

        it('should update node type counts', () => {
            const node2 = { ...mockNode, id: 'test-node-2' };
            tracker.trackNode(mockNode);
            tracker.trackNode(node2);
            tracker.disposeNode(mockNode.id);
            const stats = tracker.getStats();
            expect(stats.totalNodes).toBe(1);
            expect(stats.details?.nodeTypes['test-type']).toBe(1);
        });

        it('should trigger GC callback', () => {
            const gcCallback = jest.fn();
            tracker.registerGCCallback(gcCallback);
            tracker.trackNode(mockNode);
            tracker.disposeNode(mockNode.id);
            expect(gcCallback).toHaveBeenCalled();
        });
    });

    describe('GC callbacks', () => {
        it('should register and trigger GC callbacks', () => {
            const gcCallback = jest.fn();
            tracker.registerGCCallback(gcCallback);
            tracker.trackNode(mockNode);
            tracker.disposeNode(mockNode.id);
            expect(gcCallback).toHaveBeenCalled();
        });

        it('should handle multiple GC callbacks', () => {
            const gcCallback1 = jest.fn();
            const gcCallback2 = jest.fn();
            tracker.registerGCCallback(gcCallback1);
            tracker.registerGCCallback(gcCallback2);
            tracker.trackNode(mockNode);
            tracker.disposeNode(mockNode.id);
            expect(gcCallback1).toHaveBeenCalled();
            expect(gcCallback2).toHaveBeenCalled();
        });

        it('should unregister GC callbacks', () => {
            const gcCallback = jest.fn();
            tracker.registerGCCallback(gcCallback);
            tracker.unregisterGCCallback(gcCallback);
            tracker.trackNode(mockNode);
            tracker.disposeNode(mockNode.id);
            expect(gcCallback).not.toHaveBeenCalled();
        });

        it('should handle GC callback errors', () => {
            const errorCallback = jest.fn(() => {
                throw new Error('Test error');
            });
            tracker.registerGCCallback(errorCallback);
            tracker.trackNode(mockNode);
            expect(() => tracker.disposeNode(mockNode.id)).not.toThrow();
        });
    });

    describe('getStats', () => {
        it('should return correct initial stats', () => {
            const stats = tracker.getStats();
            expect(stats.totalNodes).toBe(0);
            expect(stats.activeCleanups).toBe(0);
            expect(stats.memoryUsage).toBe(0);
            expect(stats.details?.nodeTypes).toEqual({});
        });

        it('should track memory usage', () => {
            tracker.trackNode(mockNode);
            const stats = tracker.getStats();
            expect(stats.memoryUsage).toBeGreaterThan(0);
        });

        it('should track GC timing', () => {
            tracker.trackNode(mockNode);
            tracker.disposeNode(mockNode.id);
            const stats = tracker.getStats();
            expect(stats.lastGC).toBeDefined();
            expect(typeof stats.lastGC).toBe('number');
        });

        it('should track node type distribution', () => {
            const node2 = { ...mockNode, id: 'test-node-2', type: 'other-type' };
            tracker.trackNode(mockNode);
            tracker.trackNode(node2);
            const stats = tracker.getStats();
            expect(stats.details?.nodeTypes).toEqual({
                'test-type': 1,
                'other-type': 1
            });
        });
    });
}); 