import type { NativeScalarLanguage } from './nativeScalarContracts';
import { validNativeScalarBindingName } from './nativeScalarNames';

export const NATIVE_SCALAR_SIGNATURE_TYPES = {
  cpp: ['bool', 'signed char', 'unsigned char', 'short', 'unsigned short', 'int', 'unsigned int', 'long', 'unsigned long', 'long long', 'unsigned long long'],
  rust: ['bool', 'i8', 'u8', 'i16', 'u16', 'i32', 'u32', 'i64', 'u64', 'i128', 'u128', 'isize', 'usize'],
  gdscript: ['bool', 'int'],
} as const;
export type NativeScalarSignatureType = typeof NATIVE_SCALAR_SIGNATURE_TYPES[NativeScalarLanguage][number];

/** Canonical semantic identity; the authored spelling stays on the declaration. */
export function canonicalNativeScalarSignatureType(type: string, language: NativeScalarLanguage): string | undefined {
  if (typeof type !== 'string' || !Object.hasOwn(NATIVE_SCALAR_SIGNATURE_TYPES, language)) return;
  const text = type.replace(/\s+/g, ' ').trim();
  if (language !== 'cpp') return (NATIVE_SCALAR_SIGNATURE_TYPES[language] as readonly string[]).includes(text) ? text : undefined;
  const aliases: Record<string, string> = { signed: 'int', 'signed int': 'int', unsigned: 'unsigned int', 'short int': 'short', 'signed short': 'short', 'signed short int': 'short', 'unsigned short int': 'unsigned short', 'long int': 'long', 'signed long': 'long', 'signed long int': 'long', 'unsigned long int': 'unsigned long', 'long long int': 'long long', 'signed long long': 'long long', 'signed long long int': 'long long', 'unsigned long long int': 'unsigned long long' };
  return (NATIVE_SCALAR_SIGNATURE_TYPES.cpp as readonly string[]).includes(text) ? text : Object.hasOwn(aliases, text) ? aliases[text] : undefined;
}

export function nativeScalarSignaturePin(type: string, language: NativeScalarLanguage): 'data_boolean' | 'data_number' | undefined {
  const canonical = canonicalNativeScalarSignatureType(type, language);
  return canonical ? canonical === 'bool' ? 'data_boolean' : 'data_number' : undefined;
}

export interface NativeScalarParameter {
  readonly name: string;
  readonly authoredType: string;
  readonly nativeType: string;
  readonly mutable: boolean;
}
export interface NativeScalarFunctionSignature {
  readonly name: string;
  readonly language: NativeScalarLanguage;
  readonly parameters: readonly Readonly<NativeScalarParameter>[];
  readonly authoredReturnType: string;
  readonly nativeReturnType: string;
}

/** Bounded scalar signature contract; body/project validity and graph admission are separate. */
export function nativeScalarFunctionSignatureProblem(signature: NativeScalarFunctionSignature): string | undefined {
  if (!signature || typeof signature !== 'object') return 'SIGNATURE';
  const language = signature.language;
  if (!Object.hasOwn(NATIVE_SCALAR_SIGNATURE_TYPES, language)) return 'LANGUAGE';
  if (!validNativeScalarBindingName(signature.name, language)) return 'NAME';
  if (language === 'cpp' && signature.name === 'main' || language === 'gdscript' && signature.name === '_init') return 'FUNCTION_ROLE_CONTEXT';
  if (!Array.isArray(signature.parameters) || signature.parameters.length > 32 || signature.parameters.some(item => !item || typeof item !== 'object') || new Set(signature.parameters.map(item => item.name)).size !== signature.parameters.length) return 'PARAMETERS';
  for (const parameter of signature.parameters) {
    if (!validNativeScalarBindingName(parameter.name, language) || typeof parameter.mutable !== 'boolean') return 'PARAMETER';
    const type = canonicalNativeScalarSignatureType(parameter.authoredType, language);
    if (!type || type !== parameter.nativeType) return 'PARAMETER_TYPE';
  }
  if (language === 'gdscript' && signature.parameters.some(parameter => [signature.nativeReturnType, ...signature.parameters.map(item => item.nativeType)].includes(parameter.name))) return 'PARAMETER_TYPE_SHADOW';
  const unit = language === 'rust' ? '()' : 'void';
  if (signature.authoredReturnType === unit && signature.nativeReturnType === unit) return;
  const type = canonicalNativeScalarSignatureType(signature.authoredReturnType, language);
  if (!type || type !== signature.nativeReturnType) return 'RETURN_TYPE';
}
