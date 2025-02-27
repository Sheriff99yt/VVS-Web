import { TypedBatchQueue, BatchQueueManager } from '../BatchQueue';
import { 
    TypedBatchOperation, 
    UpdateNodeOperation,
    AddConnectionOperation,
    RemoveConnectionOperation,
    createUpdateNodeOperation,
    createAddConnectionOperation,
    createRemoveConnectionOperation
} from '../../state/EnhancedStateManager';

describe('TypedBatchQueue', () => {
    let queue: TypedBatchQueue<TypedBatchOperation>;

    beforeEach(() => {
        queue = new TypedBatchQueue<TypedBatchOperation>(3);
    });

    test('should add items and track size', () => {
        const op = createUpdateNodeOperation('node1', { type: 'test', inputs: [], outputs: [] });
        queue.add(op);
        expect(queue.size()).toBe(1);
        expect(queue.isEmpty()).toBe(false);
    });

    test('should clear items', () => {
        const op = createUpdateNodeOperation('node1', { type: 'test', inputs: [], outputs: [] });
        queue.add(op);
        queue.clear();
        expect(queue.size()).toBe(0);
        expect(queue.isEmpty()).toBe(true);
    });

    test('should return true when max size is reached', () => {
        const op1 = createUpdateNodeOperation('node1', { type: 'test1', inputs: [], outputs: [] });
        const op2 = createUpdateNodeOperation('node2', { type: 'test2', inputs: [], outputs: [] });
        const op3 = createUpdateNodeOperation('node3', { type: 'test3', inputs: [], outputs: [] });

        expect(queue.add(op1)).toBe(false);
        expect(queue.add(op2)).toBe(false);
        expect(queue.add(op3)).toBe(true); // Max size reached
    });
});

describe('BatchQueueManager', () => {
    let manager: BatchQueueManager;

    beforeEach(() => {
        manager = new BatchQueueManager(3);
    });

    test('should handle different operation types', () => {
        const updateOp = createUpdateNodeOperation('node1', { type: 'test', inputs: [], outputs: [] });
        const addOp = createAddConnectionOperation('conn1', {
            id: 'conn1',
            sourceNodeId: 'node1',
            targetNodeId: 'node2',
            sourcePortId: 'port1',
            targetPortId: 'port2'
        });
        const removeOp = createRemoveConnectionOperation('conn2');

        manager.addOperation(updateOp);
        manager.addOperation(addOp);
        manager.addOperation(removeOp);

        expect(manager.getNodeUpdates()).toHaveLength(1);
        expect(manager.getConnectionAdditions()).toHaveLength(1);
        expect(manager.getConnectionRemovals()).toHaveLength(1);
    });

    test('should clear all queues', () => {
        const updateOp = createUpdateNodeOperation('node1', { type: 'test', inputs: [], outputs: [] });
        const addOp = createAddConnectionOperation('conn1', {
            id: 'conn1',
            sourceNodeId: 'node1',
            targetNodeId: 'node2',
            sourcePortId: 'port1',
            targetPortId: 'port2'
        });

        manager.addOperation(updateOp);
        manager.addOperation(addOp);
        manager.clear();

        expect(manager.hasOperations()).toBe(false);
    });
}); 