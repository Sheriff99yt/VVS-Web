import { DataOperationBuilder } from '../DataOperationBuilder';
import { NodeTypes } from '../../NodeSystem';

describe('DataOperationBuilder', () => {
    let builder: DataOperationBuilder;

    beforeEach(() => {
        builder = new DataOperationBuilder();
    });

    describe('Variable Node', () => {
        it('should create variable node with get/set functionality', () => {
            const template = builder.createVariableNode('number').build();
            expect(template.type).toBe(NodeTypes.VARIABLE);
            expect(template.category).toBe('variables');

            // Check inputs
            const [execIn, setValue] = template.defaultInputs;
            expect(execIn.isExec).toBe(true);
            expect(setValue.dataType).toBe('number');

            // Check outputs
            const [getValue, execOut] = template.defaultOutputs;
            expect(getValue.dataType).toBe('number');
            expect(execOut.isExec).toBe(true);
        });
    });
});