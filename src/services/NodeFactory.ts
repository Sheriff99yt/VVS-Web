import { Node } from 'reactflow';
import { CustomNodeData, nodeTypes, DataType, Port } from '../components/nodes/CustomNodes';
import { v4 as uuidv4 } from 'uuid';

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
    const stringType: DataType = 'string';
    const arrayType: DataType = 'array';

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
          ],
          category: 'flow-control'
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
          ],
          category: 'flow-control'
        };

      // Output
      case nodeTypes.print:
        return {
          inputs: [
            { id: 'value', label: 'Value', dataType: anyType }
          ],
          outputs: [],
          category: 'io'
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
          variableType: anyType,
          category: 'variables'
        };

      // Math Operations
      case nodeTypes.add:
      case nodeTypes.subtract:
      case nodeTypes.multiply:
      case nodeTypes.divide:
      case nodeTypes.power:
      case nodeTypes.sqrt:
      case nodeTypes.abs:
      case nodeTypes.modulo:
      case nodeTypes.sin:
      case nodeTypes.cos:
      case nodeTypes.tan:
      case nodeTypes.asin:
      case nodeTypes.acos:
      case nodeTypes.atan:
      case nodeTypes.ln:
      case nodeTypes.log10:
      case nodeTypes.exp:
      case nodeTypes.floor:
      case nodeTypes.ceil:
      case nodeTypes.round:
        return {
          ...createBinaryMathOp(type),
          category: 'math'
        };

      // Function
      case nodeTypes.function:
        return {
          inputs: [
            { id: 'param1', label: 'Parameter 1', dataType: anyType }
          ],
          outputs: [
            { id: 'return', label: 'Return', dataType: anyType }
          ],
          category: 'functions'
        };

      default:
        throw new Error(`Unknown node type: ${type}`);
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

  private createBaseNode(type: string): Node {
    return {
      id: uuidv4(),
      type,
      position: { x: 0, y: 0 },
      data: {
        title: type,
        inputs: [],
        outputs: []
      }
    };
  }

  public create(type: string): Node {
    switch (type) {
      // Control Flow
      case nodeTypes.ifStatement:
        return this.createBaseNode(type);
      case nodeTypes.forLoop:
        return this.createBaseNode(type);
      
      // Output
      case nodeTypes.print:
        return this.createBaseNode(type);
      
      // Variables
      case nodeTypes.variable:
        return this.createBaseNode(type);
      
      // Math Operations
      case nodeTypes.add:
      case nodeTypes.subtract:
      case nodeTypes.multiply:
      case nodeTypes.divide:
      case nodeTypes.power:
      case nodeTypes.sqrt:
      case nodeTypes.abs:
      case nodeTypes.modulo:
      case nodeTypes.sin:
      case nodeTypes.cos:
      case nodeTypes.tan:
      case nodeTypes.asin:
      case nodeTypes.acos:
      case nodeTypes.atan:
      case nodeTypes.ln:
      case nodeTypes.log10:
      case nodeTypes.exp:
      case nodeTypes.floor:
      case nodeTypes.ceil:
      case nodeTypes.round:
        return this.createBaseNode(type);
      
      // Function
      case nodeTypes.function:
        return this.createBaseNode(type);

      default:
        throw new Error(`Unknown node type: ${type}`);
    }
  }
} 