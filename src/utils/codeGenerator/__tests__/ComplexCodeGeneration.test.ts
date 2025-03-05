import { UniversalCodeGenerator } from '../UniversalCodeGenerator';
import { LanguageRegistry } from '../languageRegistry';
import { Node, Edge } from 'reactflow';
import { BaseNodeData, NodeType } from '../../../nodes/types';
import { SocketType, SocketDirection } from '../../../sockets/types';

describe('Complex Code Generation Tests', () => {
  // Make sure language registry is initialized
  beforeAll(() => {
    LanguageRegistry.initialize();
  });
  
  // Test complex if-else chain with nested operations
  test('generates nested if-else statements with complex conditions', () => {
    // Create nodes for the complex if-else chain
    const variableX = createVariableNode('1', 'x', '10');
    const variableY = createVariableNode('2', 'y', '20');
    
    // Create a comparison node (x > y)
    const comparison: Node<BaseNodeData> = {
      id: '3',
      type: 'default',
      position: { x: 0, y: 0 },
      data: {
        label: 'Greater Than',
        type: NodeType.GREATER_THAN,
        inputs: [
          { id: 'left', name: 'left', type: SocketType.NUMBER, direction: SocketDirection.INPUT, defaultValue: '0' },
          { id: 'right', name: 'right', type: SocketType.NUMBER, direction: SocketDirection.INPUT, defaultValue: '0' }
        ],
        outputs: [
          { id: 'result', name: 'result', type: SocketType.BOOLEAN, direction: SocketDirection.OUTPUT }
        ]
      }
    };
    
    // Create an if statement node using the comparison
    const ifNode: Node<BaseNodeData> = {
      id: '4',
      type: 'default',
      position: { x: 0, y: 0 },
      data: {
        label: 'If Statement',
        type: NodeType.IF_STATEMENT,
        inputs: [
          { id: 'condition', name: 'condition', type: SocketType.BOOLEAN, direction: SocketDirection.INPUT, defaultValue: 'true' }
        ],
        outputs: [
          { id: 'flow', name: 'flow', type: SocketType.FLOW, direction: SocketDirection.OUTPUT },
          { id: 'then', name: 'then', type: SocketType.FLOW, direction: SocketDirection.OUTPUT },
          { id: 'else', name: 'else', type: SocketType.FLOW, direction: SocketDirection.OUTPUT }
        ]
      }
    };
    
    // Create print nodes for the then and else branches
    const thenPrint: Node<BaseNodeData> = {
      id: '5',
      type: 'default',
      position: { x: 0, y: 0 },
      data: {
        label: 'Print Then',
        type: NodeType.PRINT,
        inputs: [
          { id: 'value', name: 'value', type: SocketType.STRING, direction: SocketDirection.INPUT, defaultValue: '"x is greater than y"' }
        ],
        outputs: [
          { id: 'flow', name: 'flow', type: SocketType.FLOW, direction: SocketDirection.OUTPUT }
        ]
      }
    };
    
    const elsePrint: Node<BaseNodeData> = {
      id: '6',
      type: 'default',
      position: { x: 0, y: 0 },
      data: {
        label: 'Print Else',
        type: NodeType.PRINT,
        inputs: [
          { id: 'value', name: 'value', type: SocketType.STRING, direction: SocketDirection.INPUT, defaultValue: '"y is greater than or equal to x"' }
        ],
        outputs: [
          { id: 'flow', name: 'flow', type: SocketType.FLOW, direction: SocketDirection.OUTPUT }
        ]
      }
    };
    
    // Connect everything together
    const edges: Edge[] = [
      // Connect x to comparison left
      {
        id: 'e1',
        source: '1',
        target: '3',
        sourceHandle: 'variable',
        targetHandle: 'left',
        type: 'custom'
      },
      // Connect y to comparison right
      {
        id: 'e2',
        source: '2',
        target: '3',
        sourceHandle: 'variable',
        targetHandle: 'right',
        type: 'custom'
      },
      // Connect comparison to if condition
      {
        id: 'e3',
        source: '3',
        target: '4',
        sourceHandle: 'result',
        targetHandle: 'condition',
        type: 'custom'
      },
      // Connect variable x flow to if flow
      {
        id: 'e4',
        source: '1',
        target: '4',
        sourceHandle: 'flow',
        targetHandle: 'flow',
        type: 'custom'
      },
      // Connect if then to then print
      {
        id: 'e5',
        source: '4',
        target: '5',
        sourceHandle: 'then',
        targetHandle: 'flow',
        type: 'custom'
      },
      // Connect if else to else print
      {
        id: 'e6',
        source: '4',
        target: '6',
        sourceHandle: 'else',
        targetHandle: 'flow',
        type: 'custom'
      }
    ];
    
    const nodes = [variableX, variableY, comparison, ifNode, thenPrint, elsePrint];
    
    // Test Python code generation
    const pythonConfig = LanguageRegistry.getConfigWithFallback('python');
    const pythonGenerator = new UniversalCodeGenerator(nodes, edges, pythonConfig);
    const pythonCode = pythonGenerator.generate();
    
    expect(pythonCode).toContain('x = 10');
    expect(pythonCode).toContain('y = 20');
    expect(pythonCode).toContain('if x > y:');
    expect(pythonCode).toContain('print("x is greater than y")');
    expect(pythonCode).toContain('else:');
    expect(pythonCode).toContain('print("y is greater than or equal to x")');
    
    // Test Java code generation
    const javaConfig = LanguageRegistry.getConfigWithFallback('java');
    const javaGenerator = new UniversalCodeGenerator(nodes, edges, javaConfig);
    const javaCode = javaGenerator.generate();
    
    expect(javaCode).toContain('int x = 10');
    expect(javaCode).toContain('int y = 20');
    expect(javaCode).toContain('if (x > y) {');
    expect(javaCode).toContain('System.out.println("x is greater than y")');
    expect(javaCode).toContain('} else {');
    expect(javaCode).toContain('System.out.println("y is greater than or equal to x")');
  });
  
  // Test for loop with nested operations
  test('generates for loops with nested operations', () => {
    // Create a for loop node
    const forLoop: Node<BaseNodeData> = {
      id: '1',
      type: 'default',
      position: { x: 0, y: 0 },
      data: {
        label: 'For Loop',
        type: NodeType.FOR_LOOP,
        inputs: [
          { id: 'start', name: 'start', type: SocketType.NUMBER, direction: SocketDirection.INPUT, defaultValue: '0' },
          { id: 'end', name: 'end', type: SocketType.NUMBER, direction: SocketDirection.INPUT, defaultValue: '5' },
          { id: 'variable', name: 'variable', type: SocketType.STRING, direction: SocketDirection.INPUT, defaultValue: '"i"' }
        ],
        outputs: [
          { id: 'flow', name: 'flow', type: SocketType.FLOW, direction: SocketDirection.OUTPUT },
          { id: 'body', name: 'body', type: SocketType.FLOW, direction: SocketDirection.OUTPUT },
          { id: 'index', name: 'index', type: SocketType.NUMBER, direction: SocketDirection.OUTPUT }
        ]
      }
    };
    
    // Create a print node inside the loop body
    const printNode: Node<BaseNodeData> = {
      id: '2',
      type: 'default',
      position: { x: 0, y: 0 },
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
    
    // Connect loop body to print
    const edge: Edge = {
      id: 'e1',
      source: '1',
      target: '2',
      sourceHandle: 'body',
      targetHandle: 'flow',
      type: 'custom'
    };
    
    // Connect loop index to print value
    const dataEdge: Edge = {
      id: 'e2',
      source: '1',
      target: '2',
      sourceHandle: 'index',
      targetHandle: 'value',
      type: 'custom'
    };
    
    const nodes = [forLoop, printNode];
    const edges = [edge, dataEdge];
    
    // Test Python code generation
    const pythonConfig = LanguageRegistry.getConfigWithFallback('python');
    const pythonGenerator = new UniversalCodeGenerator(nodes, edges, pythonConfig);
    const pythonCode = pythonGenerator.generate();
    
    expect(pythonCode).toContain('for i in range(0, 5):');
    expect(pythonCode).toContain('print("Default")');
    
    // Test TypeScript code generation
    const tsConfig = LanguageRegistry.getConfigWithFallback('typescript');
    const tsGenerator = new UniversalCodeGenerator(nodes, edges, tsConfig);
    const tsCode = tsGenerator.generate();
    
    expect(tsCode).toContain('for (let i = 0; i < 5; i++)');
    expect(tsCode).toContain('console.log("Default")');
    
    // Test Go code generation
    const goConfig = LanguageRegistry.getConfigWithFallback('go');
    const goGenerator = new UniversalCodeGenerator(nodes, edges, goConfig);
    const goCode = goGenerator.generate();
    
    expect(goCode).toContain('for i := 0; i < 5; i++ {');
    expect(goCode).toContain('fmt.Println("Default")');
  });
  
  // Test a complex data flow with multiple operations
  test('handles complex data flow with multiple operations', () => {
    // Create variables a, b, c
    const varA = createVariableNode('1', 'a', '5');
    const varB = createVariableNode('2', 'b', '10');
    
    // Create math operations: a + b
    const addNode: Node<BaseNodeData> = {
      id: '3',
      type: 'default',
      position: { x: 0, y: 0 },
      data: {
        label: 'Add',
        type: NodeType.ADD,
        inputs: [
          { id: 'left', name: 'left', type: SocketType.NUMBER, direction: SocketDirection.INPUT, defaultValue: '0' },
          { id: 'right', name: 'right', type: SocketType.NUMBER, direction: SocketDirection.INPUT, defaultValue: '0' }
        ],
        outputs: [
          { id: 'result', name: 'result', type: SocketType.NUMBER, direction: SocketDirection.OUTPUT }
        ]
      }
    };
    
    // Create variable to store the result: sum = a + b
    const sumVar: Node<BaseNodeData> = {
      id: '4',
      type: 'default',
      position: { x: 0, y: 0 },
      data: {
        label: 'Variable Sum',
        type: NodeType.VARIABLE_DEFINITION,
        inputs: [
          { id: 'name', name: 'name', type: SocketType.STRING, direction: SocketDirection.INPUT, defaultValue: '"sum"' },
          { id: 'value', name: 'value', type: SocketType.NUMBER, direction: SocketDirection.INPUT, defaultValue: '0' }
        ],
        outputs: [
          { id: 'flow', name: 'flow', type: SocketType.FLOW, direction: SocketDirection.OUTPUT },
          { id: 'variable', name: 'variable', type: SocketType.NUMBER, direction: SocketDirection.OUTPUT }
        ]
      }
    };
    
    // Create print node to output the result
    const printNode: Node<BaseNodeData> = {
      id: '5',
      type: 'default',
      position: { x: 0, y: 0 },
      data: {
        label: 'Print',
        type: NodeType.PRINT,
        inputs: [
          { id: 'value', name: 'value', type: SocketType.STRING, direction: SocketDirection.INPUT, defaultValue: '"The result is: "' }
        ],
        outputs: [
          { id: 'flow', name: 'flow', type: SocketType.FLOW, direction: SocketDirection.OUTPUT }
        ]
      }
    };
    
    // Connect everything
    const edges: Edge[] = [
      // Connect a to add left
      {
        id: 'e1',
        source: '1',
        target: '3',
        sourceHandle: 'variable',
        targetHandle: 'left',
        type: 'custom'
      },
      // Connect b to add right
      {
        id: 'e2',
        source: '2',
        target: '3',
        sourceHandle: 'variable',
        targetHandle: 'right',
        type: 'custom'
      },
      // Connect add result to sum value
      {
        id: 'e3',
        source: '3',
        target: '4',
        sourceHandle: 'result',
        targetHandle: 'value',
        type: 'custom'
      },
      // Connect a flow to b flow
      {
        id: 'e4',
        source: '1',
        target: '2',
        sourceHandle: 'flow',
        targetHandle: 'flow',
        type: 'custom'
      },
      // Connect b flow to sum flow
      {
        id: 'e5',
        source: '2',
        target: '4',
        sourceHandle: 'flow',
        targetHandle: 'flow',
        type: 'custom'
      },
      // Connect sum flow to print flow
      {
        id: 'e6',
        source: '4',
        target: '5',
        sourceHandle: 'flow',
        targetHandle: 'flow',
        type: 'custom'
      },
      // Connect sum variable to print value
      {
        id: 'e7',
        source: '4',
        target: '5',
        sourceHandle: 'variable',
        targetHandle: 'value',
        type: 'custom'
      }
    ];
    
    const nodes = [varA, varB, addNode, sumVar, printNode];
    
    // Test Python code generation
    const pythonConfig = LanguageRegistry.getConfigWithFallback('python');
    const pythonGenerator = new UniversalCodeGenerator(nodes, edges, pythonConfig);
    const pythonCode = pythonGenerator.generate();
    
    expect(pythonCode).toContain('a = 5');
    expect(pythonCode).toContain('b = 10');
    expect(pythonCode).toContain('sum = a + b');
    expect(pythonCode).toContain('print(sum)');
    
    // Test Java code generation
    const javaConfig = LanguageRegistry.getConfigWithFallback('java');
    const javaGenerator = new UniversalCodeGenerator(nodes, edges, javaConfig);
    const javaCode = javaGenerator.generate();
    
    expect(javaCode).toContain('int a = 5');
    expect(javaCode).toContain('int b = 10');
    expect(javaCode).toContain('Object sum = a + b');
    expect(javaCode).toContain('System.out.println(sum)');
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