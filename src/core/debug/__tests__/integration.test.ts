import { CircularDependencyDetector } from '../CircularDependencyDetector';
import { AsyncOperationManager } from '../AsyncOperationManager';
import { NodeMemoryTrackerImpl } from '../NodeMemoryTracker';
import { PortTypeValidator } from '../PortTypeValidator';
import { StateSynchronizer } from '../StateSynchronizer';
import { SystemState, NodeState, ConnectionState, IPort } from '../../types';

describe('Debug Tools Integration', () => {
    let mockState: SystemState;
    let circularDetector: CircularDependencyDetector;
    let asyncManager: AsyncOperationManager;
    let memoryTracker: NodeMemoryTrackerImpl;
    let portValidator: PortTypeValidator;
    let stateSynchronizer: StateSynchronizer;
    let stateManager: SystemState;

    beforeEach(() => {
        mockState = {
            nodes: {},
            connections: {},
            selectedNodeIds: [],
            version: 1,
            timestamp: Date.now()
        };

        stateManager = {
            nodes: {},
            connections: {},
            selectedNodeIds: [],
            version: 1,
            timestamp: Date.now()
        };

        circularDetector = new CircularDependencyDetector();
        asyncManager = new AsyncOperationManager();
        memoryTracker = new NodeMemoryTrackerImpl();
        portValidator = new PortTypeValidator();
        stateSynchronizer = new StateSynchronizer(stateManager);
    });

    afterEach(() => {
        if (stateSynchronizer) {
            stateSynchronizer.destroy();
        }
    });

    describe('Node Creation and Validation', () => {
        it('should track node creation and validate connections', () => {
            const node = {
                id: 'test-node',
                type: 'test',
                inputs: [],
                outputs: [],
                position: { x: 0, y: 0 }
            };

            memoryTracker.trackNode(node);
            const stats = memoryTracker.getStats();
            expect(stats.totalNodes).toBe(1);
        });

        it('should handle async operations and state changes', async () => {
            const operation = asyncManager.executeNodeOperation('test-op', async () => {});
            expect(operation).toBeDefined();
            await operation;
            expect(asyncManager.hasPendingOperations('test-op')).toBe(false);
        });

        it('should handle cleanup and memory management', () => {
            const node = {
                id: 'test-node',
                type: 'test',
                inputs: [],
                outputs: [],
                position: { x: 0, y: 0 }
            };

            const cleanup = jest.fn();
            memoryTracker.trackNode(node, cleanup);
            memoryTracker.disposeNode(node.id);
            expect(cleanup).toHaveBeenCalled();
        });

        it('should validate complex node interactions', () => {
            const outputPort: IPort = {
                id: 'out1',
                name: 'Output',
                dataType: 'number',
                isInput: false
            };

            const inputPort: IPort = {
                id: 'in1',
                name: 'Input',
                dataType: 'boolean',
                isInput: true
            };

            const isValid = portValidator.canConnect(outputPort, inputPort);
            expect(isValid.canConnect).toBe(false);
        });
    });
}); 