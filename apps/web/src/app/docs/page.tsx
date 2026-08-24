import type { Metadata } from 'next';
import Link from 'next/link';
import { DocsChrome } from '@/components/docs/DocsChrome';
import { FEATURE_DOCS } from '@/lib/docsFeatures';
import { docsPath } from '@/lib/docsUrl';
import { listNodeDocs, listNodeDocsByCategory } from '@/lib/nodeDocCatalog';

export const metadata: Metadata = {
  title: 'VVS docs',
  description:
    'Reference catalog of every VVS node and the shipped Generate / leftover / grammar features. Tables come from the syntax registry.',
};

export default function DocsIndexPage() {
  const groups = listNodeDocsByCategory();
  const total = listNodeDocs().length;

  return (
    <DocsChrome active={{ type: 'home' }}>
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-indigo-300/80">Reference</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">Documentation</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-zinc-400">
        Public catalog of {total} registry kinds plus the three shipped feature pages. Ports and options
        are generated from CORE_NODE_REGISTRY. Overlay essays and the playground are not shipped.
        The editor info icon opens the same URL.
      </p>

      <section id="how-to-read" className="mt-10">
        <h2 className="text-sm font-semibold text-zinc-100">How to read this catalog</h2>
        <ol className="mt-3 space-y-2 text-[14px] leading-relaxed text-zinc-400">
          <li>
            <span className="text-zinc-200">kindId is the page.</span> /docs/nodes/{'{kindId}'} is the
            stable name. Dots stay dots.
          </li>
          <li>
            <span className="text-zinc-200">Tables are the ABI.</span> If a pin or option is not in the
            registry, it is not on the page.
          </li>
          <li>
            <span className="text-zinc-200">Leftover wins.</span> If Generate would print (x), the page
            must not invent a language API.
          </li>
        </ol>
      </section>

      <section id="features" className="mt-10">
        <h2 className="text-sm font-semibold text-zinc-100">Features</h2>
        <p className="mt-1 text-[13px] text-zinc-500">Shipped product rules, not node kinds.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {FEATURE_DOCS.map((f) => (
            <Link
              key={f.slug}
              href={docsPath({ type: 'feature', id: f.slug })}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-600 hover:bg-zinc-900"
            >
              <div className="text-sm font-medium text-zinc-100">{f.title}</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500">{f.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="nodes" className="mt-12">
        <h2 className="text-sm font-semibold text-zinc-100">Node reference</h2>
        <p className="mt-1 text-[13px] text-zinc-500">Grouped in registry category order.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {groups.map((g) => (
            <a
              key={g.category}
              href={`#cat-${g.category.toLowerCase().replace(/\s+/g, '-')}`}
              className="rounded-full border border-zinc-800 px-2.5 py-1 text-[12px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
            >
              {g.category}
              <span className="ml-1.5 text-zinc-600">{g.nodes.length}</span>
            </a>
          ))}
        </div>

        {groups.map((g) => (
          <div key={g.category} id={`cat-${g.category.toLowerCase().replace(/\s+/g, '-')}`} className="mt-8">
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-zinc-200">{g.category}</h3>
              <span className="text-[11px] text-zinc-600">{g.nodes.length}</span>
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-800">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-zinc-900/80 text-[11px] uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Title</th>
                    <th className="px-3 py-2 font-medium">Kind</th>
                    <th className="px-3 py-2 font-medium">Semantics</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {g.nodes.map((n) => (
                    <tr key={n.kindId}>
                      <td className="px-3 py-2">
                        <Link href={docsPath({ type: 'node', id: n.kindId })} className="text-zinc-100 hover:text-white">
                          {n.title}
                        </Link>
                      </td>
                      <td className="px-3 py-2 font-mono text-[12px] text-zinc-500">{n.kindId}</td>
                      <td className="px-3 py-2 font-mono text-[12px] text-zinc-500">{n.semantics}</td>
                      <td className="px-3 py-2 text-zinc-500">{n.status === 'cut' ? 'cut' : 'stable'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>
    </DocsChrome>
  );
}