'use client';

import React from 'react';

export function CanvasStatusBadge({
  label,
  ok,
  onClick,
}: {
  label: string;
  ok: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  if (ok) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="shrink-0 px-1 py-0.5 rounded text-[8px] border opacity-0 group-hover:opacity-100 bg-emerald-500/10 text-emerald-400/90 border-emerald-500/25 hover:bg-emerald-500/20 transition-opacity"
        title={`${label} on canvas`}
      >
        ✓ {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 px-1 py-0.5 rounded text-[8px] border bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
      title={`Add missing ${label} on canvas`}
    >
      ⚠ {label}
    </button>
  );
}
