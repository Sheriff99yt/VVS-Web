# Node System API Documentation

## Core Components

### StateManager

The `StateManager` class provides comprehensive state management for the node system.

#### Constructor

```typescript
constructor(initialState: SystemState, config?: StateManagerConfig)
```

- `initialState`: Initial system state
- `config`: Optional configuration object
  - `maxHistorySize`: Maximum number of history entries (default: 100)
  - `autosaveInterval`: Interval for autosave in ms (default: 60000)
  - `validationRules`: Custom validation rules
  - `persistence`: State persistence configuration
  - `migrations`: State migration rules
  - `performance`: Performance optimization settings

#### Core Methods

##### State Management
```typescript
getCurrentState(): SystemState
validateState(): StateValidationError[]
beginTransaction(description: string): void
commitTransaction(): void
rollbackTransaction(): void
```

##### History Control
```typescript
undo(): boolean
redo(): boolean
getHistory(): StateHistoryEntry[]
```

##### Node Operations
```typescript
updateNode(nodeId: string, updates: Partial<NodeState>): void
addConnection(connection: ConnectionState): void
removeConnection(connectionId: string): void
```

##### State Persistence
```typescript
async saveState(key?: string): Promise<void>
async loadState(key?: string): Promise<SystemState>
async clearState(key?: string): Promise<void>
async exportState(): Promise<string>
async importState(data: string): Promise<void>
```

##### Snapshot Management
```typescript
createSnapshot(name: string, description?: string, tags?: string[], metadata?: Record<string, any>): string
getSnapshot(id: string): StateSnapshot | undefined
listSnapshots(): StateSnapshot[]
restoreSnapshot(id: string): boolean
deleteSnapshot(id: string): boolean
```

##### Performance Monitoring
```typescript
getMetrics(): StatePerformanceMetrics
```

### NodeBuilder System

Base class for creating specialized node builders.

#### BaseNodeBuilder

```typescript
abstract class BaseNodeBuilder implements INodeBuilder {
    withType(type: string): this
    withTitle(title: string): this
    withDescription(description: string): this
    withCategory(category: NodeCategory): this
    withMetadata(metadata: INodeTemplate['metadata']): this
    addInput(port: IPort): this
    addOutput(port: IPort): this
    build(): INodeTemplate
}
```

#### Specialized Builders

##### MathNodeBuilder
```typescript
class MathNodeBuilder extends BaseNodeBuilder {
    createUnaryOperation(type: NodeTypes, title: string, description: string): this
    createBinaryOperation(type: NodeTypes, title: string, description: string): this
    createAddNode(): this
    createMultiplyNode(): this
    // ... other math operations
}
```

##### IOBuilder
```typescript
class IOBuilder extends BaseNodeBuilder {
    createPrintNode(dataType?: DataType): this
    createInputNode(dataType?: DataType, prompt?: string): this
    createFileReadNode(encoding?: string): this
    createFileWriteNode(options?: Partial<IFileOperation>): this
    createStreamReadNode(): this
    createStreamWriteNode(options?: Partial<IFileOperation>): this
}
```

### Visual Components

#### BaseNode
```typescript
interface BaseNodeProps {
    data: INodeData;
    selected?: boolean;
    onSelect?: (id: string) => void;
    onPortConnect?: (sourceId: string, sourcePort: string, targetId: string, targetPort: string) => void;
    onPositionChange?: (id: string, position: { x: number; y: number }) => void;
}

const BaseNode: React.FC<BaseNodeProps>
```

#### StateVisualizer
```typescript
interface StateVisualizerProps {
    state: NodeState;
    showPerformance?: boolean;
    showData?: boolean;
    showBreakpoints?: boolean;
    onBreakpointToggle?: (nodeId: string) => void;
}

const StateVisualizer: React.FC<StateVisualizerProps>
```

#### PortConnection
```typescript
interface PortConnectionProps {
    sourcePort: IPort;
    targetPort: IPort;
    sourcePosition: { x: number; y: number };
    targetPosition: { x: number; y: number };
    isValid?: boolean;
    isHighlighted?: boolean;
    isAnimated?: boolean;
    onClick?: () => void;
}

const PortConnection: React.FC<PortConnectionProps>
```

## Core Types

### State Types

```typescript
interface SystemState {
    nodes: Record<string, NodeState>;
    connections: Record<string, ConnectionState>;
    selectedNodeIds: string[];
    version: number;
    timestamp: number;
}

interface NodeState {
    id: string;
    type: string;
    position: { x: number; y: number };
    inputs: IPort[];
    outputs: IPort[];
    metadata?: Record<string, any>;
}

interface ConnectionState {
    id: string;
    sourceNodeId: string;
    sourcePortId: string;
    targetNodeId: string;
    targetPortId: string;
}
```

### Configuration Types

```typescript
interface StateManagerConfig {
    maxHistorySize?: number;
    autosaveInterval?: number;
    validationRules?: {
        validateNode?: (node: NodeState) => StateValidationError[];
        validateConnection?: (connection: ConnectionState, nodes: Record<string, NodeState>) => StateValidationError[];
        validateSystem?: (state: SystemState) => StateValidationError[];
    };
    persistence?: StatePersistenceConfig;
    migrations?: StateMigration[];
    performance?: {
        enableMetrics?: boolean;
        batchOperations?: boolean;
        debounceTime?: number;
        maxBatchSize?: number;
    };
}

interface StatePersistenceConfig {
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
```

### Performance Types

```typescript
interface StatePerformanceMetrics {
    operationCount: number;
    lastOperationTime: number;
    averageOperationTime: number;
    memoryUsage: number;
    historySize: number;
    snapshotCount: number;
}
```

## Usage Examples

### Basic State Management

```typescript
// Initialize state manager
const initialState: SystemState = {
    nodes: {},
    connections: {},
    selectedNodeIds: [],
    version: 1,
    timestamp: Date.now()
};

const stateManager = new StateManager(initialState, {
    maxHistorySize: 50,
    autosaveInterval: 30000
});

// Update a node
stateManager.updateNode('node1', {
    position: { x: 100, y: 100 }
});

// Create a connection
stateManager.addConnection({
    id: 'conn1',
    sourceNodeId: 'node1',
    sourcePortId: 'port1',
    targetNodeId: 'node2',
    targetPortId: 'port2'
});

// Undo last operation
stateManager.undo();

// Create and restore snapshots
const snapshotId = stateManager.createSnapshot('My Snapshot');
stateManager.restoreSnapshot(snapshotId);
```

### Using Transactions

```typescript
// Begin a transaction
stateManager.beginTransaction('Move multiple nodes');

try {
    stateManager.updateNode('node1', { position: { x: 100, y: 100 } });
    stateManager.updateNode('node2', { position: { x: 200, y: 200 } });
    stateManager.commitTransaction();
} catch (error) {
    stateManager.rollbackTransaction();
}
```

### Custom Storage Adapter

```typescript
const stateManager = new StateManager(initialState, {
    persistence: {
        storage: 'custom',
        customStorage: {
            getItem: async (key) => {
                // Custom storage logic
                return localStorage.getItem(key);
            },
            setItem: async (key, value) => {
                // Custom storage logic
                localStorage.setItem(key, value);
            },
            removeItem: async (key) => {
                // Custom storage logic
                localStorage.removeItem(key);
            }
        }
    }
});
```

## Best Practices

1. **State Management**
   - Always use transactions for multiple related updates
   - Validate state after significant changes
   - Handle errors appropriately in async operations

2. **Performance**
   - Enable operation batching for multiple updates
   - Use appropriate debounce times for your use case
   - Monitor performance metrics in development

3. **State Persistence**
   - Implement custom storage adapters for specific needs
   - Use compression for large state trees
   - Handle migration errors gracefully

4. **Error Handling**
   - Always catch and handle async operation errors
   - Validate state before critical operations
   - Provide meaningful error messages

## Migration Guide

### Version 1.x to 2.x

```typescript
const migrations: StateMigration[] = [{
    version: 2,
    description: 'Add metadata to nodes',
    migrate: (state: SystemState) => {
        const nodes = Object.entries(state.nodes).reduce((acc, [id, node]) => ({
            ...acc,
            [id]: {
                ...node,
                metadata: node.metadata || {}
            }
        }), {});

        return {
            ...state,
            nodes,
            version: 2
        };
    }
}];

const stateManager = new StateManager(initialState, {
    migrations
});
``` 