/**
 * Core type definitions for the node system
 */

// Base Types
export interface Position {
    x: number;
    y: number;
}

export interface Metadata {
    [key: string]: any;
}

// Port Types
export interface IPort {
    id: string;
    name: string;
    label?: string;  // Made optional to support both systems
    dataType: string;
    isInput: boolean;
    validation?: {
        required?: boolean;
        customValidation?: (value: any) => boolean;
        typeCheck?: (value: any) => boolean;
    };
    metadata?: Metadata;
}

// Node Types
export interface INode {
    id: string;
    type: string;
    inputs: IPort[];
    outputs: IPort[];
    position: Position;
    metadata?: Metadata;
}

export interface NodeState extends INode {
    status?: NodeStatus;
    error?: string;
    lastUpdate?: number;
}

// Connection Types
export interface ConnectionState {
    id: string;
    sourceNodeId: string;
    sourcePortId: string;
    targetNodeId: string;
    targetPortId: string;
    metadata?: Metadata;
}

// System State
export interface SystemState {
    nodes: Record<string, NodeState>;
    connections: Record<string, ConnectionState>;
    selectedNodeIds: string[];
    version: number;
    timestamp: number;
    metadata?: Metadata;
}

// Status and Error Types
export type NodeStatus = 'idle' | 'processing' | 'error' | 'success';

export interface ValidationError {
    type: 'node' | 'connection' | 'system';
    id: string;
    message: string;
    severity: 'error' | 'warning';
    details?: Record<string, any>;
}

// Configuration Types
export interface PersistenceConfig {
    storage?: 'local' | 'session' | 'custom';
    key?: string;
    customStorage?: {
        getItem: (key: string) => Promise<string | null>;
        setItem: (key: string, value: string) => Promise<void>;
        removeItem: (key: string) => Promise<void>;
    };
    autoSave?: boolean;
    saveInterval?: number;
    compression?: boolean;
}

export interface InternalConfig {
    maxHistorySize: number;
    autosaveInterval: number;
    validationRules: {
        validateNode: (node: NodeState) => ValidationError[];
        validateConnection: (connection: ConnectionState, nodes: Record<string, NodeState>) => ValidationError[];
        validateSystem: (state: SystemState) => ValidationError[];
    };
    performance: {
        enableMetrics: boolean;
        batchOperations: boolean;
        debounceTime: number;
        maxBatchSize: number;
    };
}

export interface StateManagerConfig {
    maxHistorySize?: number;
    autosaveInterval?: number;
    validationRules?: {
        validateNode?: (node: NodeState) => ValidationError[];
        validateConnection?: (connection: ConnectionState, nodes: Record<string, NodeState>) => ValidationError[];
        validateSystem?: (state: SystemState) => ValidationError[];
    };
    persistence?: PersistenceConfig;
    migrations?: StateMigration[];
    performance?: {
        enableMetrics?: boolean;
        batchOperations?: boolean;
        debounceTime?: number;
        maxBatchSize?: number;
    };
}

// History Types
export interface StateHistoryEntry {
    state: SystemState;
    timestamp: number;
    description: string;
    metadata?: Metadata;
}

export interface StateSnapshot {
    id: string;
    state: SystemState;
    timestamp: number;
    name: string;
    description?: string;
    tags?: string[];
    metadata?: Metadata;
}

// Migration Types
export interface StateMigration {
    version: number;
    description: string;
    migrate: (state: SystemState) => Promise<SystemState>;
    rollback?: (state: SystemState) => Promise<SystemState>;
}

// Performance Types
export interface PerformanceMetrics {
    operationCount: number;
    lastOperationTime: number;
    averageOperationTime: number;
    memoryUsage: number;
    historySize: number;
    snapshotCount: number;
}

// Event Types
export interface StateEvent {
    type: StateEventType;
    nodeId?: string;
    connectionId?: string;
    timestamp: number;
    data?: any;
}

export type StateEventType = 
    | 'nodeCreated'
    | 'nodeUpdated'
    | 'nodeDeleted'
    | 'connectionCreated'
    | 'connectionDeleted'
    | 'stateChanged'
    | 'error'
    | 'warning';

// Type Guards
export function isNodeState(obj: any): obj is NodeState {
    return obj && 
        typeof obj === 'object' &&
        typeof obj.id === 'string' &&
        typeof obj.type === 'string' &&
        Array.isArray(obj.inputs) &&
        Array.isArray(obj.outputs) &&
        typeof obj.position === 'object';
}

export function isPort(obj: any): obj is IPort {
    return obj &&
        typeof obj === 'object' &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.dataType === 'string' &&
        typeof obj.isInput === 'boolean';
}

export function isSystemState(obj: any): obj is SystemState {
    return obj &&
        typeof obj === 'object' &&
        typeof obj.nodes === 'object' &&
        typeof obj.connections === 'object' &&
        Array.isArray(obj.selectedNodeIds) &&
        typeof obj.version === 'number' &&
        typeof obj.timestamp === 'number';
} 