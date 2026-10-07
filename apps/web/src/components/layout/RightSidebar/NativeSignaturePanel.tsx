"use client";

import { GO_SCALAR_PINS, CSHARP_INTEGRAL_PINS, CSHARP_RETURN_PINS, type NativeParameter, nativeSignature, withNativeParameters, withNativeCallArguments, nativeScalarSignatureEditorProfile, editNativeScalarParameterType, editNativeScalarReturnType, editNativeScalarParameterMutability, type VVSNodeData } from '@vvs/graph-types';

export function NativeSignaturePanel({ data, onChange }: { data: VVSNodeData; onChange: (data: VVSNodeData) => void }) {
  const parameters = nativeSignature(data);
  const scalarProfile = nativeScalarSignatureEditorProfile(data);
  const typedSignature = !!scalarProfile || ['go', 'csharp'].includes(String(data.properties?.nativeSignatureLanguage));
  const nativeTypes = data.properties?.nativeSignatureLanguage === 'csharp' ? CSHARP_INTEGRAL_PINS : GO_SCALAR_PINS;
  const callCount = data.properties?.nativeArgumentCount;
  if (!parameters && typeof callCount !== 'number') return null;
  if (parameters?.some(parameter => !parameter || typeof parameter.id !== 'string' || typeof parameter.name !== 'string')) return <p className="text-xs text-amber-400">Invalid native signature. Review the graph diagnostics.</p>;
  const count = typeof callCount === 'number' && Number.isFinite(callCount) ? Math.max(0, Math.min(32, Math.trunc(callCount))) : 0;
  const names = Array.isArray(data.properties?.nativeArgumentNames) ? (data.properties.nativeArgumentNames as unknown[]).slice(0, count).map(name => typeof name === 'string' ? name : '') : Array.from({ length: count }, () => '');
  return <details className="border-t border-zinc-800 pt-2 text-xs text-zinc-300">
    <summary className="cursor-pointer text-zinc-400">{parameters ? 'Native signature' : 'Supplied arguments'}</summary>
    <div className="mt-2 space-y-2">
      {parameters?.map((parameter, index) => <div key={parameter.id} className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 flex-1 truncate">{parameter.name}{parameter.nativeType ? `: ${parameter.nativeType}` : ''}</span>
        {typedSignature && <select aria-label={`Native type for ${parameter.name}`} value={parameter.nativeType ?? ''} className="rounded border border-zinc-700 bg-zinc-900 px-1 py-1" onChange={event => onChange(scalarProfile ? editNativeScalarParameterType(data, parameter.id, event.target.value) : withNativeParameters(data, parameters.map((value, i) => i === index ? { ...value, nativeType: event.target.value as NativeParameter['nativeType'] } : value)))}>
          {!parameter.nativeType && <option value="" disabled>Choose native type</option>}
          {(scalarProfile?.types ?? Object.keys(nativeTypes)).map(type => <option key={type} value={type}>{type}</option>)}
        </select>}
        {scalarProfile && scalarProfile.language !== 'gdscript' && <label className="flex items-center gap-1"><input type="checkbox" aria-label={`Mutable parameter ${parameter.name}`} checked={parameter.mutable === true} onChange={event => onChange(editNativeScalarParameterMutability(data, parameter.id, event.target.checked))} />Mutable</label>}
        <select aria-label={`Mode for ${parameter.name}`} value={parameter.mode} disabled={typedSignature} className="rounded border border-zinc-700 bg-zinc-900 px-1 py-1" onChange={event => {
          const mode = event.target.value as 'positional' | 'rest';
          onChange(withNativeParameters(data, parameters.map((value, i) => i === index ? { id: value.id, name: value.name, mode, ...(mode === 'positional' && value.defaultPin ? { defaultPin: value.defaultPin } : {}) } : value)));
        }}>
          <option value="positional">Positional</option>
          <option value="rest" disabled={index !== parameters.length - 1}>Rest</option>
        </select>
        <label className="flex items-center gap-1"><input type="checkbox" aria-label={`Default for ${parameter.name}`} disabled={parameter.mode === 'rest' || typedSignature} checked={Boolean(parameter.defaultPin)} onChange={event => onChange(withNativeParameters(data, parameters.map((value, i) => i === index ? { id: value.id, name: value.name, mode: value.mode, ...(event.target.checked ? { defaultPin: `default-${value.id}` } : {}) } : value)))} />Default</label>
      </div>)}
      {parameters && typedSignature && <label className="flex items-center justify-between gap-2">Native return type<select aria-label="Native return type" value={String(data.properties?.nativeReturnType ?? '')} className="rounded border border-zinc-700 bg-zinc-900 px-1 py-1" onChange={event => onChange(scalarProfile ? editNativeScalarReturnType(data, event.target.value) : { ...data, properties: { ...data.properties, nativeReturnType: event.target.value } })}>
        {!data.properties?.nativeReturnType && <option value="" disabled>Choose native type</option>}
        {[scalarProfile?.unit ?? 'void', ...(scalarProfile?.types ?? Object.keys(data.properties?.nativeSignatureLanguage === 'csharp' ? CSHARP_RETURN_PINS : nativeTypes))].map(type => <option key={type} value={type}>{type}</option>)}
      </select></label>}
      {parameters && <p className="text-[11px] text-zinc-500">{typedSignature ? 'Parameter names and order follow the function declaration. Native types must match connected values.' : 'Connect each default value on its pin. Parameter names and order follow the function declaration.'}</p>}
      {!parameters && <>
        <label className="flex items-center justify-between gap-2">Argument count<input aria-label="Supplied argument count" type="number" min={0} max={32} value={callCount as number} className="w-16 rounded border border-zinc-700 bg-zinc-900 px-2 py-1" onChange={event => {
          const count = Math.max(0, Math.min(32, Math.trunc(Number(event.target.value)) || 0));
          onChange(withNativeCallArguments(data, Array.from({ length: count }, (_, index) => names[index] ?? '')));
        }} /></label>
        {data.properties?.nativeCallLanguage === 'python' && names.map((name, index) => <label key={index} className="flex items-center gap-2"><span>Argument {index + 1}</span><input aria-label={`Name for argument ${index + 1}`} value={name} placeholder="Positional" className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1" onChange={event => onChange(withNativeCallArguments(data, names.map((value, i) => i === index ? event.target.value : value)))} /></label>)}
      </>}
    </div>
  </details>;
}
