import { AsyncOperationManager } from '../AsyncOperationManager';

describe('AsyncOperationManager', () => {
    let manager: AsyncOperationManager;
    const nodeId = 'test-node';

    beforeEach(() => {
        manager = new AsyncOperationManager();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    // Increase timeout for all tests in this suite
    jest.setTimeout(10000);

    describe('executeNodeOperation', () => {
        it('should execute operation successfully', async () => {
            const operation = jest.fn().mockImplementation(() => 
                new Promise(resolve => setTimeout(resolve, 1000))
            );
            
            const promise = manager.executeNodeOperation(nodeId, operation);
            expect(manager.hasPendingOperations(nodeId)).toBe(true);
            
            // Advance timers and flush promises
            jest.advanceTimersByTime(1100);
            await Promise.resolve();
            
            await promise;
            expect(operation).toHaveBeenCalled();
            expect(manager.hasPendingOperations(nodeId)).toBe(false);
        });

        it('should handle operation failure', async () => {
            const error = new Error('Operation failed');
            const operation = jest.fn().mockRejectedValue(error);
            
            await expect(manager.executeNodeOperation(nodeId, operation))
                .rejects.toThrow(error);
            
            expect(operation).toHaveBeenCalled();
            expect(manager.hasPendingOperations(nodeId)).toBe(false);
        });

        it('should timeout long operations', async () => {
            const operation = jest.fn().mockImplementation(() => 
                new Promise(resolve => setTimeout(resolve, 2000))
            );
            
            const promise = manager.executeNodeOperation(nodeId, operation, 1000);
            
            // Advance timers and flush promises
            jest.advanceTimersByTime(1100);
            await Promise.resolve();
            
            await expect(promise).rejects.toThrow('Operation timeout for node test-node');
            expect(manager.hasPendingOperations(nodeId)).toBe(false);
        });

        it('should cancel previous operation when new one starts', async () => {
            const operation1 = jest.fn().mockImplementation(() => 
                new Promise(resolve => setTimeout(resolve, 2000))
            );
            const operation2 = jest.fn().mockResolvedValue(undefined);
            
            const promise1 = manager.executeNodeOperation(nodeId, operation1);
            await Promise.resolve();
            const promise2 = manager.executeNodeOperation(nodeId, operation2);
            
            // Advance timers and flush promises
            jest.advanceTimersByTime(100);
            await Promise.resolve();
            
            await promise2;
            expect(operation2).toHaveBeenCalled();
            expect(manager.hasPendingOperations(nodeId)).toBe(false);
        });
    });

    describe('waitForNode', () => {
        it('should wait for pending operation', async () => {
            const operation = jest.fn().mockImplementation(() => 
                new Promise(resolve => setTimeout(resolve, 1000))
            );
            
            const operationPromise = manager.executeNodeOperation(nodeId, operation);
            const waitPromise = manager.waitForNode(nodeId);
            
            // Advance timers and flush promises
            jest.advanceTimersByTime(1100);
            await Promise.resolve();
            
            await operationPromise;
            await waitPromise;
            
            expect(operation).toHaveBeenCalled();
        });

        it('should resolve immediately if no operation pending', async () => {
            await expect(manager.waitForNode(nodeId)).resolves.toBeUndefined();
        });
    });

    describe('getPendingOperations', () => {
        it('should return all pending operations', async () => {
            const operation1 = jest.fn().mockImplementation(() => 
                new Promise(resolve => setTimeout(resolve, 1000))
            );
            const operation2 = jest.fn().mockImplementation(() => 
                new Promise(resolve => setTimeout(resolve, 1000))
            );
            
            const promise1 = manager.executeNodeOperation('node1', operation1);
            const promise2 = manager.executeNodeOperation('node2', operation2);
            
            const pending = manager.getPendingOperations();
            expect(pending.size).toBe(2);
            expect(pending.has('node1')).toBe(true);
            expect(pending.has('node2')).toBe(true);
            
            // Advance timers and flush promises
            jest.advanceTimersByTime(1100);
            await Promise.resolve();
            
            await Promise.all([promise1, promise2]);
        });
    });

    describe('cancelOperation', () => {
        it('should cancel pending operation', async () => {
            const operation = jest.fn().mockImplementation(() => 
                new Promise(resolve => setTimeout(resolve, 1000))
            );
            
            const promise = manager.executeNodeOperation(nodeId, operation);
            expect(manager.hasPendingOperations(nodeId)).toBe(true);
            
            await manager.cancelOperation(nodeId);
            expect(manager.hasPendingOperations(nodeId)).toBe(false);
            
            try {
                await promise;
            } catch (error) {
                // Operation was cancelled, this is expected
            }
        });

        it('should handle cancellation of non-existent operation', async () => {
            await expect(manager.cancelOperation(nodeId)).resolves.toBeUndefined();
        });

        it('should clear timeout when cancelling operation', async () => {
            const operation = jest.fn().mockImplementation(() => 
                new Promise(resolve => setTimeout(resolve, 2000))
            );
            
            manager.executeNodeOperation(nodeId, operation, 1000);
            await Promise.resolve();
            await manager.cancelOperation(nodeId);
            
            jest.advanceTimersByTime(1100);
            await Promise.resolve();
            expect(manager.hasPendingOperations(nodeId)).toBe(false);
        });
    });
}); 