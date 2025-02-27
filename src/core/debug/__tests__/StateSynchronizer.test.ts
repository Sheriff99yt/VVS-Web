import { StateSynchronizer } from '../StateSynchronizer';
import { SystemState } from '../../types';

describe('StateSynchronizer', () => {
    let synchronizer: StateSynchronizer;
    let mockState: SystemState;

    beforeEach(() => {
        mockState = {
            nodes: {
                'test-node': {
                    id: 'test-node',
                    type: 'test',
                    inputs: [],
                    outputs: [],
                    position: { x: 0, y: 0 }
                }
            },
            connections: {},
            selectedNodeIds: [],
            version: 1,
            timestamp: Date.now()
        };
        synchronizer = new StateSynchronizer(mockState);
    });

    afterEach(() => {
        synchronizer.destroy();
    });

    test('should track node state', () => {
        synchronizer.trackNodeState('test-node');
        const syncStatus = synchronizer.getSyncStatus('test-node');
        expect(syncStatus.isSynced).toBe(true);
    });

    test('should detect out of sync state', () => {
        synchronizer.trackNodeState('test-node');
        const initialStatus = synchronizer.getSyncStatus('test-node');
        expect(initialStatus.isSynced).toBe(true);

        // Modify the state directly
        mockState.nodes['test-node'].type = 'modified';
        
        const newStatus = synchronizer.getSyncStatus('test-node');
        expect(newStatus.isSynced).toBe(false);
    });

    test('should force sync node state', async () => {
        synchronizer.trackNodeState('test-node');
        await synchronizer.forceSync('test-node');
        const syncStatus = synchronizer.getSyncStatus('test-node');
        expect(syncStatus.isSynced).toBe(true);
        expect(syncStatus.errors).toBeUndefined();
    });
}); 