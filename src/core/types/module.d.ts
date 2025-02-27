declare module '../types' {
    export * from '../core/types';
}

declare module '../state/StateManager' {
    import { SystemState, NodeState, ConnectionState, ValidationError, SystemConfig } from '../core/types';
    
    export interface StateManager {
        getCurrentState(): SystemState;
        validateState(): ValidationError[];
        beginTransaction(description: string): void;
        commitTransaction(): void;
        rollbackTransaction(): void;
        updateNode(nodeId: string, updates: Partial<NodeState>): void;
        addConnection(connection: ConnectionState): void;
        removeConnection(connectionId: string): void;
        undo(): boolean;
        redo(): boolean;
    }

    export interface StateManagerConfig extends SystemConfig {
        maxHistorySize?: number;
        autosaveInterval?: number;
    }
} 