import React from 'react';
import { ExternalLink } from 'lucide-react';
import {
  RESEARCH_TOPICS,
  type ResearchOption,
  type ResearchTopic,
  type ResearchVerdict,
} from '@/lib/roadmapResearch';

const VERDICT_META: Record<
  ResearchVerdict,
  { label: string; className: string }
> = {
  ship: {
    label: 'Ship this',
    className: 'text-emerald-400/90 bg-emerald-500/10 border-emerald-500/25',
  },
  later: {
    label: 'Later assist',
    className: 'text-amber-400/90 bg-amber-500/10 border-amber-500/25',
  },
  reject: {
    label: 'Reject as product path',
    className: 'text-zinc-400 bg-zinc-800/50 border-zinc-700/80',
  },
};

function OptionCard({ option, index }: { option: ResearchOption; index: number }) {
  const meta = VERDICT_META[option.verdict];
  return (
    <article className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
      <header className="px-4 pt-3 pb-2 border-b border-zinc-800/60 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-zinc-600">
            Option {index + 1}
          </span>
          <span className={`text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${meta.className}`}>
            {meta.label}
          </span>
        </div>
        <h3 className="text-[13px] font-semibold text-zinc-200 tracking-tight">{option.title}</h3>
        <p className="text-[11px] text-zinc-400 leading-relaxed">{option.summary}</p>
      </header>
      <div className="px-4 py-3 space-y-3">
        <p className="text-[11px] text-zinc-500 leading-relaxed">{option.how}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500/80 mb-1.5">
              Pros
            </h4>
            <ul className="text-[11px] text-zinc-500 leading-relaxed list-disc pl-4 space-y-1">
              {option.pros.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
              Cons
            </h4>
            <ul className="text-[11px] text-zinc-500 leading-relaxed list-disc pl-4 space-y-1">
              {option.cons.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}

function TopicBlock({ topic }: { topic: ResearchTopic }) {
  return (
    <section className="space-y-4">
      <div className="space-y-1.5">
        <h2 className="text-[15px] font-semibold text-zinc-100 tracking-tight">{topic.title}</h2>
        <p className="text-[12px] text-zinc-400 leading-relaxed">{topic.subtitle}</p>
        <p className="text-[11px] text-zinc-500 leading-relaxed">{topic.problem}</p>
      </div>

      <div className="rounded-lg border border-zinc-700/80 bg-zinc-900/40 px-4 py-3 space-y-1.5">
        <p className="text-[11px] font-medium text-zinc-300">Constraints that every option has to survive</p>
        <ul className="text-[11px] text-zinc-500 leading-relaxed list-disc pl-4 space-y-0.5">
          {topic.constraints.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        {topic.options.map((option, index) => (
          <OptionCard key={option.id} option={option} index={index} />
        ))}
      </div>

      <div className="rounded-lg border border-indigo-500/35 bg-indigo-500/5 px-4 py-3 space-y-1.5">
        <p className="text-[11px] font-medium text-indigo-300/90">Recommendation</p>
        <p className="text-[11px] text-zinc-400 leading-relaxed">{topic.recommendation}</p>
      </div>

      <div className="space-y-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
          First slice
        </h3>
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3">
          <ol className="text-[11px] text-zinc-500 leading-relaxed list-decimal pl-4 space-y-1">
            {topic.firstSlice.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
          Sources
        </h3>
        <ul className="text-[11px] leading-relaxed space-y-1">
          {topic.sources.map((source) => (
            <li key={source.href}>
              <a
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400/90 hover:text-indigo-300 inline-flex items-center gap-1"
              >
                {source.label}
                <ExternalLink size={10} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function RoadmapResearchPanel() {
  return (
    <div className="space-y-10">
      {RESEARCH_TOPICS.map((topic) => (
        <TopicBlock key={topic.id} topic={topic} />
      ))}
    </div>
  );
}
