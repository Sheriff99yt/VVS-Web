# Extending the Node System

This guide explains how to extend the node system with custom components and functionality.

## Creating Custom Node Types

### 1. Define Node Template

First, define your node template by implementing the `INodeTemplate` interface:

```typescript
const customNodeTemplate: INodeTemplate = {
    type: 'custom-node',
    title: 'Custom Node',
    description: 'A custom node implementation',
    category: 'custom',
    defaultInputs: [
        // Define input ports
    ],
    defaultOutputs: [
        // Define output ports
    ],
    metadata: {
        // Custom metadata
    }
};
```

### 2. Create Custom Builder

Create a custom builder by extending `BaseNodeBuilder`:

```typescript
class CustomNodeBuilder extends BaseNodeBuilder {
    constructor() {
        super();
        this.withCategory('custom');
    }

    createCustomNode(options: CustomNodeOptions): this {
        const execIn = this.portFactory.createExecPort('exec', 'Exec', true);
        const dataIn = this.portFactory.createDataPort('input', 'Input', options.dataType, true);
        const execOut = this.portFactory.createExecPort('next', 'Next', false);
        const dataOut = this.portFactory.createDataPort('output', 'Output', options.dataType, false);

        return this
            .withType('custom-node')
            .withTitle('Custom Node')
            .withDescription('Custom node description')
            .withMetadata({
                // Custom metadata
            })
            .addInput(execIn)
            .addInput(dataIn)
            .addOutput(execOut)
            .addOutput(dataOut);
    }
}
```

### 3. Implement Visual Component

Create a React component for your custom node:

```typescript
interface CustomNodeProps {
    data: INodeData;
    selected?: boolean;
    onSelect?: (id: string) => void;
    onPortConnect?: (sourceId: string, sourcePort: string, targetId: string, targetPort: string) => void;
    onPositionChange?: (id: string, position: { x: number; y: number }) => void;
}

const CustomNode: React.FC<CustomNodeProps> = ({
    data,
    selected,
    onSelect,
    onPortConnect,
    onPositionChange
}) => {
    return (
        <BaseNode
            data={data}
            selected={selected}
            onSelect={onSelect}
            onPortConnect={onPortConnect}
            onPositionChange={onPositionChange}
        >
            {/* Custom node content */}
        </BaseNode>
    );
};
```

## Adding Custom State Management

### 1. Define Custom State Types

```typescript
interface CustomNodeState extends NodeState {
    customData: {
        // Custom state data
    };
}

interface CustomSystemState extends SystemState {
    customNodes: Record<string, CustomNodeState>;
}
```

### 2. Create Custom State Manager

```typescript
class CustomStateManager extends StateManager {
    constructor(initialState: CustomSystemState, config?: StateManagerConfig) {
        super(initialState, config);
    }

    updateCustomNode(nodeId: string, customData: any) {
        this.updateNode(nodeId, {
            metadata: {
                ...this.getCurrentState().nodes[nodeId].metadata,
                customData
            }
        });
    }

    // Add custom state management methods
}
```

## Custom Validation Rules

### 1. Define Validation Rules

```typescript
const customValidationRules = {
    validateNode: (node: NodeState): StateValidationError[] => {
        const errors: StateValidationError[] = [];
        
        // Add custom validation logic
        if (!node.metadata?.customData) {
            errors.push({
                type: 'node',
                id: node.id,
                message: 'Custom data is required',
                severity: 'error'
            });
        }

        return errors;
    },

    validateConnection: (
        connection: ConnectionState,
        nodes: Record<string, NodeState>
    ): StateValidationError[] => {
        const errors: StateValidationError[] = [];
        
        // Add custom connection validation
        
        return errors;
    }
};
```

### 2. Apply Custom Validation

```typescript
const stateManager = new StateManager(initialState, {
    validationRules: customValidationRules
});
```

## Custom Storage Adapters

### 1. Implement Storage Adapter

```typescript
const customStorage = {
    async getItem(key: string): Promise<string | null> {
        // Custom storage retrieval logic
        return null;
    },

    async setItem(key: string, value: string): Promise<void> {
        // Custom storage save logic
    },

    async removeItem(key: string): Promise<void> {
        // Custom storage deletion logic
    }
};
```

### 2. Configure Storage

```typescript
const stateManager = new StateManager(initialState, {
    persistence: {
        storage: 'custom',
        customStorage,
        compression: true
    }
});
```

## Custom Theme Integration

### 1. Define Custom Theme

```typescript
const customTheme = {
    node: {
        background: '#2a2a2a',
        border: '#3a3a3a',
        selectedBorder: '#4a4a4a',
        text: '#ffffff'
    },
    port: {
        exec: '#4caf50',
        data: '#2196f3',
        border: '#ffffff'
    },
    // ... other theme properties
};
```

### 2. Apply Theme

```typescript
const CustomNode: React.FC<CustomNodeProps> = (props) => {
    return (
        <ThemeProvider theme={customTheme}>
            <StyledCustomNode>
                {/* Node content */}
            </StyledCustomNode>
        </ThemeProvider>
    );
};
```

## Best Practices

1. **Component Design**
   - Follow the existing component patterns
   - Use TypeScript for type safety
   - Implement proper error handling
   - Add comprehensive validation

2. **State Management**
   - Keep custom state changes atomic
   - Use transactions for complex updates
   - Validate state after changes
   - Handle async operations properly

3. **Performance**
   - Implement proper memoization
   - Use batched updates when possible
   - Monitor performance metrics
   - Optimize render cycles

4. **Theme Integration**
   - Follow the theme system structure
   - Use theme variables consistently
   - Support dark/light modes
   - Handle theme transitions

5. **Testing**
   - Write unit tests for custom components
   - Test state management logic
   - Validate custom rules
   - Test error conditions

## Example: Complete Custom Node

Here's a complete example of a custom node implementation:

```typescript
// Types
interface CustomNodeData {
    value: number;
    operation: 'increment' | 'decrement';
}

// Builder
class CustomNodeBuilder extends BaseNodeBuilder {
    createCustomNode(initialValue: number = 0): this {
        const execIn = this.portFactory.createExecPort('exec', 'Exec', true);
        const valueIn = this.portFactory.createDataPort('value', 'Value', 'number', true);
        const execOut = this.portFactory.createExecPort('next', 'Next', false);
        const valueOut = this.portFactory.createDataPort('result', 'Result', 'number', false);

        return this
            .withType('custom-counter')
            .withTitle('Counter')
            .withDescription('Custom counter node')
            .withMetadata({
                initialValue,
                isAsync: false
            })
            .addInput(execIn)
            .addInput(valueIn)
            .addOutput(execOut)
            .addOutput(valueOut);
    }
}

// Component
const CustomNode: React.FC<CustomNodeProps> = ({
    data,
    selected,
    onSelect,
    onPortConnect,
    onPositionChange
}) => {
    const [value, setValue] = useState(data.metadata?.initialValue || 0);

    const handleIncrement = () => {
        setValue(prev => prev + 1);
    };

    const handleDecrement = () => {
        setValue(prev => prev - 1);
    };

    return (
        <BaseNode
            data={data}
            selected={selected}
            onSelect={onSelect}
            onPortConnect={onPortConnect}
            onPositionChange={onPositionChange}
        >
            <CustomNodeContent>
                <Value>{value}</Value>
                <ButtonGroup>
                    <Button onClick={handleIncrement}>+</Button>
                    <Button onClick={handleDecrement}>-</Button>
                </ButtonGroup>
            </CustomNodeContent>
        </BaseNode>
    );
};

// Styled Components
const CustomNodeContent = styled.div`
    padding: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Value = styled.div`
    font-size: 24px;
    font-weight: bold;
    color: ${props => props.theme.text.primary};
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 8px;
    margin-top: 8px;
`;

const Button = styled.button`
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    background: ${props => props.theme.button.background};
    color: ${props => props.theme.button.text};
    cursor: pointer;

    &:hover {
        background: ${props => props.theme.button.hover};
    }
`;
``` 