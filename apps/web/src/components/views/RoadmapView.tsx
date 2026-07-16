'use client';

import React, { useState } from 'react';
import { CheckCircle2, Circle, CircleDashed, ExternalLink } from 'lucide-react';
import {
  FUTURE_FEATURE_SECTIONS,
  SHIPPED_FEATURE_SECTIONS,
  type RoadmapItem,
  type RoadmapItemStatus,
  type RoadmapSection,
} from '@/lib/developmentRoadmap';

type RoadmapTab = 'features' | 'future';

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
};

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

  return (
    <li className="py-2.5 border-b border-zinc-800/60 last:border-b-0">
      <div className="flex items-start gap-2">
        {showBadge ? meta.icon : <CheckCircle2 size={11} className="text-emerald-400 shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-medium text-zinc-200">{item.title}</span>
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

function RoadmapSectionBlock({
  section,
  showStatus,
  defaultStatus,
}: {
  section: RoadmapSection;
  showStatus: boolean;
  defaultStatus: RoadmapItemStatus;
}) {
  const isActive = section.emphasis === 'active';
  const isShipped = section.emphasis === 'shipped';

  return (
    <section
      className={`bg-zinc-950 border rounded-lg overflow-hidden ${
        isActive
          ? 'border-indigo-500/35 shadow-[0_0_0_1px_rgba(99,102,241,0.08)]'
          : isShipped
            ? 'border-emerald-500/25 shadow-[0_0_0_1px_rgba(16,185,129,0.06)]'
            : 'border-zinc-800'
      }`}
    >
      <h3 className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center gap-2 flex-wrap">
        <span
          className={
            isActive ? 'text-indigo-300/90' : isShipped ? 'text-emerald-300/90' : undefined
          }
        >
          {section.title}
        </span>
        {section.phase ? (
          <span className="text-[9px] font-normal normal-case tracking-normal text-zinc-600">
            Phase {section.phase}
          </span>
        ) : null}
        {isActive ? (
          <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded border text-indigo-300/90 bg-indigo-500/10 border-indigo-500/30">
            Current focus
          </span>
        ) : null}
        {isShipped ? (
          <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded border text-emerald-400/90 bg-emerald-500/10 border-emerald-500/25">
            Done
          </span>
        ) : null}
      </h3>
      <ul className="px-4">
        {section.items.map((item) => (
          <RoadmapItemRow
            key={item.id}
            item={item}
            showStatus={showStatus}
            defaultStatus={defaultStatus}
          />
        ))}
      </ul>
    </section>
  );
}

function FocusCallout() {
  return (
    <div className="rounded-lg border border-indigo-500/35 bg-indigo-500/5 px-4 py-3 space-y-1.5">
      <p className="text-[11px] font-medium text-indigo-300/90">Current focus — Phase 6 polish</p>
      <p className="text-[11px] text-zinc-500 leading-relaxed">
        U64 temps + TypeRef + Test Project goldens (U65) shipped. Open: cross-class event dispatch. Primary
        golden: Coverage Lab — verify via Code | Files goldens.
      </p>
    </div>
  );
}

export function RoadmapView() {
  const [tab, setTab] = useState<RoadmapTab>('future');

  return (
    <div className="h-full overflow-y-auto bg-zinc-950">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <header className="space-y-2">
          <h1 className="text-lg font-semibold text-zinc-100">Development roadmap</h1>
          <p className="text-[12px] text-zinc-500 leading-relaxed max-w-2xl">
            Phases 1–2 closed. Phase 6 active — fidelity deepen. Library, collab, and UE6 are planned.{' '}
            <a
              href="https://github.com/Sheriff99yt/VVS-Web/blob/main/docs/roadmap.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400/90 hover:text-indigo-300 inline-flex items-center gap-0.5"
            >
              roadmap.md
              <ExternalLink size={10} />
            </a>
          </p>
        </header>

        <FocusCallout />

        <div className="flex gap-1 p-0.5 bg-zinc-900 border border-zinc-800 rounded-md w-fit">
          <button
            type="button"
            onClick={() => setTab('future')}
            className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${
              tab === 'future'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Open tracks
          </button>
          <button
            type="button"
            onClick={() => setTab('features')}
            className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${
              tab === 'features'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Done
          </button>
        </div>

        <div className="space-y-4">
          {(tab === 'features' ? SHIPPED_FEATURE_SECTIONS : FUTURE_FEATURE_SECTIONS).map((section) => (
            <RoadmapSectionBlock
              key={section.id}
              section={section}
              showStatus={tab === 'future'}
              defaultStatus={tab === 'features' ? 'done' : 'planned'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
