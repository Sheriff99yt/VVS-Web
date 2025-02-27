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

## 📚 Adding Nodes and Categories

### Node Categories
To add a new node category:

1. Update the `NodeCategoryType` type in your components definition:
```typescript
type NodeCategoryType = 'flow-control' | 'variables' | 'io' | 'math' | 'string' | 'functions' | 'your-new-category';
```

2. Add the category to `nodeCategories` in `src/services/NodeRegistry.ts`:
```typescript
export const nodeCategories = [
  // ... existing categories ...
  { id: 'your-new-category', label: 'Your Category Label' }
];
```

### Adding New Nodes

There are several ways to add new nodes:

1. **Using Helper Functions**
   - For mathematical operations:
   ```typescript
   // Binary operation node (two inputs)
   const newMathNode = createBinaryMathNode(
     'unique-type-id',
     'Node Title',
     'Node Description'
   );

   // Unary operation node (single input)
   const newUnaryNode = createUnaryMathNode(
     'unique-type-id',
     'Node Title',
     'Node Description'
   );
   ```

2. **Custom Node Template**
   ```typescript
   const customNode: NodeTemplate = {
     type: 'unique-type-id',
     title: 'Node Title',
     description: 'Node Description',
     category: 'your-category',
     defaultInputs: [
       createExecPort('exec', 'Exec'),
       createDataPort('input1', 'Input 1', 'string'),
       // Add more inputs as needed
     ],
     defaultOutputs: [
       createExecPort('exec', 'Exec', false),
       createDataPort('output1', 'Output 1', 'number', false),
       // Add more outputs as needed
     ]
   };
   ```

3. **Port Creation Helpers**
   ```typescript
   // Create an execution port
   createExecPort('port-id', 'Port Label', isInput);

   // Create a data port
   createDataPort('port-id', 'Port Label', 'dataType', isInput);
   ```

### Adding Node to Registry

After creating your node template, add it to the `nodeTemplates` array in `src/services/NodeRegistry.ts`:

```typescript
export const nodeTemplates: NodeTemplate[] = [
  // ... existing nodes ...
  yourNewNodeTemplate
];
```

### Available Data Types

The following data types are supported for node ports:
- `'string'`
- `'number'`
- `'boolean'`
- `'any'`
- `'array'`
- `'object'`

### Best Practices

1. Ensure unique type IDs for each node
2. Provide clear, descriptive titles and descriptions
3. Use appropriate categories for organization
4. Include execution ports for flow control
5. Follow consistent naming conventions for ports
6. Document any special behavior or requirements

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