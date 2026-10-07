'use client';

import { useState } from 'react';
import { nativeScalarLocalEditorProfile, type NativeScalarLocalEdit, type NativeScalarDeclarationModeEdit, type VVSNodeData } from '@vvs/graph-types';

export function NativeLocalPanel({ data, onChange }: { data: VVSNodeData; onChange: (edit: NativeScalarLocalEdit | NativeScalarDeclarationModeEdit) => void }) {
  if (!nativeScalarLocalEditorProfile(data)) return null;
  return <details className="border-t border-zinc-800 pt-2 text-xs text-zinc-300">
    <summary className="cursor-pointer text-zinc-400">Native local declaration</summary>
    <NativeLocalFields key={`${String(data.properties?.symbolId)}:${String(data.properties?.name)}`} data={data} onChange={onChange} />
  </details>;
}

function NativeLocalFields({ data, onChange }: { data: VVSNodeData; onChange: (edit: NativeScalarLocalEdit | NativeScalarDeclarationModeEdit) => void }) {
  const name = String(data.properties?.name ?? '');
  const [draftName, setDraftName] = useState(name);
  const profile = nativeScalarLocalEditorProfile(data);
  if (!profile) return null;
  const authoredType = String(data.properties?.nativeAuthoredType ?? '');
  const types = [...new Set([...(authoredType ? [authoredType] : []), ...profile.types])];
  return <div className="mt-2 space-y-2">
      <label className="flex items-center justify-between gap-2">Name<input aria-label="Native local name" value={draftName}
        className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1"
        onChange={event => setDraftName(event.target.value)} onBlur={() => { if (draftName !== name) onChange({ name: draftName }); }}
        onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} /></label>
      <label className="flex items-center justify-between gap-2">Declaration mode<select aria-label="Native local mode" value={data.properties?.nativeInferenceMode ? 'inferred' : 'typed'}
        className="rounded border border-zinc-700 bg-zinc-900 px-1 py-1" onChange={event => onChange({ declarationMode: event.target.value as 'typed' | 'inferred' })}>
        <option value="typed">Typed</option><option value="inferred">Inferred</option>
      </select></label>
      {data.properties?.nativeInferenceMode ? <p>Inferred type: <output aria-label="Inferred local type">{String(data.properties.nativeType)}</output></p> :
      <label className="flex items-center justify-between gap-2">Native type<select aria-label="Native local type" value={authoredType}
        className="rounded border border-zinc-700 bg-zinc-900 px-1 py-1" onChange={event => onChange({ authoredType: event.target.value })}>
        {!authoredType && <option value="" disabled>Choose native type</option>}
        {types.map(type => <option key={type} value={type}>{type}</option>)}
      </select></label>}
      <label className="flex items-center gap-1"><input type="checkbox" aria-label="Mutable local" checked={data.properties?.nativeMutable === true}
        onChange={event => onChange({ mutable: event.target.checked })} />Mutable</label>
      <p className="text-[11px] text-zinc-500">Connected values must match the declaration. Incompatible edits remain visible in graph diagnostics.</p>
  </div>;
}
