import { expect, test } from 'bun:test';
import cases from '../../../tools/native_constant_cases.json';
import { evaluateNativeConstant, nativeScalarLiteral, NativeScalarFailure, type NativeConstantExpression } from './index';

for (const language of ['cpp', 'rust', 'gdscript'] as const) for (const fixture of cases[language]) {
  if (fixture.calibration) continue;
  test(`shared scalar core ${language}/${fixture.id}`, () => {
    const evaluate = () => evaluateNativeConstant(fixture.tree as NativeConstantExpression, language);
    if (fixture.modelDiagnostic) {
      try { evaluate(); throw new Error('Expected native semantic rejection'); }
      catch (error) {
        expect(error).toBeInstanceOf(NativeScalarFailure);
        expect((error as NativeScalarFailure).code).toBe(`${language.toUpperCase()}_${fixture.modelDiagnostic}`);
      }
    } else {
      const fact = evaluate();
      expect(fact.nativeType).toBe(fixture.nativeType);
      expect(String(fact.payload)).toBe(fixture.payload);
      expect(Object.isFrozen(fact)).toBe(true);
      expect(fact.graphAdmission).toBe('blocked');
    }
  });
}

test('shared native semantics recompute edited operands and reject invalid edits', () => {
  const expression: NativeConstantExpression = { kind: 'binary', operator: '/', left: { kind: 'literal', token: '12' }, right: { kind: 'literal', token: '3' } };
  for (const language of ['cpp', 'rust', 'gdscript'] as const) {
    expression.right = { kind: 'literal', token: '3' };
    expect(evaluateNativeConstant(expression, language).payload).toBe('4');
    expression.right = { kind: 'literal', token: '2' };
    expect(evaluateNativeConstant(expression, language).payload).toBe('6');
    expression.right = { kind: 'literal', token: '0' };
    expect(() => evaluateNativeConstant(expression, language)).toThrow(`${language.toUpperCase()}_CONSTANT_DIVIDE_BY_ZERO`);
  }
  expect(() => nativeScalarLiteral('256u8', 'rust')).toThrow('RUST_LITERAL_OVERFLOW');
});
