'use client';

import React from 'react';

export function CanvasStatusBadge({
  label,
  ok,
  onClick,
  emphasize = false,
}: {
  label: string;
  ok: boolean;
  onClick: (e: React.MouseEvent) => void;
  /** Keep missing badge visible when the parent row is selected (not only on hover). */
  emphasize?: boolean;
}) {
  if (ok) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="shrink-0 w-4 h-4 inline-flex items-center justify-center rounded text-[9px] leading-none border opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500/10 text-emerald-400/90 border-emerald-500/25 hover:bg-emerald-500/20"
        title={`${label} on canvas — click to focus`}
        aria-label={`${label} on canvas`}
      >
        ✓
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-1 py-0.5 rounded text-[8px] border bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 ${
        emphasize ? 'ring-1 ring-amber-500/30' : ''
      }`}
      title={`Missing ${label} on canvas — click to add or focus`}
    >
      ⚠ {label}
    </button>
  );
}
