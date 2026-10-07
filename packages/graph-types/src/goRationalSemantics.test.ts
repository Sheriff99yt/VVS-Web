import { expect, test } from 'bun:test';
import { goFloatLiteral, goRationalAssignable, goRationalBinary } from './goRationalSemantics';
import { goValueBinary, goValueDefault, goValueAssignable, goValueConvert, goValueConstant, goValueCompare } from './goValueSemantics';
test('Go typed/untyped constant references retain declaration rounding and comparison facts', () => {
  const raw = goValueConstant(goFloatLiteral('16777217.0'), 'untyped', 64);
  const typed = goValueConstant(raw, 'float32', 64);
  expect(raw.constant).toBe('16777217');
  expect(typed.constant).toBe('16777216');
  expect(goValueCompare('==', typed, raw, 64)).toEqual({ type: 'untyped-bool', constant: 'true' });
  expect(goValueConstant(goValueConvert(typed, 'float64', 64), 'untyped', 64).constant).toBe('16777216');
  expect(() => goValueConstant({ type: 'int' }, 'untyped', 64)).toThrow('CONSTANT_INITIALIZER');
  expect(() => goValueConstant(goValueCompare('>', { type: 'int' }, { type: 'untyped-integer', constant: '0' }, 64), 'untyped', 64)).toThrow('CONSTANT_INITIALIZER');
  expect(goValueCompare('>', { type: 'untyped-string', constant: '𐀀' }, { type: 'untyped-string', constant: '' }, 64).constant).toBe('true');
  expect(goValueBinary('+', { type: 'untyped-string', constant: '' }, { type: 'untyped-string', constant: 'ok' }, 64).constant).toBe('ok');
});
test('Go exact rational tokens and operations retain values without JS Number coercion', () => {
  expect(goFloatLiteral('18446744073709551615.0').constant).toBe('18446744073709551615');
  expect(goFloatLiteral('0x_1.fp+2').constant).toBe('31/4');
  expect(goRationalBinary('+', goFloatLiteral('.1'), goFloatLiteral('.2')).constant).toBe('3/10');
  expect(goRationalBinary('/', goFloatLiteral('1.'), goFloatLiteral('3.')).constant).toBe('1/3');
});
test('Go native floating assignment rounds ties even and rejects infinity', () => {
  expect(goRationalAssignable(goFloatLiteral('9007199254740993.0'), 'float64').constant).toBe('9007199254740992');
  expect(goRationalAssignable(goFloatLiteral('0x1p-1075'), 'float64').constant).toBe('0');
  expect(goRationalAssignable(goFloatLiteral('1e-1200'), 'float64').constant).toBe('0');
  expect(() => goRationalAssignable(goFloatLiteral('0x1.fffffffffffff8p1023'), 'float64')).toThrow('OVERFLOW');
});
test('Go mixed native operands, integral constants and shift inference respect native contexts', () => {
  expect(goValueAssignable(goFloatLiteral('255.0'), 'uint8', 64)).toBe(true);
  expect(() => goValueAssignable(goFloatLiteral('1.5'), 'uint8', 64)).toThrow('TRUNCATED_INTEGER');
  expect(goValueDefault({ type: 'inline-number', constant: '1' }, 64).type).toBe('int');
  expect(goValueDefault({ type: 'inline-number', constant: '1.5' }, 64).type).toBe('float64');
  expect(goValueBinary('+', { type: 'int8' }, goFloatLiteral('1.0'), 64).type).toBe('int8');
  const shifted = goValueBinary('<<', goFloatLiteral('1.0'), { type: 'uint8' }, 64);
  expect(goValueAssignable(shifted, 'uint64', 64)).toBe(true);
  expect(() => goValueDefault(shifted, 64)).toThrow('SHIFT_CONTEXT_TYPE');
});
test('Go rational fallback prerequisites stay distinct from malformed tokens and zero division', () => {
  expect(() => goFloatLiteral('1e1400')).toThrow('BIG_FLOAT_PREREQUISITE');
  expect(() => goFloatLiteral('1_.0')).toThrow('TOKEN');
  expect(() => goRationalBinary('/', { type: 'float64' }, goFloatLiteral('1e-1200'))).toThrow('DIVIDE_ZERO');
});

test('Go visible numeric conversions retain native target types and exact constant rounding', () => {
  expect(goValueConvert({ type: 'int64' }, 'uint8', 32)).toEqual({ type: 'uint8' });
  expect(goValueConvert({ type: 'float64' }, 'int32', 64)).toEqual({ type: 'int32' });
  expect(goValueConvert(goValueConvert(goFloatLiteral('.1'), 'float32', 64), 'float64', 64).constant).toBe('13421773/134217728');
  expect(() => goValueConvert(goFloatLiteral('1.5'), 'int32', 64)).toThrow('TRUNCATED_INTEGER');
  expect(() => goValueAssignable({ type: 'float32' }, 'float64', 64)).toThrow('TYPE_MISMATCH');
});
