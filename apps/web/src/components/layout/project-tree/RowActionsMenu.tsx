'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

export interface RowActionItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

export function RowActionsMenu({
  actions,
}: {
  actions: RowActionItem[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [isOpen]);

  if (actions.length === 0) return null;

  return (
    <div ref={rootRef} className="relative inline-block text-left shrink-0">
      <Tooltip content="More actions" placement="top">
        <button
          type="button"
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-200 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          <MoreVertical size={11} />
        </button>
      </Tooltip>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-24 rounded border border-zinc-800 bg-zinc-950 shadow-xl z-30 py-1">
          {actions.map((act, idx) => (
            <button
              key={idx}
              type="button"
              className={`w-full text-left px-2 py-1 text-[10px] hover:bg-zinc-900 transition-colors ${
                act.danger ? 'text-red-400 hover:text-red-300' : 'text-zinc-300 hover:text-white'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                act.onClick();
              }}
            >
              {act.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
