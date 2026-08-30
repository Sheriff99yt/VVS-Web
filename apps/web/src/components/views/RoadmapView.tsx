'use client';

import React, { useMemo, useState } from 'react';
import {
  Ban,
  BookOpen,
  CheckCircle2,
  Circle,
  CircleDashed,
  ExternalLink,
} from 'lucide-react';
import {
  FUTURE_FEATURE_SECTIONS,
  SHIPPED_FEATURE_SECTIONS,
  resolveRoadmapLayer,
  type RoadmapItem,
  type RoadmapItemStatus,
  type RoadmapLayer,
  type RoadmapSection,
} from '@/lib/developmentRoadmap';
import { RESEARCH_TOPICS } from '@/lib/roadmapResearch';
import { RoadmapResearchPanel } from '@/components/views/RoadmapResearchPanel';

type RoadmapTab = 'open' | 'done' | 'research';

const SIDEBAR_BTN =
  'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] transition-colors text-left';

const STATUS_META: Record<
  RoadmapItemStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  done: {
    label: 'Done',
    className: 'text-emerald-400/90 bg-emerald-500/10 border-emerald-500/25',
    icon: <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />,
  },
  partial: {
    label: 'In progress',
    className: 'text-amber-400/90 bg-amber-500/10 border-amber-500/25',
    icon: <CircleDashed size={14} className="text-amber-400 shrink-0 mt-0.5" />,
  },
  planned: {
    label: 'Planned',
    className: 'text-zinc-400 bg-zinc-800/50 border-zinc-700/80',
    icon: <Circle size={14} className="text-zinc-500 shrink-0 mt-0.5" />,
  },
  cut: {
    label: 'Out of scope',
    className: 'text-zinc-500 bg-zinc-900/80 border-zinc-800',
    icon: <Ban size={14} className="text-zinc-600 shrink-0 mt-0.5" />,
  },
};

function isOpenStatus(status: RoadmapItemStatus | undefined): boolean {
  return status === 'planned' || status === 'partial' || status == null;
}

function collectByLayer(
  sections: RoadmapSection[],
  predicate: (item: RoadmapItem) => boolean,
): Record<RoadmapLayer, RoadmapItem[]> {
  const out: Record<RoadmapLayer, RoadmapItem[]> = { frontend: [], backend: [] };
  for (const section of sections) {
    for (const item of section.items) {
      if (predicate(item)) {
        out[resolveRoadmapLayer(item, section)].push(item);
      }
    }
  }
  return out;
}

function RoadmapItemRow({
  item,
  showStatus,
  defaultStatus,
}: {
  item: RoadmapItem;
  showStatus: boolean;
  defaultStatus: RoadmapItemStatus;
}) {
  const status = item.status ?? defaultStatus;
  const meta = STATUS_META[status];
  const showBadge = showStatus || item.status != null;
  const isCut = status === 'cut';

  return (
    <li className={`py-3 border-b border-zinc-800 last:border-b-0 ${isCut ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-2.5">
        {showBadge ? meta.icon : <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${isCut ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
              {item.title}
            </span>
            {showBadge ? (
              <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${meta.className}`}>
                {meta.label}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed mt-1">{item.description}</p>
        </div>
      </div>
    </li>
  );
}

function ItemList({
  items,
  showStatus,
  defaultStatus,
}: {
  items: RoadmapItem[];
  showStatus: boolean;
  defaultStatus: RoadmapItemStatus;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 px-4 py-8 text-center">
        <p className="text-sm text-zinc-500">Nothing in this list.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg overflow-hidden">
      <ul className="px-4">
        {items.map((item, index) => (
          <RoadmapItemRow
            key={`${item.id}:${index}`}
            item={item}
            showStatus={showStatus}
            defaultStatus={defaultStatus}
          />
        ))}
      </ul>
    </div>
  );
}

function LayerBlock({
  title,
  items,
  showStatus,
  defaultStatus,
  cutItems,
}: {
  title: string;
  items: RoadmapItem[];
  showStatus: boolean;
  defaultStatus: RoadmapItemStatus;
  cutItems?: RoadmapItem[];
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{title}</h2>
      <ItemList items={items} showStatus={showStatus} defaultStatus={defaultStatus} />
      {cutItems && cutItems.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Out of scope</h3>
          <ItemList items={cutItems} showStatus defaultStatus="cut" />
        </div>
      ) : null}
    </section>
  );
}

function FocusCallout() {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Current focus</p>
      <p className="text-sm text-zinc-400 leading-relaxed">
        First-party templates (17 packs), host-file Contents persist, and Refresh line-based 3-way merge
        are shipped. Search stays token+chips (embeddings later); mobile hide/pin/hit is shipped
        (gestures/radial later). Open leftover fidelity is Verse GetInput (honest (x)); U93 is long-term
        and Library auth/upload stays frozen.
      </p>
    </div>
  );
}

function DirectionCallout() {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Locked direction</p>
      <ul className="text-sm text-zinc-400 leading-relaxed list-disc pl-4 space-y-1">
        <li>
          <span className="text-zinc-200">Client-first</span>: local / folder /{' '}
          <code className="text-zinc-500">.vvs/</code> / git; static Pages OK; no dedicated app server
        </li>
        <li>
          <span className="text-zinc-200">No live code execution</span>: logical checks and warnings
          only; third parties run code
        </li>
        <li>
          <span className="text-zinc-200">Generate ordinary source</span>: text-shaped graphs; no VVS
          runtime
        </li>
        <li>
          <span className="text-zinc-200">Node vs option vs pin</span>: own construct, how it is
          written, or a value from another expression
        </li>
        <li>
          <span className="text-zinc-200">Extends is a list</span>: locked visual on Declare Class;
          extra bases are more rows (Python/C++ only). Generate prints all Extends rows for python/cpp;
          js/gd/verse/cs still first parent. Implements list + Class form shipped for csharp/rust only.
          Super stays first Extends parent.
        </li>
      </ul>
    </div>
  );
}

export function RoadmapView() {
  const [tab, setTab] = useState<RoadmapTab>('open');

  const openByLayer = useMemo(
    () => collectByLayer(FUTURE_FEATURE_SECTIONS, (item) => isOpenStatus(item.status)),
    [],
  );
  const cutByLayer = useMemo(
    () => collectByLayer(FUTURE_FEATURE_SECTIONS, (item) => item.status === 'cut'),
    [],
  );
  const doneByLayer = useMemo(
    () => collectByLayer(SHIPPED_FEATURE_SECTIONS, () => true),
    [],
  );

  const openCount = openByLayer.frontend.length + openByLayer.backend.length;
  const doneCount = doneByLayer.frontend.length + doneByLayer.backend.length;

  const tabs: { id: RoadmapTab; label: string; count: number; Icon: typeof CircleDashed }[] = [
    { id: 'open', label: 'Open', count: openCount, Icon: CircleDashed },
    { id: 'done', label: 'Done', count: doneCount, Icon: CheckCircle2 },
    { id: 'research', label: 'Research', count: RESEARCH_TOPICS.length, Icon: BookOpen },
  ];

  const sectionTitle = tab === 'open' ? 'Open' : tab === 'done' ? 'Done' : 'Research';
  const sectionCopy =
    tab === 'open'
      ? 'What is still planned or in progress, grouped frontend vs backend.'
      : tab === 'done'
        ? 'Shipped work. Honest against the code, not a marketing list.'
        : 'Topics still being decided. Each option has to survive the product law.';

  return (
    <div className="flex h-full w-full bg-zinc-950 overflow-hidden text-zinc-300 font-sans">
      <aside className="w-60 shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col min-h-0">
        <div className="h-9 px-3 flex items-center text-[11px] font-semibold uppercase tracking-widest text-zinc-500 border-b border-zinc-800 shrink-0">
          Roadmap
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-0.5">
          {tabs.map(({ id, label, count, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`${SIDEBAR_BTN} ${
                tab === id
                  ? 'bg-zinc-900 text-zinc-100'
                  : 'text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100'
              }`}
            >
              <Icon size={14} className="text-zinc-500 shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              <span className="text-[10px] text-zinc-600 font-mono tabular-nums">{count}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8">
        <div className="max-w-3xl mx-auto w-full space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 max-w-xl">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{sectionTitle}</h2>
              <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{sectionCopy}</p>
            </div>
            <a
              href="https://github.com/Sheriff99yt/VVS-Web/blob/main/docs/roadmap.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
            >
              roadmap.md
              <ExternalLink size={14} />
            </a>
          </div>

          {tab === 'open' ? (
            <>
              <FocusCallout />
              <DirectionCallout />
              <LayerBlock
                title="Frontend"
                items={openByLayer.frontend}
                showStatus
                defaultStatus="planned"
                cutItems={cutByLayer.frontend}
              />
              <LayerBlock
                title="Backend"
                items={openByLayer.backend}
                showStatus
                defaultStatus="planned"
                cutItems={cutByLayer.backend}
              />
            </>
          ) : null}

          {tab === 'done' ? (
            <>
              <LayerBlock
                title="Frontend"
                items={doneByLayer.frontend}
                showStatus={false}
                defaultStatus="done"
              />
              <LayerBlock
                title="Backend"
                items={doneByLayer.backend}
                showStatus={false}
                defaultStatus="done"
              />
            </>
          ) : null}

          {tab === 'research' ? <RoadmapResearchPanel /> : null}
        </div>
      </div>
    </div>
  );
}
