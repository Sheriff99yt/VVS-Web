/**
 * Core data models for the VVS Web syntax database
 * These interfaces define the structure of language definitions, function definitions,
 * syntax patterns, and type mappings used throughout the system.
 */

/**
 * Represents a programming language supported by the system
 */
export interface Language {
    id?: number;                  // Unique language identifier (optional when creating new)
    name: string;                 // Display name (e.g., "Python")
    version: string;              // Language version (e.g., "3.11")
    fileExtension: string;        // Default file extension (e.g., ".py")
    syntaxRules: SyntaxRules;     // Language-specific syntax rules
    isEnabled: boolean;           // Whether the language is available for use
}

/**
 * Defines the syntax rules for a specific language
 */
export interface SyntaxRules {
    statementDelimiter: string;      // How statements are terminated (e.g., ";", "\n")
    blockStart: string;              // How blocks begin (e.g., "{", ":")
    blockEnd: string;                // How blocks end (e.g., "}", indentation)
    commentSingle: string;           // Single-line comment prefix (e.g., "//", "#")
    commentMultiStart: string;       // Multi-line comment start (e.g., "/*", "'''")
    commentMultiEnd: string;         // Multi-line comment end (e.g., "*/", "'''")
    stringDelimiters: string[];      // Valid string delimiters (e.g., ['"', "'", "`"])
    indentationStyle: 'space' | 'tab'; // Preferred indentation style
    indentationSize: number;         // Number of spaces per indent
    functionDefinitionPattern: string; // Template for function definitions
    variableDeclarationPattern: string; // Template for variable declarations
    operatorPatterns: {              // Templates for common operators
        [key: string]: string;       // e.g., { "add": "{0} + {1}" }
    };
}

/**
 * Categories for organizing function definitions
 */
export enum FunctionCategory {
    MATH = "Math",
    STRING = "String",
    ARRAY = "Array",
    OBJECT = "Object",
    CONTROL_FLOW = "Control Flow",
    IO = "Input/Output",
    CONVERSION = "Conversion",
    DATE_TIME = "Date & Time",
    UTILITY = "Utility",
    CUSTOM = "Custom"
}

/**
 * Defines a function that can be used in the visual programming interface
 */
export interface FunctionDefinition {
    id?: number;                     // Unique function identifier (optional when creating new)
    name: string;                    // Internal name (e.g., "math_add")
    displayName: string;             // User-visible name (e.g., "Add")
    description: string;             // Description of what the function does
    category: string;                // Function category (e.g., "Math", "String")
    parameters: Parameter[];         // Function parameters
    returnType: string;              // Return type name (abstract type)
    isBuiltIn: boolean;              // Whether this is a built-in function
    tags: string[];                  // Tags for searching and filtering
}

/**
 * Defines a parameter for a function
 */
export interface Parameter {
    name: string;                    // Parameter name
    type: string;                    // Abstract type name
    description: string;             // Parameter description
    isRequired: boolean;             // Whether parameter is required
    defaultValue?: any;              // Default value if not provided
}

/**
 * The type of pattern to use in code generation
 */
export enum PatternType {
    EXPRESSION = "expression",       // Returns a value, can be used in expressions
    STATEMENT = "statement",         // Standalone statement (e.g., variable declaration)
    BLOCK = "block"                  // Multi-line code block
}

/**
 * Maps a function definition to concrete code in a specific language
 */
export interface SyntaxPattern {
    id?: number;                     // Unique pattern identifier (optional when creating new)
    functionId: number;              // Reference to function definition
    languageId: number;              // Reference to language
    pattern: string;                 // Code template with placeholders
    patternType: PatternType;        // How pattern should be used
    additionalImports?: string[];    // Required imports/includes
    notes?: string;                  // Implementation notes
}

/**
 * Defines an abstract type used in the system
 */
export interface TypeDefinition {
    id?: number;                     // Unique type identifier (optional when creating new)
    name: string;                    // Abstract type name (e.g., "Number", "String")
    description: string;             // Type description
    color: string;                   // Color for visual representation
    baseType?: number;               // Base type for inheritance
    properties?: TypeProperty[];     // For compound types
}

/**
 * Defines a property of a compound type
 */
export interface TypeProperty {
    name: string;                    // Property name
    type: string;                    // Property type
    isRequired: boolean;             // Whether property is required
    defaultValue?: any;              // Default value if not specified
}

/**
 * Maps an abstract type to a concrete type in a specific language
 */
export interface TypeMapping {
    id?: number;                     // Unique mapping identifier (optional when creating new)
    abstractTypeId: number;          // Reference to abstract type
    languageId: number;              // Reference to language
    concreteType: string;            // Type name in target language
    imports?: string[];              // Required imports for this type
    conversionToAbstract?: string;   // Code to convert from concrete to abstract
    conversionFromAbstract?: string; // Code to convert from abstract to concrete
} 