import { generateCode, getAvailableCodeLanguages } from '../../utils/codeGenerator/index';
import { LanguageRegistry } from '../../utils/codeGenerator/languageRegistry';
import { NodeType } from '../../nodes/types';
import { SocketDirection, SocketType } from '../../sockets/types';
import { Edge, Node } from 'reactflow';
import { BaseNodeData } from '../../nodes/types';

// Make sure language registry is initialized before tests
beforeAll(() => {
  LanguageRegistry.initialize();
});

describe('Code Generator', () => {
  test('generates empty code when no nodes are present', () => {
    const nodes: Node<BaseNodeData>[] = [];
    const edges: Edge[] = [];
    
    const code = generateCode(nodes, edges, 'Python');
    
    expect(code).toContain('# No nodes in the graph');
  });
  
  test('generates code for a print node', () => {
    const printNode: Node<BaseNodeData> = {
      id: 'print-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Print Node',
        type: NodeType.PRINT,
        inputs: [
          { 
            id: 'value', 
            name: 'value', 
            type: SocketType.STRING, 
            direction: SocketDirection.INPUT,
            defaultValue: '"Hello, World!"'
          },
        ],
        outputs: [
          { 
            id: 'flow', 
            name: 'flow', 
            type: SocketType.FLOW, 
            direction: SocketDirection.OUTPUT 
          },
        ]
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [printNode];
    const edges: Edge[] = [];
    
    const code = generateCode(nodes, edges, 'Python');
    
    expect(code).toContain('print("Hello, World!")');
  });
  
  test('generates code for a variable definition node', () => {
    const varNode: Node<BaseNodeData> = {
      id: 'var-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Variable Node',
        type: NodeType.VARIABLE_DEFINITION,
        inputs: [
          { 
            id: 'name', 
            name: 'name', 
            type: SocketType.STRING, 
            direction: SocketDirection.INPUT,
            defaultValue: '"variable"'
          },
          { 
            id: 'value', 
            name: 'value', 
            type: SocketType.NUMBER, 
            direction: SocketDirection.INPUT,
            defaultValue: '0'
          }
        ],
        outputs: [
          { 
            id: 'flow', 
            name: 'flow', 
            type: SocketType.FLOW, 
            direction: SocketDirection.OUTPUT 
          },
          { 
            id: 'variable', 
            name: 'variable', 
            type: SocketType.NUMBER, 
            direction: SocketDirection.OUTPUT 
          },
        ]
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [varNode];
    const edges: Edge[] = [];
    
    const code = generateCode(nodes, edges, 'Python');
    
    expect(code).toContain('variable = 0');
  });
  
  test('generates code for an if statement node', () => {
    const ifNode: Node<BaseNodeData> = {
      id: 'if-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'If Statement',
        type: NodeType.IF_STATEMENT,
        inputs: [
          { 
            id: 'condition', 
            name: 'condition', 
            type: SocketType.BOOLEAN, 
            direction: SocketDirection.INPUT,
            defaultValue: 'true'
          }
        ],
        outputs: [
          { 
            id: 'flow', 
            name: 'flow', 
            type: SocketType.FLOW, 
            direction: SocketDirection.OUTPUT 
          },
          { 
            id: 'then', 
            name: 'then', 
            type: SocketType.FLOW, 
            direction: SocketDirection.OUTPUT 
          },
          { 
            id: 'else', 
            name: 'else', 
            type: SocketType.FLOW, 
            direction: SocketDirection.OUTPUT 
          }
        ]
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [ifNode];
    const edges: Edge[] = [];
    
    const code = generateCode(nodes, edges, 'Python');
    
    expect(code).toContain('if true:');
  });
  
  test('generates code for a for loop node', () => {
    const forNode: Node<BaseNodeData> = {
      id: 'for-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'For Loop',
        type: NodeType.FOR_LOOP,
        inputs: [
          { 
            id: 'variable', 
            name: 'variable', 
            type: SocketType.STRING, 
            direction: SocketDirection.INPUT,
            defaultValue: '"i"' 
          },
          { 
            id: 'start', 
            name: 'start', 
            type: SocketType.NUMBER, 
            direction: SocketDirection.INPUT,
            defaultValue: '0' 
          },
          { 
            id: 'end', 
            name: 'end', 
            type: SocketType.NUMBER, 
            direction: SocketDirection.INPUT,
            defaultValue: '10' 
          }
        ],
        outputs: [
          { 
            id: 'flow', 
            name: 'flow', 
            type: SocketType.FLOW, 
            direction: SocketDirection.OUTPUT 
          },
          { 
            id: 'body', 
            name: 'body', 
            type: SocketType.FLOW, 
            direction: SocketDirection.OUTPUT 
          },
          { 
            id: 'index', 
            name: 'index', 
            type: SocketType.NUMBER, 
            direction: SocketDirection.OUTPUT 
          }
        ]
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [forNode];
    const edges: Edge[] = [];
    
    const code = generateCode(nodes, edges, 'Python');
    
    expect(code).toContain('for i in range(0, 10):');
  });
  
  test('generates code with proper header', () => {
    const nodes: Node<BaseNodeData>[] = [{
      id: 'test-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Test Node',
        type: NodeType.PRINT,
        inputs: [
          { 
            id: 'value', 
            name: 'value', 
            type: SocketType.STRING, 
            direction: SocketDirection.INPUT,
            defaultValue: '"Test"' 
          }
        ],
        outputs: [
          { 
            id: 'flow', 
            name: 'flow', 
            type: SocketType.FLOW, 
            direction: SocketDirection.OUTPUT 
          }
        ]
      }
    }];
    const edges: Edge[] = [];
    
    const code = generateCode(nodes, edges, 'Python');
    
    expect(code).toContain('# Generated Python code from VVS Web');
  });
  
  // Test for multiple languages
  test('generates code in TypeScript', () => {
    const varNode: Node<BaseNodeData> = {
      id: 'var-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Variable Node',
        type: NodeType.VARIABLE_DEFINITION,
        inputs: [
          { 
            id: 'name', 
            name: 'name', 
            type: SocketType.STRING, 
            direction: SocketDirection.INPUT,
            defaultValue: '"counter"'
          },
          { 
            id: 'value', 
            name: 'value', 
            type: SocketType.NUMBER, 
            direction: SocketDirection.INPUT,
            defaultValue: '42'
          }
        ],
        outputs: [
          { 
            id: 'flow', 
            name: 'flow', 
            type: SocketType.FLOW, 
            direction: SocketDirection.OUTPUT 
          },
          { 
            id: 'variable', 
            name: 'variable', 
            type: SocketType.NUMBER, 
            direction: SocketDirection.OUTPUT 
          }
        ]
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [varNode];
    const edges: Edge[] = [];
    
    const code = generateCode(nodes, edges, 'TypeScript');
    
    expect(code).toContain('// Generated TypeScript code from VVS Web');
    expect(code).toContain('let counter = 42');
  });
  
  test('generates code in Java', () => {
    const printNode: Node<BaseNodeData> = {
      id: 'print-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Print Node',
        type: NodeType.PRINT,
        inputs: [
          { 
            id: 'value', 
            name: 'value', 
            type: SocketType.STRING, 
            direction: SocketDirection.INPUT,
            defaultValue: '"Hello Java!"'
          },
        ],
        outputs: [
          { 
            id: 'flow', 
            name: 'flow', 
            type: SocketType.FLOW, 
            direction: SocketDirection.OUTPUT 
          },
        ]
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [printNode];
    const edges: Edge[] = [];
    
    const code = generateCode(nodes, edges, 'Java');
    
    expect(code).toContain('// Generated Java code from VVS Web');
    expect(code).toContain('System.out.println("Hello Java!")');
  });
  
  // Test for the language registry
  test('language registry provides available languages', () => {
    const languages = getAvailableCodeLanguages();
    
    // Should have at least Python, TypeScript, C++, Java and Go
    expect(languages).toContain('Python');
    expect(languages).toContain('TypeScript');
    expect(languages).toContain('C++');
    expect(languages).toContain('Java');
    expect(languages).toContain('Go');
  });
});

