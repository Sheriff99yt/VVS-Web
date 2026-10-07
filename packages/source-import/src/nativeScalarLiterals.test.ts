import { expect, test } from 'bun:test';
import cases from '../../../tools/native_scalar_cases.json';
import { nativeScalarLiteral } from './nativeScalarLiterals';

for (const language of ['cpp', 'rust', 'gdscript'] as const) for (const fixture of cases[language]) {
  if (fixture.calibration) continue;
  test(`native scalar ${language}/${fixture.id}`, () => {
    const analyze = () => nativeScalarLiteral(fixture.token, language, { expectedType: fixture.context ?? undefined, negated: fixture.negated });
    if (fixture.modelDiagnostic) expect(analyze).toThrow(`${language.toUpperCase()}_${fixture.modelDiagnostic}`);
    else {
      const fact = analyze(); expect(fact.nativeType).toBe(fixture.nativeType);
      expect(String(fact.payload)).toBe(fixture.payload); expect(fact.token).toBe(fixture.token);
      expect(fact.graphAdmission).toBe('blocked'); expect(Object.isFrozen(fact)).toBe(true);
    }
  });
}
test('unsupported tokens and hostile literal budgets cannot become scalar facts', () => {
  for (const language of ['cpp', 'rust', 'gdscript'] as const) for (const token of ['','-1','1.5','someCall()','0x','0b2','1' .repeat(1025)]) expect(() => nativeScalarLiteral(token,language)).toThrow();
  expect(() => nativeScalarLiteral('1lL','cpp')).toThrow();
  expect(() => nativeScalarLiteral('1__2','gdscript')).toThrow();
});
