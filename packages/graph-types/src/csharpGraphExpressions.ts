import type { GraphDocument } from './symbols';
import type { NativeParameter } from './nativeSignatures';
import { nativeExpressionSettings, nativeExpressionProblem, NATIVE_EXPRESSION_KINDS } from './nativeExpressions';
import { csharpIntegerLiteral, csharpIntegerNegatedLiteral, csharpIntegerUnary, csharpIntegerBinary, csharpIntegerConvert, type CSharpIntegerFact, type CSharpIntegerType, type CSharpIntegerOperator, type CSharpOverflowContext } from './csharpIntegerSemantics';
import { csharpIntegerComparison, csharpBooleanUnary, csharpBooleanBinary, type CSharpBooleanFact, type CSharpComparisonOperator } from './csharpBooleanSemantics';

export class CSharpGraphExpressionError extends Error {
  constructor(code: string) { super(`NATIVE_CSHARP_EXPRESSION_${code}`); }
}
export interface CSharpGraphLocalBinding { name: string; definitionId: string; fact: CSharpIntegerFact; initialized?: boolean }
export type CSharpGraphValueFact = CSharpIntegerFact | CSharpBooleanFact;
function integral(fact: CSharpGraphValueFact): CSharpIntegerFact {
  if (fact.type === 'bool') throw new CSharpGraphExpressionError('INTEGER_DOMAIN');
  return fact;
}
function boolean(fact: CSharpGraphValueFact): CSharpBooleanFact {
  if (fact.type !== 'bool') throw new CSharpGraphExpressionError('BOOLEAN_DOMAIN');
  return fact;
}
/** Transient graph-owned facts; never an emitter or serialized constant cache. */
export function inferCSharpGraphValueExpression(doc: GraphDocument, signature: NativeParameter[], entryId: string, nodeId: string, handle: string, context: CSharpOverflowContext = 'default', visited = new Set<string>(), active = new Set<string>(), locals: ReadonlyMap<string, CSharpGraphLocalBinding> = new Map(), reachable = true): CSharpGraphValueFact {
  if (active.has(nodeId) || active.size >= 64) throw new CSharpGraphExpressionError('CYCLE_OR_DEPTH');
  const node = doc.nodes.find(node => node.id === nodeId);
  if (!node) throw new CSharpGraphExpressionError('NODE_MISSING');
  if (nodeId === entryId && node.data.kindId === 'function_entry') {
    const parameter = signature.find(parameter => parameter.id === handle);
    if (!parameter?.nativeType) throw new CSharpGraphExpressionError('PARAMETER');
    return { type: parameter.nativeType as CSharpIntegerType };
  }
  if (node.data.kindId === 'variable_get') {
    const symbolId = node.data.graphBinding?.symbolId ?? node.data.properties?.symbolId;
    const binding = typeof symbolId === 'string' ? locals.get(symbolId) : undefined;
    if (!binding || handle !== 'val' || !doc.nodes.some(node => node.id === binding.definitionId && node.data.kindId === 'var_define')) throw new CSharpGraphExpressionError('LOCAL_SCOPE');
    if (reachable && binding.initialized === false) throw new CSharpGraphExpressionError('LOCAL_NOT_INITIALIZED');
    if (!node.data.outputs.some(pin => pin.id === 'val' && pin.type === 'data_number') || node.data.inputs.length || Object.keys(node.data.inlineValues ?? {}).length || doc.edges.some(edge => edge.target === nodeId)) throw new CSharpGraphExpressionError('LOCAL_READ');
    if (node.data.properties?.symbolId && node.data.properties.symbolId !== symbolId) throw new CSharpGraphExpressionError('LOCAL_BINDING');
    if (node.data.properties?.variableName !== binding.name) throw new CSharpGraphExpressionError('LOCAL_READ_NAME');
    visited.add(nodeId); return { ...binding.fact };
  }
  if (!NATIVE_EXPRESSION_KINDS.includes(node.data.kindId as typeof NATIVE_EXPRESSION_KINDS[number]) || handle !== 'result') throw new CSharpGraphExpressionError('DOMAIN');
  if (nativeExpressionProblem(node.data, 'csharp')) throw new CSharpGraphExpressionError('SETTINGS');
  visited.add(nodeId); active.add(nodeId);
  const settings = nativeExpressionSettings(node.data);
  const edge = (index: number) => {
    const incoming = doc.edges.filter(edge => edge.target === nodeId && edge.targetHandle === `operand-${index}`);
    if (incoming.length !== 1 || !incoming[0].sourceHandle || node.data.inlineValues?.[`operand-${index}`] !== undefined) throw new CSharpGraphExpressionError('OPERAND');
    return incoming[0];
  };
  const operand = (index: number, overflow = context, live = reachable) => { const source = edge(index); return inferCSharpGraphValueExpression(doc, signature, entryId, source.source, source.sourceHandle!, overflow, visited, active, locals, live); };
  try {
    let fact: CSharpGraphValueFact;
    if (settings.form === 'scalar') fact = settings.domain === 'csharp-bool' ? { type: 'bool', constant: settings.payload === 'true' } : csharpIntegerLiteral(settings.payload);
    else if (settings.form === 'overflow') fact = operand(0, settings.payload as CSharpOverflowContext);
    else if (settings.form === 'parentheses') fact = operand(0);
    else if (settings.form === 'conversion') fact = csharpIntegerConvert(integral(operand(0)), settings.targetType as CSharpIntegerType, context);
    else if (settings.form === 'binary') {
      const a = operand(0);
      if (['&&', '||'].includes(settings.operator)) {
        const left = boolean(a), liveRight = reachable && !(settings.operator === '&&' && left.constant === false || settings.operator === '||' && left.constant === true);
        fact = csharpBooleanBinary(settings.operator as '&&' | '||', left, boolean(operand(1, context, liveRight)));
      } else {
        const b = operand(1);
        if (a.type === 'bool' || b.type === 'bool') fact = csharpBooleanBinary(settings.operator as Parameters<typeof csharpBooleanBinary>[0], boolean(a), boolean(b));
        else if (['==', '!=', '<', '<=', '>', '>='].includes(settings.operator)) fact = csharpIntegerComparison(settings.operator as CSharpComparisonOperator, a, b);
        else fact = csharpIntegerBinary(settings.operator as CSharpIntegerOperator, a, b, context);
      }
    } else if (settings.form === 'unary') {
      const source = edge(0); const child = doc.nodes.find(node => node.id === source.source)!;
      const childSettings = nativeExpressionSettings(child.data);
      // Native lexical minimum-value exception applies only to a direct literal.
      if (settings.operator === '-' && child.data.kindId === 'expr_native_literal' && childSettings.language === 'csharp' && childSettings.form === 'scalar') {
        integral(operand(0)); fact = csharpIntegerNegatedLiteral(childSettings.payload, context);
      } else {
        const value = operand(0);
        fact = settings.operator === '!' ? csharpBooleanUnary(boolean(value)) : csharpIntegerUnary(settings.operator as '+' | '-' | '~', integral(value), context);
      }
    } else throw new CSharpGraphExpressionError('FORM');
    if ((fact.type === 'bool' ? 'csharp-bool' : 'csharp-integer') !== settings.domain) throw new CSharpGraphExpressionError('RESULT_DOMAIN');
    return fact;
  } finally { active.delete(nodeId); }
}
/** Integral consumers stay strict when Boolean values become available. */
export function inferCSharpGraphExpression(...args: Parameters<typeof inferCSharpGraphValueExpression>): CSharpIntegerFact {
  return integral(inferCSharpGraphValueExpression(...args));
}
