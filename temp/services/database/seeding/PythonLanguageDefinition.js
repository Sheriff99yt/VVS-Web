"use strict";
exports.__esModule = true;
exports.pythonTypeOperators = exports.pythonLanguageDefinition = exports.pythonSyntaxRules = void 0;
/**
 * Defines the syntax rules for Python language
 */
exports.pythonSyntaxRules = {
    statementDelimiter: '\n',
    blockStart: ':',
    blockEnd: '',
    commentSingle: '#',
    commentMultiStart: '"""',
    commentMultiEnd: '"""',
    stringDelimiters: ['"', "'", '"""', "'''"],
    indentationStyle: 'space',
    indentationSize: 4,
    functionDefinitionPattern: 'def {name}({params}):\n{body}',
    variableDeclarationPattern: '{name} = {value}',
    operatorPatterns: {
        // Arithmetic operators
        add: '{0} + {1}',
        subtract: '{0} - {1}',
        multiply: '{0} * {1}',
        divide: '{0} / {1}',
        floorDivide: '{0} // {1}',
        modulo: '{0} % {1}',
        power: '{0} ** {1}',
        // Comparison operators
        equal: '{0} == {1}',
        notEqual: '{0} != {1}',
        greaterThan: '{0} > {1}',
        lessThan: '{0} < {1}',
        greaterThanOrEqual: '{0} >= {1}',
        lessThanOrEqual: '{0} <= {1}',
        // Logical operators
        and: '{0} and {1}',
        or: '{0} or {1}',
        not: 'not {0}',
        // Assignment operators
        assign: '{0} = {1}',
        addAssign: '{0} += {1}',
        subtractAssign: '{0} -= {1}',
        multiplyAssign: '{0} *= {1}',
        divideAssign: '{0} /= {1}',
        // Membership operators
        "in": '{0} in {1}',
        notIn: '{0} not in {1}',
        // Identity operators
        is: '{0} is {1}',
        isNot: '{0} is not {1}',
        // Bitwise operators
        bitwiseAnd: '{0} & {1}',
        bitwiseOr: '{0} | {1}',
        bitwiseXor: '{0} ^ {1}',
        bitwiseNot: '~{0}',
        bitwiseLeftShift: '{0} << {1}',
        bitwiseRightShift: '{0} >> {1}'
    }
};
/**
 * Python language definition
 */
exports.pythonLanguageDefinition = {
    name: 'Python',
    version: '3.11',
    fileExtension: '.py',
    syntaxRules: exports.pythonSyntaxRules,
    isEnabled: true
};
/**
 * Specialized operator patterns for specific Python types
 */
exports.pythonTypeOperators = {
    // String operations
    string: {
        concatenate: '{0} + {1}',
        repeat: '{0} * {1}',
        format: '{0}.format({1})',
        fString: 'f"{{{0}}}{{{1}}}"',
        join: '{0}.join({1})',
        split: '{0}.split({1})',
        replace: '{0}.replace({1}, {2})'
    },
    // List operations
    list: {
        append: '{0}.append({1})',
        extend: '{0}.extend({1})',
        insert: '{0}.insert({1}, {2})',
        remove: '{0}.remove({1})',
        pop: '{0}.pop({1})',
        clear: '{0}.clear()',
        index: '{0}.index({1})',
        count: '{0}.count({1})',
        sort: '{0}.sort()',
        reverse: '{0}.reverse()',
        slice: '{0}[{1}:{2}]',
        comprehension: '[{0} for {1} in {2}]',
        filterComprehension: '[{0} for {1} in {2} if {3}]'
    },
    // Dictionary operations
    dict: {
        getItem: '{0}[{1}]',
        setItem: '{0}[{1}] = {2}',
        get: '{0}.get({1}, {2})',
        update: '{0}.update({1})',
        pop: '{0}.pop({1})',
        clear: '{0}.clear()',
        keys: '{0}.keys()',
        values: '{0}.values()',
        items: '{0}.items()',
        comprehension: '{{key: value for key, value in {0}.items()}}'
    },
    // Set operations
    set: {
        add: '{0}.add({1})',
        remove: '{0}.remove({1})',
        discard: '{0}.discard({1})',
        union: '{0} | {1}',
        intersection: '{0} & {1}',
        difference: '{0} - {1}',
        symmetricDifference: '{0} ^ {1}',
        isSubset: '{0} <= {1}',
        isSuperset: '{0} >= {1}',
        comprehension: '{{{0} for {1} in {2}}}'
    }
};
