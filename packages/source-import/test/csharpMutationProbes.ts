import { CSHARP_INTEGER_TYPES, CSHARP_ASSIGNMENT_OPERATORS, type CSharpIntegerFact, type CSharpIntegerType } from '@vvs/graph-types';

export interface CSharpMutationProbe { type: CSharpIntegerType; readonly: boolean; operator: string; value?: CSharpIntegerFact }
/** Type/operator cross-product checked by independent pinned Roslyn binding.
 * Source is compiled but never executed; the observed assignment expression
 * captures its native result type, not a folded simulation of mutation.
 */
export function csharpMutationCases() {
  const cases: { id: string; mutationProbe: CSharpMutationProbe; files: { path: string; source: string }[]; expected: Record<string, unknown> }[] = [];
  const rights = [
    ...CSHARP_INTEGER_TYPES.map(type => ({ suffix: type, parameter: `${type} Input`, expression: 'Input', fact: { type } as CSharpIntegerFact })),
    ...['1', '256', '-1'].map(token => ({ suffix: `constant-${token}`, parameter: '', expression: token, fact: { type: 'int', constant: token } as CSharpIntegerFact })),
  ];
  for (const type of CSHARP_INTEGER_TYPES) {
    for (const operator of CSHARP_ASSIGNMENT_OPERATORS.filter(op => !['=', '++', '--'].includes(op))) {
      for (const right of rights) {
        cases.push({ id: `mutation-${type}-${operator}-${right.suffix}`, mutationProbe: { type, readonly: false, operator, value: right.fact }, expected: {},
          files: [{ path: 'Mutation.cs', source: `class Mutation { static void Check(${right.parameter}) { ${type} Value = (${type})0; var observed = (Value ${operator} ${right.expression}); } }` }] });
      }
    }
    for (const operator of ['++', '--']) for (const prefix of [false, true]) for (const readonly of [false, true]) {
      const expression = prefix ? `${operator}Value` : `Value${operator}`;
      cases.push({ id: `mutation-${type}-${operator}-${prefix ? 'prefix' : 'postfix'}-${readonly ? 'const' : 'mutable'}`, mutationProbe: { type, readonly, operator }, expected: {},
        files: [{ path: 'Mutation.cs', source: `class Mutation { static void Check() { ${readonly ? 'const ' : ''}${type} Value = (${type})0; var observed = ${expression}; } }` }] });
    }
  }
  return cases;
}
