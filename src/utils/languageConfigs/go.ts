import { LanguageConfig } from '../languageConfig';

/**
 * Go language configuration
 */
export const goConfig: LanguageConfig = {
  name: 'Go',
  fileExtension: 'go',
  monacoLanguage: 'go',
  syntax: {
    ifStatement: 'if $condition {',
    elseStatement: '} else {',
    forLoop: 'for $variable := $start; $variable < $end; $variable++ {',
    whileLoop: 'for $condition {',
    functionDefinition: 'func $name($parameters) $returnType {',
    functionCall: '$name($arguments)',
    returnStatement: 'return $value',
    variableDefinition: '$name := $value',
    lineComment: '// $comment',
    blockCommentStart: '/*',
    blockCommentEnd: '*/',
    print: 'fmt.Println($value)',
    input: 'fmt.Scan(&$variable)',
  },
  operators: {
    add: '$left + $right',
    subtract: '$left - $right',
    multiply: '$left * $right',
    divide: '$left / $right',
    and: '$left && $right',
    or: '$left || $right',
    greaterThan: '$left > $right',
    lessThan: '$left < $right',
    equal: '$left == $right',
    notEqual: '$left != $right',
  },
  formatting: {
    indentation: '\t',
    statementEnd: '',
    blockStart: '{',
    blockEnd: '}',
  },
  standardImports: [
    'package main',
    '',
    'import (',
    '\t"fmt"',
    '\t"bufio"',
    '\t"os"',
    '\t"strings"',
    ')',
    '',
    'func main() {',
    '\treader := bufio.NewReader(os.Stdin)',
  ],
}; 