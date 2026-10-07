import type { GraphNode } from './nodes';
import type { NativeScalarLanguage } from './nativeScalarContracts';
import { canonicalNativeScalarSignatureType, nativeScalarSignaturePin } from './nativeScalarSignatures';
import { validNativeScalarBindingName } from './nativeScalarNames';
export type NativeScalarInferenceMode = 'cpp-auto' | 'rust-let' | 'gdscript-inferred';
export function nativeScalarInferenceSpelling(mode: unknown, language: NativeScalarLanguage): string | undefined {
  return mode === 'cpp-auto' && language === 'cpp' ? 'auto' : mode === 'rust-let' && language === 'rust' ? '' : mode === 'gdscript-inferred' && language === 'gdscript' ? ':=' : undefined;
}

export interface NativeScalarLocalBinding {
  readonly id: string;
  readonly declarationId: string;
  readonly name: string;
  readonly nativeType: string;
  readonly authoredType: string;
  readonly mutable: boolean;
  readonly inferenceMode?: NativeScalarInferenceMode;
}
export class NativeScalarLocalFailure extends Error {
  constructor(public readonly code: string, public readonly nodeId: string) { super(`NATIVE_SCALAR_LOCAL_${code}: ${nodeId}`); }
}

/** Type/readonly facts come from the visible declaration, never a variable index or cached read. */
export function nativeScalarLocalBinding(node: GraphNode, language: NativeScalarLanguage, ownerId: string): Readonly<NativeScalarLocalBinding> {
  const fail = (code: string): never => { throw new NativeScalarLocalFailure(code, node.id); };
  const data = node.data, p = data.properties ?? {};
  const id = p.symbolId, name = p.name, nativeType = p.nativeType, authoredType = p.nativeAuthoredType, mutable = p.nativeMutable;
  const inferenceMode = p.nativeInferenceMode;
  const typeValid = inferenceMode === undefined ? canonicalNativeScalarSignatureType(String(authoredType), language) === nativeType
    : nativeScalarInferenceSpelling(inferenceMode, language) === authoredType && !!canonicalNativeScalarSignatureType(String(nativeType), language);
  if (data.kindId !== 'var_define' || data.graphBinding || p.nativeLocalLanguage !== language || p.nativeOwnerId !== ownerId
    || typeof id !== 'string' || !id || typeof name !== 'string' || !validNativeScalarBindingName(name, language)
    || typeof authoredType !== 'string' || !typeValid
    || typeof mutable !== 'boolean' || p.isConst !== !mutable || p.hasInitializer !== true
    || p.nativeLocalStyle !== `${language}-scalar` || p.type !== nativeScalarSignaturePin(String(nativeType), language)
    || Object.keys(data.inlineValues ?? {}).length || p.defaultValue !== undefined) return fail('DECLARATION');
  const pin = nativeScalarSignaturePin(String(nativeType), language);
  if (JSON.stringify(data.inputs.map(port => [port.id, port.type])) !== JSON.stringify([['exec_in', 'execution'], ['value', pin]])
    || JSON.stringify(data.outputs.map(port => [port.id, port.type])) !== JSON.stringify([['exec_out', 'execution']])) return fail('DECLARATION_PORTS');
  return Object.freeze({ id, declarationId: node.id, name, nativeType: String(nativeType), authoredType, mutable, ...(inferenceMode ? { inferenceMode: inferenceMode as NativeScalarInferenceMode } : {}) });
}
