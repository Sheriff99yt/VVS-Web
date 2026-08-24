import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocsChrome } from '@/components/docs/DocsChrome';
import { getNodeDoc, listNodeDocKindIds } from '@/lib/nodeDocCatalog';

type PageProps = { params: Promise<{ kindId: string }> };

export function generateStaticParams() {
  return listNodeDocKindIds().map((kindId) => ({ kindId }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { kindId } = await params;
  const id = decodeURIComponent(kindId);
  const node = getNodeDoc(id);
  if (!node) return { title: 'Unknown node' };
  return {
    title: `${node.title} — VVS docs`,
    description: `${node.title} (${node.kindId}) is a ${node.category} node. Ports and options come from the engine registry.`,
  };
}

function pinType(pin: { type?: string; label?: string }): string {
  return pin.type ?? 'data';
}

export default async function NodeDocPage({ params }: PageProps) {
  const { kindId } = await params;
  const id = decodeURIComponent(kindId);
  const node = getNodeDoc(id);
  if (!node) notFound();

  return (
    <DocsChrome title={node.title}>
      <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
        {node.category}
        {node.status === 'cut' ? ' · cut / legacy' : ''}
      </p>
      <h1 className="text-2xl font-semibold text-zinc-100 mb-2">{node.title}</h1>
      <p className="text-zinc-400 mb-6 leading-relaxed">
        {node.title} ({node.kindId}) is a {node.category} node. Semantics: {node.semantics}.
        Ports and options below are generated from the syntax registry.
        {node.status === 'cut'
          ? ' This kind is cut or legacy in the spawn catalog. The page exists so an editor deep link never 404s.'
          : ''}
      </p>
      <p className="text-xs text-zinc-600 mb-8">
        Overlay prose is not shipped yet. Tables are the source of truth.
      </p>

      <h2 className="text-sm font-semibold text-zinc-200 mb-2">Ports</h2>
      <table className="w-full text-left text-xs border-collapse mb-8">
        <thead>
          <tr className="text-zinc-500 border-b border-zinc-800">
            <th className="py-1.5 pr-3 font-medium">Id</th>
            <th className="py-1.5 pr-3 font-medium">Dir</th>
            <th className="py-1.5 pr-3 font-medium">Type</th>
            <th className="py-1.5 font-medium">Label</th>
          </tr>
        </thead>
        <tbody>
          {node.inputs.map((pin) => (
            <tr key={`in-${pin.id}`} id={`in-${pin.id}`} className="border-b border-zinc-900">
              <td className="py-1.5 pr-3 font-mono text-zinc-300">{pin.id}</td>
              <td className="py-1.5 pr-3 text-zinc-500">in</td>
              <td className="py-1.5 pr-3 text-zinc-400">{pinType(pin)}</td>
              <td className="py-1.5 text-zinc-400">{pin.label || '—'}</td>
            </tr>
          ))}
          {node.outputs.map((pin) => (
            <tr key={`out-${pin.id}`} id={`out-${pin.id}`} className="border-b border-zinc-900">
              <td className="py-1.5 pr-3 font-mono text-zinc-300">{pin.id}</td>
              <td className="py-1.5 pr-3 text-zinc-500">out</td>
              <td className="py-1.5 pr-3 text-zinc-400">{pinType(pin)}</td>
              <td className="py-1.5 text-zinc-400">{pin.label || '—'}</td>
            </tr>
          ))}
          {node.inputs.length === 0 && node.outputs.length === 0 ? (
            <tr>
              <td className="py-2 text-zinc-600" colSpan={4}>
                No ports on this kind.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <h2 className="text-sm font-semibold text-zinc-200 mb-2">Options</h2>
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="text-zinc-500 border-b border-zinc-800">
            <th className="py-1.5 pr-3 font-medium">Id</th>
            <th className="py-1.5 pr-3 font-medium">Type</th>
            <th className="py-1.5 pr-3 font-medium">Default</th>
            <th className="py-1.5 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody>
          {node.options.length === 0 ? (
            <tr>
              <td className="py-2 text-zinc-600" colSpan={4}>
                No options on this kind.
              </td>
            </tr>
          ) : (
            node.options.map((opt) => (
              <tr key={opt.key} id={`opt-${opt.key}`} className="border-b border-zinc-900">
                <td className="py-1.5 pr-3 font-mono text-zinc-300">{opt.key}</td>
                <td className="py-1.5 pr-3 text-zinc-400">{opt.type}</td>
                <td className="py-1.5 pr-3 text-zinc-400">
                  {opt.default === undefined ? '—' : String(opt.default)}
                </td>
                <td className="py-1.5 text-zinc-400">
                  {opt.enumValues?.length ? `enum: ${opt.enumValues.join(', ')}` : opt.description || '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </DocsChrome>
  );
}
