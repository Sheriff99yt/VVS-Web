import type { VVSNodeData } from './nodes';
import { nativeSignature, withNativeParameters } from './nativeSignatures';
import { canonicalNativeScalarSignatureType, NATIVE_SCALAR_SIGNATURE_TYPES, type NativeScalarSignatureType } from './nativeScalarSignatures';
import type { NativeScalarLanguage } from './nativeScalarContracts';

export function nativeScalarSignatureEditorProfile(data: VVSNodeData) {
  const language = data.properties?.nativeSignatureLanguage;
  if (typeof language !== 'string' || !Object.hasOwn(NATIVE_SCALAR_SIGNATURE_TYPES, language)) return;
  const profile = language as NativeScalarLanguage;
  return { language: profile, types: NATIVE_SCALAR_SIGNATURE_TYPES[profile], unit: profile === 'rust' ? '()' : 'void' };
}

/** Explicit inspector edits update authored and canonical type identity together. */
export function editNativeScalarParameterType(data: VVSNodeData, id: string, type: string): VVSNodeData {
  const profile = nativeScalarSignatureEditorProfile(data), parameters = nativeSignature(data);
  if (!profile || !parameters || !(profile.types as readonly string[]).includes(type) || parameters.filter(parameter => parameter.id === id).length !== 1) throw new Error('NATIVE_SCALAR_SIGNATURE_EDIT_TYPE');
  return withNativeParameters(data, parameters.map(parameter => parameter.id === id ? { ...parameter, authoredType: type, nativeType: canonicalNativeScalarSignatureType(type, profile.language) as NativeScalarSignatureType, mutable: parameter.mutable ?? profile.language !== 'rust' } : { ...parameter }));
}

export function editNativeScalarReturnType(data: VVSNodeData, type: string): VVSNodeData {
  const profile = nativeScalarSignatureEditorProfile(data);
  if (!profile || type !== profile.unit && !(profile.types as readonly string[]).includes(type)) throw new Error('NATIVE_SCALAR_SIGNATURE_EDIT_RETURN');
  return { ...data, properties: { ...data.properties, nativeAuthoredReturnType: type, nativeReturnType: type, ...(profile.language === 'rust' ? { nativeExplicitUnitReturn: type === '()' } : {}) } };
}

export function editNativeScalarParameterMutability(data: VVSNodeData, id: string, mutable: boolean): VVSNodeData {
  const profile = nativeScalarSignatureEditorProfile(data), parameters = nativeSignature(data);
  if (!profile || profile.language === 'gdscript' || typeof mutable !== 'boolean' || !parameters || parameters.filter(parameter => parameter.id === id).length !== 1) throw new Error('NATIVE_SCALAR_SIGNATURE_EDIT_MUTABILITY');
  return withNativeParameters(data, parameters.map(parameter => parameter.id === id ? { ...parameter, mutable } : { ...parameter }));
}
