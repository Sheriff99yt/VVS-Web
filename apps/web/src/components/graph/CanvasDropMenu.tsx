'use client';

import React from 'react';
import { paneMenuPosition } from '@/lib/paneMenuPosition';

export interface CanvasDropMenuItem {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}

interface CanvasDropMenuProps {
  x: number;
  y: number;
  items: CanvasDropMenuItem[];
  dividersBefore?: string[];
  onClose: () => void;
}

export function CanvasDropMenu({
  x,
  y,
  items,
  dividersBefore = [],
  onClose,
}: CanvasDropMenuProps) {
  const pos = paneMenuPosition(x, y, 220, items.length * 36 + 8);
  const dividerSet = new Set(dividersBefore);

  return (
    <div
      className="fixed z-[60] bg-zinc-900 border border-zinc-700 rounded shadow-xl overflow-hidden text-xs text-white min-w-[180px]"
      style={{ top: pos.y, left: pos.x }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && dividerSet.has(item.id) ? (
            <div className="h-px bg-zinc-800 w-full" />
          ) : null}
          <button
            type="button"
            className="w-full text-left px-4 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-zinc-800"
            disabled={item.disabled}
            title={item.title}
            onClick={() => {
              item.onClick();
              onClose();
            }}
          >
            {item.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
