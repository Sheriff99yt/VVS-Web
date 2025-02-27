import { 
    SystemState, 
    NodeState, 
    ConnectionState, 
    ValidationError,
    StateManagerConfig,
    StateEvent,
    isNodeState,
    isSystemState,
    IPort,
    PerformanceMetrics
} from '../types';
import { StateManager } from './StateManager';
import {
    CircularDependencyDetector,
    AsyncOperationManager,
    NodeMemoryTracker,
    NodeMemoryTrackerImpl,
    PortTypeValidator,
    StateSynchronizer,
    DebugTools,
    DebugToolsConfig,
    DebugEvent
} from '../debug';
import { PerformanceMonitor, PerformanceConfig, BatchMetrics } from '../utils/performance';
import { BatchQueueManager } from '../utils/BatchQueue';

export interface EnhancedStateManagerConfig extends StateManagerConfig {
    debug?: DebugToolsConfig & {
        performance?: PerformanceConfig;
    };
}

// Batch operation type literals
export const BATCH_OPERATION_TYPES = {
    UPDATE_NODE: 'updateNode',
    ADD_CONNECTION: 'addConnection',
    REMOVE_CONNECTION: 'removeConnection'
} as const;

export type BatchOperationType = typeof BATCH_OPERATION_TYPES[keyof typeof BATCH_OPERATION_TYPES];

// Base batch operation type with discriminator
export interface BaseBatchOperation {
    id: string;
    timestamp: number;
}

// Specific operation types with strict discriminators
export interface UpdateNodeOperation extends BaseBatchOperation {
    type: typeof BATCH_OPERATION_TYPES.UPDATE_NODE;
    data: Partial<NodeState>;
}

export interface AddConnectionOperation extends BaseBatchOperation {
    type: typeof BATCH_OPERATION_TYPES.ADD_CONNECTION;
    data: ConnectionState;
}

export interface RemoveConnectionOperation extends BaseBatchOperation {
    type: typeof BATCH_OPERATION_TYPES.REMOVE_CONNECTION;
}

export type TypedBatchOperation = 
    | UpdateNodeOperation 
    | AddConnectionOperation 
    | RemoveConnectionOperation;

// Type guard functions with const assertions
export function isUpdateNodeOperation(op: TypedBatchOperation): op is UpdateNodeOperation {
    return op.type === BATCH_OPERATION_TYPES.UPDATE_NODE && 'data' in op;
}

export function isAddConnectionOperation(op: TypedBatchOperation): op is AddConnectionOperation {
    return op.type === BATCH_OPERATION_TYPES.ADD_CONNECTION && 'data' in op;
}

export function isRemoveConnectionOperation(op: TypedBatchOperation): op is RemoveConnectionOperation {
    return op.type === BATCH_OPERATION_TYPES.REMOVE_CONNECTION;
}

// Update operation creation functions for type safety
export function createUpdateNodeOperation(id: string, data: Partial<NodeState>): UpdateNodeOperation {
    return {
        type: BATCH_OPERATION_TYPES.UPDATE_NODE,
        id,
        data,
        timestamp: Date.now()
    };
}

export function createAddConnectionOperation(id: string, data: ConnectionState): AddConnectionOperation {
    return {
        type: BATCH_OPERATION_TYPES.ADD_CONNECTION,
        id,
        data,
        timestamp: Date.now()
    };
}

export function createRemoveConnectionOperation(id: string): RemoveConnectionOperation {
    return {
        type: BATCH_OPERATION_TYPES.REMOVE_CONNECTION,
        id,
        timestamp: Date.now()
    };
}

export interface BatchOperationMap {
    updateNode: UpdateNodeOperation[];
    addConnection: AddConnectionOperation[];
    removeConnection: RemoveConnectionOperation[];
}

export class EnhancedStateManager extends StateManager {
    private debugTools!: DebugTools;
    private performanceMonitor!: PerformanceMonitor;
    private debugEvents: DebugEvent[] = [];
    private batchQueue: BatchQueueManager;
    private batchProcessingTimeout?: number;
    private readonly BATCH_DELAY = 100; // ms
    private readonly MAX_BATCH_SIZE = 50;

    constructor(
        initialState: SystemState,
        config: EnhancedStateManagerConfig = {}
    ) {
        if (!isSystemState(initialState)) {
            throw new Error('Invalid system state provided');
        }
        super(initialState);
        this.batchQueue = new BatchQueueManager(this.MAX_BATCH_SIZE);
        this.initializeDebugTools(config.debug);
    }

    private initializeDebugTools(config?: DebugToolsConfig & { performance?: PerformanceConfig }) {
        // Initialize performance monitoring
        this.performanceMonitor = new PerformanceMonitor(config?.performance);

        // Initialize debug tools
        const circularDetector = new CircularDependencyDetector();
        const asyncManager = new AsyncOperationManager();
        const memoryTracker = new NodeMemoryTrackerImpl();
        const portValidator = new PortTypeValidator();
        const stateSynchronizer = new StateSynchronizer(this.currentState);

        this.debugTools = {
            circularDetector,
            asyncManager,
            memoryTracker,
            portValidator,
            stateSynchronizer,
            metrics: this.performanceMonitor.getMetrics()
        };

        // Register default type validators
        this.registerDefaultTypeValidators();
    }

    private registerDefaultTypeValidators() {
        this.debugTools.portValidator.registerType('number', 
            (v) => typeof v === 'number'
        );
        this.debugTools.portValidator.registerType('string', 
            (v) => typeof v === 'string'
        );
        this.debugTools.portValidator.registerType('boolean', 
            (v) => typeof v === 'boolean'
        );
        this.debugTools.portValidator.registerType('object', 
            (v) => typeof v === 'object' && v !== null
        );
    }

    private addToBatch(operation: TypedBatchOperation): void {
        const shouldProcess = this.batchQueue.addOperation(operation);

        if (shouldProcess) {
            this.processBatchAll();
        } else if (!this.batchProcessingTimeout) {
            this.batchProcessingTimeout = window.setTimeout(() => this.processBatchAll(), this.BATCH_DELAY);
        }
    }

    private async processBatchNodeUpdates(batch: UpdateNodeOperation[]): Promise<void> {
        const updates: Record<string, Partial<NodeState>> = {};
        
        // Merge updates for the same node
        for (const operation of batch) {
            const nodeId = operation.id;
            updates[nodeId] = {
                ...(updates[nodeId] || {}),
                ...operation.data,
                lastUpdate: operation.timestamp
            };
        }

        // Process merged updates
        for (const [nodeId, nodeUpdates] of Object.entries(updates)) {
            const currentNode = this.currentState.nodes[nodeId];
            
            // Create new node if it doesn't exist
            if (!currentNode) {
                if (!nodeUpdates.id || !nodeUpdates.type) {
                    throw new Error(`Cannot create node without id and type`);
                }
                this.currentState.nodes[nodeId] = {
                    id: nodeId,
                    type: nodeUpdates.type,
                    inputs: nodeUpdates.inputs || [],
                    outputs: nodeUpdates.outputs || [],
                    position: nodeUpdates.position || { x: 0, y: 0 }
                };
                continue;
            }

            // Track in memory
            this.debugTools.memoryTracker.trackNode(currentNode);

            // Check for cycles
            const cycle = this.debugTools.circularDetector.detectCircular(
                this.currentState,
                nodeId
            );
            if (cycle) {
                throw new Error(`Circular dependency detected: ${cycle.join(' -> ')}`);
            }

            // Update node
            this.currentState.nodes[nodeId] = {
                ...currentNode,
                ...nodeUpdates
            };

            // Track for synchronization
            this.debugTools.stateSynchronizer.trackNodeState(nodeId);
        }
    }

    private async processBatchConnections(batch: AddConnectionOperation[]): Promise<void> {
        const uniqueConnections = new Map<string, ConnectionState>();
        
        // Keep only the latest connection state
        for (const operation of batch) {
            uniqueConnections.set(operation.id, operation.data);
        }

        // Process connections
        for (const connection of uniqueConnections.values()) {
            const sourceNode = this.currentState.nodes[connection.sourceNodeId];
            const targetNode = this.currentState.nodes[connection.targetNodeId];

            if (!sourceNode || !targetNode) {
                const error = new Error(`Source or target node not found: ${connection.sourceNodeId} -> ${connection.targetNodeId}`);
                this.logDebugEvent({
                    type: 'error',
                    source: 'ConnectionProcessor',
                    message: error.message,
                    timestamp: Date.now()
                });
                await this.rollbackTransaction();
                throw error;
            }

            const sourcePort = sourceNode.outputs.find(p => p.id === connection.sourcePortId);
            const targetPort = targetNode.inputs.find(p => p.id === connection.targetPortId);

            if (!sourcePort || !targetPort) {
                const error = new Error(`Source or target port not found: ${connection.sourcePortId} -> ${connection.targetPortId}`);
                this.logDebugEvent({
                    type: 'error',
                    source: 'ConnectionProcessor',
                    message: error.message,
                    timestamp: Date.now()
                });
                await this.rollbackTransaction();
                throw error;
            }

            const { canConnect, reason } = this.debugTools.portValidator.canConnect(
                sourcePort,
                targetPort
            );

            if (!canConnect) {
                const error = new Error(reason || 'Invalid connection');
                this.logDebugEvent({
                    type: 'error',
                    source: 'ConnectionProcessor',
                    message: error.message,
                    timestamp: Date.now()
                });
                await this.rollbackTransaction();
                throw error;
            }

            this.currentState.connections[connection.id] = connection;
        }
    }

    private async processBatchConnectionRemovals(batch: RemoveConnectionOperation[]): Promise<void> {
        const uniqueRemovals = new Set(batch.map(op => op.id));
        
        for (const connectionId of uniqueRemovals) {
            const connection = this.currentState.connections[connectionId];
            if (!connection) continue;

            delete this.currentState.connections[connectionId];

            // Update sync status for affected nodes
            this.debugTools.stateSynchronizer.trackNodeState(connection.sourceNodeId);
            this.debugTools.stateSynchronizer.trackNodeState(connection.targetNodeId);
        }
    }

    private async processBatchAll(): Promise<void> {
        if (this.batchProcessingTimeout) {
            clearTimeout(this.batchProcessingTimeout);
            this.batchProcessingTimeout = undefined;
        }

        const startTime = performance.now();
        const nodeUpdates = this.batchQueue.getNodeUpdates();
        const connectionAdditions = this.batchQueue.getConnectionAdditions();
        const connectionRemovals = this.batchQueue.getConnectionRemovals();
        const totalOperations = nodeUpdates.length + connectionAdditions.length + connectionRemovals.length;

        if (totalOperations === 0) return;

        const endMeasure = this.performanceMonitor.startMeasure('processBatchAll');
        try {
            await this.beginTransaction('Process all batches');

            // Process node updates
            if (nodeUpdates.length > 0) {
                await this.processBatchNodeUpdates(nodeUpdates);
            }

            // Process connection additions
            if (connectionAdditions.length > 0) {
                await this.processBatchConnections(connectionAdditions);
            }

            // Process connection removals
            if (connectionRemovals.length > 0) {
                await this.processBatchConnectionRemovals(connectionRemovals);
            }

            this.batchQueue.clear();
            await this.commitTransaction();
        } catch (error) {
            await this.rollbackTransaction();
            this.logDebugEvent({
                type: 'error',
                source: 'BatchProcessor',
                message: `Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: Date.now(),
                data: { error }
            });
            throw error;
        } finally {
            endMeasure();
            const processingTime = performance.now() - startTime;
            this.performanceMonitor.measureBatch(totalOperations, processingTime);
        }
    }

    private getSourcePort(connection: ConnectionState): IPort | undefined {
        const sourceNode = this.currentState.nodes[connection.sourceNodeId];
        return sourceNode?.outputs.find(p => p.id === connection.sourcePortId);
    }

    private getTargetPort(connection: ConnectionState): IPort | undefined {
        const targetNode = this.currentState.nodes[connection.targetNodeId];
        return targetNode?.inputs.find(p => p.id === connection.targetPortId);
    }

    public override async updateNode(nodeId: string, updates: Partial<NodeState>): Promise<void> {
        this.addToBatch(createUpdateNodeOperation(nodeId, updates));
    }

    public override async addConnection(connection: ConnectionState): Promise<void> {
        // Validate connection before adding to batch
        const errors = await this.validateConnection(connection);
        if (errors.length > 0) {
            const error = new Error(errors[0].message);
            this.logDebugEvent({
                type: 'error',
                source: 'ConnectionValidator',
                message: error.message,
                timestamp: Date.now()
            });
            throw error;
        }
        
        this.addToBatch(createAddConnectionOperation(connection.id, connection));
    }

    public override async removeConnection(connectionId: string): Promise<void> {
        this.addToBatch(createRemoveConnectionOperation(connectionId));
    }

    protected override async validateNode(node: NodeState): Promise<ValidationError[]> {
        const errors: ValidationError[] = [];

        // Validate node structure
        if (!isNodeState(node)) {
            errors.push({
                type: 'node',
                id: node.id,
                message: 'Invalid node structure',
                severity: 'error'
            });
            return errors;
        }

        // Validate ports
        for (const port of [...node.inputs, ...node.outputs]) {
            const validationResult = this.debugTools.portValidator.validatePort(port);
            if (!validationResult.isValid) {
                errors.push({
                    type: 'node',
                    id: node.id,
                    message: `Invalid port ${port.id}: ${validationResult.reason}`,
                    severity: 'error',
                    details: { portId: port.id }
                });
            }
        }

        return errors;
    }

    protected override async validateConnection(connection: ConnectionState): Promise<ValidationError[]> {
        const errors: ValidationError[] = [];
        const state = this.getCurrentState();

        const sourceNode = state.nodes[connection.sourceNodeId];
        const targetNode = state.nodes[connection.targetNodeId];

        if (!sourceNode || !targetNode) {
            errors.push({
                type: 'connection',
                id: connection.id,
                message: 'Source or target node not found',
                severity: 'error'
            });
            return errors;
        }

        const sourcePort = sourceNode.outputs.find(p => p.id === connection.sourcePortId);
        const targetPort = targetNode.inputs.find(p => p.id === connection.targetPortId);

        if (!sourcePort || !targetPort) {
            errors.push({
                type: 'connection',
                id: connection.id,
                message: 'Source or target port not found',
                severity: 'error'
            });
            return errors;
        }

        const { canConnect, reason } = this.debugTools.portValidator.canConnect(
            sourcePort,
            targetPort
        );

        if (!canConnect) {
            errors.push({
                type: 'connection',
                id: connection.id,
                message: reason || 'Invalid connection',
                severity: 'error'
            });
        }

        return errors;
    }

    protected override async validateSystem(state: SystemState): Promise<ValidationError[]> {
        const errors: ValidationError[] = [];

        // Check for circular dependencies
        for (const nodeId of Object.keys(state.nodes)) {
            const cycle = this.debugTools.circularDetector.detectCircular(state, nodeId);
            if (cycle) {
                errors.push({
                    type: 'system',
                    id: 'circular-dependency',
                    message: `Circular dependency detected: ${cycle.join(' -> ')}`,
                    severity: 'error',
                    details: { cycle }
                });
            }
        }

        // Check memory usage
        const memoryStats = this.debugTools.memoryTracker.getStats();
        if (memoryStats.totalMemory > 1000000) { // 1MB threshold
            errors.push({
                type: 'system',
                id: 'memory-usage',
                message: 'High memory usage detected',
                severity: 'warning',
                details: memoryStats
            });
        }

        // Check sync status
        for (const nodeId of Object.keys(state.nodes)) {
            if (!this.debugTools.stateSynchronizer.checkStateSync(nodeId)) {
                const syncStatus = this.debugTools.stateSynchronizer.getSyncStatus(nodeId);
                errors.push({
                    type: 'system',
                    id: 'sync-status',
                    message: `Node ${nodeId} is out of sync`,
                    severity: 'warning',
                    details: syncStatus
                });
            }
        }

        return errors;
    }

    public override dispose(): void {
        if (this.batchProcessingTimeout) {
            clearTimeout(this.batchProcessingTimeout);
            this.batchProcessingTimeout = undefined;
        }
        this.batchQueue.clear();
        this.debugTools.stateSynchronizer.destroy();
        this.performanceMonitor.dispose();
    }

    // Debug utilities
    public getDebugTools(): DebugTools {
        return this.debugTools;
    }

    public getDebugEvents(): DebugEvent[] {
        return [...this.debugEvents];
    }

    public clearDebugEvents(): void {
        this.debugEvents = [];
    }

    private logDebugEvent(event: DebugEvent): void {
        this.debugEvents.push(event);
        // Limit event history
        if (this.debugEvents.length > 1000) {
            this.debugEvents = this.debugEvents.slice(-1000);
        }
    }

    public getBatchMetrics(): BatchMetrics {
        return this.performanceMonitor.getBatchMetrics();
    }

    public getPerformanceSamples(): { timestamp: number; metrics: PerformanceMetrics }[] {
        return this.performanceMonitor.getSamples();
    }
} 