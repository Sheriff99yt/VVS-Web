import { goFloatLiteral, goIntegerLiteral, goValueConstant, goValueCompare, goValueBinary, goValueUnary, type GoValueFact } from '@vvs/graph-types';
interface Probe { id: string; source: string; wordBits: 32 | 64; evaluate: () => GoValueFact }
export const GO_CONSTANT_PROBES: Probe[] = [];
for (const wordBits of [32, 64] as const) for (const target of ['untyped', 'int', 'uint8', 'int32', 'uint64', 'float32', 'float64'] as const) for (const token of ['1', '255', '256', '2147483648', '18446744073709551615', '0.1']) {
  GO_CONSTANT_PROBES.push({ id: `binding/${wordBits}/${target}/${token}`, wordBits, source: `package sample\nconst First${target === 'untyped' ? '' : ` ${target}`} = ${token}\nconst Value = First`, evaluate: () => goValueConstant(token.includes('.') ? goFloatLiteral(token) : goIntegerLiteral(token), target, wordBits) });
}
for (const [target, token] of [['float32', '16777217.0'], ['float64', '9007199254740993.0'], ['int8', '127'], ['uint8', '255']] as const) for (const operator of ['==', '!=', '<', '<=', '>', '>=']) {
  GO_CONSTANT_PROBES.push({ id: `comparison/${target}/${token}/${operator}`, wordBits: 64, source: `package sample\nconst First ${target} = ${token}\nconst Value = First ${operator} ${token}`, evaluate: () => { const raw = token.includes('.') ? goFloatLiteral(token) : goIntegerLiteral(token); return goValueCompare(operator, goValueConstant(raw, target, 64), raw, 64); } });
}
for (const [left, right] of [['a', 'b'], ['', ''], ['𐀀', '']] as const) for (const operator of ['==', '!=', '<', '<=', '>', '>=']) {
  GO_CONSTANT_PROBES.push({ id: `text/${left}/${right}/${operator}`, wordBits: 64, source: `package sample\nconst First = ${JSON.stringify(left)}\nconst Value = First ${operator} ${JSON.stringify(right)}`, evaluate: () => goValueCompare(operator, { type: 'untyped-string', constant: left }, { type: 'untyped-string', constant: right }, 64) });
}
for (const type of ['untyped-bool', 'bool'] as const) for (const left of [false, true]) for (const right of [false, true]) for (const operator of ['&&', '||']) {
  GO_CONSTANT_PROBES.push({ id: `boolean/${type}/${left}/${right}/${operator}`, wordBits: 64, source: `package sample\nconst First${type === 'bool' ? ' bool' : ''} = ${left}\nconst Value = !First ${operator} ${right}`, evaluate: () => goValueBinary(operator, goValueUnary('!', { type, constant: String(left) }, 64), { type: 'untyped-bool', constant: String(right) }, 64) });
}
for (const target of ['untyped', 'string'] as const) GO_CONSTANT_PROBES.push({ id: `concatenation/${target}`, wordBits: 64, source: `package sample\nconst First${target === 'string' ? ' string' : ''} = "hello"\nconst Value = First + " world"`, evaluate: () => goValueBinary('+', goValueConstant({ type: 'untyped-string', constant: 'hello' }, target, 64), { type: 'untyped-string', constant: ' world' }, 64) });
export function expectedGoConstantProbe(probe: Probe) {
  try {
    const value = probe.evaluate();
    const type = value.type === 'untyped-integer' ? 'untyped int' : value.type.replace('untyped-', 'untyped ');
    return { ok: true, type, constant: ['string', 'untyped-string'].includes(value.type) ? JSON.stringify(value.constant) : value.constant };
  } catch (error) {
    if (!(error instanceof Error) || !error.message.startsWith('NATIVE_GO_')) throw error;
    return { ok: false };
  }
}
