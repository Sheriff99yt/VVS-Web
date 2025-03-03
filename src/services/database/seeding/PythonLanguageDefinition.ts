/**
 * PythonLanguageDefinition.ts
 * 
 * Defines the Python language syntax and operators for the VVS Web application.
 * Used at database initialization.
 */

import { Language, SyntaxRules } from '../../../models/syntax';

/**
 * Python syntax rules
 */
export const pythonSyntaxRules: SyntaxRules = {
  statementDelimiter: '\n',
  blockStart: ':',
  blockEnd: '',
  commentSingle: '#',
  commentMultiStart: '"""',
  commentMultiEnd: '"""',
  stringDelimiters: ['"', "'"],
  indentationStyle: 'space',
  indentationSize: 4,
  functionDefinitionPattern: 'def {name}({parameters}):\n{body}',
  variableDeclarationPattern: '{name} = {value}',
  operatorPatterns: {
    // Arithmetic operators
    add: '{0} + {1}',
    subtract: '{0} - {1}',
    multiply: '{0} * {1}',
    divide: '{0} / {1}',
    modulo: '{0} % {1}',
    power: '{0} ** {1}',
    floorDivide: '{0} // {1}',
    
    // Comparison operators
    equals: '{0} == {1}',
    notEquals: '{0} != {1}',
    lessThan: '{0} < {1}',
    greaterThan: '{0} > {1}',
    lessThanOrEqual: '{0} <= {1}',
    greaterThanOrEqual: '{0} >= {1}',
    
    // Logical operators
    and: '{0} and {1}',
    or: '{0} or {1}',
    not: 'not {0}',
    
    // Bitwise operators
    bitwiseAnd: '{0} & {1}',
    bitwiseOr: '{0} | {1}',
    bitwiseXor: '{0} ^ {1}',
    bitwiseNot: '~{0}',
    leftShift: '{0} << {1}',
    rightShift: '{0} >> {1}',
    
    // Assignment
    assign: '{0} = {1}',
    
    // Other
    in: '{0} in {1}',
    notIn: '{0} not in {1}',
    is: '{0} is {1}',
    isNot: '{0} is not {1}'
  }
};

/**
 * Python type operators
 */
export const pythonTypeOperators = {
  // Type checking
  isInstance: 'isinstance({0}, {1})',
  getType: 'type({0})',
  
  // Type conversion
  toString: 'str({0})',
  toInt: 'int({0})',
  toFloat: 'float({0})',
  toBool: 'bool({0})',
  toList: 'list({0})',
  toDict: 'dict({0})',
  toSet: 'set({0})',
  toTuple: 'tuple({0})',
  
  // Collection operations
  length: 'len({0})',
  getItem: '{0}[{1}]',
  setItem: '{0}[{1}] = {2}',
  deleteItem: 'del {0}[{1}]',
  contains: '{1} in {0}',
  append: '{0}.append({1})',
  extend: '{0}.extend({1})',
  insert: '{0}.insert({1}, {2})',
  remove: '{0}.remove({1})',
  pop: '{0}.pop({1})',
  keys: '{0}.keys()',
  values: '{0}.values()',
  items: '{0}.items()'
};

/**
 * Python language definition
 */
export const pythonLanguageDefinition: Language = {
  id: 1,
  name: 'Python',
  version: '3.11',
  fileExtension: '.py',
  syntaxRules: pythonSyntaxRules,
  isEnabled: true
}; 