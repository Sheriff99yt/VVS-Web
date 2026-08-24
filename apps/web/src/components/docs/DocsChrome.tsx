import type { ReactNode } from 'react';
import Link from 'next/link';
import { FEATURE_DOCS } from '@/lib/docsFeatures';
import { docsPath } from '@/lib/docsUrl';
import { listNodeDocsByCategory } from '@/lib/nodeDocCatalog';
import type { DocsActive } from './docsActive';
import { DocsSidebar } from './DocsSidebar';

export type { DocsActive } from './docsActive';

const CONTRIBUTE_HREF = 'https://github.com/Sheriff99yt/VVS-Web/blob/main/CONTRIBUTING.md';

export function DocsChrome({
  active,
  children,
}: {
  title?: string;
  active?: DocsActive;
  children: ReactNode;
}) {
  const groups = listNodeDocsByCategory();

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
        <DocsSidebar groups={groups} features={FEATURE_DOCS} active={active} />
        <main className="min-w-0 flex-1 px-5 py-10 sm:px-8">
          <div className="mx-auto max-w-3xl">{children}</div>
        </main>
      </div>
    </div>
  );
}