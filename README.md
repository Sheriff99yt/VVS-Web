# Visual Visual Scripting (VVS)

A modern web-based visual scripting environment built with React and TypeScript. This application provides an intuitive node-based interface for creating and managing complex logic flows.

## 🛠️ Tech Stack

- React 19.0.0
- TypeScript 4.9.5
- React Flow for node-based interface
- Prism.js for code syntax highlighting
- Testing Library for React components testing

## 📋 Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- Modern web browser (Chrome, Firefox, Safari, or Edge)

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/vvs-web.git
   cd vvs-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
vvs-web/
├── src/
│   ├── components/     # React components
│   ├── services/       # Business logic and API services
│   ├── App.tsx        # Main application component
│   ├── App.css        # Application styles
│   ├── index.tsx      # Application entry point
│   └── index.css      # Global styles
├── public/            # Static assets
└── package.json       # Project dependencies and scripts
```

## 📜 Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from create-react-app

## 🧪 Testing

The project uses React Testing Library for component testing. Run tests with:

```bash
npm test
```

## 📦 Dependencies

### Main Dependencies
- react: ^19.0.0
- react-dom: ^19.0.0
- reactflow: ^11.11.4
- prismjs: ^1.29.0
- typescript: ^4.9.5

### Development Dependencies
- @craco/craco: ^7.1.0
- @types/react: ^19.0.10
- webpack-dev-server: 4.14.0

## 📝 Adding New Nodes and Categories

### Node Registration Steps

1. **Add Node Type**
   ```typescript
   // In src/components/nodes/CustomNodes.tsx
   export const nodeTypes = {
     // ... existing types ...
     yourNode: 'yourNode',
   };
   ```

2. **Create Node Implementation**
   Choose one method:
   ```typescript
   // A. Use Helper Functions (Recommended for common patterns)
   [nodeTypes.yourNode]: createUnaryStringNode('Your Node', 'Description')
   
   // B. Custom Implementation (For complex nodes)
   [nodeTypes.yourNode]: memo((props: NodeProps<CustomNodeData>) => {
     const data = useMemo(() => ({
       title: 'Your Node',
       description: 'Description',
       category: 'your-category' as NodeCategory,
       inputs: [
         { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
         { id: 'input1', label: 'Input 1', dataType: 'your-type' as DataType }
       ],
       outputs: [
         { id: 'exec', label: 'Exec', dataType: 'any' as DataType, isExec: true },
         { id: 'output1', label: 'Output 1', dataType: 'your-type' as DataType }
       ]
     }), [props.data]);
     return <BaseNode {...props} data={data} />;
   })
   ```

3. **Register Node**
   ```typescript
   // In src/components/nodes/CustomNodes.tsx
   export const customNodes = {
     // ... existing nodes ...
     [nodeTypes.yourNode]: YOUR_NODE_IMPLEMENTATION
   };
   ```

4. **Add Category** (Optional - only if using a new category)
   ```typescript
   // A. Add to NodeCategory type
   export type NodeCategory = 
     | 'existing-categories'
     | 'your-category';

   // B. Add category styling in CustomNodes.css
   .node.your-category {
     background-color: #your-color;
   }
   ```

### Available Helper Functions

1. **String Operations**
   - `createUnaryStringNode`: One string input → string output
   - `createBinaryStringNode`: Two string inputs → string output
   - `createStringToNumberNode`: String input → number output
   - `createStringToBooleanNode`: String input → boolean output

2. **Port Creation**
   - `createExecPort`: Create execution flow ports
   - `createDataPort`: Create data input/output ports

### Node Features

Each node includes:
- Execution ports (input/output) for flow control
- Data ports with type safety
- Visual category styling
- Tooltips with descriptions
- Auto-generated titles
- Category-based coloring
- Port tooltips showing data types
- Support for code generation

### Node Categories

Available categories include:
- `flow-control`: Control flow nodes
- `pure-function`: Pure functions (green)
- `impure-function`: Impure functions (blue)
- `variables`: Variable nodes
- `event`: Event nodes
- `comment`: Comment nodes
- `math`: Mathematics operations
- `string`: String operations
- `logical`: Logical operations
- `comparison`: Comparison operations
- `io`: Input/Output operations

### Available Data Types

The following data types are supported for node ports:
```typescript
type DataType = 
  | 'number'      // Float
  | 'integer'     // Integer
  | 'boolean'     // Binary
  | 'string'      // String
  | 'vector'      // Vector
  | 'transform'   // Transform
  | 'rotator'     // Rotator
  | 'color'       // Linear Color
  | 'struct'      // Structure
  | 'class'       // Class Reference
  | 'array'       // Array type
  | 'any'         // Wildcard
```

### Port Creation Helpers

Use these helper functions to create node ports:
```typescript
// Create an execution port
createExecPort('port-id', 'Port Label', isInput);

// Create a data port
createDataPort('port-id', 'Port Label', 'dataType', isInput);
```

### Best Practices

1. **Naming Conventions**
   - Use descriptive, unique type IDs
   - Follow consistent naming patterns
   - Use clear, concise descriptions

2. **Port Configuration**
   - Include execution ports for flow control
   - Use appropriate data types
   - Provide clear port labels

3. **Visual Design**
   - Use distinct colors for different categories
   - Maintain consistent styling
   - Consider color accessibility

4. **Type Safety**
   - Use TypeScript types consistently
   - Validate port connections
   - Handle edge cases

5. **Documentation**
   - Document node purpose and behavior
   - Include usage examples
   - List any special requirements

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

```
MIT License

Copyright (c) 2024 VVS Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software...
```

## 👥 Authors

- **Your Name** - *Initial work* - [YourGithub](https://github.com/yourusername)
- **Contributor Name** - *Feature X* - [ContributorGithub](https://github.com/contributor)

## 🙏 Acknowledgments

- React Flow for the foundation of our node system
- TypeScript team for the amazing type system
- Our contributors and supporters
- Open source community

## 🔮 Future Plans

### Short Term (Q2 2024)
- [ ] Node grouping functionality
- [ ] Custom node creation interface
- [ ] Import/export capabilities
- [ ] Basic cloud save integration

### Medium Term (Q3-Q4 2024)
- [ ] Real-time collaboration
- [ ] Mobile responsiveness
- [ ] Additional node categories
- [ ] Performance optimizations

### Long Term (2025)
- [ ] AI-assisted node creation
- [ ] Visual debugging tools
- [ ] Community marketplace
- [ ] Enterprise features

## 📞 Support

### Community Support
- GitHub Issues: To Be Updated
- Discord: To Be Updated

### Professional Support
- Email: To Be Updated
- Twitter: To Be Updated
- Commercial Support: To Be Updated

### Documentation
- [Official Docs] To Be Updated
- [API Reference] To Be Updated
- [Examples] To Be Updated
- [Tutorials] To Be Updated

---

<div align="center">

Made with ❤️ by the VVS Team

[Website](To Be Updated) · [Documentation](To Be Updated) · [Blog](To Be Updated) · [Twitter](To Be Updated)

</div>

## 🔄 Adding Array Operations: A Complete Example

This section provides a detailed walkthrough of how we added array operations to the Visual Visual Scripting system.

### Step 1: Define Node Types

First, we added array operation types to the `nodeTypes` object in `src/components/nodes/CustomNodes.tsx`:

```typescript
export const nodeTypes = {
  // ... existing types ...
  arrayLength: 'arrayLength',
  arrayGet: 'arrayGet',
  arraySet: 'arraySet',
  arrayPush: 'arrayPush',
  arrayPop: 'arrayPop',
  arrayInsert: 'arrayInsert',
  arrayRemove: 'arrayRemove',
  arraySlice: 'arraySlice',
  arrayConcat: 'arrayConcat',
  arrayFind: 'arrayFind',
  arrayFilter: 'arrayFilter',
  arrayMap: 'arrayMap',
  arrayReduce: 'arrayReduce',
  arraySort: 'arraySort',
  arrayReverse: 'arrayReverse',
  arrayJoin: 'arrayJoin',
  arrayIncludes: 'arrayIncludes',
  arrayIndexOf: 'arrayIndexOf',
  arrayLastIndexOf: 'arrayLastIndexOf',
  arrayClear: 'arrayClear',
  arrayIsEmpty: 'arrayIsEmpty'
};
```

### Step 2: Add Array Category

We added the 'array' category to the `NodeCategory` type:

```typescript
export type NodeCategory = 
  // ... existing categories ...
  | 'array'          // Array operations
```

### Step 3: Register Category in UI

We added the array category to the categories list in `src/services/NodeRegistry.ts`:

```typescript
export const categories: { id: NodeCategory; label: string }[] = [
  // ... existing categories ...
  { id: 'array', label: 'Array' }
];
```

### Step 4: Implement Array Nodes

We implemented each array operation node using the memo pattern. Here's an example of how we implemented the arrayLength node:

```typescript
[nodeTypes.arrayLength]: memo((props: NodeProps<CustomNodeData>) => {
  const data = useMemo(() => ({
    title: 'Array Length',
    description: 'Get the length of an array',
    category: 'array' as NodeCategory,
    inputs: [
      { id: 'array', label: 'Array', dataType: 'array' as DataType }
    ],
    outputs: [
      { id: 'length', label: 'Length', dataType: 'number' as DataType }
    ]
  }), [props.data]);
  return <BaseNode {...props} data={data} />;
})
```

### Step 5: Define Node Templates

We added node templates in `src/services/NodeRegistry.ts` for each array operation:

```typescript
export const nodeTemplates: NodeTemplate[] = [
  // ... existing templates ...
  {
    type: nodeTypes.arrayLength,
    title: 'Array Length',
    description: 'Get the length of an array',
    category: 'array',
    defaultInputs: [
      createDataPort('array', 'Array', 'array')
    ],
    defaultOutputs: [
      createDataPort('length', 'Length', 'number', false)
    ]
  },
  // ... other array operation templates ...
];
```

### Step 6: Implement Code Generation

We added code generation support for array operations in the CodeGenerator class:

```typescript
class CodeGenerator {
  generateArrayOperation(node: Node, language: Language): string {
    switch (node.type) {
      case nodeTypes.arrayLength:
        return this.generateArrayLengthCode(node, language);
      case nodeTypes.arrayPush:
        return this.generateArrayPushCode(node, language);
      // ... other array operations ...
    }
  }
}
```

### Results

After implementing these steps:
1. Array operations appear in the node palette under the "Array" category
2. Users can drag and drop array operations into their flow
3. Each operation has proper type checking for array inputs/outputs
4. Code generation supports all array operations across supported languages
5. Operations maintain proper execution flow with exec pins
6. Array operations support various data types through the 'any' type system

### Available Array Operations

The following array operations are now available:
- Basic Operations: `length`, `get`, `set`
- Modification: `push`, `pop`, `insert`, `remove`, `clear`
- Transformation: `slice`, `concat`, `reverse`, `sort`
- Search: `find`, `includes`, `indexOf`, `lastIndexOf`
- Higher-order: `map`, `filter`, `reduce`
- Utility: `join`, `isEmpty`

Each operation includes:
- Proper type definitions
- Error handling
- Clear documentation
- Visual feedback
- Execution flow control
