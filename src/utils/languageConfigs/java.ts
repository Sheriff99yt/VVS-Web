import { LanguageConfig } from '../languageConfig';

/**
 * Java language configuration
 */
export const javaConfig: LanguageConfig = {
  name: 'Java',
  fileExtension: 'java',
  monacoLanguage: 'java',
  syntax: {
    ifStatement: 'if ($condition) {',
    elseStatement: '} else {',
    forLoop: 'for (int $variable = $start; $variable < $end; $variable++) {',
    whileLoop: 'while ($condition) {',
    functionDefinition: 'public $returnType $name($parameters) {',
    functionCall: '$name($arguments)',
    returnStatement: 'return $value',
    variableDefinition: '$type $name = $value',
    lineComment: '// $comment',
    blockCommentStart: '/*',
    blockCommentEnd: '*/',
    print: 'System.out.println($value)',
    input: 'scanner.nextLine()',
  },
  operators: {
    add: '$left + $right',
    subtract: '$left - $right',
    multiply: '$left * $right',
    divide: '$left / $right',
    and: '$left && $right',
    or: '$left || $right',
    not: '!$value',
    greaterThan: '$left > $right',
    lessThan: '$left < $right',
    equal: '$left == $right',
    notEqual: '$left != $right',
  },
  formatting: {
    indentation: '    ',
    statementEnd: ';',
    blockStart: '{',
    blockEnd: '}',
  },
  values: {
    true: 'true',
    false: 'false',
    null: 'null'
  },
  escapeSequences: {
    quote: "\\'",
    doubleQuote: '\\"',
    newline: '\\n',
    tab: '\\t'
  },
  standardImports: [
    'import java.util.Scanner;',
    'import java.io.*;',
    'import java.util.*;',
    '',
    'public class GeneratedCode {',
    '    private static Scanner scanner = new Scanner(System.in);',
    '',
    '    public static void main(String[] args) {',
  ],
}; 