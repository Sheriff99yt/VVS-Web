import { nativeRuntimeOperatorType, nativeRustConstantContext, canonicalNativeScalarSignatureType, type NativeConstantExpression, type NativeRuntimeTypeFact } from '@vvs/graph-types';
import type { Node as SyntaxNode } from 'web-tree-sitter';
import { ImportFailure, IMPORT_LIMITS, type SourceSpan } from './contracts';
import { evaluateNativeConstant } from './nativeConstantExpressions';
import type { NativeInventoryLanguage } from './nativeSyntaxInventory';

export type NativeSourceParameterReference = { kind: 'parameter'; slot: number; nativeType: string; declaration: Readonly<SourceSpan> };
export type NativeSourceLocalReference = { kind: 'local'; bindingId: string; nativeType: string; declaration: Readonly<SourceSpan> };
export type NativeSourceReference = NativeSourceParameterReference | NativeSourceLocalReference;
export type NativeScalarSourceExpression<R extends NativeSourceReference = NativeSourceReference> = Readonly<SourceSpan & { syntaxKind: string; spelling?: string } & (
  R | { kind: 'literal'; token: string }
  | { kind: 'group'; operand: NativeScalarSourceExpression<R> }
  | { kind: 'convert'; nativeType: string; operand: NativeScalarSourceExpression<R> }
  | { kind: 'unary'; operator: string; operand: NativeScalarSourceExpression<R>; directLiteral: boolean }
  | { kind: 'binary'; operator: string; left: NativeScalarSourceExpression<R>; right: NativeScalarSourceExpression<R> }
)>;
const children = (node: SyntaxNode) => node.namedChildren.filter(child => !['comment', 'line_comment', 'block_comment'].includes(child.type));
const span = (node: SyntaxNode): SourceSpan => ({ start: node.startIndex, end: node.endIndex });

/** Reviewed conversions only; arbitrary calls never acquire a conversion contract. */
export function nativeScalarSourceConversion(node: SyntaxNode, language: NativeInventoryLanguage) {
  let operand: SyntaxNode | undefined, type: string | undefined;
  if (language === 'rust' && node.type === 'type_cast_expression') { operand = node.childForFieldName('value') ?? undefined; type = node.childForFieldName('type')?.text; }
  if (language === 'gdscript' && node.type === 'call') {
    const name = children(node).find(child => child.type === 'identifier')?.text, args = node.childForFieldName('arguments');
    if (name && ['int', 'bool'].includes(name) && args && children(args).length === 1) { type = name; operand = children(args)[0]; }
  }
  if (language === 'cpp' && node.type === 'call_expression') {
    const callee = node.childForFieldName('function'), args = node.childForFieldName('arguments'), types = callee?.childForFieldName('arguments');
    if (callee?.type === 'template_function' && callee.childForFieldName('name')?.text === 'static_cast' && args && types && children(args).length === 1 && children(types).length === 1) { operand = children(args)[0]; type = children(types)[0].text; }
  }
  const nativeType = type && canonicalNativeScalarSignatureType(type, language);
  return operand && nativeType ? { operand, nativeType, authoredType: type! } : undefined;
}

/** One reviewed AST decoder; references are supplied by the exact owning binding inventory. */
export function createNativeScalarSourceExpressionReader<R extends NativeSourceReference>(source: string, language: NativeInventoryLanguage, reference: (node: SyntaxNode) => R, codePrefix = 'NATIVE_RUNTIME_SOURCE', budget = { count: 0, started: performance.now() }) {
  const fail = (node: SyntaxNode, code: string): never => { throw new ImportFailure(`${codePrefix}_${code}`, 'This expression requires its native source/binding/type contract.', span(node)); };
  const read = (node: SyntaxNode, depth = 0): NativeScalarSourceExpression<R> => {
    if (depth > 128 || ++budget.count > 4096 || performance.now() - budget.started > IMPORT_LIMITS.elapsedMs) return fail(node, 'BUDGET');
    const base = { ...span(node), syntaxKind: node.type };
    if (node.type === 'identifier') return Object.freeze({ ...base, ...reference(node) });
    if (['integer_literal', 'number_literal', 'integer', 'boolean_literal', 'true', 'false'].includes(node.type)) {
      if (language === 'cpp' && /^[+-]/.test(node.text)) return Object.freeze({ ...base, kind: 'unary', operator: node.text[0], spelling: node.text[0], directLiteral: true, operand: Object.freeze({ ...base, start: base.start + 1, kind: 'literal', token: node.text.slice(1) }) });
      return Object.freeze({ ...base, kind: 'literal', token: node.text });
    }
    if (node.type === 'parenthesized_expression') {
      if (children(node).length !== 1) return fail(node, 'GROUP');
      return Object.freeze({ ...base, kind: 'group', operand: read(children(node)[0], depth + 1) });
    }
    if (['unary_expression', 'unary_operator'].includes(node.type)) {
      const child = children(node)[0]; if (!child) return fail(node, 'UNARY');
      const spelling = node.childForFieldName('operator')?.text ?? source.slice(node.startIndex, child.startIndex).trim();
      return Object.freeze({ ...base, kind: 'unary', spelling, operator: spelling === 'not' ? '!' : spelling, directLiteral: ['integer', 'integer_literal', 'number_literal'].includes(child.type), operand: read(child, depth + 1) });
    }
    if (['binary_expression', 'binary_operator'].includes(node.type)) {
      const left = node.childForFieldName('left'), right = node.childForFieldName('right');
      if (!left || !right) return fail(node, 'BINARY');
      const spelling = node.childForFieldName('operator')?.text ?? source.slice(left.endIndex, right.startIndex).trim();
      return Object.freeze({ ...base, kind: 'binary', operator: spelling, spelling, left: read(left, depth + 1), right: read(right, depth + 1) });
    }
    const conversion = nativeScalarSourceConversion(node, language);
    if (conversion) return Object.freeze({ ...base, kind: 'convert', nativeType: conversion.nativeType, spelling: conversion.authoredType, operand: read(conversion.operand, depth + 1) });
    return fail(node, 'EXPRESSION_CONTEXT');
  };
  return read;
}

/** Constant islands only; local/parameter values are never substituted into expressions. */
export function nativeScalarSourceConstant(tree: NativeScalarSourceExpression): NativeConstantExpression | undefined {
  if (tree.kind === 'parameter' || tree.kind === 'local') return;
  if (tree.kind === 'literal') return { kind: 'literal', token: tree.token };
  if (tree.kind === 'binary') {
    const left = nativeScalarSourceConstant(tree.left), right = nativeScalarSourceConstant(tree.right);
    return left && right ? { kind: 'binary', operator: tree.operator, left, right } : undefined;
  }
  const operand = nativeScalarSourceConstant(tree.operand);
  if (!operand) return;
  if (tree.kind === 'group') return { kind: 'group', operand };
  if (tree.kind === 'convert') return { kind: 'convert', nativeType: tree.nativeType, operand };
  return { kind: 'unary', operator: tree.operator, operand, directLiteral: tree.directLiteral };
}

export function inferNativeScalarSourceExpression(tree: NativeScalarSourceExpression, language: NativeInventoryLanguage, expectedType?: string): { readonly fact: Readonly<NativeRuntimeTypeFact>; readonly referenceCount: number } {
  const hint = (node: NativeScalarSourceExpression): string | undefined => node.kind === 'parameter' || node.kind === 'local' || node.kind === 'convert' ? node.nativeType : node.kind === 'literal' ? node.token.match(/([iu](?:8|16|32|64|128|size))$/)?.[1] : node.kind === 'binary' ? ['==', '!=', '<', '<=', '>', '>=', '&&', '||', 'and', 'or'].includes(node.operator) ? 'bool' : hint(node.left) ?? hint(node.right) : hint(node.operand);
  let shortCircuit = false, referenceCount = 0, count = 0;
  const infer = (node: NativeScalarSourceExpression, context?: string, depth = 0): string => {
    if (depth > 128 || ++count > 4096) throw new ImportFailure('NATIVE_SOURCE_EXPRESSION_BUDGET', 'Expression inference exceeded its budget.', node);
    if (node.kind === 'parameter' || node.kind === 'local') { referenceCount++; return node.nativeType; }
    const island = nativeScalarSourceConstant(node);
    if (island) return evaluateNativeConstant(language === 'rust' && context ? nativeRustConstantContext(island, context) : island, language).nativeType;
    if (node.kind === 'group') return infer(node.operand, context, depth + 1);
    if (node.kind === 'literal') throw new ImportFailure('NATIVE_SOURCE_EXPRESSION_CONSTANT_CONTEXT', 'Missing constant context.', node);
    const form = node.kind === 'convert' ? 'conversion' : node.kind, op = node.kind === 'convert' ? node.nativeType : node.operator;
    const comparison = ['==', '!=', '<', '<=', '>', '>='].includes(op), shift = ['<<', '>>'].includes(op);
    const expected = language === 'rust' && form !== 'conversion' ? (comparison ? undefined : context) ?? (node.kind === 'binary' ? hint(node.left) ?? hint(node.right) : hint(node.operand)) : undefined;
    const operands = node.kind === 'binary' ? [infer(node.left, expected, depth + 1), infer(node.right, shift ? hint(node.right) : expected, depth + 1)] : [infer(node.operand, expected, depth + 1)];
    const fact = nativeRuntimeOperatorType(language, form, op, operands); shortCircuit ||= fact.evaluation === 'short-circuit'; return fact.nativeType;
  };
  const nativeType = infer(tree, expectedType);
  return Object.freeze({ fact: Object.freeze({ nativeType, domain: nativeType === 'bool' ? 'native-bool' : 'native-integer', evaluation: shortCircuit ? 'short-circuit' : 'ordinary', values: 'unknown' }), referenceCount });
}
