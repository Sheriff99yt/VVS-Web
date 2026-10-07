import { CSHARP_INTEGER_TYPES, csharpIntegerComparison, csharpBooleanBinary, csharpBooleanUnary, type CSharpBooleanFact, type CSharpIntegerFact, type CSharpComparisonOperator } from '@vvs/graph-types';
export type CSharpBooleanProbe =
  | { kind: 'comparison'; operator: CSharpComparisonOperator; left: CSharpIntegerFact; right: CSharpIntegerFact }
  | { kind: 'binary'; operator: Parameters<typeof csharpBooleanBinary>[0]; left: CSharpBooleanFact; right: CSharpBooleanFact }
  | { kind: 'not'; operand: CSharpBooleanFact };
export function evaluateCSharpBooleanProbe(probe: CSharpBooleanProbe): CSharpBooleanFact {
  return probe.kind === 'comparison' ? csharpIntegerComparison(probe.operator, probe.left, probe.right) : probe.kind === 'binary' ? csharpBooleanBinary(probe.operator, probe.left, probe.right) : csharpBooleanUnary(probe.operand);
}
export function csharpBooleanProbes() {
  const cases: { id: string; files: { path: string; source: string }[]; expected: Record<string, unknown>; booleanProbe: CSharpBooleanProbe }[] = [];
  const add = (id: string, parameters: string, value: string, probe: CSharpBooleanProbe) => {
    let expected: Record<string, unknown>;
    try { const fact = evaluateCSharpBooleanProbe(probe); expected = { ok: true, expressionType: 'bool', declaredType: 'bool', constantAvailable: fact.constant !== undefined, ...(fact.constant !== undefined ? { constant: fact.constant ? 'true' : 'false' } : {}) }; }
    catch { expected = { ok: false }; }
    cases.push({ id: `boolean-${id}`, files: [{ path: 'Boolean.cs', source: `class BooleanWitness { static object Test(${parameters}) { var observed = ${value}; return observed; } }` }], expected, booleanProbe: probe });
  };
  for (const left of CSHARP_INTEGER_TYPES) for (const right of CSHARP_INTEGER_TYPES) for (const operator of ['==', '!=', '<', '<=', '>', '>='] as const) add(`runtime-${left}-${operator}-${right}`, `${left} Left, ${right} Right`, `Left ${operator} Right`, { kind: 'comparison', operator, left: { type: left }, right: { type: right } });
  for (const [name, leftToken, left, rightToken, right] of [
    ['negative-vs-ulong', '-1', { type: 'int', constant: '-1' }, '1UL', { type: 'ulong', constant: '1' }],
    ['positive-vs-ulong', '1', { type: 'int', constant: '1' }, '2UL', { type: 'ulong', constant: '2' }],
    ['uint-long', '4294967295U', { type: 'uint', constant: '4294967295' }, '4294967295L', { type: 'long', constant: '4294967295' }],
    ['long-min', '-9223372036854775808L', { type: 'long', constant: '-9223372036854775808' }, '0', { type: 'int', constant: '0' }],
    ['ulong-max', '18446744073709551615UL', { type: 'ulong', constant: '18446744073709551615' }, '0L', { type: 'long', constant: '0' }],
  ] as const) for (const operator of ['==', '!=', '<', '<=', '>', '>='] as const) add(`constant-${name}-${operator}`, '', `${leftToken} ${operator} ${rightToken}`, { kind: 'comparison', operator, left, right });
  for (const operator of ['&&', '||', '&', '|', '^', '==', '!='] as const) for (const a of [true, false, undefined]) for (const b of [true, false, undefined]) {
    const parameters = [a === undefined && 'bool Left', b === undefined && 'bool Right'].filter(Boolean).join(', ');
    add(`logic-${operator}-${a}-${b}`, parameters, `${a === undefined ? 'Left' : String(a)} ${operator} ${b === undefined ? 'Right' : String(b)}`, { kind: 'binary', operator, left: { type: 'bool', ...(a !== undefined ? { constant: a } : {}) }, right: { type: 'bool', ...(b !== undefined ? { constant: b } : {}) } });
  }
  for (const value of [true, false, undefined]) add(`not-${value}`, value === undefined ? 'bool Input' : '', `!${value === undefined ? 'Input' : String(value)}`, { kind: 'not', operand: { type: 'bool', ...(value !== undefined ? { constant: value } : {}) } });
  return cases;
}
