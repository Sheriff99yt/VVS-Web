import type { ReactNode } from 'react';
import { FEATURE_DOCS } from '@/lib/docsFeatures';
import { listNodeDocsByCategory } from '@/lib/nodeDocCatalog';
import { BrowseShell } from '@/components/start/BrowseShell';
import type { DocsActive } from './docsActive';
import { DocsSidebar } from './DocsSidebar';

export type { DocsActive } from './docsActive';

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
    <BrowseShell title="Docs">
      <div className="h-full flex min-h-0">
        <DocsSidebar groups={groups} features={FEATURE_DOCS} active={active} />
        <main className="min-w-0 flex-1 overflow-auto px-5 py-10 sm:px-8">
          <div className="mx-auto max-w-3xl">{children}</div>
        </main>
      </div>
    </BrowseShell>
  );
}