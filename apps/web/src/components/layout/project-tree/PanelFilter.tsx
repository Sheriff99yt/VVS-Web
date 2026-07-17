'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { FOCUS_PROJECT_TREE_FILTER_EVENT } from '@/lib/uiPreferences';
import { shortcutKeys } from '@/lib/graphShortcuts';

export function PanelFilter({
  value,
  onChange,
  placeholder = 'Filter project…',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusFilter = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => inputRef.current?.focus());
    });
  }, []);

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
      focusFilter();
    };
    const onFocusEvent = () => focusFilter();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener(FOCUS_PROJECT_TREE_FILTER_EVENT, onFocusEvent);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener(FOCUS_PROJECT_TREE_FILTER_EVENT, onFocusEvent);
    };
  }, [focusFilter]);

  const filterTip = `${placeholder} (${shortcutKeys('panel-filter')} or /)`;

  return (
    <Tooltip content={filterTip} placement="bottom" className="flex flex-1 min-w-0">
      <div className="flex items-center gap-1.5 flex-1 min-w-0 h-7 px-2 rounded border border-zinc-800 bg-zinc-900/80 focus-within:border-zinc-600">
        <Search size={12} className="text-zinc-600 shrink-0" />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              if (value) onChange('');
              else inputRef.current?.blur();
            }
          }}
          placeholder={placeholder}
          aria-label="Filter project tree"
          className="flex-1 min-w-0 bg-transparent text-[11px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
        />
        {value ? (
          <Tooltip content="Clear filter" placement="bottom">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onChange('')}
              className="p-0.5 text-zinc-600 hover:text-zinc-300"
              aria-label="Clear filter"
            >
              <X size={11} />
            </button>
          </Tooltip>
        ) : null}
      </div>
    </Tooltip>
  );
}
