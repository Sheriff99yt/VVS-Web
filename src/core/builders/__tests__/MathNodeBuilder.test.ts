import { MathNodeBuilder } from '../MathNodeBuilder';
import { NodeTypes } from '../../NodeSystem';

describe('MathNodeBuilder', () => {
    let builder: MathNodeBuilder;

    beforeEach(() => {
        builder = new MathNodeBuilder();
    });

    describe('Unary Operations', () => {
        it('should create sqrt node', () => {
            const template = builder.createSqrtNode().build();
            expect(template.type).toBe(NodeTypes.SQRT);
            expect(template.category).toBe('math');
            expect(template.defaultInputs).toHaveLength(2); // exec + value
            expect(template.defaultOutputs).toHaveLength(2); // exec + result
        });

        it('should create abs node', () => {
            const template = builder.createAbsNode().build();
            expect(template.type).toBe(NodeTypes.ABS);
            expect(template.defaultInputs[1].label).toBe('Value');
            expect(template.defaultOutputs[1].label).toBe('Result');
        });

        it('should create negate node', () => {
            const template = builder.createNegateNode().build();
            expect(template.type).toBe(NodeTypes.NEGATE);
            expect(template.defaultInputs[1].dataType).toBe('number');
            expect(template.defaultOutputs[1].dataType).toBe('number');
        });
    });

    describe('Binary Operations', () => {
        it('should create add node', () => {
            const template = builder.createAddNode().build();
            expect(template.type).toBe(NodeTypes.ADD);
            expect(template.category).toBe('math');
            expect(template.defaultInputs).toHaveLength(3); // exec + a + b
            expect(template.defaultOutputs).toHaveLength(2); // exec + result
        });

        it('should create subtract node', () => {
            const template = builder.createSubtractNode().build();
            expect(template.type).toBe(NodeTypes.SUBTRACT);
            expect(template.defaultInputs[1].label).toBe('A');
            expect(template.defaultInputs[2].label).toBe('B');
        });

        it('should create multiply node', () => {
            const template = builder.createMultiplyNode().build();
            expect(template.type).toBe(NodeTypes.MULTIPLY);
            expect(template.defaultInputs[1].dataType).toBe('number');
            expect(template.defaultInputs[2].dataType).toBe('number');
        });

        it('should create divide node', () => {
            const template = builder.createDivideNode().build();
            expect(template.type).toBe(NodeTypes.DIVIDE);
            expect(template.defaultOutputs[1].label).toBe('Result');
            expect(template.defaultOutputs[1].dataType).toBe('number');
        });

        it('should create power node', () => {
            const template = builder.createPowerNode().build();
            expect(template.type).toBe(NodeTypes.POWER);
            expect(template.title).toBe('Power');
            expect(template.description).toBe('Raises the first number to the power of the second');
        });
    });

    describe('Builder Validation', () => {
        it('should require type', () => {
            expect(() => builder.build()).toThrow('Node type is required');
        });

        it('should require title', () => {
            expect(() => builder.withType('test').build()).toThrow('Node title is required');
        });

        it('should require description', () => {
            expect(() => builder
                .withType('test')
                .withTitle('Test')
                .build()
            ).toThrow('Node description is required');
        });

        it('should allow custom binary operation', () => {
            const template = builder.createBinaryOperation(
                NodeTypes.ADD,
                'Custom Add',
                'Custom addition node'
            ).build();
            expect(template.type).toBe(NodeTypes.ADD);
            expect(template.title).toBe('Custom Add');
            expect(template.description).toBe('Custom addition node');
        });

        it('should allow custom unary operation', () => {
            const template = builder.createUnaryOperation(
                NodeTypes.SQRT,
                'Custom Sqrt',
                'Custom square root node'
            ).build();
            expect(template.type).toBe(NodeTypes.SQRT);
            expect(template.title).toBe('Custom Sqrt');
            expect(template.description).toBe('Custom square root node');
        });
    });

    describe('Port Configuration', () => {
        it('should configure exec ports correctly', () => {
            const template = builder.createAddNode().build();
            const inputExec = template.defaultInputs[0];
            const outputExec = template.defaultOutputs[0];

            expect(inputExec.isExec).toBe(true);
            expect(inputExec.isInput).toBe(true);
            expect(outputExec.isExec).toBe(true);
            expect(outputExec.isInput).toBe(false);
        });

        it('should configure data ports correctly', () => {
            const template = builder.createAddNode().build();
            const inputA = template.defaultInputs[1];
            const inputB = template.defaultInputs[2];
            const output = template.defaultOutputs[1];

            expect(inputA.dataType).toBe('number');
            expect(inputB.dataType).toBe('number');
            expect(output.dataType).toBe('number');
            expect(inputA.isExec).toBeUndefined();
            expect(output.isExec).toBeUndefined();
        });
    });
}); 