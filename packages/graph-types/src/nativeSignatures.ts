import { canonicalGoIntegerType, type GoIntegerType } from './goIntegerSemantics';
import type { VVSNodeData } from './nodes';
import type { NativeScalarSignatureType } from './nativeScalarSignatures';
import { nativeScalarFunctionSignatureProblem } from './nativeScalarSignatures';
export const GO_RESERVED_NAMES = new Set('break default func interface select case defer go map struct chan else goto package switch const fallthrough if range type continue for import return var _ true false nil'.split(' '));
export const GO_SCALAR_PINS = { int: 'data_number', uint: 'data_number', uintptr: 'data_number', float64: 'data_number', float32: 'data_number', string: 'data_string', bool: 'data_boolean', int8: 'data_number', int16: 'data_number', int32: 'data_number', int64: 'data_number', uint8: 'data_number', uint16: 'data_number', uint32: 'data_number', uint64: 'data_number', byte: 'data_number', rune: 'data_number' } as const;
export type GoScalarType = keyof typeof GO_SCALAR_PINS;
export function sameGoScalarType(left: unknown, right: unknown): boolean {
  const canonical = (value: unknown) => typeof value === 'string' && Object.hasOwn(GO_SCALAR_PINS, value) ? (['byte', 'rune'].includes(value) ? canonicalGoIntegerType(value as GoIntegerType) : value) : undefined;
  return canonical(left) !== undefined && canonical(left) === canonical(right);
}
export const CSHARP_INTEGRAL_PINS = { sbyte: 'data_number', byte: 'data_number', short: 'data_number', ushort: 'data_number', int: 'data_number', uint: 'data_number', long: 'data_number', ulong: 'data_number', char: 'data_number' } as const;
export const CSHARP_RETURN_PINS = { ...CSHARP_INTEGRAL_PINS, bool: 'data_boolean' } as const;
export type CSharpSignatureType = keyof typeof CSHARP_INTEGRAL_PINS;
const CSHARP_RESERVED_NAMES = new Set('abstract as base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern false finally fixed float for foreach goto if implicit in int interface internal is lock long namespace new null object operator out override params private protected public readonly ref return sbyte sealed short sizeof stackalloc static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using virtual void volatile while'.split(' '));
export function validCSharpBindingName(name: string): boolean {
  return /^@?[A-Za-z_][A-Za-z0-9_]*$/.test(name) && (name.startsWith('@') || !CSHARP_RESERVED_NAMES.has(name));
}
export interface NativeParameter { id: string; name: string; mode: 'positional' | 'rest'; defaultPin?: string; nativeType?: GoScalarType | CSharpSignatureType | NativeScalarSignatureType; authoredType?: string; mutable?: boolean }
export function nativeSignature(data: VVSNodeData): NativeParameter[] | undefined {
  return Array.isArray(data.properties?.nativeParameters) ? data.properties.nativeParameters as NativeParameter[] : undefined;
}
export function nativeSignatureProblem(data: VVSNodeData, language: string): string | undefined {
  const parameters = nativeSignature(data); if (!parameters) return data.properties?.nativeParameters !== undefined ? 'Native parameter records must be an array.' : undefined;
  if (data.properties?.nativeSignatureLanguage !== language || !['javascript', 'python', 'go', 'csharp', 'cpp', 'rust', 'gdscript'].includes(language)) return 'Native signature requires its declared language.';
  if (parameters.some(parameter => !parameter || typeof parameter !== 'object' || typeof parameter.id !== 'string' || typeof parameter.name !== 'string')) return 'Invalid native parameter record.';
  if (parameters.length > 32 || new Set(parameters.map(parameter => parameter.id)).size !== parameters.length || new Set(parameters.map(parameter => language === 'csharp' ? parameter.name.replace(/^@/, '') : parameter.name)).size !== parameters.length) return 'Native signature has duplicate or excessive bindings.';
  if (data.kindId !== 'function_implement') return 'Native signature must belong to Function Define.';
  if (['cpp', 'rust', 'gdscript'].includes(language)) {
    if (parameters.some(parameter => parameter.mode !== 'positional' || parameter.defaultPin)) return 'Native scalar signatures require positional parameters without defaults.';
    const problem = nativeScalarFunctionSignatureProblem({ language: language as import('./nativeScalarContracts').NativeScalarLanguage, name: data.properties?.functionName as string, parameters: parameters as import('./nativeScalarSignatures').NativeScalarParameter[], authoredReturnType: data.properties?.nativeAuthoredReturnType as string, nativeReturnType: data.properties?.nativeReturnType as string });
    if (problem) return `Invalid native scalar signature: ${problem}.`;
  }
  const defaults = parameters.flatMap(parameter => parameter.defaultPin ? [parameter.defaultPin] : []);
  if (JSON.stringify(data.inputs.filter(pin => pin.type !== 'execution').map(pin => pin.id)) !== JSON.stringify(defaults)) return 'Native defaults require exactly their ordered visible pins.';
  for (const [index, parameter] of parameters.entries()) {
    if (!(language === 'csharp' ? validCSharpBindingName(parameter.name) : /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(parameter.name)) || (['python', 'go'].includes(language) && parameter.name.includes('$')) || !/^[A-Za-z0-9_-]{1,128}$/.test(parameter.id)) return 'Invalid native parameter binding.';
    if (language === 'csharp' && (parameter.mode !== 'positional' || parameter.defaultPin || !Object.hasOwn(CSHARP_INTEGRAL_PINS, parameter.nativeType ?? ''))) return 'C# parameters require a reviewed native integral type.';
    if (language === 'go' && GO_RESERVED_NAMES.has(parameter.name)) return 'Go parameters require usable native identifiers.';
    if (language === 'go' && (parameter.mode !== 'positional' || parameter.defaultPin || !Object.hasOwn(GO_SCALAR_PINS, parameter.nativeType ?? ''))) return 'Go parameters require a reviewed native scalar type.';
    if (!['positional', 'rest'].includes(parameter.mode) || (parameter.mode === 'rest' && (index !== parameters.length - 1 || parameter.defaultPin))) return 'Invalid native parameter mode/order.';
    if (parameter.defaultPin && (parameter.defaultPin !== `default-${parameter.id}` || !data.inputs.some(pin => pin.id === parameter.defaultPin && pin.type !== 'execution'))) return 'Native default requires its visible value pin.';
  }
}

/** Resolve supplied arguments in source order without filling omitted defaults. */
export function nativeCallBindingProblem(parameters: NativeParameter[], count: number, names: unknown, language: string): string | undefined {
  if (!Number.isSafeInteger(count) || count < 0 || count > 32) return 'Invalid supplied argument count.';
  const arguments_ = names === undefined ? Array.from({ length: count }, () => '') : names;
  if (!Array.isArray(arguments_) || arguments_.length !== count || arguments_.some(name => typeof name !== 'string' || (name && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)))) return 'Invalid supplied argument names.';
  if (arguments_.some(Boolean) && language !== 'python') return 'Named arguments require Python.';
  const bound = new Set<string>(); let positional = 0; let named = false;
  for (const name of arguments_) {
    if (name) {
      named = true;
      const parameter = parameters.find(parameter => parameter.name === name && parameter.mode === 'positional');
      if (!parameter || bound.has(parameter.id)) return 'Unknown or duplicate named argument.';
      bound.add(parameter.id);
    } else {
      if (named) return 'Positional arguments cannot follow named arguments.';
      const parameter = parameters[positional++];
      if (parameter?.mode === 'positional') bound.add(parameter.id);
      else if (!parameters.some(parameter => parameter.mode === 'rest')) return 'Too many positional arguments.';
    }
  }
  if (parameters.some(parameter => parameter.mode === 'positional' && !parameter.defaultPin && !bound.has(parameter.id))) return 'Missing required argument.';
}

export function withNativeParameters(data: VVSNodeData, parameters: NativeParameter[]): VVSNodeData {
  const defaults = new Set(parameters.flatMap(parameter => parameter.defaultPin ? [parameter.defaultPin] : []));
  return {
    ...data,
    properties: { ...data.properties, nativeParameters: parameters },
    inputs: [...data.inputs.filter(pin => !pin.id.startsWith('default-')), ...parameters.flatMap(parameter => parameter.defaultPin ? [{ ...(data.inputs.find(pin => pin.id === parameter.defaultPin) ?? { type: 'data_any' as const }), id: parameter.defaultPin, label: `Default ${parameter.name}`, required: true }] : [])],
    inlineValues: Object.fromEntries(Object.entries(data.inlineValues ?? {}).filter(([key]) => !key.startsWith('default-') || defaults.has(key))),
  };
}
export function withNativeCallArguments(data: VVSNodeData, names: string[]): VVSNodeData {
  return {
    ...data,
    properties: { ...data.properties, nativeArgumentCount: names.length, nativeArgumentNames: names },
    inputs: [...data.inputs.filter(pin => pin.type === 'execution'), ...names.map((name, index) => ({ ...(data.inputs.find(pin => pin.id === `arg-${index}`) ?? { type: 'data_any' as const }), id: `arg-${index}`, label: name || `Argument ${index + 1}`, required: true }))],
    inlineValues: Object.fromEntries(Object.entries(data.inlineValues ?? {}).filter(([key]) => !key.startsWith('arg-') || names.some((_, index) => key === `arg-${index}`))),
  };
}

export const GO_ASSIGN_OPERATORS = ['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '&^=', '<<=', '>>=', '++', '--'] as const;
