import type { SectionViewMode } from './constants';

/** Shared Tailwind class strings for the left explorer panel. */
export const explorerInputClass =
  'w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-zinc-600';

export const explorerSelectClass =
  'w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-zinc-600';

export const explorerLabelClass = 'block text-[9px] text-zinc-500 uppercase tracking-wide';

export const explorerBtnPrimaryClass =
  'w-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-[11px] px-2 py-1 rounded border border-indigo-500/30';

export const explorerBtnSecondaryClass =
  'w-full bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] px-2 py-1 rounded';

export const explorerBtnCompactPrimaryClass =
  'px-2 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 hover:bg-indigo-500/30';

export const explorerBtnCompactCancelClass =
  'px-2 py-1 rounded text-[10px] text-zinc-500 border border-zinc-800 hover:text-zinc-300';

export const explorerRowActionClass =
  'p-0.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-200';

export const explorerRowDeleteClass =
  'p-0.5 hover:bg-zinc-700 rounded text-zinc-500 hover:text-red-400';

export function gridTileClass(
  active: boolean,
  opts?: { dropTarget?: boolean; dragging?: boolean; interactive?: boolean }
): string {
  const interactive = opts?.interactive !== false;
  return [
    'flex items-center gap-1 min-h-[22px] px-1.5 py-0.5 rounded border select-none group relative',
    interactive ? 'cursor-pointer' : '',
    active
      ? 'bg-indigo-500/15 border-indigo-500/35 text-indigo-100'
      : 'border-zinc-800/80 hover:bg-zinc-900/70 text-zinc-300',
    opts?.dropTarget ? 'ring-1 ring-inset ring-indigo-500/40' : '',
    opts?.dragging ? 'opacity-40' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function listRowClass(
  active: boolean,
  opts?: { dropTarget?: boolean; dragging?: boolean; depthClass?: string }
): string {
  return [
    'flex items-center gap-1 py-0.5 pr-2 select-none group cursor-pointer',
    opts?.depthClass ?? '',
    active ? 'bg-indigo-500/10 text-indigo-100' : 'hover:bg-zinc-900/60 text-zinc-300',
    opts?.dropTarget ? 'ring-1 ring-inset ring-indigo-500/40 bg-indigo-500/5' : '',
    opts?.dragging ? 'opacity-40' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function bindingChipClass(selected: boolean): string {
  return `px-1.5 py-0.5 text-[9px] rounded border ${
    selected
      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200'
      : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
  } disabled:opacity-40`;
}

export function sectionBodyClass(viewMode: SectionViewMode): string {
  // Auto-fit columns as the explorer panel resizes (~7rem min tile keeps names readable).
  return viewMode === 'grid'
    ? 'grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-1 px-1.5 pb-1.5'
    : 'pb-1';
}
