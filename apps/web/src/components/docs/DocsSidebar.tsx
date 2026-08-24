'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { docsPath } from '@/lib/docsUrl';
import type { FeatureDoc } from '@/lib/docsFeatures';
import type { NodeDocRecord } from '@/lib/nodeDocCatalog';
import type { DocsActive } from './docsActive';

function navClass(on: boolean): string {
  return on
    ? 'block rounded-md px-2 py-1 text-zinc-100 bg-zinc-800/80'
    : 'block rounded-md px-2 py-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900';
}

export function DocsSidebar({
  groups,
  features,
  active,
}: {
  groups: { category: string; nodes: NodeDocRecord[] }[];
  features: Pick<FeatureDoc, 'slug' | 'title'>[];
  active?: DocsActive;
}) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!query) return groups;
    return groups
      .map((g) => ({
        category: g.category,
        nodes: g.nodes.filter(
          (n) =>
            n.title.toLowerCase().includes(query) ||
            n.kindId.toLowerCase().includes(query) ||
            n.semantics.toLowerCase().includes(query),
        ),
      }))
      .filter((g) => g.nodes.length > 0);
  }, [groups, query]);

  const activeKind = active?.type === 'node' ? active.id : null;
  const activeFeature = active?.type === 'feature' ? active.id : null;

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-zinc-800/70 px-3 py-5 text-[13px] md:block">
      <label className="mb-4 block">
        <span className="sr-only">Filter nodes</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter nodes"
          className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-[13px] text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-600"
        />
      </label>

      <Link href={docsPath({ type: 'home' })} className={navClass(active?.type === 'home') + ' mb-4'}>
        Overview
      </Link>

      <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Features</p>
      <ul className="mb-5 space-y-0.5">
        {features.map((f) => (
          <li key={f.slug}>
            <Link href={docsPath({ type: 'feature', id: f.slug })} className={navClass(activeFeature === f.slug)}>
              {f.title}
            </Link>
          </li>
        ))}
      </ul>

      <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Node reference</p>
      {filtered.map((group) => (
        <div key={group.category} className="mb-4">
          <p className="px-2 mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            <span>{group.category}</span>
            <span className="font-normal normal-case tracking-normal text-zinc-600">{group.nodes.length}</span>
          </p>
          <ul className="space-y-0.5">
            {group.nodes.map((n) => (
              <li key={n.kindId}>
                <Link href={docsPath({ type: 'node', id: n.kindId })} className={navClass(activeKind === n.kindId)}>
                  <span className="block truncate">{n.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {filtered.length === 0 ? <p className="px-2 text-zinc-600">No kinds match.</p> : null}
    </aside>
  );
}