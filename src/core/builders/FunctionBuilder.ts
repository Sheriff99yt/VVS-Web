import { BaseNodeBuilder } from './NodeBuilder';
import { NodeTypes, DataType, INodeTemplate } from '../NodeSystem';
import type { NodeCategory } from '../../components/nodes/types';
import { PortFactory } from '../PortFactory';

/**
 * Interface for function parameter configuration
 */
export interface IFunctionParameter {
    name: string;
    type: DataType;
    isOptional?: boolean;
    defaultValue?: any;
}

/**
 * Builder for creating function-related nodes.
 * Handles function definitions, calls, and returns.
 */
export class FunctionBuilder extends BaseNodeBuilder {
    private portFactory: PortFactory;

    constructor() {
        super();
        this.portFactory = new PortFactory();
        this.withCategory('pure-function' as NodeCategory);
    }

    /**
     * Creates a function definition node
     * @param parameters Array of parameter configurations
     * @param returnType The function's return type
     */
    public createFunctionNode(parameters: IFunctionParameter[], returnType: DataType = 'any'): this {
        const execIn = this.portFactory.createExecPort('execIn', 'Exec', true);
        const execOut = this.portFactory.createExecPort('execOut', 'Exec', false);
        const bodyExec = this.portFactory.createExecPort('body', 'Body', false);
        const returnValue = this.portFactory.createDataPort('return', 'Return Value', returnType, true);

        // Add validation for return value if specified
        if (returnType !== 'any') {
            returnValue.validation = {
                required: true,
                allowedTypes: [returnType]
            };
        }

        // Start building with base ports
        this.withType(NodeTypes.FUNCTION)
            .withTitle('Function')
            .withDescription('Function definition with parameters and return value')
            .addInput(execIn)
            .addInput(returnValue)
            .addOutput(execOut)
            .addOutput(bodyExec);

        // Add parameter ports
        parameters.forEach(param => {
            const paramPort = param.isOptional
                ? this.portFactory.createOptionalDataPort(
                    param.name,
                    param.name,
                    param.type,
                    false
                )
                : this.portFactory.createDataPort(
                    param.name,
                    param.name,
                    param.type,
                    false
                );

            if (param.type !== 'any') {
                paramPort.validation = {
                    required: !param.isOptional,
                    allowedTypes: [param.type]
                };
            }

            this.addOutput(paramPort);
        });

        return this;
    }

    /**
     * Creates a function call node
     * @param parameters Array of parameter configurations
     * @param returnType The function's return type
     */
    public createCallNode(parameters: IFunctionParameter[], returnType: DataType = 'any'): this {
        const execIn = this.portFactory.createExecPort('execIn', 'Exec', true);
        const execOut = this.portFactory.createExecPort('execOut', 'Exec', false);
        const returnValue = this.portFactory.createDataPort('return', 'Return Value', returnType, false);

        // Start building with base ports
        this.withType(NodeTypes.CALL)
            .withTitle('Function Call')
            .withDescription('Call a function with parameters')
            .addInput(execIn)
            .addOutput(execOut)
            .addOutput(returnValue);

        // Add parameter ports
        parameters.forEach(param => {
            const paramPort = param.isOptional
                ? this.portFactory.createOptionalDataPort(
                    param.name,
                    param.name,
                    param.type,
                    true
                )
                : this.portFactory.createDataPort(
                    param.name,
                    param.name,
                    param.type,
                    true
                );

            if (param.type !== 'any') {
                paramPort.validation = {
                    required: !param.isOptional,
                    allowedTypes: [param.type]
                };
            }

            this.addInput(paramPort);
        });

        return this;
    }

    /**
     * Creates a return node for returning values from functions
     * @param returnType The type of value to return
     */
    public createReturnNode(returnType: DataType = 'any'): this {
        const valueInput = PortFactory.createDataInput('value', 'Value', returnType);
        if (returnType !== 'any') {
            valueInput.validation = {
                required: true,
                allowedTypes: [returnType]
            };
        } else {
            valueInput.validation = undefined;
        }
        return this
            .withType(NodeTypes.RETURN)
            .withTitle('Return')
            .withDescription('Return a value from the function')
            .addInput(PortFactory.createExecInput())
            .addInput(valueInput);
    }

    /**
     * Creates a pure function node (no side effects)
     * @param parameters Array of parameter configurations
     * @param returnType The function's return type
     */
    public createPureFunctionNode(parameters: IFunctionParameter[], returnType: DataType): this {
        return this
            .createFunctionNode(parameters, returnType)
            .withMetadata({
                isPure: true
            });
    }

    buildFunctionNode(): INodeTemplate {
        const execIn = this.portFactory.createExecPort('execIn', 'Exec', true);
        const execOut = this.portFactory.createExecPort('execOut', 'Exec', false);
        const func = this.portFactory.createDataPort('function', 'Function', 'function', true);
        const args = this.portFactory.createDataPort('args', 'Arguments', 'array', true);
        const result = this.portFactory.createDataPort('result', 'Result', 'any', false);

        return {
            type: 'function/call',
            title: 'Call Function',
            description: 'Call a JavaScript function',
            category: 'pure-function',
            defaultInputs: [execIn, func, args],
            defaultOutputs: [execOut, result]
        };
    }

    buildAsyncFunctionNode(): INodeTemplate {
        const execIn = this.portFactory.createExecPort('execIn', 'Exec', true);
        const execOut = this.portFactory.createExecPort('execOut', 'Exec', false);
        const func = this.portFactory.createDataPort('function', 'Function', 'function', true);
        const args = this.portFactory.createDataPort('args', 'Arguments', 'array', true);
        const result = this.portFactory.createDataPort('result', 'Result', 'any', false);

        return {
            type: 'function/async-call',
            title: 'Call Async Function',
            description: 'Call an asynchronous JavaScript function',
            category: 'pure-function',
            defaultInputs: [execIn, func, args],
            defaultOutputs: [execOut, result]
        };
    }

    buildMethodNode(): INodeTemplate {
        const execIn = this.portFactory.createExecPort('execIn', 'Exec', true);
        const execOut = this.portFactory.createExecPort('execOut', 'Exec', false);
        const obj = this.portFactory.createDataPort('object', 'Object', 'struct', true);
        const method = this.portFactory.createDataPort('method', 'Method', 'string', true);
        const args = this.portFactory.createDataPort('args', 'Arguments', 'array', true);
        const result = this.portFactory.createDataPort('result', 'Result', 'any', false);

        return {
            type: 'function/method-call',
            title: 'Call Method',
            description: 'Call a method on an object',
            category: 'pure-function',
            defaultInputs: [execIn, obj, method, args],
            defaultOutputs: [execOut, result]
        };
    }
} 