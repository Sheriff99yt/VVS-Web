'use client';
import { NATIVE_SCALAR_SIGNATURE_TYPES, type NativeScalarGroupEdit, type NativeScalarDeclarationModeEdit, type VVSNodeData } from '@vvs/graph-types';

export function NativeDeclarationGroupPanel({ data, onChange }: { data: VVSNodeData; onChange: (edit: NativeScalarGroupEdit | NativeScalarDeclarationModeEdit) => void }) {
  if (data.kindId !== 'native_declaration_group' || data.properties?.nativeLocalLanguage !== 'cpp') return null;
  const type = String(data.properties.nativeAuthoredType ?? '');
  return <details className="border-t border-zinc-800 pt-2 text-xs text-zinc-300">
    <summary className="cursor-pointer text-zinc-400">Native declaration group</summary>
    <div className="mt-2 space-y-2">
      <label className="flex items-center justify-between gap-2">Declaration mode<select aria-label="Native group mode" value={data.properties.nativeInferenceMode ? 'inferred' : 'typed'}
        className="rounded border border-zinc-700 bg-zinc-900 px-1 py-1" onChange={event => onChange({ declarationMode: event.target.value as 'typed' | 'inferred' })}>
        <option value="typed">Typed</option><option value="inferred">Inferred</option>
      </select></label>
      {data.properties.nativeInferenceMode ? <p>Inferred type: <output aria-label="Inferred group type">{String(data.properties.nativeType)}</output></p> :
      <label className="flex items-center justify-between gap-2">Native type<select aria-label="Native group type" value={type}
        className="rounded border border-zinc-700 bg-zinc-900 px-1 py-1" onChange={event => onChange({ authoredType: event.target.value })}>
        {[...new Set([type, ...NATIVE_SCALAR_SIGNATURE_TYPES.cpp])].filter(Boolean).map(type => <option key={type} value={type}>{type}</option>)}
      </select></label>}
      <label className="flex items-center gap-1"><input type="checkbox" aria-label="Mutable group" checked={data.properties.nativeMutable === true}
        onChange={event => onChange({ mutable: event.target.checked })} />Mutable</label>
      <p className="text-[11px] text-zinc-500">Type and mutability apply to every declarator. Edit each name on its declaration node.</p>
    </div>
  </details>;
}
