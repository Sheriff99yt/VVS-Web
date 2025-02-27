import { BaseNodeBuilder } from './NodeBuilder';
import { NodeTypes, IPort } from '../NodeSystem';
import { PortFactory } from '../PortFactory';

/**
 * Builder for creating math operation nodes.
 * Provides convenient methods for creating common math operations.
 */
export class MathNodeBuilder extends BaseNodeBuilder {
    constructor() {
        super();
        this.withCategory('math');
    }

    /**
     * Creates a basic math operation node
     * @param type Operation type (add, subtract, etc.)
     * @param title Display title
     * @param description Operation description
     */
    public createBasicOperation(type: string, title: string, description: string): this {
        return this
            .withType(type)
            .withTitle(title)
            .withDescription(description)
            .addInput(PortFactory.createExecInput())
            .addInput(PortFactory.createDataInput('a', 'A', 'number', true))
            .addInput(PortFactory.createDataInput('b', 'B', 'number', true))
            .addOutput(PortFactory.createExecOutput())
            .addOutput(PortFactory.createDataOutput('result', 'Result', 'number'));
    }

    /**
     * Creates an add node
     */
    public createAddNode(): this {
        return this.createBasicOperation(
            NodeTypes.ADD,
            'Add',
            'Adds two numbers'
        );
    }

    /**
     * Creates a subtract node
     */
    public createSubtractNode(): this {
        return this.createBasicOperation(
            NodeTypes.SUBTRACT,
            'Subtract',
            'Subtracts second number from first'
        );
    }

    /**
     * Creates a multiply node
     */
    public createMultiplyNode(): this {
        return this.createBasicOperation(
            NodeTypes.MULTIPLY,
            'Multiply',
            'Multiplies two numbers'
        );
    }

    /**
     * Creates a divide node
     */
    public createDivideNode(): this {
        return this.createBasicOperation(
            NodeTypes.DIVIDE,
            'Divide',
            'Divides first number by second'
        );
    }

    /**
     * Creates a modulo node
     */
    public createModuloNode(): this {
        return this.createBasicOperation(
            NodeTypes.MODULO,
            'Modulo',
            'Remainder after division'
        );
    }

    /**
     * Creates a power node
     */
    public createPowerNode(): this {
        return this.createBasicOperation(
            NodeTypes.POWER,
            'Power',
            'Raises the first number to the power of the second'
        );
    }

    /**
     * Creates a square root node
     */
    public createSqrtNode(): this {
        return this
            .withType(NodeTypes.SQRT)
            .withTitle('Square Root')
            .withDescription('Calculates square root')
            .addInput(PortFactory.createExecInput())
            .addInput(PortFactory.createDataInput('value', 'Value', 'number', true))
            .addOutput(PortFactory.createExecOutput())
            .addOutput(PortFactory.createDataOutput('result', 'Result', 'number'));
    }

    /**
     * Creates an absolute value node
     */
    public createAbsNode(): this {
        return this
            .withType(NodeTypes.ABS)
            .withTitle('Absolute')
            .withDescription('Calculates absolute value')
            .addInput(PortFactory.createExecInput())
            .addInput(PortFactory.createDataInput('value', 'Value', 'number', true))
            .addOutput(PortFactory.createExecOutput())
            .addOutput(PortFactory.createDataOutput('result', 'Result', 'number'));
    }

    /**
     * Creates a negate node
     */
    public createNegateNode(): this {
        return this
            .withType(NodeTypes.NEGATE)
            .withTitle('Negate')
            .withDescription('Changes sign of number')
            .addInput(PortFactory.createExecInput())
            .addInput(PortFactory.createDataInput('value', 'Value', 'number', true))
            .addOutput(PortFactory.createExecOutput())
            .addOutput(PortFactory.createDataOutput('result', 'Result', 'number'));
    }

    /**
     * Creates a round node
     */
    public createRoundNode(): this {
        return this
            .withType(NodeTypes.ROUND)
            .withTitle('Round')
            .withDescription('Rounds to nearest integer')
            .addInput(PortFactory.createExecInput())
            .addInput(PortFactory.createDataInput('value', 'Value', 'number', true))
            .addOutput(PortFactory.createExecOutput())
            .addOutput(PortFactory.createDataOutput('result', 'Result', 'number'));
    }

    /**
     * Creates a floor node
     */
    public createFloorNode(): this {
        return this
            .withType(NodeTypes.FLOOR)
            .withTitle('Floor')
            .withDescription('Rounds down to nearest integer')
            .addInput(PortFactory.createExecInput())
            .addInput(PortFactory.createDataInput('value', 'Value', 'number', true))
            .addOutput(PortFactory.createExecOutput())
            .addOutput(PortFactory.createDataOutput('result', 'Result', 'number'));
    }

    /**
     * Creates a ceiling node
     */
    public createCeilingNode(): this {
        return this
            .withType(NodeTypes.CEILING)
            .withTitle('Ceiling')
            .withDescription('Rounds up to nearest integer')
            .addInput(PortFactory.createExecInput())
            .addInput(PortFactory.createDataInput('value', 'Value', 'number', true))
            .addOutput(PortFactory.createExecOutput())
            .addOutput(PortFactory.createDataOutput('result', 'Result', 'number'));
    }

    /**
     * Creates a custom binary operation node
     * @param type Operation type
     * @param title Display title
     * @param description Operation description
     */
    public createBinaryOperation(type: string, title: string, description: string): this {
        return this.createBasicOperation(type, title, description);
    }

    /**
     * Creates a custom unary operation node
     * @param type Operation type
     * @param title Display title
     * @param description Operation description
     */
    public createUnaryOperation(type: string, title: string, description: string): this {
        return this
            .withType(type)
            .withTitle(title)
            .withDescription(description)
            .addInput(PortFactory.createExecInput())
            .addInput(PortFactory.createDataInput('value', 'Value', 'number', true))
            .addOutput(PortFactory.createExecOutput())
            .addOutput(PortFactory.createDataOutput('result', 'Result', 'number'));
    }
} 