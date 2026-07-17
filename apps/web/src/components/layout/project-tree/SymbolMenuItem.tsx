'use client';

import React from 'react';

/** Shared row for Project-tree symbol context menus (label + optional shortcut). */
export function SymbolMenuItem({
  label,
  shortcut,
  danger,
  onClick,
}: {
  label: string;
  shortcut?: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={`w-full flex items-center gap-2 text-left px-2.5 py-1.5 text-[11px] hover:bg-zinc-800 ${
        danger
          ? 'text-red-300 hover:text-red-200'
          : 'text-zinc-200'
      }`}
      onClick={onClick}
    >
      <span className="flex-1 min-w-0">{label}</span>
      {shortcut ? (
        <span className="text-[9px] text-zinc-600 shrink-0 tabular-nums">{shortcut}</span>
      ) : null}
    </button>
  );
}
