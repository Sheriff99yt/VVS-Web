import { BaseNodeBuilder } from './NodeBuilder';
import { NodeTypes, DataType, IPort, IPortFactory, INodeTemplate } from '../NodeSystem';
import type { NodeCategory } from '../../components/nodes/types';
import { PortFactory } from '../PortFactory';

/**
 * Interface for file operation configuration
 */
export interface IFileOperation {
    mode: 'read' | 'write' | 'append';
    encoding?: 'utf8' | 'binary' | 'base64';
    createIfNotExists?: boolean;
}

/**
 * Builder for creating I/O operation nodes.
 * Handles console output, user input, and file operations.
 */
export class IOBuilder extends BaseNodeBuilder {
    private portFactory: PortFactory;

    constructor() {
        super();
        this.portFactory = new PortFactory();
        this.withCategory('io' as NodeCategory);
    }

    /**
     * Creates a print node for console output
     * @param dataType The type of data to print
     */
    public createPrintNode(dataType: DataType = 'any'): this {
        const execIn = this.portFactory.createExecPort('execIn', 'Exec', true);
        const value = this.portFactory.createDataPort('value', 'Value', dataType, true);
        const execOut = this.portFactory.createExecPort('execOut', 'Exec', false);

        if (dataType !== 'any') {
            value.validation = {
                required: true,
                allowedTypes: [dataType]
            };
        }

        return this
            .withType(NodeTypes.PRINT)
            .withTitle('Print')
            .withDescription('Print a value to the console')
            .withMetadata({ isAsync: false })
            .addInput(execIn)
            .addInput(value)
            .addOutput(execOut);
    }

    /**
     * Creates an input node for user input
     * @param dataType The expected type of input
     * @param prompt Optional prompt message
     */
    public createInputNode(dataType: DataType = 'string', prompt?: string): this {
        const execIn = this.portFactory.createExecPort('execIn', 'Exec', true);
        const promptValue = this.portFactory.createDataPort('prompt', 'Prompt', 'string', true);
        const execOut = this.portFactory.createExecPort('execOut', 'Exec', false);
        const value = this.portFactory.createDataPort('value', 'Value', dataType, false);

        promptValue.validation = {
            required: false,
            allowedTypes: ['string']
        };

        return this
            .withType(NodeTypes.INPUT)
            .withTitle('Input')
            .withDescription(`Get ${dataType} input from the user`)
            .withMetadata({ 
                isAsync: true,
                defaultPrompt: prompt
            })
            .addInput(execIn)
            .addInput(promptValue)
            .addOutput(execOut)
            .addOutput(value);
    }

    /**
     * Creates a file read node
     * @param encoding File encoding
     */
    public createFileReadNode(encoding: IFileOperation['encoding'] = 'utf8'): this {
        const execIn = this.portFactory.createExecPort('execIn', 'Exec', true);
        const path = this.portFactory.createDataPort('path', 'Path', 'string', true);
        const execOut = this.portFactory.createExecPort('execOut', 'Exec', false);
        const content = this.portFactory.createDataPort('content', 'Content', 'string', false);
        const error = this.portFactory.createDataPort('error', 'Error', 'string', false);

        path.validation = {
            required: true,
            allowedTypes: ['string']
        };

        return this
            .withType(NodeTypes.FILE_READ)
            .withTitle('File Read')
            .withDescription('Read content from a file')
            .withMetadata({ 
                isAsync: true,
                encoding,
                mode: 'read'
            })
            .addInput(execIn)
            .addInput(path)
            .addOutput(execOut)
            .addOutput(content)
            .addOutput(error);
    }

    /**
     * Creates a file write node
     * @param options File operation options
     */
    public createFileWriteNode(options: Partial<IFileOperation> = {}): this {
        const execIn = this.portFactory.createExecPort('execIn', 'Exec', true);
        const path = this.portFactory.createDataPort('path', 'Path', 'string', true);
        const content = this.portFactory.createDataPort('content', 'Content', 'string', true);
        const execOut = this.portFactory.createExecPort('execOut', 'Exec', false);
        const error = this.portFactory.createDataPort('error', 'Error', 'string', false);

        path.validation = {
            required: true,
            allowedTypes: ['string']
        };

        content.validation = {
            required: true,
            allowedTypes: ['string']
        };

        const metadata = {
            isAsync: true,
            mode: options.mode || 'write',
            encoding: options.encoding || 'utf8',
            createIfNotExists: options.createIfNotExists ?? true
        };

        return this
            .withType(NodeTypes.FILE_WRITE)
            .withTitle(metadata.mode === 'append' ? 'Append to File' : 'Write File')
            .withDescription(`${metadata.mode === 'append' ? 'Append' : 'Write'} content to a file`)
            .withMetadata(metadata)
            .addInput(execIn)
            .addInput(path)
            .addInput(content)
            .addOutput(execOut)
            .addOutput(error);
    }

    /**
     * Creates a stream read node for handling large files
     */
    public createStreamReadNode(): this {
        const execIn = this.portFactory.createExecPort('execIn', 'Exec', true);
        const path = this.portFactory.createDataPort('path', 'Path', 'string', true);
        const chunkSize = this.portFactory.createDataPort('chunkSize', 'Chunk Size', 'number', true);
        const execOut = this.portFactory.createExecPort('execOut', 'Exec', false);
        const chunk = this.portFactory.createDataPort('chunk', 'Chunk', 'string', false);
        const eof = this.portFactory.createDataPort('eof', 'End of File', 'boolean', false);
        const error = this.portFactory.createDataPort('error', 'Error', 'string', false);

        path.validation = {
            required: true,
            allowedTypes: ['string']
        };

        chunkSize.validation = {
            required: false,
            allowedTypes: ['number']
        };

        return this
            .withType(NodeTypes.FILE_READ)
            .withTitle('Stream Read')
            .withDescription('Read a file in chunks using a stream')
            .withMetadata({ 
                isAsync: true,
                isStream: true,
                mode: 'read'
            })
            .addInput(execIn)
            .addInput(path)
            .addInput(chunkSize)
            .addOutput(execOut)
            .addOutput(chunk)
            .addOutput(eof)
            .addOutput(error);
    }

    /**
     * Creates a stream write node for handling large files
     */
    public createStreamWriteNode(options: Partial<IFileOperation> = {}): this {
        const execIn = this.portFactory.createExecPort('execIn', 'Exec', true);
        const path = this.portFactory.createDataPort('path', 'Path', 'string', true);
        const chunk = this.portFactory.createDataPort('chunk', 'Chunk', 'string', true);
        const end = this.portFactory.createDataPort('end', 'End Stream', 'boolean', true);
        const execOut = this.portFactory.createExecPort('execOut', 'Exec', false);
        const error = this.portFactory.createDataPort('error', 'Error', 'string', false);

        path.validation = {
            required: true,
            allowedTypes: ['string']
        };

        chunk.validation = {
            required: true,
            allowedTypes: ['string']
        };

        end.validation = {
            required: false,
            allowedTypes: ['boolean']
        };

        const metadata = {
            isAsync: true,
            isStream: true,
            mode: options.mode || 'write',
            encoding: options.encoding || 'utf8',
            createIfNotExists: options.createIfNotExists ?? true
        };

        return this
            .withType(NodeTypes.FILE_WRITE)
            .withTitle('Stream Write')
            .withDescription('Write to a file in chunks using a stream')
            .withMetadata(metadata)
            .addInput(execIn)
            .addInput(path)
            .addInput(chunk)
            .addInput(end)
            .addOutput(execOut)
            .addOutput(error);
    }

    buildConsoleLogNode(): INodeTemplate {
        const execIn = this.portFactory.createExecPort('execIn', 'Exec', true);
        const execOut = this.portFactory.createExecPort('execOut', 'Exec', false);
        const message = this.portFactory.createDataPort('message', 'Message', 'string', true);

        return {
            type: 'io/console-log',
            title: 'Console Log',
            description: 'Log a message to the console',
            category: 'io',
            defaultInputs: [execIn, message],
            defaultOutputs: [execOut]
        };
    }

    buildFileReadNode(): INodeTemplate {
        const execIn = this.portFactory.createExecPort('execIn', 'Exec', true);
        const execOut = this.portFactory.createExecPort('execOut', 'Exec', false);
        const path = this.portFactory.createDataPort('path', 'Path', 'string', true);
        const content = this.portFactory.createDataPort('content', 'Content', 'string', false);

        return {
            type: 'io/file-read',
            title: 'File Read',
            description: 'Read content from a file',
            category: 'io',
            defaultInputs: [execIn, path],
            defaultOutputs: [execOut, content]
        };
    }

    buildFileWriteNode(): INodeTemplate {
        const execIn = this.portFactory.createExecPort('execIn', 'Exec', true);
        const execOut = this.portFactory.createExecPort('execOut', 'Exec', false);
        const path = this.portFactory.createDataPort('path', 'Path', 'string', true);
        const content = this.portFactory.createDataPort('content', 'Content', 'string', true);

        return {
            type: 'io/file-write',
            title: 'File Write',
            description: 'Write content to a file',
            category: 'io',
            defaultInputs: [execIn, path, content],
            defaultOutputs: [execOut]
        };
    }

    buildHttpRequestNode(): INodeTemplate {
        const execIn = this.portFactory.createExecPort('execIn', 'Exec', true);
        const execOut = this.portFactory.createExecPort('execOut', 'Exec', false);
        const url = this.portFactory.createDataPort('url', 'URL', 'string', true);
        const method = this.portFactory.createDataPort('method', 'Method', 'string', true);
        const headers = this.portFactory.createDataPort('headers', 'Headers', 'object', true);
        const body = this.portFactory.createDataPort('body', 'Body', 'string', true);
        const response = this.portFactory.createDataPort('response', 'Response', 'object', false);

        return {
            type: 'io/http-request',
            title: 'HTTP Request',
            description: 'Make an HTTP request',
            category: 'io',
            defaultInputs: [execIn, url, method, headers, body],
            defaultOutputs: [execOut, response]
        };
    }

    buildWebSocketNode(): INodeTemplate {
        const execIn = this.portFactory.createExecPort('execIn', 'Exec', true);
        const execOut = this.portFactory.createExecPort('execOut', 'Exec', false);
        const url = this.portFactory.createDataPort('url', 'URL', 'string', true);
        const message = this.portFactory.createDataPort('message', 'Message', 'string', true);
        const received = this.portFactory.createDataPort('received', 'Received', 'string', false);

        return {
            type: 'io/websocket',
            title: 'WebSocket',
            description: 'Connect to a WebSocket server',
            category: 'io',
            defaultInputs: [execIn, url, message],
            defaultOutputs: [execOut, received]
        };
    }

    buildDatabaseQueryNode(): INodeTemplate {
        const execIn = this.portFactory.createExecPort('execIn', 'Exec', true);
        const execOut = this.portFactory.createExecPort('execOut', 'Exec', false);
        const query = this.portFactory.createDataPort('query', 'Query', 'string', true);
        const params = this.portFactory.createDataPort('params', 'Parameters', 'object', true);
        const results = this.portFactory.createDataPort('results', 'Results', 'object', false);

        return {
            type: 'io/database-query',
            title: 'Database Query',
            description: 'Execute a database query',
            category: 'io',
            defaultInputs: [execIn, query, params],
            defaultOutputs: [execOut, results]
        };
    }
} 