'use client';

import React, { useState } from 'react';
import { CheckCircle2, Circle, CircleDashed, ExternalLink } from 'lucide-react';
import {
  FUTURE_FEATURE_SECTIONS,
  ROADMAP_PHASES,
  SHIPPED_FEATURE_SECTIONS,
  type RoadmapItem,
  type RoadmapItemStatus,
  type RoadmapPhase,
  type RoadmapSection,
} from '@/lib/developmentRoadmap';

type RoadmapTab = 'features' | 'future';

const STATUS_META: Record<
  RoadmapItemStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  done: {
    label: 'Shipped',
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

const PHASE_STATUS_STYLE: Record<RoadmapPhase['status'], string> = {
  shipped: 'border-emerald-500/30 bg-emerald-500/5',
  active: 'border-indigo-500/40 bg-indigo-500/10 ring-1 ring-indigo-500/20',
  planned: 'border-zinc-700/80 bg-zinc-900/40',
};

const PHASE_STATUS_LABEL: Record<RoadmapPhase['status'], string> = {
  shipped: 'Shipped',
  active: 'Active',
  planned: 'Planned',
};

function RoadmapItemRow({ item, showStatus }: { item: RoadmapItem; showStatus: boolean }) {
  const status = item.status ?? (showStatus ? 'planned' : 'done');
  const meta = STATUS_META[status];

  return (
    <li className="py-2.5 border-b border-zinc-800/60 last:border-b-0">
      <div className="flex items-start gap-2">
        {showStatus ? meta.icon : <CheckCircle2 size={11} className="text-emerald-400 shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-medium text-zinc-200">{item.title}</span>
            {showStatus ? (
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
}: {
  section: RoadmapSection;
  showStatus: boolean;
}) {
  const isActive = section.emphasis === 'active';

  return (
    <section
      className={`bg-zinc-950 border rounded-lg overflow-hidden ${
        isActive ? 'border-indigo-500/35 shadow-[0_0_0_1px_rgba(99,102,241,0.08)]' : 'border-zinc-800'
      }`}
    >
      <h3 className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center gap-2 flex-wrap">
        <span className={isActive ? 'text-indigo-300/90' : undefined}>{section.title}</span>
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
      </h3>
      <ul className="px-4">
        {section.items.map((item) => (
          <RoadmapItemRow key={item.id} item={item} showStatus={showStatus} />
        ))}
      </ul>
    </section>
  );
}

function PhaseOverviewStrip() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {ROADMAP_PHASES.map((phase) => (
        <div
          key={phase.id}
          className={`rounded-md border px-3 py-2.5 ${PHASE_STATUS_STYLE[phase.status]}`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-semibold text-zinc-300">
              Phase {phase.number}
            </span>
            <span
              className={`text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                phase.status === 'shipped'
                  ? 'text-emerald-400/90 bg-emerald-500/10 border-emerald-500/25'
                  : phase.status === 'active'
                    ? 'text-indigo-300/90 bg-indigo-500/10 border-indigo-500/30'
                    : 'text-zinc-500 bg-zinc-800/50 border-zinc-700/80'
              }`}
            >
              {PHASE_STATUS_LABEL[phase.status]}
            </span>
          </div>
          <p className="text-[11px] font-medium text-zinc-200 leading-snug">{phase.title}</p>
          <p className="text-[10px] text-zinc-500 leading-relaxed mt-0.5">{phase.summary}</p>
        </div>
      ))}
    </div>
  );
}

export function RoadmapView() {
  const [tab, setTab] = useState<RoadmapTab>('features');

  return (
    <div className="h-full overflow-y-auto bg-zinc-950">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <header className="space-y-3">
          <h1 className="text-lg font-semibold text-zinc-100">Development roadmap</h1>
          <p className="text-[12px] text-zinc-500 leading-relaxed max-w-2xl">
            <span className="text-emerald-400/90 font-medium">Phase 1 shipped</span> — syntax packs,
            IR transpiler, text-shaped graphs,{' '}
            <span className="font-mono text-zinc-400">.vvs/</span> folders, local Go HTTP API, and
            local MCP.{' '}
            <span className="text-indigo-300/90 font-medium">Phase 2 near complete in-repo</span> —
            PostgresStore, GoTrue docker stack, authenticated cloud save/load, AuthButton, MCP JWT;
            remaining: full Supabase VPS compose, GitHub OAuth credentials, daily backups. Full
            strategy in{' '}
            <a
              href="https://github.com/Sheriff99yt/VVS-Web/blob/main/docs/roadmap.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400/90 hover:text-indigo-300 inline-flex items-center gap-0.5"
            >
              roadmap.md
              <ExternalLink size={10} />
            </a>{' '}
            and deployment architecture in{' '}
            <a
              href="https://github.com/Sheriff99yt/VVS-Web/blob/main/docs/deployment.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400/90 hover:text-indigo-300 inline-flex items-center gap-0.5"
            >
              deployment.md
              <ExternalLink size={10} />
            </a>
            .
          </p>
        </header>

        <PhaseOverviewStrip />

        <div className="flex gap-1 p-0.5 bg-zinc-900 border border-zinc-800 rounded-md w-fit">
          <button
            type="button"
            onClick={() => setTab('features')}
            className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${
              tab === 'features'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Shipped (Phase 1)
          </button>
          <button
            type="button"
            onClick={() => setTab('future')}
            className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${
              tab === 'future'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Coming soon
          </button>
        </div>

        <div className="space-y-4">
          {(tab === 'features' ? SHIPPED_FEATURE_SECTIONS : FUTURE_FEATURE_SECTIONS).map((section) => (
            <RoadmapSectionBlock
              key={section.id}
              section={section}
              showStatus={tab === 'future'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
