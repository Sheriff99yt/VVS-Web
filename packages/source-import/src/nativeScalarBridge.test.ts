import { expect, test } from 'bun:test';
import { NativeScalarFailure, evaluateNativeConstant as sharedConstant } from '@vvs/graph-types';
import { ImportFailure } from './contracts';
import { nativeScalarLiteral } from './nativeScalarLiterals';
import { evaluateNativeConstant } from './nativeConstantExpressions';

test('shared semantic failures retain importer diagnostic identity without duplicate prefixes', () => {
  const checks = [
    () => nativeScalarLiteral('256u8', 'rust'),
    () => evaluateNativeConstant({ kind: 'binary', operator: '/', left: { kind: 'literal', token: '1' }, right: { kind: 'literal', token: '0' } }, 'cpp'),
  ];
  for (const check of checks) {
    try { check(); throw new Error('Expected semantic rejection'); }
    catch (error) {
      expect(error).toBeInstanceOf(ImportFailure);
      expect(error).not.toBeInstanceOf(NativeScalarFailure);
      const failure = error as ImportFailure;
      expect(failure.message.split(failure.code).length).toBe(2);
      expect(failure.span).toEqual({ start: 0, end: 0 });
    }
  }
  const expression = { kind: 'literal' as const, token: '42' };
  expect(evaluateNativeConstant(expression, 'gdscript')).toEqual(sharedConstant(expression, 'gdscript'));
});
