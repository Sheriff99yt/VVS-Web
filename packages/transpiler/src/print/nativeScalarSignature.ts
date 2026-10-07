import { nativeScalarFunctionSignatureProblem, type NativeScalarFunctionSignature, type NativeScalarParameter, type NativeScalarLanguage } from '@vvs/graph-types';
import { renderTemplate, requireTemplate, resolvePrintProfile } from '@vvs/syntax-packs';
import type { PrintedExpr } from './types';

/** Authored header options; no implicit self/receiver, visibility or type conversions. */
export interface NativeScalarHeaderOptions {
  readonly modifiers?: readonly string[];
  readonly explicitUnitReturn?: boolean;
}

export function printNativeScalarParameter(parameter: NativeScalarParameter, language: NativeScalarLanguage): string {
  const unit = language === 'rust' ? '()' : 'void';
  if (nativeScalarFunctionSignatureProblem({ name: 'parameter_check', language, parameters: [parameter], authoredReturnType: unit, nativeReturnType: unit })) throw new Error('NATIVE_SCALAR_PARAMETER_INVALID');
  const profile = resolvePrintProfile(language);
  return renderTemplate(requireTemplate(profile, 'NativeScalarTypedParameter', language), {
    name: parameter.name, type: parameter.authoredType,
    qualifier: language === 'rust' ? parameter.mutable ? 'mut ' : '' : language === 'cpp' ? parameter.mutable ? '' : 'const ' : '',
  }, profile.layout).text;
}

/** Pack-owned syntax for the verified ordinary scalar header domain. */
export function printNativeScalarFunctionHeader(signature: NativeScalarFunctionSignature, nodeId: string, options: NativeScalarHeaderOptions = {}): PrintedExpr {
  const problem = nativeScalarFunctionSignatureProblem(signature);
  if (problem) throw new Error(`NATIVE_SCALAR_SIGNATURE_${problem}`);
  const language = signature.language;
  const modifiers = options.modifiers ?? [];
  const allowed = language === 'cpp' ? ['constexpr', 'static', 'const'] : language === 'rust' ? ['pub', 'const'] : ['static'];
  if (modifiers.some(modifier => !allowed.includes(modifier)) || new Set(modifiers).size !== modifiers.length) throw new Error('NATIVE_SCALAR_SIGNATURE_MODIFIERS');
  if (!nodeId) throw new Error('NATIVE_SCALAR_SIGNATURE_OWNER');
  const profile = resolvePrintProfile(language);
  const result = renderTemplate(requireTemplate(profile, 'NativeScalarFunctionOpen', language), {
    modifiers: modifiers.length ? `${modifiers.join(' ')} ` : '',
    name: signature.name, params: signature.parameters.map(parameter => printNativeScalarParameter(parameter, language)).join(', '),
    type: signature.authoredReturnType,
    returnClause: language === 'rust' && signature.nativeReturnType === '()' && !options.explicitUnitReturn ? '' : ` -> ${signature.authoredReturnType}`,
  }, profile.layout).text;
  return { text: result, spans: [{ nodeId, start: 0, end: result.length }] };
}
