import { goFloatLiteral, goRationalAssignable, goRationalBinary, goRationalUnary, goRationalInteger, GoRationalError, goIntegerAssignable, GoIntegerError } from '@vvs/graph-types';
interface Probe { id: string; source: string; evaluate: () => { type: string; constant?: string } }
export const GO_RATIONAL_PROBES: Probe[] = [];
for (const token of ['0.1', '.5', '1.', '00.5', '1e3', '1E-3', '1_2.3_4e+1_0', '0x1p0', '0x_1.fp+2', '0x.8p-1', '0x1.p0', '1e-1200', '1e1200', '0x1p-1074', '1_.0', '1._0', '0x1.0', '1e_2', '0x1p2_', '.']) {
  GO_RATIONAL_PROBES.push({ id: `token/${token}`, source: `package sample\nconst Value = ${token}`, evaluate: () => goFloatLiteral(token) });
}
for (const target of ['float32', 'float64'] as const) for (const token of ['0.1', '0.0', '1e-1200', '1e1200', '0x1p-1074', '0x1p-1075', '0x3p-1075', '0x1p-149', '0x1p-150', '0x3p-150', '0x1.fffffep127', '0x1.ffffffp127', '0x1.fffffffffffffp1023', '0x1.fffffffffffff8p1023', '9007199254740993.0', '16777217.0']) {
  GO_RATIONAL_PROBES.push({ id: `${target}/${token}`, source: `package sample\nconst Value ${target} = ${token}`, evaluate: () => goRationalAssignable(goFloatLiteral(token), target) });
}
for (const [operator, left, right] of [['+', '0.1', '0.2'], ['/', '1.0', '3.0'], ['*', '1e100', '1e-100'], ['-', '0.3', '0.1'], ['/', '1.0', '0.0']] as const) for (const target of ['untyped-float', 'float32', 'float64'] as const) {
  GO_RATIONAL_PROBES.push({ id: `${target}/${left}${operator}${right}`, source: `package sample\n${target === 'untyped-float' ? '' : `const Left ${target} = ${left}\n`}const Value = ${target === 'untyped-float' ? left : 'Left'} ${operator} ${right}`, evaluate: () => goRationalBinary(operator, target === 'untyped-float' ? goFloatLiteral(left) : goRationalAssignable(goFloatLiteral(left), target), goFloatLiteral(right)) });
}
for (const token of ['0.0', '0.1', '1e-1200']) GO_RATIONAL_PROBES.push({ id: `negative/${token}`, source: `package sample\nconst Value = -${token}`, evaluate: () => goRationalUnary('-', goFloatLiteral(token)) });
for (const [target, token] of [['int8', '127.0'], ['int8', '128.0'], ['int8', '1.5'], ['uint64', '18446744073709551615.0'], ['uint64', '18446744073709551616.0']] as const) GO_RATIONAL_PROBES.push({ id: `${target}/${token}`, source: `package sample\nconst Value ${target} = ${token}`, evaluate: () => goIntegerAssignable({ type: 'untyped-integer', constant: goRationalInteger(goFloatLiteral(token)) }, target, 64) });
export function expectedGoRationalProbe(probe: Probe) {
  try { const value = probe.evaluate(); return { ok: true, type: value.type === 'untyped-float' ? 'untyped float' : value.type, constant: value.constant }; }
  catch (error) { if (!(error instanceof GoRationalError || error instanceof GoIntegerError)) throw error; return { ok: false }; }
}
