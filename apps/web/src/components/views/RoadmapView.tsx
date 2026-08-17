'use client';

import React, { useMemo, useState } from 'react';
import { Ban, CheckCircle2, Circle, CircleDashed, ExternalLink } from 'lucide-react';
import {
  FUTURE_FEATURE_SECTIONS,
  SHIPPED_FEATURE_SECTIONS,
  resolveRoadmapLayer,
  type RoadmapItem,
  type RoadmapItemStatus,
  type RoadmapLayer,
  type RoadmapSection,
} from '@/lib/developmentRoadmap';

type RoadmapTab = 'open' | 'done';

const STATUS_META: Record<
  RoadmapItemStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  done: {
    label: 'Done',
    className: 'text-emerald-400/90 bg-emerald-500/10 border-emerald-500/25',
    icon: <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />,
  },
  partial: {
    label: 'In progress',
    className: 'text-amber-400/90 bg-amber-500/10 border-amber-500/25',
    icon: <CircleDashed size={11} className="text-amber-400 shrink-0" />,
  },
  planned: {
    label: 'Planned',
    className: 'text-zinc-400 bg-zinc-800/50 border-zinc-700/80',
    icon: <Circle size={11} className="text-zinc-500 shrink-0" />,
  },
  cut: {
    label: 'Out of scope',
    className: 'text-zinc-500 bg-zinc-900/80 border-zinc-800',
    icon: <Ban size={11} className="text-zinc-600 shrink-0" />,
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
    <li className={`py-2.5 border-b border-zinc-800/60 last:border-b-0 ${isCut ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-2">
        {showBadge ? meta.icon : <CheckCircle2 size={11} className="text-emerald-400 shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[12px] font-medium ${isCut ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
              {item.title}
            </span>
            {showBadge ? (
              <span
                className={`text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${meta.className}`}
              >
                {meta.label}
              </span>
            ) : null}
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5">{item.description}</p>
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
    return <p className="text-[11px] text-zinc-600 px-1">None</p>;
  }

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
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
      <h2 className="text-[13px] font-semibold text-zinc-200 tracking-tight">{title}</h2>
      <ItemList items={items} showStatus={showStatus} defaultStatus={defaultStatus} />
      {cutItems && cutItems.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            Out of scope
          </h3>
          <ItemList items={cutItems} showStatus defaultStatus="cut" />
        </div>
      ) : null}
    </section>
  );
}

function FocusCallout() {
  return (
    <div className="rounded-lg border border-indigo-500/35 bg-indigo-500/5 px-4 py-3 space-y-1.5">
      <p className="text-[11px] font-medium text-indigo-300/90">Current focus — Phase 6</p>
      <p className="text-[11px] text-zinc-500 leading-relaxed">
        August emit/OOP plus Extends multi-base (py/cpp), Implements list + Class form (cs/rs), Yield, Switch match, TypeSpec CLI, overload codegen, host skip/emit UI, Library language chips, and two env packs just shipped.
        Open leftover fidelity is Verse GetInput (honest (x)); U93 is long-term and Library auth/upload stays frozen.
      </p>
    </div>
  );
}

function DirectionCallout() {
  return (
    <div className="rounded-lg border border-zinc-700/80 bg-zinc-900/40 px-4 py-3 space-y-1.5">
      <p className="text-[11px] font-medium text-zinc-300">Locked direction</p>
      <ul className="text-[11px] text-zinc-500 leading-relaxed list-disc pl-4 space-y-0.5">
        <li>
          <span className="text-zinc-400">Client-first</span> — local / folder /{' '}
          <code className="text-zinc-500">.vvs/</code> / git; static Pages OK;{' '}
          <span className="text-zinc-400">no dedicated app server</span>
        </li>
        <li>
          <span className="text-zinc-400">No live code execution</span> — logical checks and warnings
          only; third parties run code
        </li>
        <li>
          <span className="text-zinc-400">Generate ordinary source</span> — text-shaped graphs; no VVS
          runtime
        </li>
        <li>
          <span className="text-zinc-400">Node vs option vs pin</span> — own construct, how it is
          written, or a value from another expression
        </li>
        <li>
          <span className="text-zinc-400">Extends is a list</span> — locked visual on Declare Class;
          extra bases are more rows (Python/C++ only). Generate prints all Extends rows for
          python/cpp; js/gd/verse/cs still first parent. Implements list + Class form shipped
          for csharp/rust only. Super stays first Extends parent.
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

  return (
    <div className="h-full overflow-y-auto bg-zinc-950">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <header className="space-y-2">
          <h1 className="text-lg font-semibold text-zinc-100">Development roadmap</h1>
          <p className="text-[12px] text-zinc-500 leading-relaxed max-w-2xl">
            Client-first editor. Open and Done are grouped frontend (canvas, chrome, client codegen) vs
            backend (Go, MCP sidecar, hosting). Full public notes in{' '}
            <a
              href="https://github.com/Sheriff99yt/VVS-Web/blob/main/docs/roadmap.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400/90 hover:text-indigo-300 inline-flex items-center gap-0.5"
            >
              roadmap.md
              <ExternalLink size={10} />
            </a>
            .
          </p>
        </header>

        <FocusCallout />
        <DirectionCallout />

        <div className="flex gap-1 p-0.5 bg-zinc-900 border border-zinc-800 rounded-md w-fit">
          <button
            type="button"
            onClick={() => setTab('open')}
            className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${
              tab === 'open' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Open ({openCount})
          </button>
          <button
            type="button"
            onClick={() => setTab('done')}
            className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${
              tab === 'done' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Done ({doneCount})
          </button>
        </div>

        <div className="space-y-8">
          {tab === 'open' ? (
            <>
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
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
