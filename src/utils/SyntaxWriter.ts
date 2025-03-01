import { DataType, NodeCategory } from '../old/components/nodes/CustomNodes';

// Supported programming languages
export type ProgrammingLanguage = 
  | 'typescript'
  | 'javascript' 
  | 'python'
  | 'java'
  | 'csharp'
  | 'rust'
  | 'go';

// Function parameter configuration
interface ParameterConfig {
  name: string;
  type: DataType;
  defaultValue?: string;
  isReference?: boolean;
  isOutput?: boolean;
  isRest?: boolean;
  decorators?: string[];
}

// Function configuration
interface FunctionConfig {
  name: string;
  parameters: ParameterConfig[];
  returnType: DataType;
  isAsync?: boolean;
  isStatic?: boolean;
  accessModifier?: 'public' | 'private' | 'protected';
  isGenerator?: boolean;
  throws?: string[];
}

// Base syntax configuration
interface SyntaxConfig {
  // Variable syntax
  variableDeclaration: string;    // e.g., "let x: type = value;" or "x = value"
  typeAnnotation: string;         // e.g., ": type" or ""
  statementEnd: string;          // e.g., ";" or ""
  
  // Function syntax
  functionKeyword: string;          // e.g., "function", "def", "fn"
  asyncKeyword: string;            // e.g., "async", "async def"
  staticKeyword: string;          // e.g., "static", "@staticmethod"
  accessModifierPattern: string;   // e.g., "${modifier} "
  parameterPattern: string;       // e.g., "${name}: ${type}"
  defaultValuePattern: string;    // e.g., " = ${default}"
  referencePattern: string;      // e.g., "ref ", "&mut "
  outputPattern: string;        // e.g., "out "
  restPattern: string;         // e.g., "...", "*"
  returnTypePattern: string;  // e.g., ": ${type}", " -> ${type}"
  throwsPattern?: string;    // e.g., "throws ${types}"
  returnStatement: string;  // e.g., "return" or "return"
  
  // Block syntax
  blockStart: string;            // e.g., "{" or ":"
  blockEnd: string;             // e.g., "}" or "end"
  
  // Type mappings
  typeMap: Record<DataType, string>;  // Maps our DataTypes to language types
}

export class SyntaxWriter {
  private language: ProgrammingLanguage;
  private config: SyntaxConfig;

  constructor(language: ProgrammingLanguage) {
    this.language = language;
    this.config = this.getLanguageConfig(language);
  }

  private getLanguageConfig(language: ProgrammingLanguage): SyntaxConfig {
    switch (language) {
      case 'typescript':
        return {
          variableDeclaration: 'let ${name}: ${type} = ${value}',
          typeAnnotation: ': ${type}',
          statementEnd: ';',
          functionKeyword: 'function',
          asyncKeyword: 'async ',
          staticKeyword: 'static ',
          accessModifierPattern: '${modifier} ',
          parameterPattern: '${name}: ${type}',
          defaultValuePattern: ' = ${default}',
          referencePattern: '',  // TypeScript doesn't have ref parameters
          outputPattern: '',     // TypeScript doesn't have out parameters
          restPattern: '...',
          returnTypePattern: ': ${type}',
          returnStatement: 'return',
          blockStart: '{',
          blockEnd: '}',
          typeMap: {
            'number': 'number',
            'integer': 'number',
            'boolean': 'boolean',
            'string': 'string',
            'array': 'Array<any>',
            'function': 'Function',
            'any': 'any',
            'vector': 'Vector',
            'transform': 'Transform',
            'rotator': 'Rotator',
            'color': 'Color',
            'struct': 'object',
            'class': 'object'
          }
        };

      case 'python':
        return {
          variableDeclaration: '${name} = ${value}',
          typeAnnotation: ': ${type}',  // Python 3 type hints
          statementEnd: '',
          functionKeyword: 'def',
          asyncKeyword: 'async def',
          staticKeyword: '@staticmethod\n',
          accessModifierPattern: '',  // Python doesn't use access modifiers
          parameterPattern: '${name}: ${type}',
          defaultValuePattern: ' = ${default}',
          referencePattern: '',
          outputPattern: '',
          restPattern: '*',
          returnTypePattern: ' -> ${type}',
          returnStatement: 'return',
          blockStart: ':',
          blockEnd: '',
          typeMap: {
            'number': 'float',
            'integer': 'int',
            'boolean': 'bool',
            'string': 'str',
            'array': 'list',
            'function': 'callable',
            'any': 'Any',
            'vector': 'Vector',
            'transform': 'Transform',
            'rotator': 'Rotator',
            'color': 'Color',
            'struct': 'object',
            'class': 'object'
          }
        };

      // Add more language configurations...
      
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  // Write variable declaration
  writeVariable(name: string, type: DataType, value: string): string {
    const template = this.config.variableDeclaration;
    const typeStr = this.config.typeMap[type];
    
    return template
      .replace('${name}', name)
      .replace('${type}', typeStr)
      .replace('${value}', value)
      + this.config.statementEnd;
  }

  // Enhanced function writing
  writeFunction(config: FunctionConfig, body: string): string {
    const {
      name,
      parameters,
      returnType,
      isAsync = false,
      isStatic = false,
      accessModifier,
      throws = []
    } = config;

    // Build function declaration
    const parts: string[] = [];

    // Add modifiers
    if (accessModifier) {
      parts.push(this.config.accessModifierPattern.replace('${modifier}', accessModifier));
    }
    if (isStatic) {
      parts.push(this.config.staticKeyword);
    }
    
    // Add function keyword
    parts.push(isAsync ? this.config.asyncKeyword : this.config.functionKeyword);
    
    // Add name
    parts.push(name);

    // Add parameters
    const paramStrings = parameters.map(param => {
      let paramStr = this.config.parameterPattern
        .replace('${name}', param.name)
        .replace('${type}', this.config.typeMap[param.type]);

      if (param.isReference) {
        paramStr = this.config.referencePattern + paramStr;
      }
      if (param.isOutput) {
        paramStr = this.config.outputPattern + paramStr;
      }
      if (param.isRest) {
        paramStr = this.config.restPattern + paramStr;
      }
      if (param.defaultValue) {
        paramStr += this.config.defaultValuePattern.replace('${default}', param.defaultValue);
      }
      return paramStr;
    });

    parts.push(`(${paramStrings.join(', ')})`);

    // Add return type
    if (returnType !== 'any') {
      parts.push(this.config.returnTypePattern.replace('${type}', this.config.typeMap[returnType]));
    }

    // Add throws clause if needed
    if (throws.length > 0 && this.config.throwsPattern) {
      parts.push(this.config.throwsPattern.replace('${types}', throws.join(', ')));
    }

    // Combine declaration with body
    return [
      parts.join(''),
      this.writeBlock(body)
    ].join('');
  }

  // Write a return statement
  writeReturn(value: string): string {
    return `${this.config.returnStatement} ${value}${this.config.statementEnd}`;
  }

  // Write a code block
  writeBlock(body: string): string {
    return [
      this.config.blockStart,
      this.indent(body),
      this.config.blockEnd
    ].filter(Boolean).join('\n');
  }

  // Helper to indent code blocks
  private indent(code: string): string {
    const indentation = this.language === 'python' ? '    ' : '  ';
    return code.split('\n')
      .map(line => line.trim() ? indentation + line : line)
      .join('\n');
  }

  // Add methods for other syntax elements like:
  // - Class declarations
  // - Control flow statements (if, for, while)
  // - Array operations
  // - String operations
  // - etc.
}

// Example usage:
/*
const writer = new SyntaxWriter('typescript');

console.log(writer.writeFunction({
  name: 'processData',
  parameters: [
    { name: 'data', type: 'array', isRest: true },
    { name: 'callback', type: 'function', isOptional: true }
  ],
  returnType: 'promise',
  isAsync: true,
  accessModifier: 'public',
  isStatic: true,
  throws: ['Error']
}, `
  const result = await Promise.all(data.map(processItem));
  if (callback) {
    callback(result);
  }
  return result;
`));

// Output:
// public static async function processData(...data: Array<any>, callback?: Function): Promise<any> throws Error {
//   const result = await Promise.all(data.map(processItem));
//   if (callback) {
//     callback(result);
//   }
//   return result;
// }
*/ 