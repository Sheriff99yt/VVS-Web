import { Node } from 'reactflow';
import { CustomNodeData, nodeTypes, DataType, Port } from '../components/nodes/CustomNodes';

let nodeIdCounter = 1;

const getNextNodeId = () => {
  return `node_${nodeIdCounter++}`;
};

export interface CreateNodeOptions {
  type: string;
  position: { x: number; y: number };
  data?: Partial<CustomNodeData>;
}

export class NodeFactory {
  static createNode(options: CreateNodeOptions): Node<CustomNodeData> {
    const baseNode = {
      id: getNextNodeId(),
      type: options.type,
      position: options.position,
      data: {
        title: this.getDefaultTitle(options.type),
        ...this.getDefaultData(options.type),
        ...options.data,
      },
    };

    return baseNode;
  }

  private static getDefaultTitle(type: string): string {
    switch (type) {
      // Control Flow
      case nodeTypes.ifStatement:
        return 'If Statement';
      case nodeTypes.forLoop:
        return 'For Loop';
      
      // Output
      case nodeTypes.print:
        return 'Print';
      
      // Variables
      case nodeTypes.variable:
        return 'Variable';
      
      // Basic Math
      case nodeTypes.add:
        return 'Add';
      case nodeTypes.subtract:
        return 'Subtract';
      case nodeTypes.multiply:
        return 'Multiply';
      case nodeTypes.divide:
        return 'Divide';
      case nodeTypes.power:
        return 'Power';
      case nodeTypes.sqrt:
        return 'Square Root';
      case nodeTypes.abs:
        return 'Absolute';
      case nodeTypes.modulo:
        return 'Modulo';
      
      // Trigonometry
      case nodeTypes.sin:
        return 'Sine';
      case nodeTypes.cos:
        return 'Cosine';
      case nodeTypes.tan:
        return 'Tangent';
      case nodeTypes.asin:
        return 'Arcsine';
      case nodeTypes.acos:
        return 'Arccosine';
      case nodeTypes.atan:
        return 'Arctangent';
      
      // Logarithmic
      case nodeTypes.ln:
        return 'Natural Log';
      case nodeTypes.log10:
        return 'Log Base 10';
      case nodeTypes.exp:
        return 'Exponential';
      
      // Rounding
      case nodeTypes.floor:
        return 'Floor';
      case nodeTypes.ceil:
        return 'Ceiling';
      case nodeTypes.round:
        return 'Round';
      
      // Function
      case nodeTypes.function:
        return 'Function';
      
      default:
        return 'Node';
    }
  }

  private static getDefaultData(type: string): Partial<CustomNodeData> {
    const numberType: DataType = 'number';
    const booleanType: DataType = 'boolean';
    const anyType: DataType = 'any';

    // Helper functions for common node configurations
    const createBinaryMathOp = (operation: string) => ({
      inputs: [
        { id: 'a', label: 'A', dataType: numberType },
        { id: 'b', label: 'B', dataType: numberType }
      ],
      outputs: [
        { id: 'result', label: 'Result', dataType: numberType }
      ],
      operation
    });

    const createUnaryMathOp = (operation: string) => ({
      inputs: [
        { id: 'x', label: 'X', dataType: numberType }
      ],
      outputs: [
        { id: 'result', label: 'Result', dataType: numberType }
      ],
      operation
    });

    const createComparisonOp = (operation: string) => ({
      inputs: [
        { id: 'a', label: 'A', dataType: numberType },
        { id: 'b', label: 'B', dataType: numberType }
      ],
      outputs: [
        { id: 'result', label: 'Result', dataType: booleanType }
      ],
      operation
    });

    const createLogicalOp = (operation: string) => ({
      inputs: [
        { id: 'a', label: 'A', dataType: booleanType },
        { id: 'b', label: 'B', dataType: booleanType }
      ],
      outputs: [
        { id: 'result', label: 'Result', dataType: booleanType }
      ],
      operation
    });

    const createBitwiseOp = (operation: string) => ({
      inputs: [
        { id: 'a', label: 'A', dataType: numberType },
        { id: 'b', label: 'B', dataType: numberType }
      ],
      outputs: [
        { id: 'result', label: 'Result', dataType: numberType }
      ],
      operation
    });

    switch (type) {
      // Control Flow
      case nodeTypes.ifStatement:
        return {
          inputs: [
            { id: 'condition', label: 'Condition', dataType: booleanType }
          ],
          outputs: [
            { id: 'true', label: 'True', dataType: anyType },
            { id: 'false', label: 'False', dataType: anyType }
          ]
        };

      case nodeTypes.forLoop:
        return {
          inputs: [
            { id: 'start', label: 'Start', dataType: numberType },
            { id: 'end', label: 'End', dataType: numberType },
            { id: 'step', label: 'Step', dataType: numberType }
          ],
          outputs: [
            { id: 'body', label: 'Body', dataType: anyType },
            { id: 'index', label: 'Index', dataType: numberType }
          ]
        };

      // Output
      case nodeTypes.print:
        return {
          inputs: [
            { id: 'value', label: 'Value', dataType: anyType }
          ],
          outputs: []
        };

      // Variables
      case nodeTypes.variable:
        return {
          inputs: [
            { id: 'value', label: 'Value', dataType: anyType }
          ],
          outputs: [
            { id: 'output', label: 'Value', dataType: anyType }
          ],
          variableType: anyType
        };

      // Basic Math
      case nodeTypes.add:
        return createBinaryMathOp('add');
      case nodeTypes.subtract:
        return createBinaryMathOp('subtract');
      case nodeTypes.multiply:
        return createBinaryMathOp('multiply');
      case nodeTypes.divide:
        return createBinaryMathOp('divide');
      case nodeTypes.power:
        return createBinaryMathOp('power');
      case nodeTypes.modulo:
        return createBinaryMathOp('modulo');
      case nodeTypes.sqrt:
        return createUnaryMathOp('sqrt');
      case nodeTypes.abs:
        return createUnaryMathOp('abs');

      // Trigonometry
      case nodeTypes.sin:
        return createUnaryMathOp('sin');
      case nodeTypes.cos:
        return createUnaryMathOp('cos');
      case nodeTypes.tan:
        return createUnaryMathOp('tan');
      case nodeTypes.asin:
        return createUnaryMathOp('asin');
      case nodeTypes.acos:
        return createUnaryMathOp('acos');
      case nodeTypes.atan:
        return createUnaryMathOp('atan');

      // Logarithmic
      case nodeTypes.ln:
        return createUnaryMathOp('ln');
      case nodeTypes.log10:
        return createUnaryMathOp('log10');
      case nodeTypes.exp:
        return createUnaryMathOp('exp');

      // Rounding
      case nodeTypes.floor:
        return createUnaryMathOp('floor');
      case nodeTypes.ceil:
        return createUnaryMathOp('ceil');
      case nodeTypes.round:
        return createUnaryMathOp('round');

      // Function
      case nodeTypes.function:
        return {
          inputs: [
            { id: 'param1', label: 'Parameter 1', dataType: anyType }
          ],
          outputs: [
            { id: 'return', label: 'Return', dataType: anyType }
          ]
        };

      // Comparison Operators
      case nodeTypes.equal:
        return {
          inputs: [
            { id: 'a', label: 'A', dataType: anyType },
            { id: 'b', label: 'B', dataType: anyType }
          ],
          outputs: [
            { id: 'result', label: 'Result', dataType: booleanType }
          ],
          operation: 'equal'
        };
      case nodeTypes.notEqual:
        return {
          inputs: [
            { id: 'a', label: 'A', dataType: anyType },
            { id: 'b', label: 'B', dataType: anyType }
          ],
          outputs: [
            { id: 'result', label: 'Result', dataType: booleanType }
          ],
          operation: 'notEqual'
        };
      case nodeTypes.greaterThan:
        return createComparisonOp('greaterThan');
      case nodeTypes.lessThan:
        return createComparisonOp('lessThan');
      case nodeTypes.greaterEqual:
        return createComparisonOp('greaterEqual');
      case nodeTypes.lessEqual:
        return createComparisonOp('lessEqual');

      // Logical Operators
      case nodeTypes.and:
        return createLogicalOp('and');
      case nodeTypes.or:
        return createLogicalOp('or');
      case nodeTypes.not:
        return {
          inputs: [
            { id: 'value', label: 'Value', dataType: booleanType }
          ],
          outputs: [
            { id: 'result', label: 'Result', dataType: booleanType }
          ],
          operation: 'not'
        };
      case nodeTypes.logicalXor:
        return createLogicalOp('logicalXor');

      // Bitwise Operators
      case nodeTypes.bitwiseAnd:
        return createBitwiseOp('bitwiseAnd');
      case nodeTypes.bitwiseOr:
        return createBitwiseOp('bitwiseOr');
      case nodeTypes.bitwiseXor:
        return createBitwiseOp('bitwiseXor');
      case nodeTypes.leftShift:
        return {
          inputs: [
            { id: 'value', label: 'Value', dataType: numberType },
            { id: 'shift', label: 'Shift', dataType: numberType }
          ],
          outputs: [
            { id: 'result', label: 'Result', dataType: numberType }
          ],
          operation: 'leftShift'
        };
      case nodeTypes.rightShift:
        return {
          inputs: [
            { id: 'value', label: 'Value', dataType: numberType },
            { id: 'shift', label: 'Shift', dataType: numberType }
          ],
          outputs: [
            { id: 'result', label: 'Result', dataType: numberType }
          ],
          operation: 'rightShift'
        };

      default:
        return {
          inputs: [],
          outputs: []
        };
    }
  }

  static isValidConnection(
    sourceNode: Node<CustomNodeData>,
    sourcePortId: string,
    targetNode: Node<CustomNodeData>,
    targetPortId: string
  ): boolean {
    const sourcePort = sourceNode.data.outputs?.find(p => p.id === sourcePortId);
    const targetPort = targetNode.data.inputs?.find(p => p.id === targetPortId);

    if (!sourcePort || !targetPort) {
      return false;
    }

    // Allow 'any' to connect to any type
    if (sourcePort.dataType === 'any' || targetPort.dataType === 'any') {
      return true;
    }

    return sourcePort.dataType === targetPort.dataType;
  }
} 