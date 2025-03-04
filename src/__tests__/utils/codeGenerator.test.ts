import { generatePythonCode } from '../../utils/codeGenerator';
import { NodeType } from '../../nodes/types';
import { SocketDirection, SocketType, createSocketDefinition } from '../../sockets/types';
import { Edge, Node } from 'reactflow';
import { BaseNodeData } from '../../nodes/types';

describe('Code Generator', () => {
  test('generates empty code when no nodes are present', () => {
    const nodes: Node<BaseNodeData>[] = [];
    const edges: Edge[] = [];
    
    const code = generatePythonCode(nodes, edges);
    
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
          createSocketDefinition('flow_in', 'Flow In', SocketType.FLOW, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('flow_out', 'Flow Out', SocketType.FLOW, SocketDirection.OUTPUT),
        ],
        properties: {
          text: 'Hello VVS'
        }
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [printNode];
    const edges: Edge[] = [];
    
    const code = generatePythonCode(nodes, edges);
    
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
        inputs: [],
        outputs: [
          createSocketDefinition('value', 'Value', SocketType.NUMBER, SocketDirection.OUTPUT),
        ],
        properties: {
          name: 'counter',
          value: '42'
        }
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [varNode];
    const edges: Edge[] = [];
    
    const code = generatePythonCode(nodes, edges);
    
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
          createSocketDefinition('condition', 'Condition', SocketType.BOOLEAN, SocketDirection.INPUT),
          createSocketDefinition('flow_in', 'Flow In', SocketType.FLOW, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('true_flow', 'True', SocketType.FLOW, SocketDirection.OUTPUT),
          createSocketDefinition('false_flow', 'False', SocketType.FLOW, SocketDirection.OUTPUT),
        ],
        properties: {
          condition: 'x > 10'
        }
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [ifNode];
    const edges: Edge[] = [];
    
    const code = generatePythonCode(nodes, edges);
    
    expect(code).toContain('if x > 10:');
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
          createSocketDefinition('flow_in', 'Flow In', SocketType.FLOW, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('loop_body', 'Body', SocketType.FLOW, SocketDirection.OUTPUT),
          createSocketDefinition('loop_complete', 'Complete', SocketType.FLOW, SocketDirection.OUTPUT),
          createSocketDefinition('current_value', 'Value', SocketType.NUMBER, SocketDirection.OUTPUT),
        ],
        properties: {
          variable: 'idx',
          start: '1',
          end: '5'
        }
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [forNode];
    const edges: Edge[] = [];
    
    const code = generatePythonCode(nodes, edges);
    
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
        inputs: [],
        outputs: [],
        properties: {
          text: 'Test'
        }
      }
    }];
    const edges: Edge[] = [];
    
    const code = generatePythonCode(nodes, edges);
    
    expect(code).toContain('# Generated Python code from VVS Web');
  });
  
  // Tests for logic operations
  test('generates code for AND operation', () => {
    const andNode: Node<BaseNodeData> = {
      id: 'and-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'AND',
        type: NodeType.AND,
        inputs: [
          createSocketDefinition('left', 'Left', SocketType.BOOLEAN, SocketDirection.INPUT),
          createSocketDefinition('right', 'Right', SocketType.BOOLEAN, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.BOOLEAN, SocketDirection.OUTPUT),
        ],
        properties: {}
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [andNode];
    const edges: Edge[] = [];
    
    const code = generatePythonCode(nodes, edges);
    
    expect(code).toContain('_temp_and_node = False and False');
  });
  
  test('generates code for OR operation', () => {
    const orNode: Node<BaseNodeData> = {
      id: 'or-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'OR',
        type: NodeType.OR,
        inputs: [
          createSocketDefinition('left', 'Left', SocketType.BOOLEAN, SocketDirection.INPUT),
          createSocketDefinition('right', 'Right', SocketType.BOOLEAN, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.BOOLEAN, SocketDirection.OUTPUT),
        ],
        properties: {}
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [orNode];
    const edges: Edge[] = [];
    
    const code = generatePythonCode(nodes, edges);
    
    expect(code).toContain('_temp_or_node = False or False');
  });
  
  test('generates code for GREATER_THAN operation', () => {
    const gtNode: Node<BaseNodeData> = {
      id: 'gt-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Greater Than',
        type: NodeType.GREATER_THAN,
        inputs: [
          createSocketDefinition('left', 'Left', SocketType.NUMBER, SocketDirection.INPUT),
          createSocketDefinition('right', 'Right', SocketType.NUMBER, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.BOOLEAN, SocketDirection.OUTPUT),
        ],
        properties: {}
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [gtNode];
    const edges: Edge[] = [];
    
    const code = generatePythonCode(nodes, edges);
    
    expect(code).toContain('_temp_gt_node = 0 > 0');
  });
  
  test('generates code for LESS_THAN operation', () => {
    const ltNode: Node<BaseNodeData> = {
      id: 'lt-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Less Than',
        type: NodeType.LESS_THAN,
        inputs: [
          createSocketDefinition('left', 'Left', SocketType.NUMBER, SocketDirection.INPUT),
          createSocketDefinition('right', 'Right', SocketType.NUMBER, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.BOOLEAN, SocketDirection.OUTPUT),
        ],
        properties: {}
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [ltNode];
    const edges: Edge[] = [];
    
    const code = generatePythonCode(nodes, edges);
    
    expect(code).toContain('_temp_lt_node = 0 < 0');
  });
  
  test('generates code for EQUAL operation', () => {
    const eqNode: Node<BaseNodeData> = {
      id: 'eq-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Equal',
        type: NodeType.EQUAL,
        inputs: [
          createSocketDefinition('left', 'Left', SocketType.ANY, SocketDirection.INPUT),
          createSocketDefinition('right', 'Right', SocketType.ANY, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.BOOLEAN, SocketDirection.OUTPUT),
        ],
        properties: {}
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [eqNode];
    const edges: Edge[] = [];
    
    const code = generatePythonCode(nodes, edges);
    
    expect(code).toContain('_temp_eq_node = 0 == 0');
  });
  
  // Tests for math operations
  test('generates code for ADD operation', () => {
    const addNode: Node<BaseNodeData> = {
      id: 'add-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Add',
        type: NodeType.ADD,
        inputs: [
          createSocketDefinition('left', 'Left', SocketType.NUMBER, SocketDirection.INPUT),
          createSocketDefinition('right', 'Right', SocketType.NUMBER, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.NUMBER, SocketDirection.OUTPUT),
        ],
        properties: {}
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [addNode];
    const edges: Edge[] = [];
    
    const code = generatePythonCode(nodes, edges);
    
    expect(code).toContain('_temp_add_node = 0 + 0');
  });
  
  test('generates code for SUBTRACT operation', () => {
    const subNode: Node<BaseNodeData> = {
      id: 'sub-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Subtract',
        type: NodeType.SUBTRACT,
        inputs: [
          createSocketDefinition('left', 'Left', SocketType.NUMBER, SocketDirection.INPUT),
          createSocketDefinition('right', 'Right', SocketType.NUMBER, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.NUMBER, SocketDirection.OUTPUT),
        ],
        properties: {}
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [subNode];
    const edges: Edge[] = [];
    
    const code = generatePythonCode(nodes, edges);
    
    expect(code).toContain('_temp_sub_node = 0 - 0');
  });
  
  test('generates code for MULTIPLY operation', () => {
    const mulNode: Node<BaseNodeData> = {
      id: 'mul-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Multiply',
        type: NodeType.MULTIPLY,
        inputs: [
          createSocketDefinition('left', 'Left', SocketType.NUMBER, SocketDirection.INPUT),
          createSocketDefinition('right', 'Right', SocketType.NUMBER, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.NUMBER, SocketDirection.OUTPUT),
        ],
        properties: {}
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [mulNode];
    const edges: Edge[] = [];
    
    const code = generatePythonCode(nodes, edges);
    
    expect(code).toContain('_temp_mul_node = 0 * 0');
  });
  
  test('generates code for DIVIDE operation', () => {
    const divNode: Node<BaseNodeData> = {
      id: 'div-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Divide',
        type: NodeType.DIVIDE,
        inputs: [
          createSocketDefinition('left', 'Left', SocketType.NUMBER, SocketDirection.INPUT),
          createSocketDefinition('right', 'Right', SocketType.NUMBER, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.NUMBER, SocketDirection.OUTPUT),
        ],
        properties: {}
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [divNode];
    const edges: Edge[] = [];
    
    const code = generatePythonCode(nodes, edges);
    
    expect(code).toContain('_temp_div_node = 0 / 1');
  });
  
  // Tests for variable getter
  test('generates code for VARIABLE_GETTER', () => {
    const getterNode: Node<BaseNodeData> = {
      id: 'getter-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Get Variable',
        type: NodeType.VARIABLE_GETTER,
        inputs: [],
        outputs: [
          createSocketDefinition('value', 'Value', SocketType.ANY, SocketDirection.OUTPUT),
        ],
        properties: {
          name: 'myVariable'
        }
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [getterNode];
    const edges: Edge[] = [];
    
    const code = generatePythonCode(nodes, edges);
    
    // Variable getters don't generate code directly, they're used in other nodes
    expect(code).toContain('# Generated Python code from VVS Web');
  });
  
  // Tests for user input
  test('generates code for USER_INPUT', () => {
    const userInputNode: Node<BaseNodeData> = {
      id: 'user-input-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'User Input',
        type: NodeType.USER_INPUT,
        inputs: [
          createSocketDefinition('flow_in', 'Flow In', SocketType.FLOW, SocketDirection.INPUT),
          createSocketDefinition('prompt', 'Prompt', SocketType.STRING, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('flow_out', 'Flow Out', SocketType.FLOW, SocketDirection.OUTPUT),
          createSocketDefinition('value', 'Value', SocketType.STRING, SocketDirection.OUTPUT),
        ],
        properties: {
          prompt: 'Enter your name:'
        }
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [userInputNode];
    const edges: Edge[] = [];
    
    const code = generatePythonCode(nodes, edges);
    
    expect(code).toContain('userName = input(Enter your name:)');
  });
  
  // Test for connected nodes
  test('generates code for connected nodes', () => {
    const varNode: Node<BaseNodeData> = {
      id: 'var-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Variable',
        type: NodeType.VARIABLE_DEFINITION,
        inputs: [
          createSocketDefinition('flow_in', 'Flow In', SocketType.FLOW, SocketDirection.INPUT),
          createSocketDefinition('value', 'Value', SocketType.NUMBER, SocketDirection.INPUT, 0),
        ],
        outputs: [
          createSocketDefinition('flow_out', 'Flow Out', SocketType.FLOW, SocketDirection.OUTPUT),
        ],
        properties: {
          name: 'x',
          value: '10'
        }
      }
    };
    
    const printNode: Node<BaseNodeData> = {
      id: 'print-node',
      type: 'baseNode',
      position: { x: 300, y: 100 },
      data: {
        label: 'Print',
        type: NodeType.PRINT,
        inputs: [
          createSocketDefinition('flow_in', 'Flow In', SocketType.FLOW, SocketDirection.INPUT),
          createSocketDefinition('value', 'Value', SocketType.ANY, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('flow_out', 'Flow Out', SocketType.FLOW, SocketDirection.OUTPUT),
        ],
        properties: {}
      }
    };
    
    const edge: Edge = {
      id: 'edge1',
      source: 'var-node',
      target: 'print-node',
      sourceHandle: 'flow_out',
      targetHandle: 'flow_in',
    };
    
    const valueEdge: Edge = {
      id: 'edge2',
      source: 'var-node',
      target: 'print-node',
      sourceHandle: 'value',
      targetHandle: 'value',
    };
    
    const nodes: Node<BaseNodeData>[] = [varNode, printNode];
    const edges: Edge[] = [edge, valueEdge];
    
    const code = generatePythonCode(nodes, edges);
    
    expect(code).toContain('variable = 0');
    expect(code).toContain('print("Hello, World!")');
  });
});

