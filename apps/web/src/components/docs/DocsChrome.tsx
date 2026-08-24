import type { ReactNode } from 'react';
import Link from 'next/link';
import { BrowseShell } from '@/components/start/BrowseShell';
import { docsPath } from '@/lib/docsUrl';

export function DocsChrome({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <BrowseShell title={title}>
      <div className="h-full overflow-auto">
        <div className="max-w-3xl mx-auto px-4 py-8 text-sm text-zinc-300">
          <nav className="text-xs text-zinc-500 mb-6 flex flex-wrap gap-3">
            <Link href={docsPath({ type: 'home' })} className="text-indigo-400 hover:text-indigo-300">
              Docs
            </Link>
            <Link href={docsPath({ type: 'feature', id: 'generate' })} className="hover:text-zinc-200">
              Generate
            </Link>
            <Link href={docsPath({ type: 'feature', id: 'leftover' })} className="hover:text-zinc-200">
              Leftover
            </Link>
            <Link href={docsPath({ type: 'feature', id: 'node-option-pin' })} className="hover:text-zinc-200">
              Node / option / pin
            </Link>
          </nav>
          {children}
        </div>
      </div>
    </BrowseShell>
  );
}
