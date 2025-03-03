"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.PythonAnalyzer = void 0;
var syntax_1 = require("../../../models/syntax");
var PythonLanguageDefinition_1 = require("./PythonLanguageDefinition");
var LanguageAnalyzer_1 = require("./LanguageAnalyzer");
/**
 * Analyzer for extracting Python language features, built-in functions,
 * and generating appropriate syntax patterns
 */
var PythonAnalyzer = /** @class */ (function (_super) {
    __extends(PythonAnalyzer, _super);
    function PythonAnalyzer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Extract the Python language definition including syntax rules
     * @returns The Python language definition (without ID)
     */
    PythonAnalyzer.prototype.extractLanguageDefinition = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Simply return the pre-defined Python language definition
                return [2 /*return*/, PythonLanguageDefinition_1.pythonLanguageDefinition];
            });
        });
    };
    /**
     * Extract built-in functions from Python
     * @returns Array of function definitions (without IDs)
     */
    PythonAnalyzer.prototype.extractBuiltInFunctions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var functions;
            return __generator(this, function (_a) {
                functions = [];
                // Add basic built-in functions
                functions.push.apply(functions, this.extractBasicBuiltIns());
                // Add string operations
                functions.push.apply(functions, this.extractStringOperations());
                // Add list operations
                functions.push.apply(functions, this.extractListOperations());
                // Add dictionary operations
                functions.push.apply(functions, this.extractDictOperations());
                // Add math operations
                functions.push.apply(functions, this.extractMathOperations());
                return [2 /*return*/, functions];
            });
        });
    };
    /**
     * Generate syntax patterns for Python function definitions
     * @param functionIds Map of function names to their database IDs
     * @param languageId The Python language ID in the database
     * @returns Array of syntax patterns (without IDs)
     */
    PythonAnalyzer.prototype.generateSyntaxPatterns = function (functionIds, languageId) {
        return __awaiter(this, void 0, void 0, function () {
            var patterns, entries, _i, entries_1, _a, funcName, funcId;
            return __generator(this, function (_b) {
                patterns = [];
                entries = Array.from(functionIds.entries());
                // For each function, generate its syntax pattern
                for (_i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                    _a = entries_1[_i], funcName = _a[0], funcId = _a[1];
                    // Different pattern types based on function name prefixes
                    if (funcName.startsWith('str_')) {
                        patterns.push(this.generateStringPattern(funcName, funcId, languageId));
                    }
                    else if (funcName.startsWith('list_')) {
                        patterns.push(this.generateListPattern(funcName, funcId, languageId));
                    }
                    else if (funcName.startsWith('dict_')) {
                        patterns.push(this.generateDictPattern(funcName, funcId, languageId));
                    }
                    else if (funcName.startsWith('math_')) {
                        patterns.push(this.generateMathPattern(funcName, funcId, languageId));
                    }
                    else {
                        // Default pattern
                        patterns.push({
                            functionId: funcId,
                            languageId: languageId,
                            pattern: this.generateDefaultPattern(funcName),
                            patternType: syntax_1.PatternType.EXPRESSION
                        });
                    }
                }
                return [2 /*return*/, patterns];
            });
        });
    };
    /**
     * Extract type definitions for Python
     * @returns Array of type definitions (without IDs)
     */
    PythonAnalyzer.prototype.extractTypeDefinitions = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Define Python's built-in types
                return [2 /*return*/, [
                        {
                            name: 'Number',
                            description: 'Numeric value (int, float, complex)',
                            color: '#6B8E23' // OliveDrab
                        },
                        {
                            name: 'String',
                            description: 'Text value',
                            color: '#4682B4' // SteelBlue
                        },
                        {
                            name: 'Boolean',
                            description: 'True or False value',
                            color: '#B22222' // FireBrick
                        },
                        {
                            name: 'List',
                            description: 'Ordered collection of items',
                            color: '#8A2BE2' // BlueViolet
                        },
                        {
                            name: 'Dictionary',
                            description: 'Key-value pairs',
                            color: '#FF8C00' // DarkOrange
                        },
                        {
                            name: 'Set',
                            description: 'Unordered collection of unique items',
                            color: '#2F4F4F' // DarkSlateGray
                        },
                        {
                            name: 'Tuple',
                            description: 'Immutable ordered collection',
                            color: '#800080' // Purple
                        },
                        {
                            name: 'None',
                            description: 'Null value',
                            color: '#708090' // SlateGray
                        },
                        {
                            name: 'Function',
                            description: 'Callable function or method',
                            color: '#CD5C5C' // IndianRed
                        },
                        {
                            name: 'Any',
                            description: 'Any type',
                            color: '#808080' // Gray
                        }
                    ]];
            });
        });
    };
    /**
     * Generate type mappings for Python types
     * @param typeIds Map of type names to their database IDs
     * @param languageId The Python language ID in the database
     * @returns Array of type mappings (without IDs)
     */
    PythonAnalyzer.prototype.generateTypeMappings = function (typeIds, languageId) {
        return __awaiter(this, void 0, void 0, function () {
            var mappings;
            return __generator(this, function (_a) {
                mappings = [];
                // Map abstract types to Python concrete types
                if (typeIds.has('Number')) {
                    mappings.push({
                        abstractTypeId: typeIds.get('Number'),
                        languageId: languageId,
                        concreteType: 'int | float'
                    });
                }
                if (typeIds.has('String')) {
                    mappings.push({
                        abstractTypeId: typeIds.get('String'),
                        languageId: languageId,
                        concreteType: 'str'
                    });
                }
                if (typeIds.has('Boolean')) {
                    mappings.push({
                        abstractTypeId: typeIds.get('Boolean'),
                        languageId: languageId,
                        concreteType: 'bool'
                    });
                }
                if (typeIds.has('List')) {
                    mappings.push({
                        abstractTypeId: typeIds.get('List'),
                        languageId: languageId,
                        concreteType: 'list'
                    });
                }
                if (typeIds.has('Dictionary')) {
                    mappings.push({
                        abstractTypeId: typeIds.get('Dictionary'),
                        languageId: languageId,
                        concreteType: 'dict'
                    });
                }
                if (typeIds.has('Set')) {
                    mappings.push({
                        abstractTypeId: typeIds.get('Set'),
                        languageId: languageId,
                        concreteType: 'set'
                    });
                }
                if (typeIds.has('Tuple')) {
                    mappings.push({
                        abstractTypeId: typeIds.get('Tuple'),
                        languageId: languageId,
                        concreteType: 'tuple'
                    });
                }
                if (typeIds.has('None')) {
                    mappings.push({
                        abstractTypeId: typeIds.get('None'),
                        languageId: languageId,
                        concreteType: 'None'
                    });
                }
                if (typeIds.has('Function')) {
                    mappings.push({
                        abstractTypeId: typeIds.get('Function'),
                        languageId: languageId,
                        concreteType: 'callable'
                    });
                }
                if (typeIds.has('Any')) {
                    mappings.push({
                        abstractTypeId: typeIds.get('Any'),
                        languageId: languageId,
                        concreteType: 'any'
                    });
                }
                return [2 /*return*/, mappings];
            });
        });
    };
    /**
     * Extract basic Python built-in functions
     * @returns Array of function definitions
     */
    PythonAnalyzer.prototype.extractBasicBuiltIns = function () {
        return [
            {
                name: 'print',
                displayName: 'Print',
                description: 'Prints the specified message to the console',
                category: syntax_1.FunctionCategory.IO,
                parameters: [
                    {
                        name: 'value',
                        type: 'Any',
                        description: 'The value to print',
                        isRequired: true
                    }
                ],
                returnType: 'None',
                isBuiltIn: true,
                tags: ['print', 'output', 'console', 'io']
            },
            {
                name: 'len',
                displayName: 'Length',
                description: 'Returns the number of items in an object',
                category: syntax_1.FunctionCategory.UTILITY,
                parameters: [
                    {
                        name: 'obj',
                        type: 'Any',
                        description: 'The object to get the length of',
                        isRequired: true
                    }
                ],
                returnType: 'Number',
                isBuiltIn: true,
                tags: ['length', 'size', 'count', 'utility']
            },
            {
                name: 'range',
                displayName: 'Range',
                description: 'Returns a sequence of numbers',
                category: syntax_1.FunctionCategory.UTILITY,
                parameters: [
                    {
                        name: 'start',
                        type: 'Number',
                        description: 'Starting value (inclusive)',
                        isRequired: false,
                        defaultValue: 0
                    },
                    {
                        name: 'stop',
                        type: 'Number',
                        description: 'Ending value (exclusive)',
                        isRequired: true
                    },
                    {
                        name: 'step',
                        type: 'Number',
                        description: 'Step value',
                        isRequired: false,
                        defaultValue: 1
                    }
                ],
                returnType: 'List',
                isBuiltIn: true,
                tags: ['range', 'sequence', 'numbers', 'utility']
            },
            {
                name: 'input',
                displayName: 'Input',
                description: 'Reads a line from input',
                category: syntax_1.FunctionCategory.IO,
                parameters: [
                    {
                        name: 'prompt',
                        type: 'String',
                        description: 'The prompt to display',
                        isRequired: false,
                        defaultValue: ''
                    }
                ],
                returnType: 'String',
                isBuiltIn: true,
                tags: ['input', 'read', 'console', 'io']
            }
        ];
    };
    /**
     * Extract string operations in Python
     * @returns Array of function definitions
     */
    PythonAnalyzer.prototype.extractStringOperations = function () {
        return [
            {
                name: 'str_concat',
                displayName: 'Concatenate Strings',
                description: 'Joins two strings together',
                category: syntax_1.FunctionCategory.STRING,
                parameters: [
                    {
                        name: 'str1',
                        type: 'String',
                        description: 'First string',
                        isRequired: true
                    },
                    {
                        name: 'str2',
                        type: 'String',
                        description: 'Second string',
                        isRequired: true
                    }
                ],
                returnType: 'String',
                isBuiltIn: true,
                tags: ['string', 'concatenate', 'join']
            },
            {
                name: 'str_upper',
                displayName: 'Uppercase',
                description: 'Converts a string to uppercase',
                category: syntax_1.FunctionCategory.STRING,
                parameters: [
                    {
                        name: 'str',
                        type: 'String',
                        description: 'The string to convert',
                        isRequired: true
                    }
                ],
                returnType: 'String',
                isBuiltIn: true,
                tags: ['string', 'uppercase', 'case']
            },
            {
                name: 'str_lower',
                displayName: 'Lowercase',
                description: 'Converts a string to lowercase',
                category: syntax_1.FunctionCategory.STRING,
                parameters: [
                    {
                        name: 'str',
                        type: 'String',
                        description: 'The string to convert',
                        isRequired: true
                    }
                ],
                returnType: 'String',
                isBuiltIn: true,
                tags: ['string', 'lowercase', 'case']
            },
            {
                name: 'str_split',
                displayName: 'Split String',
                description: 'Splits a string into a list by a separator',
                category: syntax_1.FunctionCategory.STRING,
                parameters: [
                    {
                        name: 'str',
                        type: 'String',
                        description: 'The string to split',
                        isRequired: true
                    },
                    {
                        name: 'separator',
                        type: 'String',
                        description: 'The separator to split by',
                        isRequired: false,
                        defaultValue: ' '
                    }
                ],
                returnType: 'List',
                isBuiltIn: true,
                tags: ['string', 'split', 'separator']
            },
            {
                name: 'str_join',
                displayName: 'Join Strings',
                description: 'Joins items in a list into a string with a separator',
                category: syntax_1.FunctionCategory.STRING,
                parameters: [
                    {
                        name: 'separator',
                        type: 'String',
                        description: 'The separator to join with',
                        isRequired: true
                    },
                    {
                        name: 'items',
                        type: 'List',
                        description: 'The items to join',
                        isRequired: true
                    }
                ],
                returnType: 'String',
                isBuiltIn: true,
                tags: ['string', 'join', 'separator']
            }
        ];
    };
    /**
     * Extract list operations in Python
     * @returns Array of function definitions
     */
    PythonAnalyzer.prototype.extractListOperations = function () {
        return [
            {
                name: 'list_create',
                displayName: 'Create List',
                description: 'Creates a new list',
                category: syntax_1.FunctionCategory.ARRAY,
                parameters: [
                    {
                        name: 'items',
                        type: 'Any',
                        description: 'Items to add to the list (comma-separated)',
                        isRequired: false,
                        defaultValue: []
                    }
                ],
                returnType: 'List',
                isBuiltIn: true,
                tags: ['list', 'create', 'array']
            },
            {
                name: 'list_append',
                displayName: 'Append to List',
                description: 'Adds an item to the end of a list',
                category: syntax_1.FunctionCategory.ARRAY,
                parameters: [
                    {
                        name: 'list',
                        type: 'List',
                        description: 'The list to modify',
                        isRequired: true
                    },
                    {
                        name: 'item',
                        type: 'Any',
                        description: 'The item to add',
                        isRequired: true
                    }
                ],
                returnType: 'None',
                isBuiltIn: true,
                tags: ['list', 'append', 'add', 'array']
            },
            {
                name: 'list_get',
                displayName: 'Get List Item',
                description: 'Gets an item from a list at the specified index',
                category: syntax_1.FunctionCategory.ARRAY,
                parameters: [
                    {
                        name: 'list',
                        type: 'List',
                        description: 'The source list',
                        isRequired: true
                    },
                    {
                        name: 'index',
                        type: 'Number',
                        description: 'The index of the item to get',
                        isRequired: true
                    }
                ],
                returnType: 'Any',
                isBuiltIn: true,
                tags: ['list', 'get', 'index', 'array']
            },
            {
                name: 'list_set',
                displayName: 'Set List Item',
                description: 'Sets an item in a list at the specified index',
                category: syntax_1.FunctionCategory.ARRAY,
                parameters: [
                    {
                        name: 'list',
                        type: 'List',
                        description: 'The list to modify',
                        isRequired: true
                    },
                    {
                        name: 'index',
                        type: 'Number',
                        description: 'The index of the item to set',
                        isRequired: true
                    },
                    {
                        name: 'value',
                        type: 'Any',
                        description: 'The new value',
                        isRequired: true
                    }
                ],
                returnType: 'None',
                isBuiltIn: true,
                tags: ['list', 'set', 'index', 'array']
            },
            {
                name: 'list_length',
                displayName: 'List Length',
                description: 'Gets the length of a list',
                category: syntax_1.FunctionCategory.ARRAY,
                parameters: [
                    {
                        name: 'list',
                        type: 'List',
                        description: 'The list to get the length of',
                        isRequired: true
                    }
                ],
                returnType: 'Number',
                isBuiltIn: true,
                tags: ['list', 'length', 'size', 'array']
            }
        ];
    };
    /**
     * Extract dictionary operations in Python
     * @returns Array of function definitions
     */
    PythonAnalyzer.prototype.extractDictOperations = function () {
        return [
            {
                name: 'dict_create',
                displayName: 'Create Dictionary',
                description: 'Creates a new dictionary',
                category: syntax_1.FunctionCategory.OBJECT,
                parameters: [],
                returnType: 'Dictionary',
                isBuiltIn: true,
                tags: ['dict', 'create', 'object']
            },
            {
                name: 'dict_get',
                displayName: 'Get Dictionary Value',
                description: 'Gets a value from a dictionary by key',
                category: syntax_1.FunctionCategory.OBJECT,
                parameters: [
                    {
                        name: 'dict',
                        type: 'Dictionary',
                        description: 'The source dictionary',
                        isRequired: true
                    },
                    {
                        name: 'key',
                        type: 'Any',
                        description: 'The key to look up',
                        isRequired: true
                    },
                    {
                        name: 'default',
                        type: 'Any',
                        description: 'Default value if key is not found',
                        isRequired: false
                    }
                ],
                returnType: 'Any',
                isBuiltIn: true,
                tags: ['dict', 'get', 'key', 'object']
            },
            {
                name: 'dict_set',
                displayName: 'Set Dictionary Value',
                description: 'Sets a value in a dictionary for the specified key',
                category: syntax_1.FunctionCategory.OBJECT,
                parameters: [
                    {
                        name: 'dict',
                        type: 'Dictionary',
                        description: 'The dictionary to modify',
                        isRequired: true
                    },
                    {
                        name: 'key',
                        type: 'Any',
                        description: 'The key to set',
                        isRequired: true
                    },
                    {
                        name: 'value',
                        type: 'Any',
                        description: 'The value to set',
                        isRequired: true
                    }
                ],
                returnType: 'None',
                isBuiltIn: true,
                tags: ['dict', 'set', 'key', 'object']
            },
            {
                name: 'dict_keys',
                displayName: 'Dictionary Keys',
                description: 'Gets all keys from a dictionary',
                category: syntax_1.FunctionCategory.OBJECT,
                parameters: [
                    {
                        name: 'dict',
                        type: 'Dictionary',
                        description: 'The source dictionary',
                        isRequired: true
                    }
                ],
                returnType: 'List',
                isBuiltIn: true,
                tags: ['dict', 'keys', 'object']
            },
            {
                name: 'dict_values',
                displayName: 'Dictionary Values',
                description: 'Gets all values from a dictionary',
                category: syntax_1.FunctionCategory.OBJECT,
                parameters: [
                    {
                        name: 'dict',
                        type: 'Dictionary',
                        description: 'The source dictionary',
                        isRequired: true
                    }
                ],
                returnType: 'List',
                isBuiltIn: true,
                tags: ['dict', 'values', 'object']
            }
        ];
    };
    /**
     * Extract math operations in Python
     * @returns Array of function definitions
     */
    PythonAnalyzer.prototype.extractMathOperations = function () {
        return [
            {
                name: 'math_add',
                displayName: 'Add',
                description: 'Adds two numbers',
                category: syntax_1.FunctionCategory.MATH,
                parameters: [
                    {
                        name: 'a',
                        type: 'Number',
                        description: 'First number',
                        isRequired: true
                    },
                    {
                        name: 'b',
                        type: 'Number',
                        description: 'Second number',
                        isRequired: true
                    }
                ],
                returnType: 'Number',
                isBuiltIn: true,
                tags: ['math', 'add', 'plus', 'sum']
            },
            {
                name: 'math_subtract',
                displayName: 'Subtract',
                description: 'Subtracts the second number from the first',
                category: syntax_1.FunctionCategory.MATH,
                parameters: [
                    {
                        name: 'a',
                        type: 'Number',
                        description: 'Number to subtract from',
                        isRequired: true
                    },
                    {
                        name: 'b',
                        type: 'Number',
                        description: 'Number to subtract',
                        isRequired: true
                    }
                ],
                returnType: 'Number',
                isBuiltIn: true,
                tags: ['math', 'subtract', 'minus', 'difference']
            },
            {
                name: 'math_multiply',
                displayName: 'Multiply',
                description: 'Multiplies two numbers',
                category: syntax_1.FunctionCategory.MATH,
                parameters: [
                    {
                        name: 'a',
                        type: 'Number',
                        description: 'First number',
                        isRequired: true
                    },
                    {
                        name: 'b',
                        type: 'Number',
                        description: 'Second number',
                        isRequired: true
                    }
                ],
                returnType: 'Number',
                isBuiltIn: true,
                tags: ['math', 'multiply', 'times', 'product']
            },
            {
                name: 'math_divide',
                displayName: 'Divide',
                description: 'Divides the first number by the second',
                category: syntax_1.FunctionCategory.MATH,
                parameters: [
                    {
                        name: 'a',
                        type: 'Number',
                        description: 'Number to divide',
                        isRequired: true
                    },
                    {
                        name: 'b',
                        type: 'Number',
                        description: 'Number to divide by',
                        isRequired: true
                    }
                ],
                returnType: 'Number',
                isBuiltIn: true,
                tags: ['math', 'divide', 'quotient']
            },
            {
                name: 'math_floor',
                displayName: 'Floor',
                description: 'Returns the largest integer less than or equal to the number',
                category: syntax_1.FunctionCategory.MATH,
                parameters: [
                    {
                        name: 'x',
                        type: 'Number',
                        description: 'The number to floor',
                        isRequired: true
                    }
                ],
                returnType: 'Number',
                isBuiltIn: true,
                tags: ['math', 'floor', 'round', 'down']
            },
            {
                name: 'math_ceil',
                displayName: 'Ceiling',
                description: 'Returns the smallest integer greater than or equal to the number',
                category: syntax_1.FunctionCategory.MATH,
                parameters: [
                    {
                        name: 'x',
                        type: 'Number',
                        description: 'The number to ceil',
                        isRequired: true
                    }
                ],
                returnType: 'Number',
                isBuiltIn: true,
                tags: ['math', 'ceiling', 'ceil', 'round', 'up']
            }
        ];
    };
    /**
     * Generate a pattern for string operations
     * @param funcName Function name
     * @param funcId Function ID
     * @param languageId Language ID
     * @returns Syntax pattern
     */
    PythonAnalyzer.prototype.generateStringPattern = function (funcName, funcId, languageId) {
        var operationType = funcName.replace('str_', '');
        // Use the pre-defined string operations from pythonTypeOperators
        if (operationType in PythonLanguageDefinition_1.pythonTypeOperators.string) {
            return {
                functionId: funcId,
                languageId: languageId,
                pattern: PythonLanguageDefinition_1.pythonTypeOperators.string[operationType],
                patternType: syntax_1.PatternType.EXPRESSION
            };
        }
        // Manual pattern generation for specific operations
        switch (operationType) {
            case 'upper':
                return {
                    functionId: funcId,
                    languageId: languageId,
                    pattern: '{0}.upper()',
                    patternType: syntax_1.PatternType.EXPRESSION
                };
            case 'lower':
                return {
                    functionId: funcId,
                    languageId: languageId,
                    pattern: '{0}.lower()',
                    patternType: syntax_1.PatternType.EXPRESSION
                };
            // Default string operation pattern
            default:
                return {
                    functionId: funcId,
                    languageId: languageId,
                    pattern: "{0}.".concat(operationType, "({1})"),
                    patternType: syntax_1.PatternType.EXPRESSION
                };
        }
    };
    /**
     * Generate a pattern for list operations
     * @param funcName Function name
     * @param funcId Function ID
     * @param languageId Language ID
     * @returns Syntax pattern
     */
    PythonAnalyzer.prototype.generateListPattern = function (funcName, funcId, languageId) {
        var operationType = funcName.replace('list_', '');
        // Use the pre-defined list operations from pythonTypeOperators
        if (operationType in PythonLanguageDefinition_1.pythonTypeOperators.list) {
            return {
                functionId: funcId,
                languageId: languageId,
                pattern: PythonLanguageDefinition_1.pythonTypeOperators.list[operationType],
                patternType: syntax_1.PatternType.EXPRESSION
            };
        }
        // Manual pattern generation for specific operations
        switch (operationType) {
            case 'create':
                return {
                    functionId: funcId,
                    languageId: languageId,
                    pattern: '[{0}]',
                    patternType: syntax_1.PatternType.EXPRESSION
                };
            case 'get':
                return {
                    functionId: funcId,
                    languageId: languageId,
                    pattern: '{0}[{1}]',
                    patternType: syntax_1.PatternType.EXPRESSION
                };
            case 'set':
                return {
                    functionId: funcId,
                    languageId: languageId,
                    pattern: '{0}[{1}] = {2}',
                    patternType: syntax_1.PatternType.STATEMENT
                };
            case 'length':
                return {
                    functionId: funcId,
                    languageId: languageId,
                    pattern: 'len({0})',
                    patternType: syntax_1.PatternType.EXPRESSION
                };
            // Default list operation pattern
            default:
                return {
                    functionId: funcId,
                    languageId: languageId,
                    pattern: "{0}.".concat(operationType, "({1})"),
                    patternType: syntax_1.PatternType.STATEMENT
                };
        }
    };
    /**
     * Generate a pattern for dictionary operations
     * @param funcName Function name
     * @param funcId Function ID
     * @param languageId Language ID
     * @returns Syntax pattern
     */
    PythonAnalyzer.prototype.generateDictPattern = function (funcName, funcId, languageId) {
        var operationType = funcName.replace('dict_', '');
        // Use the pre-defined dictionary operations from pythonTypeOperators
        if (operationType in PythonLanguageDefinition_1.pythonTypeOperators.dict) {
            return {
                functionId: funcId,
                languageId: languageId,
                pattern: PythonLanguageDefinition_1.pythonTypeOperators.dict[operationType],
                patternType: operationType === 'set' ? syntax_1.PatternType.STATEMENT : syntax_1.PatternType.EXPRESSION
            };
        }
        // Manual pattern generation for specific operations
        switch (operationType) {
            case 'create':
                return {
                    functionId: funcId,
                    languageId: languageId,
                    pattern: '{}',
                    patternType: syntax_1.PatternType.EXPRESSION
                };
            case 'get':
                return {
                    functionId: funcId,
                    languageId: languageId,
                    pattern: '{0}.get({1}, {2})',
                    patternType: syntax_1.PatternType.EXPRESSION
                };
            case 'set':
                return {
                    functionId: funcId,
                    languageId: languageId,
                    pattern: '{0}[{1}] = {2}',
                    patternType: syntax_1.PatternType.STATEMENT
                };
            case 'keys':
                return {
                    functionId: funcId,
                    languageId: languageId,
                    pattern: 'list({0}.keys())',
                    patternType: syntax_1.PatternType.EXPRESSION
                };
            case 'values':
                return {
                    functionId: funcId,
                    languageId: languageId,
                    pattern: 'list({0}.values())',
                    patternType: syntax_1.PatternType.EXPRESSION
                };
            // Default dictionary operation pattern
            default:
                return {
                    functionId: funcId,
                    languageId: languageId,
                    pattern: "{0}.".concat(operationType, "({1})"),
                    patternType: syntax_1.PatternType.EXPRESSION
                };
        }
    };
    /**
     * Generate a pattern for math operations
     * @param funcName Function name
     * @param funcId Function ID
     * @param languageId Language ID
     * @returns Syntax pattern
     */
    PythonAnalyzer.prototype.generateMathPattern = function (funcName, funcId, languageId) {
        var operationType = funcName.replace('math_', '');
        // Basic arithmetic operations
        switch (operationType) {
            case 'add':
                return {
                    functionId: funcId,
                    languageId: languageId,
                    pattern: '{0} + {1}',
                    patternType: syntax_1.PatternType.EXPRESSION,
                    additionalImports: []
                };
            case 'subtract':
                return {
                    functionId: funcId,
                    languageId: languageId,
                    pattern: '{0} - {1}',
                    patternType: syntax_1.PatternType.EXPRESSION,
                    additionalImports: []
                };
            case 'multiply':
                return {
                    functionId: funcId,
                    languageId: languageId,
                    pattern: '{0} * {1}',
                    patternType: syntax_1.PatternType.EXPRESSION,
                    additionalImports: []
                };
            case 'divide':
                return {
                    functionId: funcId,
                    languageId: languageId,
                    pattern: '{0} / {1}',
                    patternType: syntax_1.PatternType.EXPRESSION,
                    additionalImports: []
                };
            // Math module functions
            case 'floor':
                return {
                    functionId: funcId,
                    languageId: languageId,
                    pattern: 'math.floor({0})',
                    patternType: syntax_1.PatternType.EXPRESSION,
                    additionalImports: ['import math']
                };
            case 'ceil':
                return {
                    functionId: funcId,
                    languageId: languageId,
                    pattern: 'math.ceil({0})',
                    patternType: syntax_1.PatternType.EXPRESSION,
                    additionalImports: ['import math']
                };
            // Default math operation pattern
            default:
                return {
                    functionId: funcId,
                    languageId: languageId,
                    pattern: "math.".concat(operationType, "({0})"),
                    patternType: syntax_1.PatternType.EXPRESSION,
                    additionalImports: ['import math']
                };
        }
    };
    /**
     * Generate a default pattern for a function
     * @param funcName Function name
     * @returns Pattern string
     */
    PythonAnalyzer.prototype.generateDefaultPattern = function (funcName) {
        // Basic built-in functions
        switch (funcName) {
            case 'print':
                return 'print({0})';
            case 'len':
                return 'len({0})';
            case 'range':
                return 'range({0}, {1}, {2})';
            case 'input':
                return 'input({0})';
            // Default pattern
            default:
                return "".concat(funcName, "({0})");
        }
    };
    return PythonAnalyzer;
}(LanguageAnalyzer_1.BaseLanguageAnalyzer));
exports.PythonAnalyzer = PythonAnalyzer;
