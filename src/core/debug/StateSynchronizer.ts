import { SystemState, NodeState, ValidationError } from '../types';
import { SyncStatus, StateSynchronizer as IStateSynchronizer } from './types';

export class StateSynchronizer implements IStateSynchronizer {
    private trackedNodes: Map<string, NodeState> = new Map();
    private lastSyncTimes: Map<string, number> = new Map();
    private syncErrors: Map<string, ValidationError[]> = new Map();
    private reconciliationInterval: NodeJS.Timeout | null = null;
    private isDestroyed = false;

    constructor(private currentState: SystemState) {}

    public trackNodeState(nodeId: string): void {
        const node = Object.values(this.currentState.nodes).find(n => n.id === nodeId);
        if (node) {
            this.trackedNodes.set(nodeId, { ...node });
            this.lastSyncTimes.set(nodeId, Date.now());
        }
    }

    public checkStateSync(nodeId: string): boolean {
        const trackedNode = this.trackedNodes.get(nodeId);
        const currentNode = Object.values(this.currentState.nodes).find(n => n.id === nodeId);
        
        if (!trackedNode || !currentNode) {
            return false;
        }

        const isEqual = JSON.stringify(trackedNode) === JSON.stringify(currentNode);
        if (!isEqual) {
            this.syncErrors.set(nodeId, [{
                type: 'node',
                id: nodeId,
                message: 'Node state out of sync',
                severity: 'error',
                details: {
                    tracked: trackedNode,
                    current: currentNode
                }
            }]);
        }

        return isEqual;
    }

    public getSyncStatus(nodeId: string): SyncStatus {
        const isSynced = this.checkStateSync(nodeId);
        const lastSyncTime = this.lastSyncTimes.get(nodeId) || 0;
        const errors = this.syncErrors.get(nodeId);

        return {
            isSynced,
            lastSyncTime,
            errors,
            outOfSyncNodes: isSynced ? [] : [nodeId],
            lastSyncAttempt: lastSyncTime,
            pendingReconciliation: false
        };
    }

    public async forceSync(nodeId: string): Promise<void> {
        const currentNode = Object.values(this.currentState.nodes).find(n => n.id === nodeId);
        if (currentNode) {
            this.trackedNodes.set(nodeId, { ...currentNode });
            this.lastSyncTimes.set(nodeId, Date.now());
            this.syncErrors.delete(nodeId);
        }
    }

    public async reconcileStates(): Promise<void> {
        if (this.isDestroyed) return;

        const promises = Array.from(this.trackedNodes.keys()).map(nodeId => 
            this.checkStateSync(nodeId) ? Promise.resolve() : this.forceSync(nodeId)
        );

        await Promise.all(promises);
    }

    public startPeriodicReconciliation(interval: number): void {
        if (this.isDestroyed) return;
        
        if (this.reconciliationInterval) {
            clearInterval(this.reconciliationInterval);
        }

        this.reconciliationInterval = setInterval(() => {
            this.reconcileStates().catch(error => {
                console.error('Error during state reconciliation:', error);
            });
        }, interval);
    }

    public stopPeriodicReconciliation(): void {
        if (this.reconciliationInterval) {
            clearInterval(this.reconciliationInterval);
            this.reconciliationInterval = null;
        }
    }

    public destroy(): void {
        this.isDestroyed = true;
        this.stopPeriodicReconciliation();
        this.trackedNodes.clear();
        this.lastSyncTimes.clear();
        this.syncErrors.clear();
    }
} 