import { Node } from 'reactflow';
import { CustomNodeData, nodeTypes, DataType, NodeCategory as NodeCategoryType, Port } from '../components/nodes/CustomNodes';
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

// Helper function to create base node data
function createNodeData(type: string, category: NodeCategoryType, inputs: Port[], outputs: Port[]): CustomNodeData {
  return Object.assign({
    category,
    inputs,
    outputs
  }, {
    title: NodeFactory.getDefaultTitle(type)
  });
}

export class NodeFactory {
  static createNode(options: CreateNodeOptions): Node<CustomNodeData> {
    const baseNode = {
      id: getNextNodeId(),
      type: options.type,
      position: options.position,
      data: {
        ...this.getDefaultData(options.type),
        ...options.data,
      },
    };

    return baseNode;
  }

  static getDefaultTitle(type: string): string {
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
      
      // Math Operations
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
      case nodeTypes.ln:
        return 'Natural Log';
      case nodeTypes.log10:
        return 'Log Base 10';
      case nodeTypes.exp:
        return 'Exponential';
      case nodeTypes.floor:
        return 'Floor';
      case nodeTypes.ceil:
        return 'Ceiling';
      case nodeTypes.round:
        return 'Round';
      
      // Logical Operations
      case nodeTypes.and:
        return 'AND';
      case nodeTypes.or:
        return 'OR';
      case nodeTypes.not:
        return 'NOT';
      case nodeTypes.nand:
        return 'NAND';
      case nodeTypes.nor:
        return 'NOR';
      case nodeTypes.xor:
        return 'XOR';
      case nodeTypes.xnor:
        return 'XNOR';
      
      // Comparison Operations
      case nodeTypes.equals:
        return 'Equals';
      case nodeTypes.notEquals:
        return 'Not Equals';
      case nodeTypes.greaterThan:
        return 'Greater Than';
      case nodeTypes.lessThan:
        return 'Less Than';
      case nodeTypes.greaterThanOrEqual:
        return 'Greater Than or Equal';
      case nodeTypes.lessThanOrEqual:
        return 'Less Than or Equal';
      case nodeTypes.between:
        return 'Between';
      
      // String Operations
      case nodeTypes.stringLength:
        return 'String Length';
      case nodeTypes.concat:
        return 'Concatenate';
      case nodeTypes.substring:
        return 'Substring';
      case nodeTypes.trim:
        return 'Trim';
      case nodeTypes.toUpperCase:
        return 'To Uppercase';
      case nodeTypes.toLowerCase:
        return 'To Lowercase';
      case nodeTypes.replace:
        return 'Replace';
      case nodeTypes.split:
        return 'Split';
      case nodeTypes.indexOf:
        return 'Index Of';
      case nodeTypes.lastIndexOf:
        return 'Last Index Of';
      case nodeTypes.startsWith:
        return 'Starts With';
      case nodeTypes.endsWith:
        return 'Ends With';
      case nodeTypes.includes:
        return 'Includes';
      case nodeTypes.repeat:
        return 'Repeat';
      case nodeTypes.charAt:
        return 'Char At';
      case nodeTypes.padStart:
        return 'Pad Start';
      case nodeTypes.padEnd:
        return 'Pad End';
      case nodeTypes.match:
        return 'Regex Match';
      case nodeTypes.search:
        return 'Regex Search';
      case nodeTypes.format:
        return 'Format';
      
      // Array Operations
      case nodeTypes.arrayLength:
        return 'Array Length';
      case nodeTypes.arrayGet:
        return 'Array Get';
      case nodeTypes.arraySet:
        return 'Array Set';
      case nodeTypes.arrayPush:
        return 'Array Push';
      case nodeTypes.arrayPop:
        return 'Array Pop';
      case nodeTypes.arrayInsert:
        return 'Array Insert';
      case nodeTypes.arrayRemove:
        return 'Array Remove';
      case nodeTypes.arraySlice:
        return 'Array Slice';
      case nodeTypes.arrayConcat:
        return 'Array Concat';
      case nodeTypes.arrayFind:
        return 'Array Find';
      case nodeTypes.arrayFilter:
        return 'Array Filter';
      case nodeTypes.arrayMap:
        return 'Array Map';
      case nodeTypes.arrayReduce:
        return 'Array Reduce';
      case nodeTypes.arraySort:
        return 'Array Sort';
      case nodeTypes.arrayReverse:
        return 'Array Reverse';
      case nodeTypes.arrayJoin:
        return 'Array Join';
      case nodeTypes.arrayIncludes:
        return 'Array Includes';
      case nodeTypes.arrayIndexOf:
        return 'Array Index Of';
      case nodeTypes.arrayLastIndexOf:
        return 'Array Last Index Of';
      case nodeTypes.arrayClear:
        return 'Array Clear';
      case nodeTypes.arrayIsEmpty:
        return 'Array Is Empty';
      
      default:
        return 'Unknown Node';
    }
  }

  static getDefaultData(type: string): CustomNodeData {
    const anyType: DataType = 'any';
    const numberType: DataType = 'number';
    const booleanType: DataType = 'boolean';
    const stringType: DataType = 'string';
    const arrayType: DataType = 'array';

    switch (type) {
      // Control Flow
      case nodeTypes.ifStatement:
        return createNodeData(
          type,
          'flow-control' as NodeCategoryType,
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'condition', label: 'Condition', dataType: booleanType }
          ],
          [
            { id: 'true', label: 'True', dataType: anyType, isExec: true },
            { id: 'false', label: 'False', dataType: anyType, isExec: true }
          ]
        );

      case nodeTypes.forLoop:
        return createNodeData(
          type,
          'flow-control' as NodeCategoryType,
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'start', label: 'Start', dataType: numberType },
            { id: 'end', label: 'End', dataType: numberType },
            { id: 'step', label: 'Step', dataType: numberType }
          ],
          [
            { id: 'loop', label: 'Loop', dataType: anyType, isExec: true },
            { id: 'completed', label: 'Completed', dataType: anyType, isExec: true },
            { id: 'index', label: 'Index', dataType: numberType }
          ]
        );

      // Output
      case nodeTypes.print:
        return createNodeData(
          type,
          'io' as NodeCategoryType,
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'value', label: 'Value', dataType: anyType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true }
          ]
        );

      // Variables
      case nodeTypes.variable:
        return createNodeData(
          type,
          'variables' as NodeCategoryType,
          [
            { id: 'value', label: 'Value', dataType: anyType }
          ],
          [
            { id: 'value', label: 'Value', dataType: anyType }
          ]
        );

      // Math Operations
      case nodeTypes.add:
      case nodeTypes.subtract:
      case nodeTypes.multiply:
      case nodeTypes.divide:
      case nodeTypes.power:
      case nodeTypes.modulo:
        return createNodeData(
          type,
          'math' as NodeCategoryType,
          [
            { id: 'a', label: 'A', dataType: numberType },
            { id: 'b', label: 'B', dataType: numberType }
          ],
          [
            { id: 'result', label: 'Result', dataType: numberType }
          ]
        );
      
      case nodeTypes.sqrt:
      case nodeTypes.abs:
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
        return createNodeData(
          type,
          'math' as NodeCategoryType,
          [
            { id: 'value', label: 'Value', dataType: numberType }
          ],
          [
            { id: 'result', label: 'Result', dataType: numberType }
          ]
        );
      
      // Logical Operations
      case nodeTypes.and:
      case nodeTypes.or:
      case nodeTypes.nand:
      case nodeTypes.nor:
      case nodeTypes.xor:
      case nodeTypes.xnor:
        return createNodeData(
          type,
          'logical' as NodeCategoryType,
          [
            { id: 'a', label: 'A', dataType: booleanType },
            { id: 'b', label: 'B', dataType: booleanType }
          ],
          [
            { id: 'result', label: 'Result', dataType: booleanType }
          ]
        );
      
      case nodeTypes.not:
        return createNodeData(
          type,
          'logical' as NodeCategoryType,
          [
            { id: 'value', label: 'Value', dataType: booleanType }
          ],
          [
            { id: 'result', label: 'Result', dataType: booleanType }
          ]
        );
      
      // Comparison Operations
      case nodeTypes.equals:
      case nodeTypes.notEquals:
      case nodeTypes.greaterThan:
      case nodeTypes.lessThan:
      case nodeTypes.greaterThanOrEqual:
      case nodeTypes.lessThanOrEqual:
        return createNodeData(
          type,
          'comparison' as NodeCategoryType,
          [
            { id: 'a', label: 'A', dataType: anyType },
            { id: 'b', label: 'B', dataType: anyType }
          ],
          [
            { id: 'result', label: 'Result', dataType: booleanType }
          ]
        );
      
      case nodeTypes.between:
        return createNodeData(
          type,
          'comparison' as NodeCategoryType,
          [
            { id: 'value', label: 'Value', dataType: numberType },
            { id: 'min', label: 'Min', dataType: numberType },
            { id: 'max', label: 'Max', dataType: numberType }
          ],
          [
            { id: 'result', label: 'Result', dataType: booleanType }
          ]
        );
      
      // String Operations
      case nodeTypes.stringLength:
        return createNodeData(
          type,
          'string',
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'string', label: 'String', dataType: stringType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'length', label: 'Length', dataType: numberType }
          ]
        );
      
      case nodeTypes.concat:
        return createNodeData(
          type,
          'string',
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'a', label: 'A', dataType: stringType },
            { id: 'b', label: 'B', dataType: stringType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'result', label: 'Result', dataType: stringType }
          ]
        );
      
      case nodeTypes.substring:
        return createNodeData(
          type,
          'string',
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'string', label: 'String', dataType: stringType },
            { id: 'start', label: 'Start', dataType: numberType },
            { id: 'length', label: 'Length', dataType: numberType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'result', label: 'Result', dataType: stringType }
          ]
        );
      
      case nodeTypes.trim:
      case nodeTypes.toUpperCase:
      case nodeTypes.toLowerCase:
        return createNodeData(
          type,
          'string',
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'string', label: 'String', dataType: stringType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'result', label: 'Result', dataType: stringType }
          ]
        );
      
      case nodeTypes.replace:
        return createNodeData(
          type,
          'string',
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'string', label: 'String', dataType: stringType },
            { id: 'search', label: 'Search', dataType: stringType },
            { id: 'replace', label: 'Replace', dataType: stringType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'result', label: 'Result', dataType: stringType }
          ]
        );
      
      case nodeTypes.split:
        return createNodeData(
          type,
          'string',
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'string', label: 'String', dataType: stringType },
            { id: 'delimiter', label: 'Delimiter', dataType: stringType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'result', label: 'Result', dataType: arrayType }
          ]
        );
      
      case nodeTypes.indexOf:
      case nodeTypes.lastIndexOf:
        return createNodeData(
          type,
          'string',
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'string', label: 'String', dataType: stringType },
            { id: 'search', label: 'Search', dataType: stringType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'index', label: 'Index', dataType: numberType }
          ]
        );
      
      case nodeTypes.startsWith:
      case nodeTypes.endsWith:
      case nodeTypes.includes:
        return createNodeData(
          type,
          'string',
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'string', label: 'String', dataType: stringType },
            { id: 'search', label: 'Search', dataType: stringType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'result', label: 'Result', dataType: booleanType }
          ]
        );
      
      case nodeTypes.repeat:
        return createNodeData(
          type,
          'string',
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'string', label: 'String', dataType: stringType },
            { id: 'count', label: 'Count', dataType: numberType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'result', label: 'Result', dataType: stringType }
          ]
        );
      
      case nodeTypes.charAt:
        return createNodeData(
          type,
          'string',
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'string', label: 'String', dataType: stringType },
            { id: 'index', label: 'Index', dataType: numberType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'result', label: 'Result', dataType: stringType }
          ]
        );
      
      case nodeTypes.padStart:
      case nodeTypes.padEnd:
        return createNodeData(
          type,
          'string',
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'string', label: 'String', dataType: stringType },
            { id: 'length', label: 'Target Length', dataType: numberType },
            { id: 'pad', label: 'Pad String', dataType: stringType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'result', label: 'Result', dataType: stringType }
          ]
        );
      
      case nodeTypes.match:
        return createNodeData(
          type,
          'string',
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'string', label: 'String', dataType: stringType },
            { id: 'pattern', label: 'Pattern', dataType: stringType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'matches', label: 'Matches', dataType: arrayType },
            { id: 'success', label: 'Success', dataType: booleanType }
          ]
        );
      
      case nodeTypes.search:
        return createNodeData(
          type,
          'string',
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'string', label: 'String', dataType: stringType },
            { id: 'pattern', label: 'Pattern', dataType: stringType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'index', label: 'Index', dataType: numberType },
            { id: 'found', label: 'Found', dataType: booleanType }
          ]
        );
      
      case nodeTypes.format:
        return createNodeData(
          type,
          'string',
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'template', label: 'Template', dataType: stringType },
            { id: 'values', label: 'Values', dataType: arrayType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'result', label: 'Result', dataType: stringType }
          ]
        );
      
      // Array Operations
      case nodeTypes.arrayLength:
        return createNodeData(
          type,
          'array' as NodeCategoryType,
          [
            { id: 'array', label: 'Array', dataType: arrayType }
          ],
          [
            { id: 'length', label: 'Length', dataType: numberType }
          ]
        );
      
      case nodeTypes.arrayGet:
        return createNodeData(
          type,
          'array' as NodeCategoryType,
          [
            { id: 'array', label: 'Array', dataType: arrayType },
            { id: 'index', label: 'Index', dataType: numberType }
          ],
          [
            { id: 'element', label: 'Element', dataType: anyType }
          ]
        );

      case nodeTypes.arraySet:
        return createNodeData(
          type,
          'array' as NodeCategoryType,
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'array', label: 'Array', dataType: arrayType },
            { id: 'index', label: 'Index', dataType: numberType },
            { id: 'value', label: 'Value', dataType: anyType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true }
          ]
        );

      case nodeTypes.arrayPush:
        return createNodeData(
          type,
          'array' as NodeCategoryType,
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'array', label: 'Array', dataType: arrayType },
            { id: 'value', label: 'Value', dataType: anyType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'length', label: 'New Length', dataType: numberType }
          ]
        );

      case nodeTypes.arrayPop:
        return createNodeData(
          type,
          'array' as NodeCategoryType,
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'array', label: 'Array', dataType: arrayType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'element', label: 'Popped Element', dataType: anyType }
          ]
        );

      case nodeTypes.arrayInsert:
        return createNodeData(
          type,
          'array' as NodeCategoryType,
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'array', label: 'Array', dataType: arrayType },
            { id: 'index', label: 'Index', dataType: numberType },
            { id: 'value', label: 'Value', dataType: anyType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'length', label: 'New Length', dataType: numberType }
          ]
        );

      case nodeTypes.arrayRemove:
        return createNodeData(
          type,
          'array' as NodeCategoryType,
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'array', label: 'Array', dataType: arrayType },
            { id: 'index', label: 'Index', dataType: numberType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'element', label: 'Removed Element', dataType: anyType }
          ]
        );

      case nodeTypes.arraySlice:
        return createNodeData(
          type,
          'array' as NodeCategoryType,
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'array', label: 'Array', dataType: arrayType },
            { id: 'start', label: 'Start', dataType: numberType },
            { id: 'end', label: 'End', dataType: numberType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'result', label: 'Result', dataType: arrayType }
          ]
        );

      case nodeTypes.arrayConcat:
        return createNodeData(
          type,
          'array' as NodeCategoryType,
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'array1', label: 'Array 1', dataType: arrayType },
            { id: 'array2', label: 'Array 2', dataType: arrayType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'result', label: 'Result', dataType: arrayType }
          ]
        );

      case nodeTypes.arrayFind:
        return createNodeData(
          type,
          'array' as NodeCategoryType,
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'array', label: 'Array', dataType: arrayType },
            { id: 'predicate', label: 'Predicate', dataType: 'function' as DataType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'result', label: 'Result', dataType: anyType },
            { id: 'found', label: 'Found', dataType: booleanType }
          ]
        );

      case nodeTypes.arrayFilter:
        return createNodeData(
          type,
          'array' as NodeCategoryType,
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'array', label: 'Array', dataType: arrayType },
            { id: 'predicate', label: 'Predicate', dataType: 'function' as DataType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'result', label: 'Result', dataType: arrayType }
          ]
        );

      case nodeTypes.arrayMap:
        return createNodeData(
          type,
          'array' as NodeCategoryType,
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'array', label: 'Array', dataType: arrayType },
            { id: 'transform', label: 'Transform', dataType: 'function' as DataType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'result', label: 'Result', dataType: arrayType }
          ]
        );

      case nodeTypes.arrayReduce:
        return createNodeData(
          type,
          'array' as NodeCategoryType,
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'array', label: 'Array', dataType: arrayType },
            { id: 'reducer', label: 'Reducer', dataType: 'function' as DataType },
            { id: 'initial', label: 'Initial Value', dataType: anyType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'result', label: 'Result', dataType: anyType }
          ]
        );

      case nodeTypes.arraySort:
        return createNodeData(
          type,
          'array' as NodeCategoryType,
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'array', label: 'Array', dataType: arrayType },
            { id: 'comparator', label: 'Comparator', dataType: 'function' as DataType, isOptional: true }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'result', label: 'Result', dataType: arrayType }
          ]
        );

      case nodeTypes.arrayReverse:
        return createNodeData(
          type,
          'array' as NodeCategoryType,
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'array', label: 'Array', dataType: arrayType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'result', label: 'Result', dataType: arrayType }
          ]
        );

      case nodeTypes.arrayJoin:
        return createNodeData(
          type,
          'array' as NodeCategoryType,
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'array', label: 'Array', dataType: arrayType },
            { id: 'separator', label: 'Separator', dataType: stringType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'result', label: 'Result', dataType: stringType }
          ]
        );

      case nodeTypes.arrayIncludes:
        return createNodeData(
          type,
          'array' as NodeCategoryType,
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'array', label: 'Array', dataType: arrayType },
            { id: 'value', label: 'Value', dataType: anyType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'result', label: 'Result', dataType: booleanType }
          ]
        );

      case nodeTypes.arrayIndexOf:
      case nodeTypes.arrayLastIndexOf:
        return createNodeData(
          type,
          'array' as NodeCategoryType,
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'array', label: 'Array', dataType: arrayType },
            { id: 'value', label: 'Value', dataType: anyType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'index', label: 'Index', dataType: numberType }
          ]
        );

      case nodeTypes.arrayClear:
        return createNodeData(
          type,
          'array' as NodeCategoryType,
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'array', label: 'Array', dataType: arrayType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true }
          ]
        );

      case nodeTypes.arrayIsEmpty:
        return createNodeData(
          type,
          'array' as NodeCategoryType,
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'array', label: 'Array', dataType: arrayType }
          ],
          [
            { id: 'exec', label: 'Exec', dataType: anyType, isExec: true },
            { id: 'result', label: 'Is Empty', dataType: booleanType }
          ]
        );

      default:
        return createNodeData(
          type,
          'math' as NodeCategoryType,
          [],
          []
        );
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
      
      // Logical Operations
      case nodeTypes.and:
      case nodeTypes.or:
      case nodeTypes.nand:
      case nodeTypes.nor:
      case nodeTypes.xor:
      case nodeTypes.xnor:
        return this.createBaseNode(type);

      case nodeTypes.not:
        return this.createBaseNode(type);

      // Comparison Operations
      case nodeTypes.equals:
      case nodeTypes.notEquals:
      case nodeTypes.greaterThan:
      case nodeTypes.lessThan:
      case nodeTypes.greaterThanOrEqual:
      case nodeTypes.lessThanOrEqual:
        return this.createBaseNode(type);

      case nodeTypes.between:
        return this.createBaseNode(type);

      // String Operations
      case nodeTypes.stringLength:
      case nodeTypes.concat:
      case nodeTypes.substring:
      case nodeTypes.trim:
      case nodeTypes.toUpperCase:
      case nodeTypes.toLowerCase:
      case nodeTypes.replace:
      case nodeTypes.split:
      case nodeTypes.indexOf:
      case nodeTypes.lastIndexOf:
      case nodeTypes.startsWith:
      case nodeTypes.endsWith:
      case nodeTypes.includes:
      case nodeTypes.repeat:
      case nodeTypes.charAt:
      case nodeTypes.padStart:
      case nodeTypes.padEnd:
      case nodeTypes.match:
      case nodeTypes.search:
      case nodeTypes.format:
        return this.createBaseNode(type);

      default:
        throw new Error(`Unknown node type: ${type}`);
    }
  }
} 