import type { Node as SyntaxNode } from 'web-tree-sitter';
import { parseNativeTree } from './nativeParser';
import type { NativeInventoryLanguage } from './nativeSyntaxInventory';

/** Structural comparison for the independently checked ordinary scalar domain.
 * Comments are excluded here only after source admission has rejected unmapped
 * authored comments. The printer may add its existing empty-body comment.
 */
export function normalizedNativeScalarSyntax(source: string, language: NativeInventoryLanguage): string {
  const tree = parseNativeTree(source, language);
  const punctuation = new Set(['(', ')', '{', '}', ';', ':', ',', '->']);
  const comments = new Set(['comment', 'line_comment', 'block_comment']);
  const visit = (node: SyntaxNode): unknown => {
    const named = node.namedChildren.filter(child => !comments.has(child.type));
    if (node.type === 'parenthesized_expression' && named.length === 1) return visit(named[0]);
    if (language === 'cpp' && node.type === 'number_literal' && /^[+-]/.test(node.text)) return ['unary_expression', [node.text[0], node.text[0]], ['number_literal', node.text.slice(1)]];
    const parts = node.children.filter(child => !comments.has(child.type) && (child.isNamed || !punctuation.has(child.type))).map(visit);
    if (language === 'gdscript' && ['unary_operator', 'unary_expression'].includes(node.type) && node.text.trimStart().startsWith('-')) parts.push(['direct-negative-literal', named[0]?.type === 'integer']);
    return parts.length ? [node.type, ...parts] : [node.type, node.text];
  };
  try { return JSON.stringify(visit(tree.rootNode)); } finally { tree.delete(); }
}
