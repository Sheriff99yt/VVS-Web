import { expect, test } from 'bun:test';
import cases from '../../../tools/native_constant_cases.json';
import { evaluateNativeConstant, type NativeConstantExpression } from './nativeConstantExpressions';

for (const language of ['cpp','rust','gdscript'] as const) for (const fixture of cases[language]) {
  if (fixture.calibration) continue;
  test(`native constant ${language}/${fixture.id}`,()=>{
    const analyze=()=>evaluateNativeConstant(fixture.tree as NativeConstantExpression,language);
    if (fixture.modelDiagnostic) expect(analyze).toThrow(`${language.toUpperCase()}_${fixture.modelDiagnostic}`);
    else {
      const result=analyze(); expect(result.nativeType).toBe(fixture.nativeType); expect(String(result.payload)).toBe(fixture.payload);
      expect(result.graphAdmission).toBe('blocked'); expect(result.domain).toBe('integer-boolean-constant-expressions');
      expect(Object.isFrozen(result.nativeWarnings)).toBe(true);
    }
  });
}
test('dynamic calls, conditional evaluation and hostile trees retain prerequisites',()=>{
  for (const language of ['cpp','rust','gdscript'] as const) {
    expect(()=>evaluateNativeConstant({kind:'binary',operator:'&&',left:{kind:'literal',token:'false'},right:{kind:'literal',token:'true'}},language)).toThrow('UNSUPPORTED_CONSTANT_CONDITIONAL_EVALUATION');
    const cycle={kind:'unary',operator:'-',operand:null} as unknown as NativeConstantExpression;
    (cycle as {operand:NativeConstantExpression}).operand=cycle;
    expect(()=>evaluateNativeConstant(cycle,language)).toThrow('UNSUPPORTED_CONSTANT_BUDGET');
  }
});
