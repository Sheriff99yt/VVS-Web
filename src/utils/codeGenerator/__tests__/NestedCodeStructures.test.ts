import { UniversalCodeGenerator } from '../UniversalCodeGenerator';
import { LanguageRegistry } from '../languageRegistry';
import { Node, Edge } from 'reactflow';
import { BaseNodeData, NodeType } from '../../../nodes/types';
import { SocketType, SocketDirection } from '../../../sockets/types';

/**
 * Tests for deeply nested code structures to verify proper indentation and block handling
 */
describe('Nested Code Structures', () => {
  // Make sure language registry is initialized
  beforeAll(() => {
    LanguageRegistry.initialize();
  });

  // Helper to create a variable definition node
  const createVariableNode = (id: string, name: string, value: string): Node<BaseNodeData> => {
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
          { id: 'value', name: 'value', type: SocketType.ANY, direction: SocketDirection.OUTPUT }
        ]
      }
    };
  };

  // Helper to create a print node
  const createPrintNode = (id: string, defaultValue: string): Node<BaseNodeData> => {
    return {
      id,
      type: 'default',
      position: { x: 0, y: 0 },
      data: {
        label: 'Print',
        type: NodeType.PRINT,
        inputs: [
          { id: 'value', name: 'value', type: SocketType.STRING, direction: SocketDirection.INPUT, defaultValue }
        ],
        outputs: [
          { id: 'flow', name: 'flow', type: SocketType.FLOW, direction: SocketDirection.OUTPUT }
        ]
      }
    };
  };

  /**
   * Test deeply nested if statements within a for loop
   * Structure:
   * For Loop
   *   └─ If Statement
   *       ├─ Then: Print "x is positive"
   *       └─ Else: If Statement
   *           ├─ Then: Print "x is zero"
   *           └─ Else: Print "x is negative"
   */
  test('generates properly nested if statements within for loops', () => {
    // Create nodes
    const forLoop: Node<BaseNodeData> = {
      id: '1',
      type: 'default',
      position: { x: 0, y: 0 },
      data: {
        label: 'For Loop',
        type: NodeType.FOR_LOOP,
        inputs: [
          { id: 'variable', name: 'variable', type: SocketType.STRING, direction: SocketDirection.INPUT, defaultValue: '"i"' },
          { id: 'start', name: 'start', type: SocketType.NUMBER, direction: SocketDirection.INPUT, defaultValue: '-1' },
          { id: 'end', name: 'end', type: SocketType.NUMBER, direction: SocketDirection.INPUT, defaultValue: '2' }
        ],
        outputs: [
          { id: 'flow', name: 'flow', type: SocketType.FLOW, direction: SocketDirection.OUTPUT },
          { id: 'body', name: 'body', type: SocketType.FLOW, direction: SocketDirection.OUTPUT },
          { id: 'index', name: 'index', type: SocketType.NUMBER, direction: SocketDirection.OUTPUT }
        ]
      }
    };

    // First if statement (checks if i > 0)
    const outerIf: Node<BaseNodeData> = {
      id: '2',
      type: 'default',
      position: { x: 0, y: 0 },
      data: {
        label: 'If Statement',
        type: NodeType.IF_STATEMENT,
        inputs: [
          { id: 'condition', name: 'condition', type: SocketType.BOOLEAN, direction: SocketDirection.INPUT, defaultValue: 'i > 0' }
        ],
        outputs: [
          { id: 'flow', name: 'flow', type: SocketType.FLOW, direction: SocketDirection.OUTPUT },
          { id: 'then', name: 'then', type: SocketType.FLOW, direction: SocketDirection.OUTPUT },
          { id: 'else', name: 'else', type: SocketType.FLOW, direction: SocketDirection.OUTPUT }
        ]
      }
    };

    // Second if statement (checks if i == 0)
    const innerIf: Node<BaseNodeData> = {
      id: '3',
      type: 'default',
      position: { x: 0, y: 0 },
      data: {
        label: 'If Statement',
        type: NodeType.IF_STATEMENT,
        inputs: [
          { id: 'condition', name: 'condition', type: SocketType.BOOLEAN, direction: SocketDirection.INPUT, defaultValue: 'i == 0' }
        ],
        outputs: [
          { id: 'flow', name: 'flow', type: SocketType.FLOW, direction: SocketDirection.OUTPUT },
          { id: 'then', name: 'then', type: SocketType.FLOW, direction: SocketDirection.OUTPUT },
          { id: 'else', name: 'else', type: SocketType.FLOW, direction: SocketDirection.OUTPUT }
        ]
      }
    };

    // Print node for positive case
    const printPositive = createPrintNode('4', '"i is positive"');
    // Print node for zero case
    const printZero = createPrintNode('5', '"i is zero"');
    // Print node for negative case
    const printNegative = createPrintNode('6', '"i is negative"');

    // Edges
    const edges: Edge[] = [
      // Connect for loop body to outer if
      { id: 'e1', source: '1', target: '2', sourceHandle: 'body', targetHandle: 'flow', type: 'custom' },
      // Connect outer if then branch to print positive
      { id: 'e2', source: '2', target: '4', sourceHandle: 'then', targetHandle: 'flow', type: 'custom' },
      // Connect outer if else branch to inner if
      { id: 'e3', source: '2', target: '3', sourceHandle: 'else', targetHandle: 'flow', type: 'custom' },
      // Connect inner if then branch to print zero
      { id: 'e4', source: '3', target: '5', sourceHandle: 'then', targetHandle: 'flow', type: 'custom' },
      // Connect inner if else branch to print negative
      { id: 'e5', source: '3', target: '6', sourceHandle: 'else', targetHandle: 'flow', type: 'custom' }
    ];

    const nodes = [forLoop, outerIf, innerIf, printPositive, printZero, printNegative];

    // Test Python code generation
    const pythonConfig = LanguageRegistry.getConfigWithFallback('python');
    const pythonGenerator = new UniversalCodeGenerator(nodes, edges, pythonConfig);
    const pythonCode = pythonGenerator.generate();

    expect(pythonCode).toContain('for i in range(-1, 2):');
    expect(pythonCode).toContain('if i > 0:');
    expect(pythonCode).toContain('print("i is positive")');
    expect(pythonCode).toContain('else:');
    expect(pythonCode).toContain('if i == 0:');
    expect(pythonCode).toContain('print("i is zero")');
    expect(pythonCode).toContain('else:');
    expect(pythonCode).toContain('print("i is negative")');

    // Verify proper indentation for Python (space-based)
    expect(pythonCode).toMatch(/for i in range\(-1, 2\):\n\s{4}if i > 0:/);
    expect(pythonCode).toMatch(/if i > 0:\n\s{8}print\("i is positive"\)/);
    expect(pythonCode).toMatch(/else:\n\s{8}if i == 0:/);
    expect(pythonCode).toMatch(/if i == 0:\n\s{12}print\("i is zero"\)/);
    expect(pythonCode).toMatch(/else:\n\s{12}print\("i is negative"\)/);

    // Test TypeScript code generation
    const tsConfig = LanguageRegistry.getConfigWithFallback('typescript');
    const tsGenerator = new UniversalCodeGenerator(nodes, edges, tsConfig);
    const tsCode = tsGenerator.generate();

    expect(tsCode).toContain('for (let i = -1; i < 2; i++)');
    expect(tsCode).toContain('if (i > 0)');
    expect(tsCode).toContain('console.log("i is positive")');
    expect(tsCode).toContain('else');
    expect(tsCode).toContain('if (i == 0)');
    expect(tsCode).toContain('console.log("i is zero")');
    expect(tsCode).toContain('else');
    expect(tsCode).toContain('console.log("i is negative")');

    // Verify block structure for TypeScript (brace-based)
    expect(tsCode).toContain('for (let i = -1; i < 2; i++) {');
    expect(tsCode).toContain('if (i > 0) {');
    expect(tsCode).toContain('} else {');
    expect(tsCode).toContain('if (i == 0) {');
  });

  /**
   * Test conditional structures with nested control flow
   * This simulates a function-like behavior with nested control flow
   * Structure:
   * Variable Definition (funcName)
   *   └─ For Loop
   *       └─ If Statement
   *           ├─ Then: Print "Value is even"
   *           └─ Else: Print "Value is odd"
   */
  test('generates nested control structures with complex flow', () => {
    // Create function name variable (to simulate a function definition)
    const funcNameVar = createVariableNode('1', 'processValues', '"function"');

    // Create for loop inside function
    const forLoop: Node<BaseNodeData> = {
      id: '2',
      type: 'default',
      position: { x: 0, y: 0 },
      data: {
        label: 'For Loop',
        type: NodeType.FOR_LOOP,
        inputs: [
          { id: 'variable', name: 'variable', type: SocketType.STRING, direction: SocketDirection.INPUT, defaultValue: '"value"' },
          { id: 'start', name: 'start', type: SocketType.NUMBER, direction: SocketDirection.INPUT, defaultValue: '1' },
          { id: 'end', name: 'end', type: SocketType.NUMBER, direction: SocketDirection.INPUT, defaultValue: '10' }
        ],
        outputs: [
          { id: 'flow', name: 'flow', type: SocketType.FLOW, direction: SocketDirection.OUTPUT },
          { id: 'body', name: 'body', type: SocketType.FLOW, direction: SocketDirection.OUTPUT },
          { id: 'index', name: 'index', type: SocketType.NUMBER, direction: SocketDirection.OUTPUT }
        ]
      }
    };

    // Create if statement inside loop
    const ifNode: Node<BaseNodeData> = {
      id: '3',
      type: 'default',
      position: { x: 0, y: 0 },
      data: {
        label: 'If Statement',
        type: NodeType.IF_STATEMENT,
        inputs: [
          { id: 'condition', name: 'condition', type: SocketType.BOOLEAN, direction: SocketDirection.INPUT, defaultValue: 'value % 2 == 0' }
        ],
        outputs: [
          { id: 'flow', name: 'flow', type: SocketType.FLOW, direction: SocketDirection.OUTPUT },
          { id: 'then', name: 'then', type: SocketType.FLOW, direction: SocketDirection.OUTPUT },
          { id: 'else', name: 'else', type: SocketType.FLOW, direction: SocketDirection.OUTPUT }
        ]
      }
    };

    // Print nodes for even and odd cases
    const printEven = createPrintNode('4', '"Value is even: " + value');
    const printOdd = createPrintNode('5', '"Value is odd: " + value');

    // Main program print
    const mainPrint = createPrintNode('6', '"Processing complete"');

    // Connect everything
    const edges: Edge[] = [
      // Connect variable to for loop
      { id: 'e1', source: '1', target: '2', sourceHandle: 'flow', targetHandle: 'flow', type: 'custom' },
      // Connect loop body to if statement
      { id: 'e2', source: '2', target: '3', sourceHandle: 'body', targetHandle: 'flow', type: 'custom' },
      // Connect if then branch to print even
      { id: 'e3', source: '3', target: '4', sourceHandle: 'then', targetHandle: 'flow', type: 'custom' },
      // Connect if else branch to print odd
      { id: 'e4', source: '3', target: '5', sourceHandle: 'else', targetHandle: 'flow', type: 'custom' },
      // Connect for loop to main print
      { id: 'e5', source: '2', target: '6', sourceHandle: 'flow', targetHandle: 'flow', type: 'custom' }
    ];

    const nodes = [funcNameVar, forLoop, ifNode, printEven, printOdd, mainPrint];

    // Test Python code generation
    const pythonConfig = LanguageRegistry.getConfigWithFallback('python');
    const pythonGenerator = new UniversalCodeGenerator(nodes, edges, pythonConfig);
    const pythonCode = pythonGenerator.generate();

    // The variable will be generated first
    expect(pythonCode).toContain('processValues = "function"');
    
    // Then the for loop and nested structures
    expect(pythonCode).toContain('for value in range(1, 10):');
    expect(pythonCode).toContain('if value % 2 == 0:');
    expect(pythonCode).toContain('print("Value is even: " + value)');
    expect(pythonCode).toContain('else:');
    expect(pythonCode).toContain('print("Value is odd: " + value)');
    expect(pythonCode).toContain('print("Processing complete")');

    // Verify indentation for the nested structure
    expect(pythonCode).toMatch(/for value in range\(1, 10\):\n\s{4}if value % 2 == 0:/);

    // Test TypeScript code generation
    const tsConfig = LanguageRegistry.getConfigWithFallback('typescript');
    const tsGenerator = new UniversalCodeGenerator(nodes, edges, tsConfig);
    const tsCode = tsGenerator.generate();

    // The variable will be generated first
    expect(tsCode).toContain('let processValues = "function"');
    
    // Then the for loop and nested structures
    expect(tsCode).toContain('for (let value = 1; value < 10; value++)');
    expect(tsCode).toContain('if (value % 2 == 0)');
    expect(tsCode).toContain('console.log("Value is even: " + value)');
    expect(tsCode).toContain('else');
    expect(tsCode).toContain('console.log("Value is odd: " + value)');
    expect(tsCode).toContain('console.log("Processing complete")');

    // Verify block structure for TypeScript
    expect(tsCode).toContain('for (let value = 1; value < 10; value++) {');
    expect(tsCode).toContain('if (value % 2 == 0) {');
  });
}); 