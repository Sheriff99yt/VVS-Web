import { NodeFunctionStructure } from '../FunctionDB';

export type Language = 'typescript' | 'python' | 'java' | 'rust';

export interface FunctionImplementation extends Omit<NodeFunctionStructure, 'id' | 'name' | 'category' | 'description' | 'language' | 'created' | 'modified'> {
    // Access and modifiers
    accessModifier: string;    // public, private, protected, pub, etc.
    isStatic: string;         // static, @staticmethod, etc.
    isAsync: string;          // async, async def, etc.
    isFinal: string;          // final, readonly, etc.
    isAbstract: string;       // abstract, virtual, etc.
    
    // Type information
    returnType: string;           // The function return type
    genericTypes: string;         // <T>, <T extends Base>, etc.
    genericConstraints: string;   // where T: Clone, T extends Base, etc.
    
    // Parameters
    parameters: {
        text: string;            // Full parameter text
        defaultValue: string;    // Default value if any
        isOptional: string;      // Optional marker
        isRest: string;         // Rest/spread parameter
        isReference: string;    // ref, &mut, etc.
        decorators: string;     // Parameter decorators
    }[];
    
    // Function structure
    throws: string;             // Exception/error types
    bodyPrefix: string;         // Opening of function body
    bodySuffix: string;         // Closing of function body
    
    // Code sections
    decorators: string;         // Function decorators
    attributes: string;         // [Attributes], #[derive], etc.
    validation: string;         // Parameter validation code
    implementation: string;     // Main implementation code
    errorHandling: string;      // Error handling code
    
    // Language-specific features
    lifetimeAnnotations: string;  // Rust lifetime annotations
    mutabilityModifiers: string;  // mut, const, etc.
    typeGuards: string;          // TypeScript type guards
    yieldStatements: string;     // Generator functions
    asyncModifiers: string;      // async/await specific modifiers
}

export interface FunctionTemplate {
    id: number;
    name: string;
    category: string;
    description: string;
    implementations: {
        [key in Language]?: FunctionImplementation;
    };
    created: string;
    modified: string;
}

export interface FunctionData {
    version: number;
    languages: Language[];
    functions: FunctionTemplate[];
}

export default FunctionData; 