'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
  group?: string;
}

export interface SearchableSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  emptyLabel?: string;
  className?: string;
  /** Minimum options before search field appears (default: always searchable). */
  searchMinOptions?: number;
  variant?: 'default' | 'compact';
  menuClassName?: string;
}

export function SearchableSelect({
  id: idProp,
  value,
  onChange,
  options,
  placeholder = 'Select…',
  disabled = false,
  searchable = true,
  emptyLabel = 'No matches',
  className = '',
  searchMinOptions = 0,
  variant = 'default',
  menuClassName = '',
}: SearchableSelectProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((o) => o.value === value);

  const showSearch = searchable && options.length > searchMinOptions;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const hay = `${o.label} ${o.description ?? ''} ${o.group ?? ''} ${o.value}`.toLowerCase();
      return hay.includes(q);
    });
  }, [options, query]);

  const groups = useMemo(() => {
    const map = new Map<string, SearchableSelectOption[]>();
    for (const option of filtered) {
      const key = option.group ?? '';
      const list = map.get(key) ?? [];
      list.push(option);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [filtered]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery('');
  };

  const isCompact = variant === 'compact';

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded text-white focus:outline-none focus:border-zinc-600 disabled:opacity-50 nowheel nopan nodrag ${
          isCompact
            ? 'gap-1 px-1.5 h-6 text-[10px] font-mono'
            : 'gap-2 px-2.5 py-1.5 text-[11px]'
        }`}
        onWheel={(e) => e.stopPropagation()}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate text-left ${selected ? 'text-zinc-100' : 'text-zinc-500'}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={isCompact ? 10 : 12} className="text-zinc-500 shrink-0" />
      </button>

      {open ? (
        <div
          className={`absolute z-50 mt-1 w-full min-w-[12rem] max-h-56 overflow-hidden rounded border border-zinc-700 bg-zinc-950 shadow-lg flex flex-col ${menuClassName}`}
        >
          {showSearch ? (
            <div className="flex items-center gap-1.5 border-b border-zinc-800 px-2 py-1.5">
              <Search size={12} className="text-zinc-500 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="flex-1 bg-transparent text-[11px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                autoFocus
                onWheel={(e) => e.stopPropagation()}
              />
            </div>
          ) : null}
          <div className="overflow-y-auto flex-1 py-1" role="listbox">
            {filtered.length === 0 ? (
              <p className="px-2.5 py-2 text-[10px] text-zinc-600">{emptyLabel}</p>
            ) : (
              groups.map(([group, items]) => (
                <div key={group || '__default'}>
                  {group ? (
                    <p className="px-2.5 pt-1.5 pb-0.5 text-[9px] font-semibold uppercase tracking-widest text-zinc-600">
                      {group}
                    </p>
                  ) : null}
                  {items.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={option.value === value}
                      onClick={() => pick(option.value)}
                      className={`w-full text-left px-2.5 py-1.5 text-[11px] hover:bg-zinc-900 ${
                        option.value === value ? 'bg-indigo-500/10 text-indigo-200' : 'text-zinc-200'
                      }`}
                    >
                      <span className="block truncate">{option.label}</span>
                      {option.description ? (
                        <span className="block truncate text-[10px] text-zinc-500">{option.description}</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
