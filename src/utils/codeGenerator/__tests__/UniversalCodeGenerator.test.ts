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
          { id: 'name', name: 'name', type: SocketType.STRING, direction: SocketDirection.INPUT, defaultValue: 'myVar' },
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
    
    expect(pythonCode).toContain('myVar = 42');
    
    // Test TypeScript code generation
    const tsConfig = LanguageRegistry.getConfigWithFallback('typescript');
    const tsGenerator = new UniversalCodeGenerator(nodes, edges, tsConfig);
    const tsCode = tsGenerator.generate();
    
    expect(tsCode).toContain('let myVar = 42');
    
    // Test Java code generation
    const javaConfig = LanguageRegistry.getConfigWithFallback('java');
    const javaGenerator = new UniversalCodeGenerator(nodes, edges, javaConfig);
    const javaCode = javaGenerator.generate();
    
    expect(javaCode).toContain('int myVar = 42');
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
}); 