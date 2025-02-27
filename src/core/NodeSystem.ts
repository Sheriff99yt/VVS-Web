import { NodeCategory } from '../components/nodes/types';

/**
 * Type for data types supported by ports
 */
export type DataType = 'number' | 'integer' | 'boolean' | 'string' | 'vector' | 'transform' | 'rotator' | 'color' | 'struct' | 'class' | 'array' | 'function' | 'any';

/**
 * Enhanced port interface with validation support
 */
export interface IPort {
    id: string;                 // Unique identifier
    label: string;             // Display label
    dataType: DataType;        // Type of data handled
    isExec?: boolean;          // Execution port flag
    isInput: boolean;          // Input port flag
    isOptional?: boolean;      // Optional port flag
    validation?: {             // Optional validation rules
        required?: boolean;
        allowedTypes?: DataType[];
        customValidation?: (value: any) => boolean;
    };
}

/**
 * Enhanced node data interface
 */
export interface INodeData {
    id: string;               // Unique node identifier
    type: string;            // Node type identifier
    title: string;           // Display title
    category: NodeCategory;  // Node category
    inputs: IPort[];         // Input ports
    outputs: IPort[];        // Output ports
    position?: {             // Node position in graph
        x: number;
        y: number;
    };
    metadata?: {            // Optional metadata
        description?: string;
        tags?: string[];
        version?: string;
        deprecated?: boolean;
        complexity?: number;
        isPure?: boolean;    // Pure function flag
        isAsync?: boolean;   // Async operation flag
    };
}

/**
 * Node template interface for node creation
 */
export interface INodeTemplate {
    type: string;              // Node type identifier
    title: string;            // Display title
    description: string;      // Node description
    category: NodeCategory;   // Node category
    defaultInputs: IPort[];   // Default input configurations
    defaultOutputs: IPort[]; // Default output configurations
    metadata?: {             // Optional metadata
        description?: string;
        tags?: string[];
        version?: string;
        deprecated?: boolean;
        complexity?: number;
        isPure?: boolean;     // Pure function flag
        isAsync?: boolean;    // Async operation flag
        isStream?: boolean;   // Stream operation flag
        mode?: string;       // Operation mode
        encoding?: string;   // Data encoding
        createIfNotExists?: boolean; // File creation flag
        defaultPrompt?: string; // Default input prompt
    };
}

/**
 * Defines the available node types in the system.
 */
export enum NodeTypes {
    // Math operations
    ADD = 'add',
    SUBTRACT = 'subtract',
    MULTIPLY = 'multiply',
    DIVIDE = 'divide',
    MODULO = 'modulo',
    POWER = 'power',
    SQRT = 'sqrt',
    ABS = 'abs',
    NEGATE = 'negate',
    ROUND = 'round',
    FLOOR = 'floor',
    CEILING = 'ceiling',

    // Flow control
    IF = 'if',
    WHILE = 'while',
    FOR = 'for',
    SWITCH = 'switch',
    BREAK = 'break',
    CONTINUE = 'continue',

    // Data operations
    VARIABLE = 'variable',
    CONSTANT = 'constant',
    ARRAY = 'array',
    OBJECT = 'object',

    // Functions
    FUNCTION = 'function',
    RETURN = 'return',
    CALL = 'call',

    // I/O operations
    PRINT = 'print',
    INPUT = 'input',
    FILE_READ = 'file_read',
    FILE_WRITE = 'file_write'
}

/**
 * Node builder interface
 */
export interface INodeBuilder {
    setType(type: string): this;
    setTitle(title: string): this;
    setDescription(description: string): this;
    setCategory(category: NodeCategory): this;
    addInput(port: IPort): this;
    addOutput(port: IPort): this;
    setMetadata(metadata: INodeTemplate['metadata']): this;
    build(): INodeTemplate;
}

/**
 * Port factory interface
 */
export interface IPortFactory {
    createExecPort(id: string, label: string, isInput: boolean): IPort;
    createDataPort(
        id: string,
        label: string,
        dataType: DataType,
        isInput: boolean,
        validation?: IPort['validation']
    ): IPort;
}

/**
 * Node factory interface
 */
export interface INodeFactory {
    createNode(template: INodeTemplate): INodeData;
    registerTemplate(template: INodeTemplate): void;
    getTemplate(type: string): INodeTemplate | undefined;
    getTemplatesByCategory(category: NodeCategory): INodeTemplate[];
}

/**
 * Interface for port validation rules
 */
export interface IPortValidation {
    /** Whether the port value is required */
    required?: boolean;
    /** Array of allowed data types */
    allowedTypes?: DataType[];
    /** Custom validation function */
    customValidation?: (value: any) => boolean;
}

/**
 * Interface for node ports (inputs/outputs).
 */
export interface IPort {
    /** Unique identifier for the port */
    id: string;
    /** Display label for the port */
    label: string;
    /** Type of data this port handles */
    dataType: DataType;
    /** Whether this is an input port (false for output) */
    isInput: boolean;
    /** Whether this is an execution port (optional) */
    isExec?: boolean;
    /** Whether this port is optional (optional) */
    isOptional?: boolean;
    /** Validation rules for the port (optional) */
    validation?: IPortValidation;
}

/**
 * Interface for node data.
 */
export interface INodeData {
    /** Unique identifier for the node */
    id: string;
    /** Type identifier for the node */
    type: string;
    /** Display title for the node */
    title: string;
    /** Category the node belongs to */
    category: NodeCategory;
    /** Input ports for the node */
    inputs: IPort[];
    /** Output ports for the node */
    outputs: IPort[];
    /** Optional position in the graph */
    position?: { x: number; y: number };
    /** Optional data associated with the node */
    data?: Record<string, any>;
}

/**
 * Interface for node templates.
 */
export interface INodeTemplate {
    /** Type identifier for the node */
    type: string;
    /** Display title for the node */
    title: string;
    /** Description of the node's functionality */
    description: string;
    /** Category the node belongs to */
    category: NodeCategory;
    /** Default input ports for the node */
    defaultInputs: IPort[];
    /** Default output ports for the node */
    defaultOutputs: IPort[];
} 