'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';

export function PanelFilter({
  value,
  onChange,
  placeholder = 'Filter project…',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(() => value.trim().length > 0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value.trim()) setOpen(true);
  }, [value]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      e.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => inputRef.current?.focus());
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const collapse = useCallback(() => {
    if (!value.trim()) {
      setOpen(false);
      onChange('');
    }
  }, [onChange, value]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className="flex items-center justify-center w-7 h-6 rounded border border-zinc-800 bg-zinc-900/80 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors"
        title={`${placeholder} (/)`}
        aria-label="Filter project tree"
      >
        <Search size={12} />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 flex-1 min-w-0">
      <Search size={12} className="text-zinc-600 shrink-0" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={collapse}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            onChange('');
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        aria-label="Filter project tree"
        className="flex-1 min-w-0 bg-transparent text-[11px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
      />
      {value ? (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange('')}
          className="p-0.5 text-zinc-600 hover:text-zinc-300"
          title="Clear filter"
          aria-label="Clear filter"
        >
          <X size={11} />
        </button>
      ) : null}
    </div>
  );
}
