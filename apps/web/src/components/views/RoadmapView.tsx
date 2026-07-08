'use client';

import React, { useState } from 'react';
import { CheckCircle2, Circle, CircleDashed, ExternalLink } from 'lucide-react';
import {
  computeRoadmapProgress,
  FUTURE_FEATURE_SECTIONS,
  SHIPPED_FEATURE_SECTIONS,
  type PhaseProgress,
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

const PHASE_STATUS_STYLE: Record<RoadmapPhase['status'], string> = {
  shipped: 'border-emerald-500/30 bg-emerald-500/5',
  active: 'border-indigo-500/40 bg-indigo-500/10 ring-1 ring-indigo-500/20',
  planned: 'border-zinc-700/80 bg-zinc-900/40',
};

const PHASE_STATUS_LABEL: Record<RoadmapPhase['status'], string> = {
  shipped: 'Complete',
  active: 'Active',
  planned: 'Planned',
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

function SymbolVocabularyCallout() {
  return (
    <div className="rounded-lg border border-sky-500/25 bg-sky-500/5 px-4 py-3 space-y-2">
      <p className="text-[11px] font-medium text-sky-300/90">
        Symbol vocabulary realignment — in progress (Phase 3)
      </p>
      <ul className="text-[11px] text-zinc-500 space-y-1">
        <li className="flex items-start gap-2">
          <CircleDashed size={11} className="text-amber-400 shrink-0 mt-0.5" />
          <span>
            <span className="text-zinc-300">Declare</span> variables, functions, events &amp; classes on the member chain
          </span>
        </li>
        <li className="flex items-start gap-2">
          <CircleDashed size={11} className="text-amber-400 shrink-0 mt-0.5" />
          <span>
            <span className="text-zinc-300">On</span> event handlers ·{' '}
            <span className="text-zinc-300">Call</span> / <span className="text-zinc-300">Dispatch</span>{' '}
            at invoke sites — <span className="font-mono text-zinc-400">kindId</span>s unchanged
          </span>
        </li>
        <li className="flex items-start gap-2">
          <Circle size={11} className="text-zinc-500 shrink-0 mt-0.5" />
          <span>
            Cross Over Architecture deferred — single-target portability warnings in place; node
            effectiveness indicators planned next
          </span>
        </li>
      </ul>
    </div>
  );
}

function EventFidelityCallout() {
  return (
    <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 space-y-2">
      <p className="text-[11px] font-medium text-emerald-300/90">
        Event fidelity refactor — done (Phase 1)
      </p>
      <ul className="text-[11px] text-zinc-500 space-y-1">
        <li className="flex items-start gap-2">
          <CheckCircle2 size={11} className="text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <span className="text-zinc-300">Dispatch</span> — visible direct handler calls (
            <span className="font-mono text-zinc-400">self.on_*()</span>) from{' '}
            <span className="font-mono text-zinc-400">event_dispatch</span> nodes
          </span>
        </li>
        <li className="flex items-start gap-2">
          <Circle size={11} className="text-rose-400/80 shrink-0 mt-0.5" />
          <span>
            <span className="text-zinc-300">Emit / Subscribe</span> — rejected; hidden runtime
            blocked via{' '}
            <span className="font-mono text-zinc-400">HIDDEN_EVENT_RUNTIME_UNSUPPORTED</span> (no
            spawn catalog entry)
          </span>
        </li>
        <li className="flex items-start gap-2">
          <Circle size={11} className="text-rose-400/80 shrink-0 mt-0.5" />
          <span>
            No transpiler <span className="font-mono text-zinc-400">_emit</span> /{' '}
            <span className="font-mono text-zinc-400">_subscribe</span> injection — multicast
            conflicts surface{' '}
            <span className="font-mono text-zinc-400">MULTICAST_REQUIRES_SUBSCRIBE</span>, not
            hidden helpers
          </span>
        </li>
      </ul>
    </div>
  );
}

function PhaseProgressBar({ progress }: { progress: PhaseProgress }) {
  const { counts } = progress;
  if (counts.total === 0) {
    return (
      <div
        className="h-1.5 rounded-full bg-zinc-800"
        title="No tracked checklist items for this phase yet"
      />
    );
  }

  const doneWidth = (counts.done / counts.total) * 100;
  const partialWidth = (counts.partial / counts.total) * 100;

  return (
    <div
      className="h-1.5 rounded-full bg-zinc-800 overflow-hidden flex"
      title={`${counts.done} done · ${counts.partial} in progress · ${counts.planned} planned`}
    >
      {doneWidth > 0 ? (
        <div className="h-full bg-emerald-500/90" style={{ width: `${doneWidth}%` }} />
      ) : null}
      {partialWidth > 0 ? (
        <div className="h-full bg-amber-500/80" style={{ width: `${partialWidth}%` }} />
      ) : null}
    </div>
  );
}

function PhaseProgressCard({ progress }: { progress: PhaseProgress }) {
  const { phase, counts, percent } = progress;

  return (
    <div className={`rounded-md border px-3 py-2.5 ${PHASE_STATUS_STYLE[phase.status]}`}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-semibold text-zinc-300">Phase {phase.number}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] tabular-nums text-zinc-400">{percent}%</span>
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
      </div>
      <p className="text-[11px] font-medium text-zinc-200 leading-snug">{phase.title}</p>
      <div className="mt-2">
        <PhaseProgressBar progress={progress} />
      </div>
      {counts.total > 0 ? (
        <p className="text-[9px] text-zinc-600 mt-1.5 tabular-nums">
          <span className="text-emerald-500/90">{counts.done} done</span>
          {counts.partial > 0 ? (
            <>
              {' · '}
              <span className="text-amber-500/90">{counts.partial} in progress</span>
            </>
          ) : null}
          {counts.planned > 0 ? (
            <>
              {' · '}
              <span className="text-zinc-500">{counts.planned} planned</span>
            </>
          ) : null}
        </p>
      ) : (
        <p className="text-[9px] text-zinc-600 mt-1.5">{phase.summary}</p>
      )}
    </div>
  );
}

function PhaseTimelineConnector({ active }: { active: boolean }) {
  return (
    <div
      className={`hidden lg:block flex-1 min-w-[8px] h-px self-[1.65rem] ${
        active ? 'bg-indigo-500/40' : 'bg-zinc-700/80'
      }`}
      aria-hidden
    />
  );
}

function PhaseOverviewStrip() {
  const { phases, crossCutting, overallPercent } = computeRoadmapProgress();

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Phase progress
          </h2>
          <p className="text-[10px] text-zinc-600 mt-0.5">
            Checklist completion per phase (partial items count as 50%)
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-zinc-600">Overall</p>
          <p className="text-lg font-semibold tabular-nums text-zinc-200">{overallPercent}%</p>
        </div>
      </div>

      <div className="hidden lg:flex items-start">
        {phases.map((progress, index) => (
          <React.Fragment key={progress.phase.id}>
            <div className="w-[calc((100%-5*1.5rem)/6)] min-w-0 shrink-0">
              <PhaseProgressCard progress={progress} />
            </div>
            {index < phases.length - 1 ? (
              <PhaseTimelineConnector active={progress.phase.status === 'shipped' || progress.phase.status === 'active'} />
            ) : null}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-2">
        {phases.map((progress) => (
          <PhaseProgressCard key={progress.phase.id} progress={progress} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-zinc-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-emerald-500/90" aria-hidden />
          Done
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-amber-500/80" aria-hidden />
          In progress
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-zinc-800 border border-zinc-700" aria-hidden />
          Planned
        </span>
        {crossCutting.total > 0 ? (
          <span className="text-zinc-500">
            + {crossCutting.total} cross-phase items ({crossCutting.done} done, {crossCutting.partial}{' '}
            in progress, {crossCutting.planned} planned) in Coming soon
          </span>
        ) : null}
      </div>
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
            <span className="text-emerald-400/90 font-medium">Phase 1 closed</span> — syntax packs,
            IR transpiler, <span className="text-zinc-300">text-shaped graphs</span> (fidelity
            alignment complete July 2026),{' '}
            <span className="text-zinc-300">canvas-as-source-of-truth codegen</span> (every export line
            maps to a graph node), graph-as-canvas multi-class model,{' '}
            <span className="font-mono text-zinc-400">.vvs/</span> folders, local Go HTTP API, and
            local MCP. Event model:{' '}
            <span className="text-emerald-400/80">Dispatch</span> (direct{' '}
            <span className="font-mono text-zinc-400">self.on_*()</span> calls) is done;{' '}
            <span className="text-rose-400/80">Emit/Subscribe</span> hidden-runtime nodes are
            rejected.{' '}
            <span className="text-indigo-300/90 font-medium">Phases 1 and 2 are closed</span>{' '}
            — PostgresStore, JWT auth, authenticated cloud save/load, AuthButton, and MCP auth are
            done.{' '}
            <span className="text-indigo-300/90 font-medium">Phase 3 is the current product focus</span>{' '}
            — community library backend, browsing, install flow, and search. Deployment and service work
            now live in a separate{' '}
            <span className="text-zinc-300">Deployment &amp; operations</span> track: VPS compose,
            GitHub OAuth production wiring, backups, and offline sync. Full
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

        <EventFidelityCallout />

        <SymbolVocabularyCallout />

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
            Done (Phases 1-2)
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
            Open tracks
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
