import { GO_INTEGER_TYPES, goIntegerLiteral, goFloatLiteral, goValueConvert, GoIntegerError, GoRationalError, type GoScalarType, type GoValueFact } from '@vvs/graph-types';
interface Probe { id: string; source: string; wordBits: 32 | 64; evaluate: () => GoValueFact }
export const GO_CONVERSION_PROBES: Probe[] = [];
for (const wordBits of [32, 64] as const) for (const target of [...GO_INTEGER_TYPES, 'float32', 'float64'] as GoScalarType[]) for (const token of ['127', '128', '9007199254740993', '1.5', '1e40']) GO_CONVERSION_PROBES.push({
  id: `${wordBits}/${target}/${token}`, wordBits, source: `package sample\nconst Value = ${target}(${token})`,
  evaluate: () => goValueConvert(/[.eE]/.test(token) ? goFloatLiteral(token) : goIntegerLiteral(token), target, wordBits),
});
for (const wordBits of [32, 64] as const) for (const sourceType of [...GO_INTEGER_TYPES, 'float32', 'float64'] as GoScalarType[]) for (const target of ['uint8', 'int32', 'float32', 'float64'] as GoScalarType[]) GO_CONVERSION_PROBES.push({
  id: `${wordBits}/runtime/${sourceType}/${target}`, wordBits, source: `package sample\nvar Input ${sourceType}\nvar Value = ${target}(Input)`, evaluate: () => goValueConvert({ type: sourceType }, target, wordBits),
});
GO_CONVERSION_PROBES.push({ id: 'nested-rounding', wordBits: 64, source: 'package sample\nconst Value = float64(float32(0.1))', evaluate: () => goValueConvert(goValueConvert(goFloatLiteral('.1'), 'float32', 64), 'float64', 64) });
export function expectedGoConversionProbe(probe: Probe) {
  try { const fact = probe.evaluate(); return { ok: true, type: fact.type === 'byte' ? 'uint8' : fact.type === 'rune' ? 'int32' : fact.type, ...(fact.constant === undefined ? {} : { constant: fact.constant }) }; }
  catch (error) { if (!(error instanceof GoIntegerError || error instanceof GoRationalError)) throw error; return { ok: false }; }
}
