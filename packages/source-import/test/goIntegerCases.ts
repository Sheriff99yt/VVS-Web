import { goValueBinary, goValueUnary, goValueDefault, resolveGoValueContext } from '@vvs/graph-types';
import { GoIntegerError, GO_INTEGER_TYPES, canonicalGoIntegerType, goIntegerAssignable, goIntegerBinary, goIntegerUnary, goIntegerLiteral, goIntegerDescriptor, goDefaultInteger, type GoIntegerFact, type GoWordBits } from '@vvs/graph-types';

interface Probe { id: string; source: string; wordBits: GoWordBits; evaluate: () => GoIntegerFact }
export const GO_INTEGER_PROBES: Probe[] = [];
for (const wordBits of [32, 64] as const) for (const type of GO_INTEGER_TYPES) {
  const descriptor = goIntegerDescriptor(type, wordBits);
  for (const [label, value] of [['minimum', descriptor.min], ['maximum', descriptor.max], ['below', descriptor.min - BigInt(1)], ['above', descriptor.max + BigInt(1)]] as const) GO_INTEGER_PROBES.push({
    id: `${wordBits}/${type}/${label}`, wordBits, source: `package sample\nconst Value ${type} = ${value}`,
    evaluate: () => goIntegerAssignable({ type: 'untyped-integer', constant: String(value) }, type, wordBits),
  });
}
const literal = (constant: string): GoIntegerFact => ({ type: 'untyped-integer', constant });
for (const wordBits of [32, 64] as const) {
  GO_INTEGER_PROBES.push({ id: `${wordBits}/inferred-word-boundary`, wordBits, source: 'package sample\nvar Value = 2147483648', evaluate: () => { const fact = goDefaultInteger(goIntegerLiteral('2147483648'), wordBits); return { type: fact.type }; } });
  for (const [operator, left, right] of [['/', '-7', '3'], ['%', '-7', '3'], ['&^', '15', '3'], ['<<', '1', '511'], ['<<', '1', '512'], ['<<', '1', '-1'], ['>>', '-7', '1'], ['/', '1', '0']] as const) GO_INTEGER_PROBES.push({ id: `${wordBits}/constant/${left}${operator}${right}`, wordBits, source: `package sample\nconst Value = (${left}) ${operator} (${right})`, evaluate: () => goIntegerBinary(operator, literal(left), literal(right), wordBits) });
  GO_INTEGER_PROBES.push(
    { id: `${wordBits}/unsigned-complement`, wordBits, source: 'package sample\nconst Left uint8 = 0\nconst Value = ^Left', evaluate: () => goIntegerUnary('^', { type: 'uint8', constant: '0' }, wordBits) },
    { id: `${wordBits}/typed-constant-overflow`, wordBits, source: 'package sample\nconst Left int8 = 127\nconst Value = Left + 1', evaluate: () => goIntegerBinary('+', { type: 'int8', constant: '127' }, literal('1'), wordBits) },
    { id: `${wordBits}/dynamic-overflow-kept-native`, wordBits, source: 'package sample\nvar Left int8 = 127\nvar Value = Left + 1', evaluate: () => goIntegerBinary('+', { type: 'int8' }, literal('1'), wordBits) },
    { id: `${wordBits}/width-mismatch`, wordBits, source: 'package sample\nvar Left int8 = 1\nvar Right int16 = 1\nvar Value = Left + Right', evaluate: () => goIntegerBinary('+', { type: 'int8' }, { type: 'int16' }, wordBits) },
    { id: `${wordBits}/mixed-shift-widths`, wordBits, source: 'package sample\nconst Left uint8 = 1\nconst Right int64 = 7\nconst Value = Left << Right', evaluate: () => goIntegerBinary('<<', { type: 'uint8', constant: '1' }, { type: 'int64', constant: '7' }, wordBits) },
    { id: `${wordBits}/untyped-nonconstant-shift`, wordBits, source: 'package sample\nvar Right uint8 = 1\nvar Value = 1 << Right', evaluate: () => goIntegerBinary('<<', goIntegerLiteral('1'), { type: 'uint8' }, wordBits) },
    { id: `${wordBits}/unsigned-runtime-minus`, wordBits, source: 'package sample\nvar Left uint8 = 1\nvar Value = -Left', evaluate: () => goIntegerUnary('-', { type: 'uint8' }, wordBits) },
    { id: `${wordBits}/unsigned-constant-minus`, wordBits, source: 'package sample\nconst Left uint8 = 1\nconst Value = -Left', evaluate: () => goIntegerUnary('-', { type: 'uint8', constant: '1' }, wordBits) },
  );
}
for (const token of ['0xffff_ffff_ffff_ffff', '0b_1111', '0o_777', '0777', '0_777', '09', '1__2', '0b2', '9'.repeat(200)]) GO_INTEGER_PROBES.push({ id: `token/${token.slice(0, 32)}`, wordBits: 64, source: `package sample\nconst Value = ${token}`, evaluate: () => goIntegerLiteral(token) });

export function expectedGoIntegerProbe(probe: Probe) {
  try {
    const value = probe.evaluate();
    return { ok: true, type: value.type === 'untyped-integer' ? 'untyped int' : canonicalGoIntegerType(value.type), ...(value.constant !== undefined ? { constant: value.constant } : {}) };
  } catch (error) { if (!(error instanceof GoIntegerError)) throw error; return { ok: false }; }
}

for (const wordBits of [32, 64] as const) {
  for (const left of ['0', '1', '-1']) for (const count of ['513', '1000', '1074', '1075', '18446744073709551615', '18446744073709551616']) for (const operator of ['<<', '>>'] as const) GO_INTEGER_PROBES.push({
    id: `${wordBits}/large-constant/${left}${operator}${count}`, wordBits,
    source: `package sample\nconst Value = (${left}) ${operator} ${count}`,
    evaluate: () => goIntegerBinary(operator, literal(left), literal(count), wordBits),
  });
  for (const count of ['513', '1000', '1075', '18446744073709551615', '18446744073709551616']) GO_INTEGER_PROBES.push({
    id: `${wordBits}/large-runtime/${count}`, wordBits, source: `package sample\nvar Left uint8\nvar Value = Left << ${count}`,
    evaluate: () => goIntegerBinary('<<', { type: 'uint8' }, literal(count), wordBits),
  });
  for (const [type, left] of [['uint8', '1'], ['uint64', '18446744073709551615'], ['int8', '128'], ['int8', '127']] as const) GO_INTEGER_PROBES.push({
    id: `${wordBits}/context/${type}/${left}`, wordBits, source: `package sample\nvar Count uint8\nvar Value ${type} = ${left} << Count`,
    evaluate: () => resolveGoValueContext(goValueBinary('<<', literal(left), { type: 'uint8' }, wordBits), type, wordBits) as GoIntegerFact,
  });
  GO_INTEGER_PROBES.push(
    { id: `${wordBits}/context/default`, wordBits, source: 'package sample\nvar Count uint8\nvar Value = 2147483648 << Count', evaluate: () => goValueDefault(goValueBinary('<<', literal('2147483648'), { type: 'uint8' }, wordBits), wordBits) as GoIntegerFact },
    { id: `${wordBits}/context/peer`, wordBits, source: 'package sample\nvar Count uint8\nvar Peer uint64\nvar Value = (1 << Count) + Peer', evaluate: () => goValueBinary('+', goValueBinary('<<', literal('1'), { type: 'uint8' }, wordBits), { type: 'uint64' }, wordBits) as GoIntegerFact },
    { id: `${wordBits}/context/composed`, wordBits, source: 'package sample\nvar Count uint8\nvar Value uint8 = (1 << Count) + (2 << Count)', evaluate: () => resolveGoValueContext(goValueBinary('+', goValueBinary('<<', literal('1'), { type: 'uint8' }, wordBits), goValueBinary('<<', literal('2'), { type: 'uint8' }, wordBits), wordBits), 'uint8', wordBits) as GoIntegerFact },
    { id: `${wordBits}/context/complement`, wordBits, source: 'package sample\nvar Count uint8\nvar Value uint8 = ^(1 << Count)', evaluate: () => resolveGoValueContext(goValueUnary('^', goValueBinary('<<', literal('1'), { type: 'uint8' }, wordBits), wordBits), 'uint8', wordBits) as GoIntegerFact },
    { id: `${wordBits}/context/count`, wordBits, source: 'package sample\nvar Count uint8\nvar Left uint64\nvar Value = Left << (1 << Count)', evaluate: () => goValueBinary('<<', { type: 'uint64' }, goValueBinary('<<', literal('1'), { type: 'uint8' }, wordBits), wordBits) as GoIntegerFact },
    { id: `${wordBits}/context/negative-count`, wordBits, source: 'package sample\nvar Count uint8\nvar Left uint64\nvar Value = Left << (-1 << Count)', evaluate: () => goValueBinary('<<', { type: 'uint64' }, goValueBinary('<<', literal('-1'), { type: 'uint8' }, wordBits), wordBits) as GoIntegerFact },
  );
}

for (const wordBits of [32, 64] as const) GO_INTEGER_PROBES.push({
  id: `${wordBits}/large-typed-count`, wordBits,
  source: 'package sample\nvar Left uint8\nconst Count uint64 = 18446744073709551615\nvar Value = Left << Count',
  evaluate: () => goIntegerBinary('<<', { type: 'uint8' }, { type: 'uint64', constant: '18446744073709551615' }, wordBits),
});
