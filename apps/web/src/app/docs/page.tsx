import type { Metadata } from 'next';
import Link from 'next/link';
import { DocsChrome } from '@/components/docs/DocsChrome';
import { FEATURE_DOCS } from '@/lib/docsFeatures';
import { docsPath } from '@/lib/docsUrl';
import { listNodeDocs } from '@/lib/nodeDocCatalog';

export const metadata: Metadata = {
  title: 'VVS docs',
  description:
    'Catalog of every VVS node, option, and feature. Generated from the syntax registry. HTML-first.',
};

export default function DocsIndexPage() {
  const nodes = listNodeDocs();
  const categories = [...new Set(nodes.map((n) => n.category))];

  return (
    <DocsChrome title="Docs">
      <h1 className="text-2xl font-semibold text-zinc-100 mb-2">VVS documentation</h1>
      <p className="text-zinc-400 mb-8 leading-relaxed">
        A catalog of every public node in the engine registry. Ports and options are generated.
        Playground is later. The editor info icon opens the same URL.
      </p>

      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Features</h2>
      <ul className="mb-10 space-y-2">
        {FEATURE_DOCS.map((f) => (
          <li key={f.slug}>
            <Link href={docsPath({ type: 'feature', id: f.slug })} className="text-indigo-400 hover:text-indigo-300">
              {f.title}
            </Link>
            <span className="text-zinc-500"> — {f.summary}</span>
          </li>
        ))}
      </ul>

      {categories.map((category) => (
        <section key={category} className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">{category}</h2>
          <ul className="space-y-1.5">
            {nodes
              .filter((n) => n.category === category)
              .map((n) => (
                <li key={n.kindId} className="flex items-baseline gap-2">
                  <Link
                    href={docsPath({ type: 'node', id: n.kindId })}
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    {n.title}
                  </Link>
                  <code className="text-[10px] text-zinc-600">{n.kindId}</code>
                  {n.status === 'cut' ? (
                    <span className="text-[10px] uppercase tracking-wide text-amber-500/80">cut</span>
                  ) : null}
                </li>
              ))}
          </ul>
        </section>
      ))}
    </DocsChrome>
  );
}
