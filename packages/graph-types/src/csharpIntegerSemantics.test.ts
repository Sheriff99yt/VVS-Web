import { expect, test } from 'bun:test';
import { csharpIntegerLiteral, csharpIntegerAssignable, csharpIntegerConvert, csharpIntegerBinary, csharpIntegerUnary } from './csharpIntegerSemantics';

test('integer tokens reject executable text, misplaced separators, signs and excessive values', () => {
  for (const token of ['-1', '+1', '1;', 'call()', '1_', '_1', '0x_', '1uu', '0o12', '1.0', '18446744073709551616', '1'.repeat(1025)]) expect(() => csharpIntegerLiteral(token), token).toThrow('NATIVE_CSHARP_INTEGER_');
});
test('constant facts must be canonical and within their native type', () => {
  for (const constant of ['01', '-0', '1.0', 'Infinity', '2147483648', '1'.repeat(1000)]) expect(() => csharpIntegerUnary('+', { type: 'int', constant })).toThrow('NATIVE_CSHARP_INTEGER_');
  expect(() => csharpIntegerUnary('+', { type: 'nint' as 'int' })).toThrow('TYPE');
});
test('a variable has no constant conversion just because its current UI value fits', () => {
  expect(() => csharpIntegerAssignable({ type: 'int' }, 'byte')).toThrow('ASSIGNMENT');
  expect(csharpIntegerAssignable({ type: 'int', constant: '1' }, 'byte')).toEqual({ type: 'byte', constant: '1' });
  expect(() => csharpIntegerAssignable({ type: 'int', constant: '65' }, 'char')).toThrow('ASSIGNMENT');
});
test('native overflow contexts affect constants without mutating operands or runtime values', () => {
  const left = Object.freeze({ type: 'int' as const, constant: '2147483647' });
  const right = Object.freeze({ type: 'int' as const, constant: '1' });
  expect(() => csharpIntegerBinary('+', left, right)).toThrow('OVERFLOW');
  expect(csharpIntegerBinary('+', left, right, 'unchecked')).toEqual({ type: 'int', constant: '-2147483648' });
  expect(left.constant).toBe('2147483647');
  expect(csharpIntegerBinary('+', { type: 'int' }, right, 'checked')).toEqual({ type: 'int' });
  expect(() => csharpIntegerConvert(left, 'byte', 'invalid' as 'checked')).toThrow('CONTEXT');
});
test('conditional/native effects are not inferred from an integral fact', () => {
  const fact = csharpIntegerBinary('+', { type: 'byte' }, { type: 'byte' });
  expect(fact).toEqual({ type: 'int' });
  expect('pure' in fact).toBe(false);
  expect('token' in fact).toBe(false);
});
