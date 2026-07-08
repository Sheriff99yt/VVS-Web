'use client';

import React from 'react';
import { Layers } from 'lucide-react';

export function CrossOverArchitecturePanel() {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <Layers size={14} className="text-zinc-500 shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[11px] font-semibold text-zinc-300">Cross Over Architecture</p>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium border border-zinc-700 bg-zinc-900 text-zinc-500 uppercase tracking-wide">
              Planned
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Future mode: author one graph with node effectiveness indicators, then export equivalent
            code across multiple targets without hidden portability surprises.
          </p>
        </div>
      </div>

      <div className="rounded border border-zinc-800 bg-zinc-900/40 px-2.5 py-2 space-y-1.5">
        <p className="text-[10px] text-zinc-400 font-medium">Shipped today</p>
        <ul className="text-[10px] text-zinc-500 space-y-0.5 list-disc list-inside leading-relaxed">
          <li>Single codegen target (selector above)</li>
          <li>Portability warnings per target language</li>
          <li>Canvas = source of truth for all declarations</li>
        </ul>
      </div>

      <div className="rounded border border-indigo-500/15 bg-indigo-500/5 px-2.5 py-2 space-y-1.5">
        <p className="text-[10px] text-indigo-200/80 font-medium">COA scope (not yet enabled)</p>
        <ul className="text-[10px] text-zinc-500 space-y-0.5 list-disc list-inside leading-relaxed">
          <li>Global node effectiveness (dim / badge per language)</li>
          <li>Multi-target export from one graph</li>
          <li>Authoring limits across a language set</li>
        </ul>
        <p className="text-[9px] text-zinc-600 leading-relaxed">
          Spec: <span className="text-zinc-500">docs/design/unified_symbol_model.md</span>
        </p>
      </div>
    </div>
  );
}
