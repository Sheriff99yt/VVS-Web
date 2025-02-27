import { 
    SystemState, 
    NodeState, 
    ValidationError, 
    IPort, 
    PerformanceMetrics,
    LogLevel
} from '../types';

export interface DebugToolsConfig {
    enableCircularDetection?: boolean;
    enableMemoryTracking?: boolean;
    enableStateSynchronization?: boolean;
    enableTypeValidation?: boolean;
    logLevel?: LogLevel;
    performance?: {
        sampleInterval?: number;
        maxSamples?: number;
        enableMetrics?: boolean;
        batchOperations?: boolean;
        debounceTime?: number;
        maxBatchSize?: number;
    };
    reconciliation?: {
        interval?: number;
        autoStart?: boolean;
    };
    memory?: {
        gcThreshold?: number;
        maxNodeCount?: number;
    };
    validation?: {
        strictTypeChecking?: boolean;
        allowTypeCoercion?: boolean;
    };
}

export interface MemoryStats {
    nodeCount: number;
    totalMemory: number;
    averageNodeMemory: number;
    largestNode: {
        id: string;
        size: number;
    };
    typeDistribution: Record<string, number>;
}

export interface SyncStatus {
    isSynced: boolean;
    outOfSyncNodes: string[];
    lastSyncAttempt: number;
    pendingReconciliation: boolean;
    details?: {
        modifiedNodes: string[];
        lastSuccessfulSync?: number;
        syncErrors?: ValidationError[];
    };
    lastSyncTime: number;
    errors?: ValidationError[];
}

export interface DebugTools {
    circularDetector: CircularDependencyDetector;
    asyncManager: AsyncOperationManager;
    memoryTracker: NodeMemoryTracker;
    portValidator: PortTypeValidator;
    stateSynchronizer: StateSynchronizer;
    metrics: {
        operationCount: number;
        lastOperationTime: number;
        averageOperationTime: number;
        memoryUsage: number;
        historySize: number;
        snapshotCount: number;
    };
}

export interface CircularDependencyDetector {
    detectCircular(state: SystemState, startNodeId: string): string[] | null;
    validateGraph(state: SystemState): ValidationError[];
    getNodeDependencies(state: SystemState, nodeId: string): string[];
}

export interface AsyncOperationManager {
    executeNodeOperation(nodeId: string, operation: () => Promise<void>): Promise<void>;
    hasPendingOperations(nodeId: string): boolean;
    waitForNode(nodeId: string): Promise<void>;
    getPendingOperations(): Map<string, Promise<void>>;
    cancelOperation(nodeId: string): void;
    isOperationPending(nodeId: string): boolean;
}

export interface NodeMemoryTracker {
    trackNode(node: NodeState): void;
    untrackNode(nodeId: string): void;
    getStats(): MemoryStats;
    clear(): void;
}

export interface PortTypeValidator {
    registerType(type: string, validator: (value: any) => boolean): void;
    validatePort(port: IPort, value?: any): PortValidationResult;
    canConnect(sourcePort: IPort, targetPort: IPort): { canConnect: boolean; reason?: string };
    getRegisteredTypes(): string[];
}

export interface StateSynchronizer {
    trackNodeState(nodeId: string): void;
    checkStateSync(nodeId: string): boolean;
    getSyncStatus(nodeId: string): SyncStatus;
    forceSync(nodeId: string): Promise<void>;
    reconcileStates(): Promise<void>;
    startPeriodicReconciliation(interval: number): void;
    stopPeriodicReconciliation(): void;
    destroy(): void;
}

export interface DebugEvent {
    type: 'error' | 'warning' | 'info';
    source: string;
    message: string;
    timestamp: number;
    data?: any;
}

export interface PortValidationResult {
    isValid: boolean;
    reason?: string;
} 