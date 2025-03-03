# VVS Web API Reference

> **Note**: This document is for developers who want to extend VVS Web or integrate it with other systems. For user documentation, please refer to the [User Guide](./USER_GUIDE.md).

## Overview

VVS Web provides a JavaScript API that allows you to:

1. Programmatically create and manipulate node graphs
2. Generate code from node graphs
3. Integrate VVS Web into your own applications
4. Create custom node types
5. Extend the functionality of VVS Web

This document describes the public API of VVS Web, which is available through the global `VVSWeb` object when the library is loaded.

## Table of Contents

- [Core API](#core-api)
  - [Initialization](#initialization)
  - [Graph Management](#graph-management)
  - [Node Management](#node-management)
  - [Connection Management](#connection-management)
  - [Code Generation](#code-generation)
  - [Import/Export](#importexport)
- [Node Types API](#node-types-api)
  - [Creating Custom Nodes](#creating-custom-nodes)
  - [Node Properties](#node-properties)
  - [Port Configuration](#port-configuration)
- [Events API](#events-api)
  - [Graph Events](#graph-events)
  - [Node Events](#node-events)
  - [Connection Events](#connection-events)
- [UI Integration API](#ui-integration-api)
  - [Canvas Customization](#canvas-customization)
  - [Theme Customization](#theme-customization)
  - [Custom Renderers](#custom-renderers)

## Core API

### Initialization

```javascript
// Initialize VVS Web with a container element and options
const vvsWeb = VVSWeb.initialize(containerElement, {
  theme: 'light',
  readOnly: false,
  showCodePreview: true,
  language: 'python'
});
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| theme | string | 'light' | UI theme ('light' or 'dark') |
| readOnly | boolean | false | Whether the graph is editable |
| showCodePreview | boolean | true | Whether to show the code preview panel |
| language | string | 'python' | Target language for code generation |
| autoLayout | boolean | false | Whether to automatically layout nodes |
| snapToGrid | boolean | true | Whether to snap nodes to grid |
| gridSize | number | 20 | Size of the grid in pixels |

### Graph Management

```javascript
// Create a new empty graph
const graph = vvsWeb.createGraph();

// Get the current graph
const currentGraph = vvsWeb.getCurrentGraph();

// Clear the current graph
vvsWeb.clearGraph();

// Check if the graph is valid (no errors)
const isValid = vvsWeb.validateGraph();

// Get validation errors if any
const errors = vvsWeb.getValidationErrors();
```

### Node Management

```javascript
// Create a node of a specific type
const node = vvsWeb.createNode('math.add', { x: 100, y: 200 });

// Get all nodes in the graph
const allNodes = vvsWeb.getNodes();

// Get a node by ID
const node = vvsWeb.getNodeById('node-123');

// Update node properties
vvsWeb.updateNode('node-123', { 
  title: 'Custom Title',
  position: { x: 150, y: 250 }
});

// Delete a node
vvsWeb.deleteNode('node-123');
```

### Connection Management

```javascript
// Create a connection between two nodes
const connection = vvsWeb.createConnection({
  sourceNodeId: 'node-1',
  sourcePortId: 'output-1',
  targetNodeId: 'node-2',
  targetPortId: 'input-1'
});

// Get all connections
const connections = vvsWeb.getConnections();

// Delete a connection
vvsWeb.deleteConnection('connection-123');

// Check if a connection is valid
const isValid = vvsWeb.validateConnection(sourcePort, targetPort);
```

### Code Generation

```javascript
// Generate code from the current graph
const code = vvsWeb.generateCode();

// Generate code with specific options
const code = vvsWeb.generateCode({
  language: 'python',
  indentSize: 4,
  includeComments: true
});

// Get code generation errors if any
const errors = vvsWeb.getCodeGenerationErrors();
```

### Import/Export

```javascript
// Export the current graph to JSON
const jsonData = vvsWeb.exportGraph();

// Import a graph from JSON
vvsWeb.importGraph(jsonData);

// Export generated code to a file
vvsWeb.exportCode('program.py');
```

## Node Types API

### Creating Custom Nodes

```javascript
// Register a custom node type
vvsWeb.registerNodeType({
  type: 'custom.myNode',
  category: 'Custom',
  title: 'My Custom Node',
  description: 'A custom node that does something special',
  
  // Define input ports
  inputs: [
    { id: 'input1', name: 'First Input', type: 'number' },
    { id: 'input2', name: 'Second Input', type: 'string' }
  ],
  
  // Define output ports
  outputs: [
    { id: 'output', name: 'Result', type: 'number' }
  ],
  
  // Define execution ports (for control flow)
  executionInputs: [
    { id: 'exec_in', name: 'Execution In' }
  ],
  executionOutputs: [
    { id: 'exec_out', name: 'Execution Out' }
  ],
  
  // Define properties that can be configured
  properties: [
    { id: 'factor', name: 'Factor', type: 'number', default: 1 }
  ],
  
  // Define how this node generates code
  generateCode: (node, context) => {
    const input1 = context.getInputValue(node, 'input1') || '0';
    const input2 = context.getInputValue(node, 'input2') || '""';
    const factor = node.properties.factor || 1;
    
    return `${context.getOutputVariable(node, 'output')} = (${input1} + len(${input2})) * ${factor}`;
  }
});
```

### Node Properties

```javascript
// Get properties of a node
const properties = vvsWeb.getNodeProperties('node-123');

// Update a specific property
vvsWeb.updateNodeProperty('node-123', 'propertyName', newValue);

// Reset a property to its default value
vvsWeb.resetNodeProperty('node-123', 'propertyName');
```

### Port Configuration

```javascript
// Get information about a port
const portInfo = vvsWeb.getPortInfo('node-123', 'port-456');

// Get all connected ports for a node
const connections = vvsWeb.getNodeConnections('node-123');

// Check if a port is connected
const isConnected = vvsWeb.isPortConnected('node-123', 'port-456');
```

## Events API

### Graph Events

```javascript
// Listen for graph changes
vvsWeb.on('graph:changed', (graphData) => {
  console.log('Graph was changed', graphData);
});

// Listen for graph loaded event
vvsWeb.on('graph:loaded', (graphData) => {
  console.log('Graph was loaded', graphData);
});

// Listen for validation events
vvsWeb.on('graph:validated', (isValid, errors) => {
  if (!isValid) {
    console.error('Graph validation failed', errors);
  }
});
```

### Node Events

```javascript
// Listen for node creation
vvsWeb.on('node:created', (node) => {
  console.log('Node was created', node);
});

// Listen for node deletion
vvsWeb.on('node:deleted', (nodeId) => {
  console.log('Node was deleted', nodeId);
});

// Listen for node property changes
vvsWeb.on('node:propertyChanged', (nodeId, property, value) => {
  console.log(`Property ${property} of node ${nodeId} changed to`, value);
});
```

### Connection Events

```javascript
// Listen for connection creation
vvsWeb.on('connection:created', (connection) => {
  console.log('Connection was created', connection);
});

// Listen for connection deletion
vvsWeb.on('connection:deleted', (connectionId) => {
  console.log('Connection was deleted', connectionId);
});

// Listen for invalid connection attempts
vvsWeb.on('connection:invalid', (sourcePort, targetPort, reason) => {
  console.warn('Invalid connection attempt', reason);
});
```

## UI Integration API

### Canvas Customization

```javascript
// Set canvas zoom level
vvsWeb.setZoom(1.5); // 150% zoom

// Center the view on a specific node
vvsWeb.centerOnNode('node-123');

// Get the current viewport information
const viewport = vvsWeb.getViewport();

// Set the canvas size
vvsWeb.setCanvasSize(width, height);
```

### Theme Customization

```javascript
// Set a custom theme
vvsWeb.setTheme({
  background: '#f5f5f5',
  nodeFill: '#ffffff',
  nodeStroke: '#cccccc',
  textColor: '#333333',
  primaryColor: '#4a90e2',
  successColor: '#5cb85c',
  warningColor: '#f0ad4e',
  dangerColor: '#d9534f',
  // ... other theme properties
});

// Get the current theme
const theme = vvsWeb.getTheme();
```

### Custom Renderers

```javascript
// Register a custom node renderer
vvsWeb.registerNodeRenderer('custom.myNode', {
  render: (node, element, theme) => {
    // Custom rendering logic using DOM or Canvas API
    element.innerHTML = `<div class="custom-node">
      <div class="title">${node.title}</div>
      <div class="body">Custom content here</div>
    </div>`;
  }
});

// Register a custom port renderer
vvsWeb.registerPortRenderer('myCustomPortStyle', {
  render: (port, element, theme) => {
    // Custom port rendering logic
  }
});
```

## For More Information

For more detailed information about using VVS Web, please refer to:

- [User Guide](./USER_GUIDE.md) - Comprehensive guide for using VVS Web
- [Function Guide](./FUNCTION_GUIDE.md) - Reference for all available functions
- [Examples](./EXAMPLES.md) - Example projects to learn from

For developer support, please visit our GitHub repository or contact the development team.
