# VVS Web Simplified Implementation Guide

This document provides detailed technical guidance for implementing the simplified MVP as outlined in the SIMPLIFIED_MVP_PLAN.md. It specifies the exact components to build, code considerations, and implementation priority.

## Essential Components and Implementation Approach

### 1. Function Definitions (Priority: Highest)

#### Implementation Steps:
1. Create a simplified JSON format for function definitions
   ```json
   {
     "version": "1.0",
     "functions": [
       {
         "id": "math_add",
         "name": "Add",
         "category": "Math",
         "description": "Adds two numbers together",
         "parameters": [
           {"id": "a", "name": "A", "type": "number", "required": true},
           {"id": "b", "name": "B", "type": "number", "required": true}
         ],
         "returnType": "number",
         "syntaxPattern": "{0} + {1}"
       }
     ]
   }
   ```

2. Implement minimal `FunctionDefinitionService` class
   ```typescript
   class FunctionDefinitionService {
     private functions: Map<string, FunctionDefinition> = new Map();
   
     async loadDefinitions(url: string): Promise<void> {
       const response = await fetch(url);
       const data = await response.json();
       
       data.functions.forEach((func: FunctionDefinition) => {
         this.functions.set(func.id, func);
       });
     }
   
     getFunction(id: string): FunctionDefinition | undefined {
       return this.functions.get(id);
     }
   
     getAllFunctions(): FunctionDefinition[] {
       return Array.from(this.functions.values());
     }
   
     getFunctionsByCategory(category: string): FunctionDefinition[] {
       return this.getAllFunctions().filter(f => f.category === category);
     }
   }
   ```

3. Create function definition files for the essential functions:
   - `math_functions.json`: Add, Subtract, Multiply, Divide
   - `string_functions.json`: Concatenate, Format
   - `control_functions.json`: If, For Loop
   - `io_functions.json`: Print, Input
   - `data_functions.json`: Create List, Get Item, Set Item

### 2. Node Canvas (Priority: High)

#### Implementation Steps:
1. Set up React Flow with minimal configuration
   ```typescript
   import ReactFlow, { Background, Controls } from 'reactflow';
   
   const NodeCanvas: React.FC = () => {
     const [nodes, setNodes] = useState<Node[]>([]);
     const [edges, setEdges] = useState<Edge[]>([]);
   
     return (
       <div style={{ height: '100%', width: '100%' }}>
         <ReactFlow
           nodes={nodes}
           edges={edges}
           onNodesChange={(changes) => setNodes(applyNodeChanges(changes, nodes))}
           onEdgesChange={(changes) => setEdges(applyEdgeChanges(changes, edges))}
           onConnect={(params) => setEdges((eds) => addEdge(params, eds))}
         >
           <Background />
           <Controls />
         </ReactFlow>
       </div>
     );
   };
   ```

2. Create minimal FunctionNode component
   ```typescript
   const FunctionNode: React.FC<NodeProps> = ({ data }) => {
     return (
       <div className="function-node">
         <div className="function-node-header">
           <div className="function-node-title">{data.label}</div>
         </div>
         
         <div className="function-node-ports">
           {/* Input ports */}
           <div className="function-node-inputs">
             {data.inputs.map(input => (
               <div key={input.id} className="port-container input-port">
                 <Handle
                   type="target"
                   position={Position.Left}
                   id={input.id}
                   className="port"
                 />
                 <span className="port-label">{input.name}</span>
               </div>
             ))}
           </div>
           
           {/* Output ports */}
           <div className="function-node-outputs">
             {data.outputs.map(output => (
               <div key={output.id} className="port-container output-port">
                 <span className="port-label">{output.name}</span>
                 <Handle
                   type="source"
                   position={Position.Right}
                   id={output.id}
                   className="port"
                 />
               </div>
             ))}
           </div>
         </div>
       </div>
     );
   };
   ```

3. Implement minimal styling for nodes
   ```css
   .function-node {
     padding: 10px;
     border-radius: 5px;
     background-color: white;
     border: 1px solid #ddd;
     width: 200px;
   }
   
   .function-node-header {
     margin-bottom: 10px;
   }
   
   .function-node-title {
     font-weight: bold;
     font-size: 14px;
   }
   
   .port-container {
     display: flex;
     align-items: center;
     margin: 5px 0;
   }
   
   .input-port {
     justify-content: flex-start;
   }
   
   .output-port {
     justify-content: flex-end;
   }
   
   .port-label {
     font-size: 12px;
   }
   ```

### 3. Node Library (Priority: Medium)

#### Implementation Steps:
1. Create a basic NodeLibrary component
   ```typescript
   const NodeLibrary: React.FC<{onNodeAdd: (node: Node) => void}> = ({ onNodeAdd }) => {
     const [functions, setFunctions] = useState<FunctionDefinition[]>([]);
     const [searchTerm, setSearchTerm] = useState('');
     
     useEffect(() => {
       // Load functions
       const functionService = new FunctionDefinitionService();
       functionService.loadDefinitions('/functions/all_functions.json')
         .then(() => {
           setFunctions(functionService.getAllFunctions());
         });
     }, []);
     
     const filteredFunctions = functions.filter(func => 
       func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       func.category.toLowerCase().includes(searchTerm.toLowerCase())
     );
     
     const createNode = (func: FunctionDefinition) => {
       const position = { x: 100, y: 100 };
       const newNode = {
         id: `${func.id}-${Date.now()}`,
         type: 'functionNode',
         position,
         data: {
           label: func.name,
           inputs: func.parameters.map(p => ({
             id: p.id,
             name: p.name,
             type: p.type
           })),
           outputs: [
             {
               id: 'output',
               name: 'Output',
               type: func.returnType
             }
           ]
         }
       };
       
       onNodeAdd(newNode);
     };
     
     return (
       <div className="node-library">
         <div className="node-library-header">
           <h3>Function Library</h3>
           <input
             type="text"
             placeholder="Search..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="node-library-search"
           />
         </div>
         
         <div className="node-library-list">
           {filteredFunctions.map(func => (
             <div 
               key={func.id}
               className={`node-library-item category-${func.category.toLowerCase()}`}
               onClick={() => createNode(func)}
             >
               <div className="node-library-item-title">{func.name}</div>
               <div className="node-library-item-category">{func.category}</div>
             </div>
           ))}
         </div>
       </div>
     );
   };
   ```

2. Implement drag-and-drop from library to canvas
   ```typescript
   // Extend NodeLibrary component with drag handlers
   const onDragStart = (event: React.DragEvent, func: FunctionDefinition) => {
     event.dataTransfer.setData('application/reactflow', JSON.stringify(func));
     event.dataTransfer.effectAllowed = 'move';
   };
   
   // In NodeLibrary JSX, make items draggable
   <div 
     key={func.id}
     className={`node-library-item category-${func.category.toLowerCase()}`}
     onClick={() => createNode(func)}
     draggable
     onDragStart={(e) => onDragStart(e, func)}
   >
     {/* ... */}
   </div>
   
   // In NodeCanvas component, add drop handlers
   const onDragOver = (event: React.DragEvent) => {
     event.preventDefault();
     event.dataTransfer.dropEffect = 'move';
   };
   
   const onDrop = (event: React.DragEvent) => {
     event.preventDefault();
     
     const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
     const func = JSON.parse(event.dataTransfer.getData('application/reactflow'));
     
     // Get position from drop point
     const position = reactFlowInstance.project({
       x: event.clientX - reactFlowBounds.left,
       y: event.clientY - reactFlowBounds.top,
     });
     
     // Create node with function data
     const newNode = createNodeFromFunction(func, position);
     
     // Add node to canvas
     setNodes((nds) => nds.concat(newNode));
   };
   ```

### 4. Basic Code Generation (Priority: Medium-High)

#### Implementation Steps:
1. Create a simple code generator class
   ```typescript
   class SimpleCodeGenerator {
     generateCode(nodes: Node[], edges: Edge[]): string {
       let code = '# Generated Python Code\n\n';
       
       // Create a map of node output to variable names
       const variableMap = new Map();
       
       // Process nodes in topological order (simple version)
       const processedNodes = new Set();
       const orderedNodes: Node[] = [];
       
       // Simple topological sort
       const addNodesInOrder = (nodeId: string) => {
         if (processedNodes.has(nodeId)) return;
         
         // Add dependencies first (nodes that provide input to this node)
         const incomingEdges = edges.filter(e => e.target === nodeId);
         for (const edge of incomingEdges) {
           addNodesInOrder(edge.source);
         }
         
         const node = nodes.find(n => n.id === nodeId);
         if (node && !processedNodes.has(node.id)) {
           orderedNodes.push(node);
           processedNodes.add(node.id);
         }
       };
       
       // Start with nodes that have no incoming edges (sources)
       const sourceNodes = nodes.filter(node => 
         !edges.some(edge => edge.target === node.id)
       );
       
       for (const node of sourceNodes) {
         addNodesInOrder(node.id);
       }
       
       // Generate code for each node in order
       for (const node of orderedNodes) {
         const func = getFunctionById(node.data.functionId);
         if (!func) continue;
         
         // Get input values
         const inputs: string[] = [];
         for (const input of node.data.inputs) {
           const incomingEdge = edges.find(e => 
             e.target === node.id && e.targetHandle === input.id
           );
           
           if (incomingEdge) {
             // Use the variable from the source node
             const sourceNode = nodes.find(n => n.id === incomingEdge.source);
             const sourcePortId = incomingEdge.sourceHandle;
             const varName = variableMap.get(`${incomingEdge.source}:${sourcePortId}`);
             inputs.push(varName);
           } else {
             // No connection, use default value
             inputs.push(getDefaultValueForType(input.type));
           }
         }
         
         // Generate code for this node
         const varName = `var_${node.id.replace(/\W/g, '_')}`;
         variableMap.set(`${node.id}:output`, varName);
         
         // Apply syntax pattern
         const syntaxPattern = func.syntaxPattern || '{0}';
         let nodeCode = syntaxPattern;
         
         // Simple pattern replacement
         for (let i = 0; i < inputs.length; i++) {
           nodeCode = nodeCode.replace(`{${i}}`, inputs[i]);
         }
         
         // Add line to code
         code += `${varName} = ${nodeCode}\n`;
       }
       
       return code;
     }
     
     private getDefaultValueForType(type: string): string {
       switch (type) {
         case 'number': return '0';
         case 'string': return '""';
         case 'boolean': return 'False';
         case 'array': return '[]';
         default: return 'None';
       }
     }
   }
   ```

2. Create a basic CodePreview component
   ```typescript
   const CodePreview: React.FC<{nodes: Node[], edges: Edge[]}> = ({ nodes, edges }) => {
     const [code, setCode] = useState('# No code generated yet');
     
     useEffect(() => {
       if (nodes.length === 0) {
         setCode('# Add nodes to generate code');
         return;
       }
       
       const generator = new SimpleCodeGenerator();
       const generatedCode = generator.generateCode(nodes, edges);
       setCode(generatedCode);
     }, [nodes, edges]);
     
     const handleExport = () => {
       const blob = new Blob([code], { type: 'text/plain' });
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = 'generated_code.py';
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
       URL.revokeObjectURL(url);
     };
     
     return (
       <div className="code-preview">
         <div className="code-preview-header">
           <h3>Generated Code</h3>
           <button onClick={handleExport} className="export-button">
             Export
           </button>
         </div>
         <pre className="code-area">
           <code>{code}</code>
         </pre>
       </div>
     );
   };
   ```

### 5. Main Application Layout (Priority: Medium)

#### Implementation Steps:
1. Create a main layout component
   ```typescript
   const App: React.FC = () => {
     const [nodes, setNodes] = useState<Node[]>([]);
     const [edges, setEdges] = useState<Edge[]>([]);
     
     const handleNodeAdd = (node: Node) => {
       setNodes((nds) => [...nds, node]);
     };
     
     return (
       <div className="app">
         <header className="app-header">
           <h1>VVS Web Python (Simplified MVP)</h1>
         </header>
         
         <div className="app-content">
           <div className="app-layout">
             <div className="sidebar">
               <NodeLibrary onNodeAdd={handleNodeAdd} />
             </div>
             
             <div className="main-area">
               <NodeCanvas
                 nodes={nodes}
                 edges={edges}
                 onNodesChange={setNodes}
                 onEdgesChange={setEdges}
               />
             </div>
             
             <div className="code-panel">
               <CodePreview nodes={nodes} edges={edges} />
             </div>
           </div>
         </div>
       </div>
     );
   };
   ```

2. Implement essential styling
   ```css
   .app {
     display: flex;
     flex-direction: column;
     height: 100vh;
   }
   
   .app-header {
     background-color: #1a192b;
     color: white;
     padding: 10px 20px;
   }
   
   .app-content {
     flex: 1;
     padding: 20px;
     background-color: #f5f5f5;
     overflow: hidden;
   }
   
   .app-layout {
     display: flex;
     height: 100%;
     gap: 20px;
   }
   
   .sidebar {
     width: 250px;
     background-color: white;
     border-radius: 5px;
     box-shadow: 0 1px 3px rgba(0,0,0,0.1);
   }
   
   .main-area {
     flex: 1;
     background-color: white;
     border-radius: 5px;
     overflow: hidden;
     box-shadow: 0 1px 3px rgba(0,0,0,0.1);
   }
   
   .code-panel {
     width: 350px;
     background-color: white;
     border-radius: 5px;
     box-shadow: 0 1px 3px rgba(0,0,0,0.1);
   }
   ```

## Essential Function Definitions

### Math Functions
1. **Add** - Adds two numbers
2. **Subtract** - Subtracts one number from another
3. **Multiply** - Multiplies two numbers
4. **Divide** - Divides one number by another

### String Functions
1. **Concatenate** - Joins two strings
2. **Format** - Creates a formatted string with placeholders

### Control Flow
1. **If Statement** - Executes code based on a condition
2. **For Loop** - Repeats code for each item in a collection

### Input/Output
1. **Print** - Displays a value
2. **Input** - Gets user input

### Data Structures
1. **Create List** - Creates a list of items
2. **Get Item** - Retrieves an item from a list
3. **Set Item** - Changes an item in a list

## Implementation Notes

### Simplifications to Make

1. **Skip the Database**:
   - Use simple JSON files loaded via fetch instead of IndexedDB
   - Store function definitions in memory

2. **Simplified Node System**:
   - No execution flow system (relies on data connections only)
   - Simple node positioning without auto-layout
   - Basic visual styling

3. **Basic Code Generation**:
   - Generate linear code following data dependencies
   - Skip complex dependency resolution algorithms
   - Use simple string-based code generation instead of AST manipulation

4. **Minimal Validation**:
   - Basic type checking for connections
   - Skip detailed error reporting

### Testing the Implementation

1. Create the following simple test programs:
   - Calculator that adds two numbers and displays the result
   - String formatter that combines two strings
   - List processor that creates and manipulates a list

2. Verify the generated code runs correctly in Python 3.11+

## Next Steps After Initial Implementation

1. Validate the base system works before adding any additional features
2. Get user feedback on the simplified MVP
3. Prioritize the most valuable features to add next based on user needs
4. Gradually enhance the system with execution flow, more functions, and better UI 