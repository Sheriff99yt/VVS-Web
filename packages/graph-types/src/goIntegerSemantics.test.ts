import { expect, test } from 'bun:test';
import { GO_INTEGER_TYPES, goIntegerLiteral, goIntegerAssignable, goIntegerBinary, goIntegerUnary, goDefaultInteger, goIntegerDescriptor, type GoIntegerType } from './goIntegerSemantics';

test('Go integer tokens preserve exact magnitude and enforce lexer/budget limits', () => {
  for (const [token, expected] of [['18446744073709551615', '18446744073709551615'], ['0xffff_ffff_ffff_ffff', '18446744073709551615'], ['0b_1111', '15'], ['0o_777', '511'], ['0777', '511'], ['0_777', '511']]) expect(goIntegerLiteral(token).constant).toBe(expected);
  for (const token of ['-1', '+1', '09', '1__2', '1_', '0x', '0_x1', '0b2', '1; panic()', 'NaN', 'Infinity', '1.0', '1e2']) expect(() => goIntegerLiteral(token)).toThrow();
  expect(() => goIntegerLiteral('9'.repeat(200))).toThrow('CONSTANT_BUDGET');
});
test('every signedness/width boundary is exact under both word sizes', () => {
  for (const bits of [32, 64] as const) for (const type of GO_INTEGER_TYPES) {
    const descriptor = goIntegerDescriptor(type, bits);
    for (const value of [descriptor.min, descriptor.max]) expect(goIntegerAssignable({ type: 'untyped-integer', constant: String(value) }, type, bits).constant).toBe(String(value));
    for (const value of [descriptor.min - 1n, descriptor.max + 1n]) expect(() => goIntegerAssignable({ type: 'untyped-integer', constant: String(value) }, type, bits)).toThrow('OVERFLOW');
  }
  expect(goIntegerAssignable({ type: 'byte', constant: '255' }, 'uint8', 64).type).toBe('uint8');
  expect(goIntegerAssignable({ type: 'rune', constant: '-1' }, 'int32', 32).type).toBe('int32');
  expect(() => goIntegerAssignable({ type: 'int8', constant: '1' }, 'int16', 64)).toThrow('TYPE_MISMATCH');
});
test('constant arithmetic uses Go integer division/remainder and checked typed results', () => {
  const literal = (value: string) => ({ type: 'untyped-integer' as const, constant: value });
  expect(goIntegerBinary('/', literal('-7'), literal('3'), 64).constant).toBe('-2');
  expect(goIntegerBinary('%', literal('-7'), literal('3'), 64).constant).toBe('-1');
  expect(goIntegerBinary('&^', literal('15'), literal('3'), 64).constant).toBe('12');
  expect(goIntegerUnary('^', { type: 'uint8', constant: '0' }, 64).constant).toBe('255');
  expect(goIntegerUnary('^', literal('0'), 64).constant).toBe('-1');
  expect(() => goIntegerBinary('+', { type: 'int8', constant: '127' }, literal('1'), 64)).toThrow('OVERFLOW');
  expect(goIntegerBinary('+', { type: 'int8' }, literal('1'), 64)).toEqual({ type: 'int8' });
  expect(() => goIntegerUnary('-', { type: 'uint8', constant: '1' }, 64)).toThrow('OVERFLOW');
  expect(goIntegerUnary('-', { type: 'uint8' }, 64)).toEqual({ type: 'uint8' });
  for (const operator of ['/', '%'] as const) expect(() => goIntegerBinary(operator, { type: 'int64' }, literal('0'), 64)).toThrow('DIVIDE_ZERO');
});
test('integer inference and shifts retain explicit native types and context', () => {
  expect(goDefaultInteger(goIntegerLiteral('2147483648'), 64).type).toBe('int');
  expect(() => goDefaultInteger(goIntegerLiteral('2147483648'), 32)).toThrow('OVERFLOW');
  expect(goIntegerBinary('<<', { type: 'uint8', constant: '1' }, { type: 'int64', constant: '7' }, 64)).toEqual({ type: 'uint8', constant: '128' });
  expect(() => goIntegerBinary('<<', { type: 'uint8', constant: '1' }, goIntegerLiteral('8'), 64)).toThrow('OVERFLOW');
  expect(() => goIntegerBinary('<<', goIntegerLiteral('1'), { type: 'untyped-integer', constant: '-1' }, 64)).toThrow('NEGATIVE_SHIFT');
  expect(goIntegerBinary('<<', goIntegerLiteral('1'), { type: 'uint8' }, 32)).toEqual({ type: 'int' });
  expect(() => goIntegerBinary('+', { type: 'int' }, { type: 'uint' }, 64)).toThrow('TYPE_MISMATCH');
  expect(() => goIntegerBinary('arbitrary' as '+', { type: 'int64' }, { type: 'int64' }, 64)).toThrow('OPERATOR');
  expect(() => goIntegerAssignable(goIntegerLiteral('1'), 'float64' as GoIntegerType, 64)).toThrow('TYPE');
});

test('large native shifts separate constant limits, uint counts and runtime evidence', () => {
  expect(goIntegerBinary('>>', goIntegerLiteral('1'), goIntegerLiteral('1000'), 64).constant).toBe('0');
  expect(goIntegerBinary('<<', goIntegerLiteral('0'), goIntegerLiteral('1074'), 64).constant).toBe('0');
  expect(() => goIntegerBinary('>>', goIntegerLiteral('1'), goIntegerLiteral('1075'), 64)).toThrow('CONSTANT_SHIFT_LIMIT');
  expect(goIntegerBinary('<<', { type: 'uint8' }, goIntegerLiteral('18446744073709551615'), 64)).toEqual({ type: 'uint8' });
  expect(() => goIntegerBinary('<<', { type: 'uint8' }, goIntegerLiteral('18446744073709551615'), 32)).toThrow('OVERFLOW');
  expect(goIntegerBinary('<<', { type: 'uint8' }, { type: 'uint64', constant: '18446744073709551615' }, 32)).toEqual({ type: 'uint8' });
});
