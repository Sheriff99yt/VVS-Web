import { Deprecated, DeprecatedMethod } from '../../utils/deprecation';
import type { DataType, NodeCategory, Port } from './types';

/**
 * @deprecated Use INodeData from new system instead
 * Will be removed in version 2.0.0
 */
export interface CustomNodeData {
    title: string;
    inputs?: Port[];
    outputs?: Port[];
    category?: NodeCategory;
    variableType?: DataType;
    operation?: string;
    initialValue?: string;
    isPure?: boolean;
    isEvent?: boolean;
    description?: string;
}

/**
 * @deprecated Use NodeTypes enum from new system instead
 * Will be removed in version 2.0.0
 */
export const nodeTypes = {
    // Control Flow
    ifStatement: 'ifStatement',
    forLoop: 'forLoop',
    
    // Output
    print: 'print',
    
    // Variables
    variable: 'variable',
    
    // Math Operations
    add: 'add',
    subtract: 'subtract',
    multiply: 'multiply',
    divide: 'divide',
    power: 'power',
    sqrt: 'sqrt',
    abs: 'abs',
    modulo: 'modulo',
    
    // Trigonometry
    sin: 'sin',
    cos: 'cos',
    tan: 'tan',
    
    // String Operations
    stringLength: 'stringLength',
    concat: 'concat',
    substring: 'substring',
    
    // Array Operations
    arrayLength: 'arrayLength',
    arrayGet: 'arrayGet',
    arraySet: 'arraySet'
} as const;

/**
 * @deprecated Use NodeCategory enum from new system instead
 * Will be removed in version 2.0.0
 */
export const categories = [
    { id: 'flow-control' as NodeCategory, label: 'Control Flow' },
    { id: 'variables' as NodeCategory, label: 'Variables' },
    { id: 'io' as NodeCategory, label: 'Input/Output' },
    { id: 'math' as NodeCategory, label: 'Mathematics' },
    { id: 'string' as NodeCategory, label: 'String' },
    { id: 'logical' as NodeCategory, label: 'Logical' },
    { id: 'comparison' as NodeCategory, label: 'Comparison' },
    { id: 'array' as NodeCategory, label: 'Array' }
] as const;

/**
 * @deprecated Use PortFactory from new system instead
 * Will be removed in version 2.0.0
 */
export class PortUtils {
    /**
     * @deprecated Use PortFactory.createExecPort() instead
     * Will be removed in version 2.0.0
     */
    static createExecPort(id: string, label: string, isInput = true): Port {
        console.warn('[Deprecated] PortUtils.createExecPort: Use PortFactory.createExecPort() instead');
        return {
            id,
            label,
            dataType: 'any',
            isExec: true,
            isInput,
            isOutput: !isInput
        };
    }

    /**
     * @deprecated Use PortFactory.createDataPort() instead
     * Will be removed in version 2.0.0
     */
    static createDataPort(id: string, label: string, dataType: DataType, isInput = true): Port {
        console.warn('[Deprecated] PortUtils.createDataPort: Use PortFactory.createDataPort() instead');
        return {
            id,
            label,
            dataType,
            isInput,
            isOutput: !isInput
        };
    }
}

/**
 * @deprecated Use NodeBuilder from new system instead
 * Will be removed in version 2.0.0
 */
export class NodeUtils {
    /**
     * @deprecated Use MathNodeBuilder.createUnary() instead
     * Will be removed in version 2.0.0
     */
    static createUnaryMathNode(title: string) {
        console.warn('[Deprecated] NodeUtils.createUnaryMathNode: Use MathNodeBuilder.createUnary() instead');
        // Implementation
    }

    /**
     * @deprecated Use MathNodeBuilder.createBinary() instead
     * Will be removed in version 2.0.0
     */
    static createBinaryMathNode(title: string) {
        console.warn('[Deprecated] NodeUtils.createBinaryMathNode: Use MathNodeBuilder.createBinary() instead');
        // Implementation
    }

    /**
     * @deprecated Use StringNodeBuilder.createUnary() instead
     * Will be removed in version 2.0.0
     */
    static createUnaryStringNode(title: string, description: string) {
        console.warn('[Deprecated] NodeUtils.createUnaryStringNode: Use StringNodeBuilder.createUnary() instead');
        // Implementation
    }

    /**
     * @deprecated Use StringNodeBuilder.createBinary() instead
     * Will be removed in version 2.0.0
     */
    static createBinaryStringNode(title: string, description: string) {
        console.warn('[Deprecated] NodeUtils.createBinaryStringNode: Use StringNodeBuilder.createBinary() instead');
        // Implementation
    }
} 