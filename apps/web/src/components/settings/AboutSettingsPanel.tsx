'use client';

import React from 'react';
import { PRODUCT_NAME } from '@/lib/productName';

export function AboutSettingsPanel() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-zinc-100">{PRODUCT_NAME}</p>
        <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
          Visual graphs that generate real, importable source code. Client-first — edit locally,
          export to git, run anywhere.
        </p>
      </div>
      <div className="rounded border border-zinc-800 bg-zinc-900/40 px-3 py-2.5 space-y-1.5 text-[10px] text-zinc-600">
        <p>
          <span className="text-zinc-500">Live preview:</span>{' '}
          <a
            href="https://sheriff99yt.github.io/VVS-Web/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400/90 hover:text-indigo-300"
          >
            sheriff99yt.github.io/VVS-Web
          </a>
        </p>
        <p>
          <span className="text-zinc-500">Docs:</span> roadmap and fidelity specs ship in-repo
          under <code className="text-zinc-500">docs/</code>.
        </p>
      </div>
    </div>
  );
}
