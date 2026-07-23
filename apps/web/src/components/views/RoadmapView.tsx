'use client';

import React, { useMemo, useState } from 'react';
import { Ban, CheckCircle2, Circle, CircleDashed, ExternalLink } from 'lucide-react';
import {
  FUTURE_FEATURE_SECTIONS,
  SHIPPED_FEATURE_SECTIONS,
  type RoadmapItem,
  type RoadmapItemStatus,
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

function sectionHasOpenItems(section: RoadmapSection): boolean {
  return section.items.some((item) => isOpenStatus(item.status));
}

function openItems(section: RoadmapSection): RoadmapItem[] {
  return section.items.filter((item) => isOpenStatus(item.status));
}

function cutItems(section: RoadmapSection): RoadmapItem[] {
  return section.items.filter((item) => item.status === 'cut');
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

function RoadmapSectionBlock({
  section,
  showStatus,
  defaultStatus,
  items,
}: {
  section: RoadmapSection;
  showStatus: boolean;
  defaultStatus: RoadmapItemStatus;
  items?: RoadmapItem[];
}) {
  const list = items ?? section.items;
  if (list.length === 0) return null;

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
        {list.map((item) => (
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
      <p className="text-[11px] font-medium text-indigo-300/90">Current focus — Phase 6</p>
      <p className="text-[11px] text-zinc-500 leading-relaxed">
        <span className="text-zinc-300">Priority:</span> Pack versions (U78) and
        emit-fidelity plans (CL backlog). Then References / Library (U89–U90), AI & examples
        (U91–U92), and graph/OOP fidelity (U97–U106).{' '}
        <span className="text-zinc-300">Just shipped:</span> Go Target Language Pack (U77), U108–U119 (history · menus · settings ·
        undo · naming · safety), code-panel hover nav, U83 virtualization.
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
      </ul>
    </div>
  );
}

export function RoadmapView() {
  const [tab, setTab] = useState<RoadmapTab>('open');

  const openSections = useMemo(
    () => FUTURE_FEATURE_SECTIONS.filter(sectionHasOpenItems),
    []
  );
  const cutFlat = useMemo(
    () =>
      FUTURE_FEATURE_SECTIONS.flatMap((section) =>
        cutItems(section).map((item) => ({ section, item }))
      ),
    []
  );

  const openCount = useMemo(
    () => openSections.reduce((n, s) => n + openItems(s).length, 0),
    [openSections]
  );
  const doneCount = useMemo(
    () => SHIPPED_FEATURE_SECTIONS.reduce((n, s) => n + s.items.length, 0),
    []
  );

  return (
    <div className="h-full overflow-y-auto bg-zinc-950">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <header className="space-y-2">
          <h1 className="text-lg font-semibold text-zinc-100">Development roadmap</h1>
          <p className="text-[12px] text-zinc-500 leading-relaxed max-w-2xl">
            Client-first editor. Active: Go / pack versions / CL emit plans, then U89–U92 and
            U97–U106. Full public notes in{' '}
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
              tab === 'open'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Open ({openCount})
          </button>
          <button
            type="button"
            onClick={() => setTab('done')}
            className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${
              tab === 'done'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Done ({doneCount})
          </button>
        </div>

        <div className="space-y-4">
          {tab === 'done'
            ? SHIPPED_FEATURE_SECTIONS.map((section) => (
                <RoadmapSectionBlock
                  key={section.id}
                  section={section}
                  showStatus={false}
                  defaultStatus="done"
                />
              ))
            : openSections.map((section) => (
                <RoadmapSectionBlock
                  key={section.id}
                  section={section}
                  showStatus
                  defaultStatus="planned"
                  items={openItems(section)}
                />
              ))}

          {tab === 'open' && cutFlat.length > 0 ? (
            <section className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden opacity-90">
              <h3 className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 border-b border-zinc-800/80 bg-zinc-900/40">
                Out of scope (locked)
              </h3>
              <ul className="px-4">
                {cutFlat.map(({ section, item }) => (
                  <RoadmapItemRow
                    key={`${section.id}:${item.id}`}
                    item={item}
                    showStatus
                    defaultStatus="cut"
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
