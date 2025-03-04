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
    
    expect(code).toContain('print("Hello VVS")');
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
    
    expect(code).toContain('counter = 42');
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
    
    expect(code).toContain('for idx in range(1, 5):');
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
    const inputNode: Node<BaseNodeData> = {
      id: 'input-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'User Input',
        type: NodeType.USER_INPUT,
        inputs: [
          createSocketDefinition('flow_in', 'Flow In', SocketType.FLOW, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('flow_out', 'Flow Out', SocketType.FLOW, SocketDirection.OUTPUT),
          createSocketDefinition('value', 'Value', SocketType.STRING, SocketDirection.OUTPUT),
        ],
        properties: {
          prompt: 'Enter your name:',
          variableName: 'userName',
          dataType: 'string'
        }
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [inputNode];
    const edges: Edge[] = [];
    
    const code = generatePythonCode(nodes, edges);
    
    expect(code).toContain('userName = input("Enter your name:")');
  });
  
  // Tests for function definition
  test('generates code for FUNCTION_DEFINITION', () => {
    const funcDefNode: Node<BaseNodeData> = {
      id: 'func-def-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Define Function',
        type: NodeType.FUNCTION_DEFINITION,
        inputs: [
          createSocketDefinition('return_value', 'Return', SocketType.ANY, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('body_flow', 'Body', SocketType.FLOW, SocketDirection.OUTPUT),
        ],
        properties: {
          name: 'calculate_sum',
          parameters: 'a, b'
        }
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [funcDefNode];
    const edges: Edge[] = [];
    
    const code = generatePythonCode(nodes, edges);
    
    expect(code).toContain('def calculate_sum(a, b):');
  });
  
  // Tests for function call
  test('generates code for FUNCTION_CALL', () => {
    const funcCallNode: Node<BaseNodeData> = {
      id: 'func-call-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Call Function',
        type: NodeType.FUNCTION_CALL,
        inputs: [
          createSocketDefinition('flow_in', 'Flow In', SocketType.FLOW, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('flow_out', 'Flow Out', SocketType.FLOW, SocketDirection.OUTPUT),
          createSocketDefinition('result', 'Result', SocketType.ANY, SocketDirection.OUTPUT),
        ],
        properties: {
          name: 'calculate_sum',
          arguments: '5, 10'
        }
      }
    };
    
    const nodes: Node<BaseNodeData>[] = [funcCallNode];
    const edges: Edge[] = [];
    
    const code = generatePythonCode(nodes, edges);
    
    expect(code).toContain('_result_func_call_node = calculate_sum(5, 10)');
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
        inputs: [],
        outputs: [
          createSocketDefinition('value', 'Value', SocketType.NUMBER, SocketDirection.OUTPUT),
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
          createSocketDefinition('value', 'Value', SocketType.ANY, SocketDirection.INPUT),
        ],
        outputs: [],
        properties: {}
      }
    };
    
    const edge: Edge = {
      id: 'edge-1',
      source: 'var-node',
      target: 'print-node',
      sourceHandle: 'value',
      targetHandle: 'value',
    };
    
    const nodes: Node<BaseNodeData>[] = [varNode, printNode];
    const edges: Edge[] = [edge];
    
    const code = generatePythonCode(nodes, edges);
    
    expect(code).toContain('x = 10');
    expect(code).toContain('print(x)');
  });
  
  // Test for a complex node graph - Factorial calculation
  test('generates code for a complex factorial calculation program', () => {
    // Function definition node for factorial
    const funcDefNode: Node<BaseNodeData> = {
      id: 'func-def-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Define Function',
        type: NodeType.FUNCTION_DEFINITION,
        inputs: [
          createSocketDefinition('return_value', 'Return', SocketType.ANY, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('body_flow', 'Body', SocketType.FLOW, SocketDirection.OUTPUT),
        ],
        properties: {
          name: 'factorial',
          parameters: 'n'
        }
      }
    };
    
    // Variable definition for result
    const resultVarNode: Node<BaseNodeData> = {
      id: 'result-var-node',
      type: 'baseNode',
      position: { x: 300, y: 100 },
      data: {
        label: 'Variable',
        type: NodeType.VARIABLE_DEFINITION,
        inputs: [
          createSocketDefinition('flow_in', 'Flow In', SocketType.FLOW, SocketDirection.INPUT),
          createSocketDefinition('value', 'Value', SocketType.NUMBER, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('flow_out', 'Flow Out', SocketType.FLOW, SocketDirection.OUTPUT),
          createSocketDefinition('value_out', 'Value', SocketType.NUMBER, SocketDirection.OUTPUT),
        ],
        properties: {
          name: 'result',
          value: '1'
        }
      }
    };
    
    // For loop node
    const forLoopNode: Node<BaseNodeData> = {
      id: 'for-loop-node',
      type: 'baseNode',
      position: { x: 500, y: 100 },
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
          variable: 'i',
          start: '1',
          end: 'n + 1'  // Loop from 1 to n inclusive
        }
      }
    };
    
    // Variable getter for result inside loop
    const resultGetterNode: Node<BaseNodeData> = {
      id: 'result-getter-node',
      type: 'baseNode',
      position: { x: 700, y: 200 },
      data: {
        label: 'Get Variable',
        type: NodeType.VARIABLE_GETTER,
        inputs: [],
        outputs: [
          createSocketDefinition('value', 'Value', SocketType.NUMBER, SocketDirection.OUTPUT),
        ],
        properties: {
          name: 'result'
        }
      }
    };
    
    // Loop variable getter
    const loopVarGetterNode: Node<BaseNodeData> = {
      id: 'loop-var-getter-node',
      type: 'baseNode',
      position: { x: 700, y: 300 },
      data: {
        label: 'Get Variable',
        type: NodeType.VARIABLE_GETTER,
        inputs: [],
        outputs: [
          createSocketDefinition('value', 'Value', SocketType.NUMBER, SocketDirection.OUTPUT),
        ],
        properties: {
          name: 'i'
        }
      }
    };
    
    // Multiply node for result * i
    const multiplyNode: Node<BaseNodeData> = {
      id: 'multiply-node',
      type: 'baseNode',
      position: { x: 900, y: 250 },
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
    
    // Update result variable
    const updateResultNode: Node<BaseNodeData> = {
      id: 'update-result-node',
      type: 'baseNode',
      position: { x: 1100, y: 250 },
      data: {
        label: 'Variable',
        type: NodeType.VARIABLE_DEFINITION,
        inputs: [
          createSocketDefinition('flow_in', 'Flow In', SocketType.FLOW, SocketDirection.INPUT),
          createSocketDefinition('value', 'Value', SocketType.NUMBER, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('flow_out', 'Flow Out', SocketType.FLOW, SocketDirection.OUTPUT),
        ],
        properties: {
          name: 'result'
        }
      }
    };
    
    // Return result
    const returnNode: Node<BaseNodeData> = {
      id: 'return-node',
      type: 'baseNode',
      position: { x: 500, y: 400 },
      data: {
        label: 'Return',
        type: NodeType.VARIABLE_GETTER,
        inputs: [],
        outputs: [
          createSocketDefinition('value', 'Value', SocketType.NUMBER, SocketDirection.OUTPUT),
        ],
        properties: {
          name: 'result'
        }
      }
    };
    
    // Main program - User input for number
    const inputNode: Node<BaseNodeData> = {
      id: 'input-node',
      type: 'baseNode',
      position: { x: 100, y: 500 },
      data: {
        label: 'User Input',
        type: NodeType.USER_INPUT,
        inputs: [],
        outputs: [
          createSocketDefinition('flow_out', 'Flow Out', SocketType.FLOW, SocketDirection.OUTPUT),
          createSocketDefinition('value', 'Value', SocketType.STRING, SocketDirection.OUTPUT),
        ],
        properties: {
          prompt: 'Enter a number:',
          variableName: 'num',
          dataType: 'number'
        }
      }
    };
    
    // Function call node
    const funcCallNode: Node<BaseNodeData> = {
      id: 'func-call-node',
      type: 'baseNode',
      position: { x: 300, y: 500 },
      data: {
        label: 'Call Function',
        type: NodeType.FUNCTION_CALL,
        inputs: [
          createSocketDefinition('flow_in', 'Flow In', SocketType.FLOW, SocketDirection.INPUT),
          createSocketDefinition('arg1', 'n', SocketType.NUMBER, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('flow_out', 'Flow Out', SocketType.FLOW, SocketDirection.OUTPUT),
          createSocketDefinition('result', 'Result', SocketType.NUMBER, SocketDirection.OUTPUT),
        ],
        properties: {
          name: 'factorial',
          arguments: ''  // Will be connected via edge
        }
      }
    };
    
    // Print result node
    const printNode: Node<BaseNodeData> = {
      id: 'print-node',
      type: 'baseNode',
      position: { x: 500, y: 500 },
      data: {
        label: 'Print',
        type: NodeType.PRINT,
        inputs: [
          createSocketDefinition('flow_in', 'Flow In', SocketType.FLOW, SocketDirection.INPUT),
          createSocketDefinition('value', 'Value', SocketType.ANY, SocketDirection.INPUT),
        ],
        outputs: [],
        properties: {
          text: 'Factorial result:'
        }
      }
    };
    
    // Define all the edges
    const edges: Edge[] = [
      // Function definition flow
      {
        id: 'edge-func-to-result',
        source: 'func-def-node',
        target: 'result-var-node',
        sourceHandle: 'body_flow',
        targetHandle: 'flow_in',
      },
      {
        id: 'edge-result-to-for',
        source: 'result-var-node',
        target: 'for-loop-node',
        sourceHandle: 'flow_out',
        targetHandle: 'flow_in',
      },
      // For loop body
      {
        id: 'edge-for-to-update',
        source: 'for-loop-node',
        target: 'update-result-node',
        sourceHandle: 'loop_body',
        targetHandle: 'flow_in',
      },
      // Multiply operation
      {
        id: 'edge-result-to-multiply',
        source: 'result-getter-node',
        target: 'multiply-node',
        sourceHandle: 'value',
        targetHandle: 'left',
      },
      {
        id: 'edge-i-to-multiply',
        source: 'loop-var-getter-node',
        target: 'multiply-node',
        sourceHandle: 'value',
        targetHandle: 'right',
      },
      {
        id: 'edge-multiply-to-update',
        source: 'multiply-node',
        target: 'update-result-node',
        sourceHandle: 'result',
        targetHandle: 'value',
      },
      // Return value
      {
        id: 'edge-return-to-func',
        source: 'return-node',
        target: 'func-def-node',
        sourceHandle: 'value',
        targetHandle: 'return_value',
      },
      // Main program flow
      {
        id: 'edge-input-to-call',
        source: 'input-node',
        target: 'func-call-node',
        sourceHandle: 'flow_out',
        targetHandle: 'flow_in',
      },
      {
        id: 'edge-input-to-call-arg',
        source: 'input-node',
        target: 'func-call-node',
        sourceHandle: 'value',
        targetHandle: 'arg1',
      },
      {
        id: 'edge-call-to-print',
        source: 'func-call-node',
        target: 'print-node',
        sourceHandle: 'flow_out',
        targetHandle: 'flow_in',
      },
      {
        id: 'edge-call-result-to-print',
        source: 'func-call-node',
        target: 'print-node',
        sourceHandle: 'result',
        targetHandle: 'value',
      },
    ];
    
    const nodes: Node<BaseNodeData>[] = [
      funcDefNode, resultVarNode, forLoopNode, resultGetterNode, loopVarGetterNode,
      multiplyNode, updateResultNode, returnNode, inputNode, funcCallNode, printNode
    ];
    
    const code = generatePythonCode(nodes, edges);
    
    // Check for function definition
    expect(code).toContain('def factorial(n):');
    
    // Check for result initialization
    expect(code).toContain('result = 1');
    
    // Check for for loop
    expect(code).toContain('for i in range(1, n + 1):');
    
    // Check for multiplication and result update
    expect(code).toContain('_temp_multiply_node = result * i');
    expect(code).toContain('result = _temp_multiply_node');
    
    // Check for return statement
    expect(code).toContain('return result');
    
    // Check for user input
    expect(code).toContain('num = input("Enter a number:")');
    expect(code).toContain('num = float(num)');
    
    // Check for function call
    expect(code).toContain('_result_func_call_node = factorial(');
    
    // Check for print statement
    expect(code).toContain('print(');
  });
}); 