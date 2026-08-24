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
    <DocsChrome active={{ type: 'home' }}>
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-indigo-300/80">Reference</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">Documentation</h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-400">
        Every public node in the engine registry. Ports and options are generated. Overlay essays and
        the playground are not shipped yet. The editor info icon opens the same URL.
      </p>

      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-zinc-200">Features</h2>
          <span className="text-[11px] text-zinc-600">{FEATURE_DOCS.length}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {FEATURE_DOCS.map((f) => (
            <Link
              key={f.slug}
              href={docsPath({ type: 'feature', id: f.slug })}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-600 hover:bg-zinc-900"
            >
              <div className="text-sm font-medium text-zinc-100 group-hover:text-white">{f.title}</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500">{f.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      {categories.map((category) => {
        const rows = nodes.filter((n) => n.category === category);
        return (
          <section key={category} className="mt-10">
            <div className="mb-3 flex items-baseline justify-between border-b border-zinc-800/80 pb-2">
              <h2 className="text-sm font-semibold text-zinc-200">{category}</h2>
              <span className="text-[11px] text-zinc-600">{rows.length}</span>
            </div>
            <div className="divide-y divide-zinc-800/70 rounded-xl border border-zinc-800/80">
              {rows.map((n) => (
                <Link
                  key={n.kindId}
                  href={docsPath({ type: 'node', id: n.kindId })}
                  className="flex items-center justify-between gap-4 px-4 py-2.5 transition-colors hover:bg-zinc-900/70"
                >
                  <span className="text-sm text-zinc-200">{n.title}</span>
                  <span className="flex items-center gap-2">
                    {n.status === 'cut' ? (
                      <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-400">
                        cut
                      </span>
                    ) : null}
                    <code className="font-mono text-[11px] text-zinc-600">{n.kindId}</code>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </DocsChrome>
  );
}
