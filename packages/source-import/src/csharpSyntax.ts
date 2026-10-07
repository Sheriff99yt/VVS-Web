import type { Node as SyntaxNode } from 'web-tree-sitter';
import { csharpIntegerLiteral } from '@vvs/graph-types';
import { ImportFailure } from './contracts';
import { parseCSharpTree } from './nativeParser';

/** Conservative structural comparison for the reviewed integral class subset.
 * The async planner loads the pinned grammar before this synchronous gate runs.
 * Parentheses added by printing are redundant except when they separate a
 * minimum-value literal from unary minus: C# gives that lexical form special
 * typing. No constants are folded and no unsupported syntax is discarded.
 */
export function normalizedCSharpSyntax(source: string): string {
  const tree = parseCSharpTree(source);
  const fail = (node: SyntaxNode): never => {
    throw new ImportFailure('CSHARP_COMPARISON_UNSUPPORTED', `Structural comparison needs a contract for ${node.type}.`, { start: node.startIndex, end: node.endIndex });
  };
  const children = (node: SyntaxNode) => node.namedChildren.filter(child => child.type !== 'comment');
  const field = (node: SyntaxNode, key: string): SyntaxNode => node.childForFieldName(key) ?? fail(node);
  const identifier = (node: SyntaxNode) => node.text.replace(/^@/, '');
  const expression = (node: SyntaxNode): unknown => {
    const parts = children(node);
    switch (node.type) {
      case 'integer_literal': return ['integer', node.text];
      case 'boolean_literal': return ['boolean', node.text];
      case 'identifier': return ['identifier', identifier(node)];
      case 'parenthesized_expression': return parts.length === 1 ? expression(parts[0]) : fail(node);
      case 'prefix_unary_expression': {
        if (parts.length !== 1) return fail(node);
        const operator = node.children[0].text;
        if (!['+', '-', '~', '!'].includes(operator)) return fail(node);
        // -(2147483648) and -2147483648 have different native types.
        const token = parts[0].text;
        const magnitude = parts[0].type === 'integer_literal' ? csharpIntegerLiteral(token).constant : undefined;
        const directMinimum = operator === '-' && parts[0].type === 'integer_literal'
          && (magnitude === '2147483648' && !/[uUlL]$/.test(token) || magnitude === '9223372036854775808' && !/[uU]/.test(token));
        return ['unary', operator, directMinimum, expression(parts[0])];
      }
      case 'binary_expression': return ['binary', field(node, 'operator').text, expression(field(node, 'left')), expression(field(node, 'right'))];
      case 'cast_expression': {
        const type = field(node, 'type');
        if (type.type !== 'predefined_type') return fail(type);
        return ['cast', type.text, expression(field(node, 'value'))];
      }
      case 'checked_expression': return parts.length === 1 ? ['overflow', node.children[0].text, expression(parts[0])] : fail(node);
      default: return fail(node);
    }
  };
  const normalize = (node: SyntaxNode): unknown => {
    const parts = children(node);
    switch (node.type) {
      case 'compilation_unit':
        if (parts.length !== 1 || parts[0].type !== 'class_declaration') return fail(node);
        return normalize(parts[0]);
      case 'class_declaration':
        if (parts.some(child => !['modifier', 'identifier', 'declaration_list'].includes(child.type))) return fail(node);
        return ['class', parts.filter(child => child.type === 'modifier').map(child => child.text).sort(), identifier(field(node, 'name')), children(field(node, 'body')).map(normalize)];
      case 'method_declaration': {
        if (parts.some(child => !['modifier', 'predefined_type', 'identifier', 'parameter_list', 'block', 'arrow_expression_clause'].includes(child.type))) return fail(node);
        const body = field(node, 'body');
        const statements = body.type === 'arrow_expression_clause' ? [['return', expression(children(body)[0])]] : children(body).map(normalize);
        return ['method', parts.filter(child => child.type === 'modifier').map(child => child.text).sort(), field(node, 'returns').text, identifier(field(node, 'name')), children(field(node, 'parameters')).map(normalize), statements];
      }
      case 'parameter':
        if (parts.some(child => !['predefined_type', 'identifier'].includes(child.type)) || node.children.some(child => child.type === '=')) return fail(node);
        return ['parameter', field(node, 'type').text, identifier(field(node, 'name'))];
      case 'return_statement': return parts.length === 0 ? ['return'] : parts.length === 1 ? ['return', expression(parts[0])] : fail(node);
      case 'block': return ['scope', 'default', children(node).map(normalize)];
      case 'checked_statement': return parts.length === 1 && parts[0].type === 'block' ? ['scope', node.children[0].text, children(parts[0]).map(normalize)] : fail(node);
      case 'expression_statement': {
        if (parts.length !== 1) return fail(node);
        if (['prefix_unary_expression', 'postfix_unary_expression'].includes(parts[0].type)) {
          const update = parts[0], target = children(update)[0];
          const operator = update.children.find(child => ['++', '--'].includes(child.text))?.text;
          if (!operator || target?.type !== 'identifier') return fail(node);
          return ['update', operator, update.type === 'prefix_unary_expression', identifier(target)];
        }
        if (parts[0].type !== 'assignment_expression') return fail(node);
        const assignment = parts[0], left = field(assignment, 'left');
        const operator = field(assignment, 'operator').text;
        if (left.type !== 'identifier' || !['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '>>>='].includes(operator)) return fail(node);
        return ['assign', operator, identifier(left), expression(field(assignment, 'right'))];
      }
      case 'local_declaration_statement': {
        if (parts.some(child => !['modifier', 'variable_declaration'].includes(child.type))) return fail(node);
        const declaration = parts.find(child => child.type === 'variable_declaration') ?? fail(node);
        const variables = children(declaration).filter(child => child.type === 'variable_declarator');
        if (!variables.length) return fail(node);
        if (variables.length > 1) return ['local-group', parts.filter(child => child.type === 'modifier').map(child => child.text).sort(), field(declaration, 'type').text, variables.map(variable => {
          const name = field(variable, 'name'), values = children(variable).filter(child => child.id !== name.id);
          if (!values.length && !variable.children.some(child => child.type === '=')) return [identifier(name)];
          if (values.length !== 1 || !variable.children.some(child => child.type === '=')) return fail(variable);
          return [identifier(name), expression(values[0])];
        })];
        const variable = variables[0], name = field(variable, 'name');
        const values = children(variable).filter(child => child.id !== name.id);
        if (!values.length && !variable.children.some(child => child.type === '=')) return ['local', parts.filter(child => child.type === 'modifier').map(child => child.text).sort(), field(declaration, 'type').text, identifier(name)];
        if (values.length !== 1 || !variable.children.some(child => child.type === '=')) return fail(variable);
        return ['local', parts.filter(child => child.type === 'modifier').map(child => child.text).sort(), field(declaration, 'type').text, identifier(name), expression(values[0])];
      }
      default: return fail(node);
    }
  };
  try { return JSON.stringify(normalize(tree.rootNode)); }
  finally { tree.delete(); }
}

/** Reimport compares generated versions, including authored graph comments. */
export function normalizedCSharpReimportSyntax(source: string): string {
  const syntax = normalizedCSharpSyntax(source);
  const tree = parseCSharpTree(source);
  try {
    const comments: { start: number; text: string }[] = [];
    const queue = [tree.rootNode];
    while (queue.length) {
      const node = queue.pop()!;
      if (node.type === 'comment') comments.push({ start: node.startIndex, text: node.text.trim() });
      else queue.push(...node.namedChildren);
    }
    comments.sort((left, right) => left.start - right.start);
    return JSON.stringify([syntax, comments.map(comment => comment.text)]);
  } finally { tree.delete(); }
}
