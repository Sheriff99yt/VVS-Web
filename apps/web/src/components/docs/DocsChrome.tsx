import type { ReactNode } from 'react';
import Link from 'next/link';
import { FEATURE_DOCS } from '@/lib/docsFeatures';
import { docsPath } from '@/lib/docsUrl';
import { listNodeDocs } from '@/lib/nodeDocCatalog';

const CONTRIBUTE_HREF = 'https://github.com/Sheriff99yt/VVS-Web/blob/main/CONTRIBUTING.md';

export type DocsActive =
  | { type: 'home' }
  | { type: 'feature'; id: string }
  | { type: 'node'; id: string };

function navClass(on: boolean): string {
  return on
    ? 'block rounded-md px-2 py-1 text-zinc-100 bg-zinc-800/80'
    : 'block rounded-md px-2 py-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900';
}

export function DocsChrome({
  active,
  children,
}: {
  title?: string;
  active?: DocsActive;
  children: ReactNode;
}) {
  const nodes = listNodeDocs();
  const categories = [...new Set(nodes.map((n) => n.category))];
  const activeKind = active?.type === 'node' ? active.id : null;
  const activeFeature = active?.type === 'feature' ? active.id : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans">
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-wide text-zinc-100">
              <span className="h-3.5 w-3.5 rounded-sm bg-zinc-100" />
              VVS Web
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href={docsPath({ type: 'home' })}
                className={active?.type === 'home' ? 'text-zinc-100' : 'text-zinc-400 hover:text-zinc-100'}
              >
                Docs
              </Link>
              <Link href="/editor" className="text-zinc-400 hover:text-zinc-100">
                Editor
              </Link>
            </nav>
          </div>
          <a
            href={CONTRIBUTE_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-100"
          >
            Contribute
          </a>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-zinc-800/70 px-3 py-6 text-[13px] md:block">
          <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Features</p>
          <ul className="mb-6 space-y-0.5">
            {FEATURE_DOCS.map((f) => (
              <li key={f.slug}>
                <Link href={docsPath({ type: 'feature', id: f.slug })} className={navClass(activeFeature === f.slug)}>
                  {f.title}
                </Link>
              </li>
            ))}
          </ul>
          {categories.map((category) => (
            <div key={category} className="mb-5">
              <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{category}</p>
              <ul className="space-y-0.5">
                {nodes
                  .filter((n) => n.category === category)
                  .map((n) => (
                    <li key={n.kindId}>
                      <Link href={docsPath({ type: 'node', id: n.kindId })} className={navClass(activeKind === n.kindId)}>
                        <span className="block truncate">{n.title}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </aside>

        <main className="min-w-0 flex-1 px-5 py-10 sm:px-8">
          <div className="mx-auto max-w-3xl">{children}</div>
        </main>
      </div>
    </div>
  );
}