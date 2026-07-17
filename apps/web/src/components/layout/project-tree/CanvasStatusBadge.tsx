'use client';

import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';

export function CanvasStatusBadge({
  label,
  ok,
  onClick,
  emphasize = false,
  /** Compact corner pip for grid tiles — does not compete with the name. */
  variant = 'chip',
}: {
  label: string;
  ok: boolean;
  onClick: (e: React.MouseEvent) => void;
  /** Keep missing badge visible when the parent row is selected (not only on hover). */
  emphasize?: boolean;
  variant?: 'chip' | 'pip';
}) {
  if (ok) {
    if (variant === 'pip') {
      return (
        <button
          type="button"
          onClick={onClick}
          className="shrink-0 w-3.5 h-3.5 inline-flex items-center justify-center rounded-sm text-emerald-400/90 hover:bg-emerald-500/15 transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          title={`${label} on canvas — click to focus`}
          aria-label={`${label} on canvas`}
        >
          <Check size={9} strokeWidth={2.5} />
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={onClick}
        className="shrink-0 w-4 h-4 inline-flex items-center justify-center rounded text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        title={`${label} on canvas — click to focus`}
        aria-label={`${label} on canvas`}
      >
        <Check size={10} strokeWidth={2.5} />
      </button>
    );
  }

  if (variant === 'pip') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`shrink-0 w-3.5 h-3.5 inline-flex items-center justify-center rounded-sm bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors ${
          emphasize ? 'ring-1 ring-amber-500/40' : ''
        }`}
        title={`Missing ${label} on canvas — click to add or focus`}
        aria-label={`Missing ${label}`}
      >
        <AlertTriangle size={8} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-0.5 h-4 px-1 rounded text-[8px] font-medium uppercase tracking-wide bg-amber-500/10 text-amber-300 border border-amber-500/25 hover:bg-amber-500/20 transition-colors ${
        emphasize ? 'ring-1 ring-amber-500/35' : ''
      }`}
      title={`Missing ${label} on canvas — click to add or focus`}
    >
      <AlertTriangle size={8} className="shrink-0" />
      {label}
    </button>
  );
}
