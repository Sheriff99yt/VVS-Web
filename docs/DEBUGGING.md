# Node System Debugging Guide

This guide provides comprehensive information about debugging the node system, including common issues, debugging tools, and best practices.

## Built-in Debugging Tools

### 1. State Validation

The state validation system provides real-time error detection:

```typescript
// Get current validation errors
const errors = stateManager.validateState();

// Configure custom validation rules
const stateManager = new StateManager(initialState, {
    validationRules: {
        validateNode: (node) => {
            const errors: StateValidationError[] = [];
            // Add custom validation logic
            return errors;
        }
    }
});
```

### 2. Performance Monitoring

Monitor system performance using built-in metrics:

```typescript
// Enable performance monitoring
const stateManager = new StateManager(initialState, {
    performance: {
        enableMetrics: true,
        batchOperations: true,
        debounceTime: 100,
        maxBatchSize: 50
    }
});

// Get performance metrics
const metrics = stateManager.getMetrics();
console.log({
    operationCount: metrics.operationCount,
    averageOperationTime: metrics.averageOperationTime,
    memoryUsage: metrics.memoryUsage
});
```

### 3. State History

Inspect state changes using history:

```typescript
// Get state history
const history = stateManager.getHistory();

// Analyze state changes
history.forEach(entry => {
    console.log({
        timestamp: entry.timestamp,
        description: entry.description,
        stateVersion: entry.state.version
    });
});
```

### 4. Runtime State Inspection

Use the `StateVisualizer` component for runtime inspection:

```typescript
<StateVisualizer
    state={nodeState}
    showPerformance={true}
    showData={true}
    showBreakpoints={true}
    onBreakpointToggle={(nodeId) => {
        console.log(`Breakpoint toggled for node: ${nodeId}`);
    }}
/>
```

## Common Issues and Solutions

### 1. State Management Issues

#### Invalid State Updates

```typescript
// ❌ Wrong: Direct state mutation
stateManager.getCurrentState().nodes[nodeId].position = newPosition;

// ✅ Correct: Use updateNode method
stateManager.updateNode(nodeId, { position: newPosition });
```

#### Transaction Errors

```typescript
// ❌ Wrong: Unhandled transaction errors
stateManager.beginTransaction('Update nodes');
updateNodes(); // Might throw
stateManager.commitTransaction();

// ✅ Correct: Handle transaction errors
try {
    stateManager.beginTransaction('Update nodes');
    await updateNodes();
    stateManager.commitTransaction();
} catch (error) {
    stateManager.rollbackTransaction();
    console.error('Failed to update nodes:', error);
}
```

### 2. Port Connection Issues

#### Type Validation

```typescript
// ❌ Wrong: Missing port validation
onPortConnect(sourceId, sourcePort, targetId, targetPort);

// ✅ Correct: Validate port compatibility
const isValid = validatePortConnection(sourcePort, targetPort);
if (isValid) {
    onPortConnect(sourceId, sourcePort, targetId, targetPort);
} else {
    console.warn('Invalid port connection');
}
```

#### Connection State

```typescript
// Debug connection state
const debugConnection = (connection: ConnectionState) => {
    const sourceNode = stateManager.getCurrentState().nodes[connection.sourceNodeId];
    const targetNode = stateManager.getCurrentState().nodes[connection.targetNodeId];
    
    console.log({
        connection,
        sourceNode: sourceNode?.type,
        sourcePort: sourceNode?.outputs.find(p => p.id === connection.sourcePortId),
        targetNode: targetNode?.type,
        targetPort: targetNode?.inputs.find(p => p.id === connection.targetPortId)
    });
};
```

### 3. Performance Issues

#### Memory Leaks

```typescript
// ❌ Wrong: Not cleaning up resources
class LeakyNode extends React.Component {
    componentDidMount() {
        window.addEventListener('resize', this.handleResize);
    }
}

// ✅ Correct: Proper cleanup
class OptimizedNode extends React.Component {
    componentDidMount() {
        window.addEventListener('resize', this.handleResize);
    }
    
    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }
}
```

#### Render Optimization

```typescript
// ❌ Wrong: Unnecessary renders
const Node = ({ data }) => {
    const position = { x: data.x, y: data.y }; // New object each render
    return <div style={position} />;
};

// ✅ Correct: Memoized values
const Node = ({ data }) => {
    const position = useMemo(() => ({
        x: data.x,
        y: data.y
    }), [data.x, data.y]);
    
    return <div style={position} />;
};
```

## Debugging Tools

### 1. State Inspector

```typescript
class StateInspector {
    private stateManager: StateManager;
    
    constructor(stateManager: StateManager) {
        this.stateManager = stateManager;
    }
    
    inspectNode(nodeId: string) {
        const state = this.stateManager.getCurrentState();
        const node = state.nodes[nodeId];
        
        return {
            node,
            connections: Object.values(state.connections)
                .filter(conn => 
                    conn.sourceNodeId === nodeId || 
                    conn.targetNodeId === nodeId
                ),
            isSelected: state.selectedNodeIds.includes(nodeId)
        };
    }
    
    inspectConnection(connectionId: string) {
        const state = this.stateManager.getCurrentState();
        const connection = state.connections[connectionId];
        
        if (!connection) return null;
        
        return {
            connection,
            sourceNode: state.nodes[connection.sourceNodeId],
            targetNode: state.nodes[connection.targetNodeId]
        };
    }
}
```

### 2. Performance Profiler

```typescript
class PerformanceProfiler {
    private measurements: Map<string, number[]> = new Map();
    
    startMeasure(operation: string) {
        const start = performance.now();
        return () => {
            const duration = performance.now() - start;
            const measurements = this.measurements.get(operation) || [];
            measurements.push(duration);
            this.measurements.set(operation, measurements);
        };
    }
    
    getStats(operation: string) {
        const measurements = this.measurements.get(operation) || [];
        return {
            count: measurements.length,
            average: measurements.reduce((a, b) => a + b, 0) / measurements.length,
            min: Math.min(...measurements),
            max: Math.max(...measurements)
        };
    }
}
```

### 3. Connection Debugger

```typescript
class ConnectionDebugger {
    validateConnection(
        sourcePort: IPort,
        targetPort: IPort,
        nodes: Record<string, NodeState>
    ) {
        const issues: string[] = [];
        
        // Type compatibility
        if (sourcePort.dataType !== targetPort.dataType) {
            issues.push(
                `Type mismatch: ${sourcePort.dataType} -> ${targetPort.dataType}`
            );
        }
        
        // Port validation
        if (sourcePort.isInput) {
            issues.push('Source port cannot be an input');
        }
        if (!targetPort.isInput) {
            issues.push('Target port must be an input');
        }
        
        // Custom validation
        if (sourcePort.validation?.customValidation) {
            const result = sourcePort.validation.customValidation(null);
            if (!result) {
                issues.push('Source port validation failed');
            }
        }
        
        return {
            isValid: issues.length === 0,
            issues
        };
    }
}
```

## Best Practices

1. **Development Environment**
   - Enable source maps
   - Use TypeScript strict mode
   - Configure proper error boundaries
   - Set up comprehensive logging

2. **State Management**
   - Log state changes in development
   - Use transactions for complex operations
   - Validate state after updates
   - Keep state history for debugging

3. **Performance**
   - Profile critical operations
   - Monitor memory usage
   - Optimize render cycles
   - Use batched updates

4. **Error Handling**
   - Implement error boundaries
   - Log errors with context
   - Provide user feedback
   - Handle async errors properly

5. **Testing**
   - Write unit tests for state logic
   - Test edge cases
   - Mock complex operations
   - Use snapshot testing

## Debugging Checklist

1. **State Issues**
   - [ ] Validate current state
   - [ ] Check state history
   - [ ] Verify transactions
   - [ ] Inspect node metadata

2. **Connection Issues**
   - [ ] Validate port types
   - [ ] Check connection state
   - [ ] Verify port positions
   - [ ] Test connection events

3. **Performance Issues**
   - [ ] Monitor metrics
   - [ ] Profile operations
   - [ ] Check memory usage
   - [ ] Optimize renders

4. **Visual Issues**
   - [ ] Verify theme
   - [ ] Check layout
   - [ ] Test animations
   - [ ] Validate styles 

## Complex Debugging Scenarios

### 1. Circular Dependencies

When nodes form a circular dependency chain:

```typescript
// Debug circular dependencies
class CircularDependencyDetector {
    detectCircular(stateManager: StateManager, startNodeId: string): string[] | null {
        const visited = new Set<string>();
        const path: string[] = [];
        
        const dfs = (nodeId: string): boolean => {
            if (path.includes(nodeId)) {
                // Found cycle
                const cycleStart = path.indexOf(nodeId);
                return true;
            }
            
            if (visited.has(nodeId)) {
                return false;
            }
            
            visited.add(nodeId);
            path.push(nodeId);
            
            const state = stateManager.getCurrentState();
            const outgoingConnections = Object.values(state.connections)
                .filter(conn => conn.sourceNodeId === nodeId);
                
            for (const conn of outgoingConnections) {
                if (dfs(conn.targetNodeId)) {
                    return true;
                }
            }
            
            path.pop();
            return false;
        };
        
        if (dfs(startNodeId)) {
            return path;
        }
        
        return null;
    }
}

// Usage example
const detector = new CircularDependencyDetector();
const cycle = detector.detectCircular(stateManager, 'node1');
if (cycle) {
    console.error('Circular dependency detected:', cycle.join(' -> '));
}
```

### 2. Race Conditions in Async Operations

When multiple async operations affect the same nodes:

```typescript
class AsyncOperationManager {
    private pendingOperations: Map<string, Promise<void>> = new Map();
    
    async executeNodeOperation(
        nodeId: string,
        operation: () => Promise<void>
    ) {
        // Cancel any pending operation on this node
        if (this.pendingOperations.has(nodeId)) {
            console.warn(`Cancelling pending operation on node ${nodeId}`);
        }
        
        try {
            const operationPromise = operation();
            this.pendingOperations.set(nodeId, operationPromise);
            
            await operationPromise;
            console.log(`Operation completed for node ${nodeId}`);
        } catch (error) {
            console.error(`Operation failed for node ${nodeId}:`, error);
            throw error;
        } finally {
            this.pendingOperations.delete(nodeId);
        }
    }
    
    hasPendingOperations(nodeId: string): boolean {
        return this.pendingOperations.has(nodeId);
    }
    
    async waitForNode(nodeId: string): Promise<void> {
        const pending = this.pendingOperations.get(nodeId);
        if (pending) {
            await pending;
        }
    }
}

// Usage example
const asyncManager = new AsyncOperationManager();

try {
    await asyncManager.executeNodeOperation('node1', async () => {
        await stateManager.beginTransaction('Update node data');
        // Perform async operations
        await stateManager.commitTransaction();
    });
} catch (error) {
    await stateManager.rollbackTransaction();
}
```

### 3. Memory Leaks in Dynamic Node Creation

When nodes are created and destroyed frequently:

```typescript
class NodeMemoryTracker {
    private nodeRefs: WeakMap<NodeState, Set<() => void>> = new WeakMap();
    private disposers: Map<string, () => void> = new Map();
    
    trackNode(node: NodeState, cleanup: () => void) {
        let refs = this.nodeRefs.get(node);
        if (!refs) {
            refs = new Set();
            this.nodeRefs.set(node, refs);
        }
        
        refs.add(cleanup);
        this.disposers.set(node.id, () => {
            refs?.delete(cleanup);
            cleanup();
        });
    }
    
    disposeNode(nodeId: string) {
        const dispose = this.disposers.get(nodeId);
        if (dispose) {
            dispose();
            this.disposers.delete(nodeId);
        }
    }
    
    getActiveCleanups(): number {
        return this.disposers.size;
    }
}

// Usage with React components
const DynamicNode: React.FC<NodeProps> = ({ data }) => {
    const memoryTracker = useContext(MemoryTrackerContext);
    
    useEffect(() => {
        const cleanup = () => {
            // Cleanup resources
        };
        
        memoryTracker.trackNode(data, cleanup);
        return () => memoryTracker.disposeNode(data.id);
    }, [data.id]);
    
    return <NodeContent data={data} />;
};
```

### 4. Port Type Mismatches in Complex Connections

When dealing with complex data types and type coercion:

```typescript
class PortTypeValidator {
    private typeRegistry: Map<string, (value: any) => boolean> = new Map();
    
    registerType(type: string, validator: (value: any) => boolean) {
        this.typeRegistry.set(type, validator);
    }
    
    canConnect(sourcePort: IPort, targetPort: IPort): {
        canConnect: boolean;
        reason?: string;
        coercion?: (value: any) => any;
    } {
        // Direct type match
        if (sourcePort.dataType === targetPort.dataType) {
            return { canConnect: true };
        }
        
        // Check for type coercion
        const sourceValidator = this.typeRegistry.get(sourcePort.dataType);
        const targetValidator = this.typeRegistry.get(targetPort.dataType);
        
        if (!sourceValidator || !targetValidator) {
            return {
                canConnect: false,
                reason: 'Unknown data type'
            };
        }
        
        // Check if types are compatible through coercion
        if (this.canCoerce(sourcePort.dataType, targetPort.dataType)) {
            return {
                canConnect: true,
                coercion: (value) => this.coerceValue(
                    value,
                    sourcePort.dataType,
                    targetPort.dataType
                )
            };
        }
        
        return {
            canConnect: false,
            reason: `Cannot convert ${sourcePort.dataType} to ${targetPort.dataType}`
        };
    }
    
    private canCoerce(fromType: string, toType: string): boolean {
        // Define type coercion rules
        const coercionRules: Record<string, string[]> = {
            'number': ['string', 'boolean'],
            'string': ['number', 'boolean'],
            'boolean': ['number', 'string']
        };
        
        return coercionRules[fromType]?.includes(toType) ?? false;
    }
    
    private coerceValue(value: any, fromType: string, toType: string): any {
        // Implement type coercion logic
        const coercionMap: Record<string, Record<string, (v: any) => any>> = {
            'number': {
                'string': String,
                'boolean': Boolean
            },
            'string': {
                'number': Number,
                'boolean': (v) => v.toLowerCase() === 'true'
            },
            'boolean': {
                'number': Number,
                'string': String
            }
        };
        
        return coercionMap[fromType]?.[toType]?.(value) ?? value;
    }
}

// Usage example
const typeValidator = new PortTypeValidator();

// Register custom types
typeValidator.registerType('vector2d', 
    (value) => value && typeof value.x === 'number' && typeof value.y === 'number'
);

// Validate connection
const { canConnect, reason, coercion } = typeValidator.canConnect(
    sourcePort,
    targetPort
);

if (canConnect && coercion) {
    // Handle type coercion during data transfer
    const coercedValue = coercion(sourceValue);
    targetNode.handleInput(coercedValue);
} else {
    console.error('Cannot connect ports:', reason);
}
```

### 5. State Synchronization Issues

When node states become out of sync with the visual representation:

```typescript
class StateSynchronizer {
    private lastKnownStates: Map<string, string> = new Map();
    private reconciliationQueue: Set<string> = new Set();
    
    constructor(private stateManager: StateManager) {
        this.setupReconciliation();
    }
    
    private setupReconciliation() {
        // Periodically check for state mismatches
        setInterval(() => this.reconcileStates(), 1000);
    }
    
    trackNodeState(nodeId: string) {
        const currentState = JSON.stringify(
            this.stateManager.getCurrentState().nodes[nodeId]
        );
        this.lastKnownStates.set(nodeId, currentState);
    }
    
    checkStateSync(nodeId: string): boolean {
        const lastState = this.lastKnownStates.get(nodeId);
        const currentState = JSON.stringify(
            this.stateManager.getCurrentState().nodes[nodeId]
        );
        
        if (lastState !== currentState) {
            this.reconciliationQueue.add(nodeId);
            return false;
        }
        
        return true;
    }
    
    private async reconcileStates() {
        if (this.reconciliationQueue.size === 0) return;
        
        console.warn(
            'State synchronization issues detected for nodes:',
            Array.from(this.reconciliationQueue)
        );
        
        try {
            await this.stateManager.beginTransaction('State reconciliation');
            
            for (const nodeId of this.reconciliationQueue) {
                const node = this.stateManager.getCurrentState().nodes[nodeId];
                if (node) {
                    // Trigger a re-render of the node
                    this.stateManager.updateNode(nodeId, {
                        ...node,
                        timestamp: Date.now()
                    });
                    
                    this.trackNodeState(nodeId);
                }
            }
            
            await this.stateManager.commitTransaction();
            this.reconciliationQueue.clear();
            
        } catch (error) {
            console.error('Failed to reconcile states:', error);
            await this.stateManager.rollbackTransaction();
        }
    }
}

// Usage example
const synchronizer = new StateSynchronizer(stateManager);

// Track node state changes
synchronizer.trackNodeState('node1');

// Check if node is in sync
if (!synchronizer.checkStateSync('node1')) {
    console.warn('Node state is out of sync');
}
``` 