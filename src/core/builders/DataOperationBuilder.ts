import { BaseNodeBuilder } from './NodeBuilder';
import { NodeTypes, IPort, DataType } from '../NodeSystem';
import { PortFactory } from '../PortFactory';
import { NodeCategory } from '../../components/nodes/types';

/**
 * Builder for creating data operation nodes.
 * Handles variables, constants, arrays, and objects.
 */
export class DataOperationBuilder extends BaseNodeBuilder {
    constructor() {
        super();
        this.withCategory('variables' as NodeCategory);
    }

    /**
     * Creates a variable node with get/set functionality
     * @param dataType The type of data to store
     */
    public createVariableNode(dataType: DataType = 'number'): this {
        return this
            .withType(NodeTypes.VARIABLE)
            .withTitle('Variable')
            .withDescription('Stores and retrieves a value')
            .addInput(PortFactory.createExecInput())
            .addInput(PortFactory.createDataInput('value', 'Set Value', dataType, true))
            .addOutput(PortFactory.createDataOutput('value', 'Get Value', dataType))
            .addOutput(PortFactory.createExecOutput());
    }

    /**
     * Creates a constant node that outputs a fixed value
     * @param value The constant value
     * @param type The data type of the constant
     */
    public createConstantNode(value: any, type: DataType = 'string'): this {
        return this
            .withType(NodeTypes.CONSTANT)
            .withTitle('Constant')
            .withDescription('A constant value')
            .addOutput(PortFactory.createDataOutput('value', 'Value', type))
            .withMetadata({
                description: `Constant ${type} value: ${value}`,
                isPure: true,
                tags: [`${type}-constant`]
            });
    }

    /**
     * Creates an array node with operations for array manipulation
     * @param elementType The type of elements in the array
     */
    public createArrayNode(elementType: DataType = 'any'): this {
        return this
            .withType(NodeTypes.ARRAY)
            .withTitle('Array')
            .withDescription('Array operations')
            .addInput(PortFactory.createExecInput())
            .addInput(PortFactory.createDataInput('array', 'Array', 'array', true))
            .addInput(PortFactory.createDataInput('index', 'Index', 'number', true))
            .addInput(PortFactory.createDataInput('value', 'Set Value', elementType, true))
            .addOutput(PortFactory.createExecOutput())
            .addOutput(PortFactory.createDataOutput('length', 'Length', 'number'))
            .addOutput(PortFactory.createDataOutput('element', 'Get Value', elementType));
    }

    /**
     * Creates an object node for working with object properties
     */
    public createObjectNode(): this {
        return this
            .withType(NodeTypes.OBJECT)
            .withTitle('Object')
            .withDescription('Object operations')
            .addInput(PortFactory.createExecInput())
            .addInput(PortFactory.createDataInput('object', 'Object', 'struct', true))
            .addInput(PortFactory.createDataInput('key', 'Key', 'string', true))
            .addInput(PortFactory.createDataInput('value', 'Set Value', 'any'))
            .addOutput(PortFactory.createExecOutput())
            .addOutput(PortFactory.createDataOutput('value', 'Get Value', 'any'));
    }
} 