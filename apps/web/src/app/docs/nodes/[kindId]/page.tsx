import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DocsChrome } from '@/components/docs/DocsChrome';
import { docsCategoryHash, docsPath } from '@/lib/docsUrl';
import { getNodeDoc, listNodeDocKindIds, relatedNodeDocs } from '@/lib/nodeDocCatalog';

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
    title: `${node.title} - VVS docs`,
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

  const ports = [
    ...node.inputs.map((pin) => ({ dir: 'in' as const, pin })),
    ...node.outputs.map((pin) => ({ dir: 'out' as const, pin })),
  ];
  const related = relatedNodeDocs(node.kindId);

  return (
    <DocsChrome title={node.title} active={{ type: 'node', id: node.kindId }}>
      <nav className="mb-6 text-[12px] text-zinc-500">
        <Link href={docsPath({ type: 'home' })} className="hover:text-zinc-200">
          Docs
        </Link>
        <span className="mx-1.5 text-zinc-700">/</span>
        <Link href={docsPath({ type: 'home', hash: docsCategoryHash(node.category) })} className="hover:text-zinc-200">
          {node.category}
        </Link>
        <span className="mx-1.5 text-zinc-700">/</span>
        <span className="text-zinc-300">{node.title}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[11px] uppercase tracking-wide text-zinc-400">
          {node.category}
        </span>
        {node.status === 'cut' ? (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-amber-400">
            cut / legacy
          </span>
        ) : (
          <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[11px] uppercase tracking-wide text-zinc-500">
            stable
          </span>
        )}
      </div>

      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50">{node.title}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">
        {node.title} ({node.kindId}) is a {node.category} node. Semantics: {node.semantics}. Ports and
        options below are generated from the syntax registry.
        {node.status === 'cut'
          ? ' This kind is cut or legacy in the spawn catalog. The page exists so an editor deep link never 404s.'
          : ''}
      </p>

      <nav className="mt-6 flex flex-wrap gap-3 text-[12px] text-zinc-500">
        <a href="#overview" className="hover:text-zinc-200">Overview</a>
        <a href="#ports" className="hover:text-zinc-200">Ports ({ports.length})</a>
        <a href="#options" className="hover:text-zinc-200">Options ({node.options.length})</a>
        {related.length > 0 ? <a href="#related" className="hover:text-zinc-200">Related</a> : null}
      </nav>

      <section id="overview" className="mt-8">
        <h2 className="text-sm font-semibold text-zinc-100">Overview</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-widest text-zinc-500">Kind id</dt>
            <dd className="mt-1 font-mono text-[13px] text-zinc-200">{node.kindId}</dd>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-widest text-zinc-500">Semantics</dt>
            <dd className="mt-1 font-mono text-[13px] text-zinc-200">{node.semantics}</dd>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-widest text-zinc-500">Source</dt>
            <dd className="mt-1 text-[13px] text-zinc-200">CORE_NODE_REGISTRY</dd>
          </div>
        </dl>
        <p className="mt-3 text-[12px] text-zinc-600">Overlay prose is not shipped yet. Tables are the source of truth.</p>
      </section>

      <section id="ports" className="mt-10">
        <h2 className="text-sm font-semibold text-zinc-100">Ports</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-zinc-900/80 text-[11px] uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-medium">Id</th>
                <th className="px-3 py-2 font-medium">Dir</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Label</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {ports.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-zinc-600" colSpan={4}>
                    No ports on this kind.
                  </td>
                </tr>
              ) : (
                ports.map(({ dir, pin }) => (
                  <tr key={`${dir}-${pin.id}`} id={`${dir}-${pin.id}`}>
                    <td className="px-3 py-2 font-mono text-zinc-200">{pin.id}</td>
                    <td className="px-3 py-2 text-zinc-500">{dir}</td>
                    <td className="px-3 py-2 text-zinc-400">{pinType(pin)}</td>
                    <td className="px-3 py-2 text-zinc-400">{pin.label || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section id="options" className="mt-10">
        <h2 className="text-sm font-semibold text-zinc-100">Options</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-zinc-900/80 text-[11px] uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-medium">Id</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Default</th>
                <th className="px-3 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {node.options.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-zinc-600" colSpan={4}>
                    No options on this kind.
                  </td>
                </tr>
              ) : (
                node.options.map((opt) => (
                  <tr key={opt.key} id={`opt-${opt.key}`}>
                    <td className="px-3 py-2 font-mono text-zinc-200">{opt.key}</td>
                    <td className="px-3 py-2 text-zinc-400">{opt.type}</td>
                    <td className="px-3 py-2 text-zinc-400">
                      {opt.default === undefined ? '-' : String(opt.default)}
                    </td>
                    <td className="px-3 py-2 text-zinc-400">
                      {opt.enumValues?.length ? `enum: ${opt.enumValues.join(', ')}` : opt.description || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {related.length > 0 ? (
        <section id="related" className="mt-10">
          <h2 className="text-sm font-semibold text-zinc-100">Related in {node.category}</h2>
          <ul className="mt-3 divide-y divide-zinc-800/80 rounded-xl border border-zinc-800">
            {related.map((n) => (
              <li key={n.kindId}>
                <Link
                  href={docsPath({ type: 'node', id: n.kindId })}
                  className="flex items-center justify-between px-3 py-2 text-[13px] hover:bg-zinc-900/70"
                >
                  <span className="text-zinc-200">{n.title}</span>
                  <code className="text-[11px] text-zinc-600">{n.kindId}</code>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </DocsChrome>
  );
}