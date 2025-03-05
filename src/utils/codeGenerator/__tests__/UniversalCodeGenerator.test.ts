import { UniversalCodeGenerator } from '../UniversalCodeGenerator';
import { LanguageRegistry } from '../languageRegistry';
import { Node, Edge } from 'reactflow';
import { BaseNodeData, NodeType } from '../../../nodes/types';
import { SocketType, SocketDirection } from '../../../sockets/types';

describe('UniversalCodeGenerator', () => {
  // Make sure language registry is initialized
  beforeAll(() => {
    LanguageRegistry.initialize();
  });
  
  // Test empty graph
  test('generates a comment for empty graph', () => {
    const nodes: Node<BaseNodeData>[] = [];
    const edges: Edge[] = [];
    
    const pythonConfig = LanguageRegistry.getConfigWithFallback('python');
    const generator = new UniversalCodeGenerator(nodes, edges, pythonConfig);
    const code = generator.generate();
    
    expect(code).toContain('No nodes in the graph');
  });
  
  // Test simple variable definition in multiple languages
  test('generates variable definition in multiple languages', () => {
    // Create a simple node for variable definition
    const node: Node<BaseNodeData> = {
      id: '1',
      type: 'default',
      position: { x: 0, y: 0 },
      data: {
        label: 'Variable Definition',
        type: NodeType.VARIABLE_DEFINITION,
        inputs: [
          { id: 'name', name: 'name', type: SocketType.STRING, direction: SocketDirection.INPUT, defaultValue: '"myVar"' },
          { id: 'value', name: 'value', type: SocketType.NUMBER, direction: SocketDirection.INPUT, defaultValue: '42' }
        ],
        outputs: [
          { id: 'flow', name: 'flow', type: SocketType.FLOW, direction: SocketDirection.OUTPUT },
          { id: 'variable', name: 'variable', type: SocketType.NUMBER, direction: SocketDirection.OUTPUT }
        ]
      }
    };
    
    const nodes = [node];
    const edges: Edge[] = [];
    
    // Test Python code generation
    const pythonConfig = LanguageRegistry.getConfigWithFallback('python');
    const pythonGenerator = new UniversalCodeGenerator(nodes, edges, pythonConfig);
    const pythonCode = pythonGenerator.generate();
    
    // Verify the variable name has no quotes and is defined correctly
    expect(pythonCode).toContain('myVar = 42');
    expect(pythonCode).not.toContain('"myVar"');
    
    // Test TypeScript code generation
    const tsConfig = LanguageRegistry.getConfigWithFallback('typescript');
    const tsGenerator = new UniversalCodeGenerator(nodes, edges, tsConfig);
    const tsCode = tsGenerator.generate();
    
    expect(tsCode).toContain('let myVar = 42');
    expect(tsCode).not.toContain('"myVar"');
    
    // Test Java code generation
    const javaConfig = LanguageRegistry.getConfigWithFallback('java');
    const javaGenerator = new UniversalCodeGenerator(nodes, edges, javaConfig);
    const javaCode = javaGenerator.generate();
    
    expect(javaCode).toContain('int myVar = 42');
    expect(javaCode).not.toContain('"myVar"');
    
    // Test C++ code generation
    const cppConfig = LanguageRegistry.getConfigWithFallback('c++');
    const cppGenerator = new UniversalCodeGenerator(nodes, edges, cppConfig);
    const cppCode = cppGenerator.generate();
    
    expect(cppCode).toContain('int myVar = 42');
    expect(cppCode).not.toContain('"myVar"');
    
    // Test Go code generation
    const goConfig = LanguageRegistry.getConfigWithFallback('go');
    const goGenerator = new UniversalCodeGenerator(nodes, edges, goConfig);
    const goCode = goGenerator.generate();
    
    expect(goCode).toContain('myVar := 42');
    expect(goCode).not.toContain('"myVar"');
  });
  
  // Test different variable types (string, number, boolean)
  test('correctly infers types for different variable values', () => {
    // Create nodes for different variable types
    const stringNode: Node<BaseNodeData> = createVariableNode('1', 'strVar', '"hello"');
    const numberNode: Node<BaseNodeData> = createVariableNode('2', 'numVar', '42.5');
    const booleanNode: Node<BaseNodeData> = createVariableNode('3', 'boolVar', 'true');
    
    const nodes = [stringNode, numberNode, booleanNode];
    const edges: Edge[] = [];
    
    // Test Java code generation which requires correct type inference
    const javaConfig = LanguageRegistry.getConfigWithFallback('java');
    const javaGenerator = new UniversalCodeGenerator(nodes, edges, javaConfig);
    const javaCode = javaGenerator.generate();
    
    expect(javaCode).toContain('String strVar = "hello"');
    expect(javaCode).toContain('double numVar = 42.5');
    expect(javaCode).toContain('boolean boolVar = true');
    
    // Test C++ code generation
    const cppConfig = LanguageRegistry.getConfigWithFallback('c++');
    const cppGenerator = new UniversalCodeGenerator(nodes, edges, cppConfig);
    const cppCode = cppGenerator.generate();
    
    expect(cppCode).toContain('std::string strVar = "hello"');
    expect(cppCode).toContain('double numVar = 42.5');
    expect(cppCode).toContain('bool boolVar = true');
  });
  
  // Test if statement generation
  test('generates if statements correctly', () => {
    // Create an if statement node
    const ifNode: Node<BaseNodeData> = {
      id: '1',
      type: 'default',
      position: { x: 0, y: 0 },
      data: {
        label: 'If Statement',
        type: NodeType.IF_STATEMENT,
        inputs: [
          { id: 'condition', name: 'condition', type: SocketType.BOOLEAN, direction: SocketDirection.INPUT, defaultValue: 'x > 10' }
        ],
        outputs: [
          { id: 'flow', name: 'flow', type: SocketType.FLOW, direction: SocketDirection.OUTPUT },
          { id: 'then', name: 'then', type: SocketType.FLOW, direction: SocketDirection.OUTPUT },
          { id: 'else', name: 'else', type: SocketType.FLOW, direction: SocketDirection.OUTPUT }
        ]
      }
    };
    
    const nodes = [ifNode];
    const edges: Edge[] = [];
    
    // Test Python if statement
    const pythonConfig = LanguageRegistry.getConfigWithFallback('python');
    const pythonGenerator = new UniversalCodeGenerator(nodes, edges, pythonConfig);
    const pythonCode = pythonGenerator.generate();
    
    expect(pythonCode).toContain('if x > 10:');
    
    // Test TypeScript if statement
    const tsConfig = LanguageRegistry.getConfigWithFallback('typescript');
    const tsGenerator = new UniversalCodeGenerator(nodes, edges, tsConfig);
    const tsCode = tsGenerator.generate();
    
    expect(tsCode).toContain('if (x > 10) {');
    
    // Test Java if statement
    const javaConfig = LanguageRegistry.getConfigWithFallback('java');
    const javaGenerator = new UniversalCodeGenerator(nodes, edges, javaConfig);
    const javaCode = javaGenerator.generate();
    
    expect(javaCode).toContain('if (x > 10) {');
    
    // Test Go if statement
    const goConfig = LanguageRegistry.getConfigWithFallback('go');
    const goGenerator = new UniversalCodeGenerator(nodes, edges, goConfig);
    const goCode = goGenerator.generate();
    
    expect(goCode).toContain('if x > 10 {');
  });
  
  // Test print statement generation
  test('generates print statements correctly', () => {
    // Create a print node
    const printNode: Node<BaseNodeData> = {
      id: '1',
      type: 'default',
      position: { x: 0, y: 0 },
      data: {
        label: 'Print',
        type: NodeType.PRINT,
        inputs: [
          { id: 'value', name: 'value', type: SocketType.STRING, direction: SocketDirection.INPUT, defaultValue: '"Hello, World!"' }
        ],
        outputs: [
          { id: 'flow', name: 'flow', type: SocketType.FLOW, direction: SocketDirection.OUTPUT }
        ]
      }
    };
    
    const nodes = [printNode];
    const edges: Edge[] = [];
    
    // Test Python print
    const pythonConfig = LanguageRegistry.getConfigWithFallback('python');
    const pythonGenerator = new UniversalCodeGenerator(nodes, edges, pythonConfig);
    const pythonCode = pythonGenerator.generate();
    
    expect(pythonCode).toContain('print("Hello, World!")');
    
    // Test TypeScript print
    const tsConfig = LanguageRegistry.getConfigWithFallback('typescript');
    const tsGenerator = new UniversalCodeGenerator(nodes, edges, tsConfig);
    const tsCode = tsGenerator.generate();
    
    expect(tsCode).toContain('console.log("Hello, World!")');
    
    // Test Java print
    const javaConfig = LanguageRegistry.getConfigWithFallback('java');
    const javaGenerator = new UniversalCodeGenerator(nodes, edges, javaConfig);
    const javaCode = javaGenerator.generate();
    
    expect(javaCode).toContain('System.out.println("Hello, World!")');
    
    // Test Go print
    const goConfig = LanguageRegistry.getConfigWithFallback('go');
    const goGenerator = new UniversalCodeGenerator(nodes, edges, goConfig);
    const goCode = goGenerator.generate();
    
    expect(goCode).toContain('fmt.Println("Hello, World!")');
  });
  
  // Test user input handling for different languages
  test('handles user input correctly in different languages', () => {
    // Create an input node
    const inputNode: Node<BaseNodeData> = {
      id: '1',
      type: 'default',
      position: { x: 0, y: 0 },
      data: {
        label: 'User Input',
        type: NodeType.USER_INPUT,
        inputs: [
          { id: 'prompt', name: 'prompt', type: SocketType.STRING, direction: SocketDirection.INPUT, defaultValue: '"Enter a value: "' }
        ],
        outputs: [
          { id: 'flow', name: 'flow', type: SocketType.FLOW, direction: SocketDirection.OUTPUT },
          { id: 'value', name: 'value', type: SocketType.STRING, direction: SocketDirection.OUTPUT }
        ],
        properties: {
          variableName: 'userInput'
        }
      }
    };
    
    const nodes = [inputNode];
    const edges: Edge[] = [];
    
    // Test Python input
    const pythonConfig = LanguageRegistry.getConfigWithFallback('python');
    const pythonGenerator = new UniversalCodeGenerator(nodes, edges, pythonConfig);
    const pythonCode = pythonGenerator.generate();
    
    expect(pythonCode).toContain('userInput = input("Enter a value: ")');
    
    // Test Java input
    const javaConfig = LanguageRegistry.getConfigWithFallback('java');
    const javaGenerator = new UniversalCodeGenerator(nodes, edges, javaConfig);
    const javaCode = javaGenerator.generate();
    
    expect(javaCode).toContain('System.out.print("Enter a value: ")');
    expect(javaCode).toContain('String userInput = scanner.nextLine()');
    
    // Test Go input
    const goConfig = LanguageRegistry.getConfigWithFallback('go');
    const goGenerator = new UniversalCodeGenerator(nodes, edges, goConfig);
    const goCode = goGenerator.generate();
    
    expect(goCode).toContain('fmt.Print("Enter a value: ")');
    expect(goCode).toContain('userInput, _ := reader.ReadString(');
  });
  
  // Test complex graph with connected nodes
  test('generates code for connected nodes correctly', () => {
    // Create variable definition and print nodes
    const varNode: Node<BaseNodeData> = createVariableNode('1', 'message', '"Testing connected nodes"');
    const printNode: Node<BaseNodeData> = {
      id: '2',
      type: 'default',
      position: { x: 0, y: 100 },
      data: {
        label: 'Print',
        type: NodeType.PRINT,
        inputs: [
          { id: 'value', name: 'value', type: SocketType.STRING, direction: SocketDirection.INPUT, defaultValue: '"Default"' }
        ],
        outputs: [
          { id: 'flow', name: 'flow', type: SocketType.FLOW, direction: SocketDirection.OUTPUT }
        ]
      }
    };
    
    // Create edges connecting the nodes
    const flowEdge: Edge = {
      id: 'e1',
      source: '1',
      target: '2',
      sourceHandle: 'flow',
      targetHandle: 'flow',
      type: 'custom'
    };
    
    const dataEdge: Edge = {
      id: 'e2',
      source: '1',
      target: '2',
      sourceHandle: 'variable',
      targetHandle: 'value',
      type: 'custom'
    };
    
    const nodes = [varNode, printNode];
    const edges = [flowEdge, dataEdge];
    
    // Test Python connected nodes
    const pythonConfig = LanguageRegistry.getConfigWithFallback('python');
    const pythonGenerator = new UniversalCodeGenerator(nodes, edges, pythonConfig);
    const pythonCode = pythonGenerator.generate();
    
    expect(pythonCode).toContain('message = "Testing connected nodes"');
    expect(pythonCode).toContain('print(message)');
    
    // Test TypeScript connected nodes
    const tsConfig = LanguageRegistry.getConfigWithFallback('typescript');
    const tsGenerator = new UniversalCodeGenerator(nodes, edges, tsConfig);
    const tsCode = tsGenerator.generate();
    
    expect(tsCode).toContain('let message = "Testing connected nodes"');
    expect(tsCode).toContain('console.log(message)');
  });
});

// Helper function to create a variable definition node
function createVariableNode(id: string, name: string, value: string): Node<BaseNodeData> {
  return {
    id,
    type: 'default',
    position: { x: 0, y: 0 },
    data: {
      label: 'Variable Definition',
      type: NodeType.VARIABLE_DEFINITION,
      inputs: [
        { id: 'name', name: 'name', type: SocketType.STRING, direction: SocketDirection.INPUT, defaultValue: `"${name}"` },
        { id: 'value', name: 'value', type: SocketType.ANY, direction: SocketDirection.INPUT, defaultValue: value }
      ],
      outputs: [
        { id: 'flow', name: 'flow', type: SocketType.FLOW, direction: SocketDirection.OUTPUT },
        { id: 'variable', name: 'variable', type: SocketType.ANY, direction: SocketDirection.OUTPUT }
      ]
    }
  };
} 