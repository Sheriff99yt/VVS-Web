'use client';

import React, { useState } from 'react';
import { CheckCircle2, Circle, CircleDashed, ExternalLink } from 'lucide-react';
import {
  computeRoadmapProgress,
  FUTURE_FEATURE_SECTIONS,
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

function SymbolVocabularyCallout() {
  return (
    <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 space-y-2">
      <p className="text-[11px] font-medium text-emerald-300/90">
        Symbol vocabulary &amp; declare → implement → invoke — largely done
      </p>
      <ul className="text-[11px] text-zinc-500 space-y-1">
        <li className="flex items-start gap-2">
          <CheckCircle2 size={11} className="text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <span className="text-zinc-300">Declare</span> member-chain slots ·{' '}
            <span className="text-zinc-300">Call</span> / <span className="text-zinc-300">Dispatch</span>{' '}
            invoke sites · canvas drop menus and tree badges for declare + handler + define
          </span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 size={11} className="text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Codegen splits <span className="text-zinc-300">declare</span> (native or{' '}
            <span className="font-mono text-zinc-400"># Declare …</span> placeholder) from{' '}
            <span className="text-zinc-300">implement</span> (handler / function body); event labels
            use the name you set — no forced <span className="font-mono text-zinc-400">On</span> prefix
          </span>
        </li>
        <li className="flex items-start gap-2">
          <CircleDashed size={11} className="text-amber-400 shrink-0 mt-0.5" />
          <span>
            Spawn catalog role chips (Declare / Handlers / Calls) — remaining Phase D polish
          </span>
        </li>
        <li className="flex items-start gap-2">
          <Circle size={11} className="text-zinc-500 shrink-0 mt-0.5" />
          <span>
            Cross Over Architecture deferred — single-target portability warnings today; node
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

function ClassDeclareFidelityCallout() {
  return (
    <div className="rounded-lg border border-indigo-500/25 bg-indigo-500/5 px-4 py-3 space-y-2">
      <p className="text-[11px] font-medium text-indigo-300/90">
        Class declare fidelity — shipped (July 2026)
      </p>
      <ul className="text-[11px] text-zinc-500 space-y-1">
        <li className="flex items-start gap-2">
          <CheckCircle2 size={11} className="text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <span className="text-zinc-300">Declare Class</span> on canvas required when a class has
            symbols or member defines — blank class with neither passes analysis
          </span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 size={11} className="text-emerald-400 shrink-0 mt-0.5" />
          <span>
            No phantom <span className="font-mono text-zinc-400">class Name:</span> from symbol table
            — shell emits only from <span className="font-mono text-zinc-400">class_define</span>
          </span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 size={11} className="text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Delete class Declare → preview keeps member body order;{' '}
            <span className="font-mono text-zinc-400">DEFINE_NODE_MISSING</span> blocks Generate;
            preview-only banner in code panel
          </span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 size={11} className="text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Project tree Declare badge + restore; dual-write on class create (
            <span className="font-mono text-zinc-400">addClassWithDefine</span>)
          </span>
        </li>
      </ul>
    </div>
  );
}

function GdScriptCallout() {
  return (
    <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/5 px-4 py-3 space-y-2">
      <p className="text-[11px] font-medium text-cyan-300/90">
        Milestone 3 — language platform closed
      </p>
      <ul className="text-[11px] text-zinc-500 space-y-1">
        <li className="flex items-start gap-2">
          <CheckCircle2 size={11} className="text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Seven pack-driven families: Python, JS, C++, Verse, GDScript, Rust, C# — 98 Rosetta goldens
          </span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 size={11} className="text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Godot env pack (<span className="font-mono text-zinc-400">env.gdscript.godot-game</span>) + portability profiles
          </span>
        </li>
        <li className="flex items-start gap-2">
          <CircleDashed size={11} className="text-amber-400 shrink-0 mt-0.5" />
          <span>
            Next: usability &amp; workflow standards per{' '}
            <span className="font-mono text-zinc-400">terms_refactor_plan.md</span>
          </span>
        </li>
      </ul>
    </div>
  );
}

function PhaseOverviewStrip() {
  const { phases, overallPercent } = computeRoadmapProgress();

  const statusDot = (status: RoadmapPhase['status']) =>
    status === 'shipped'
      ? 'bg-emerald-500'
      : status === 'active'
        ? 'bg-indigo-400'
        : 'bg-zinc-600';

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-zinc-800/80 bg-zinc-900/30 px-3 py-2">
      <div className="flex items-center gap-2.5 flex-wrap min-w-0">
        <span className="text-[10px] uppercase tracking-wider text-zinc-600 shrink-0">Phases</span>
        {phases.map((progress) => (
          <span
            key={progress.phase.id}
            className="inline-flex items-center gap-1 text-[10px] text-zinc-500"
            title={`Phase ${progress.phase.number}: ${progress.phase.title} (${progress.percent}%)`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot(progress.phase.status)}`} />
            <span className="tabular-nums">{progress.phase.number}</span>
          </span>
        ))}
      </div>
      <span className="text-[10px] tabular-nums text-zinc-500 shrink-0">{overallPercent}%</span>
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
            <span className="text-zinc-300">declare → implement → invoke</span> codegen (member
            declares, comment placeholders, separate handler bodies),{' '}
            <span className="text-zinc-300">canvas-as-source-of-truth</span> (every export line maps
            to a graph node; class Declare fidelity shipped July 2026), graph-as-canvas multi-class
            model,{' '}
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
            — community library backend, browsing, install flow, and search.{' '}
            <span className="text-amber-400/90 font-medium">Phase 6 is active</span>{' '}
            — <span className="text-zinc-300">Milestone 3</span> (language platform) is closed:
            seven pack-driven codegen families and 98 Rosetta goldens. Remaining Phase 6: performance,
            optional Rust/C# console env packs, mobile UX, enterprise. Next major track: usability
            &amp; workflow standards. Deployment and service work now live in a separate{' '}
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

        <ClassDeclareFidelityCallout />

        <GdScriptCallout />

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
