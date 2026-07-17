'use client';

import React, { useEffect, useRef } from 'react';
import { paneMenuPosition } from '@/lib/paneMenuPosition';
import { Tooltip } from '@/components/ui/Tooltip';

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
  const rootRef = useRef<HTMLDivElement>(null);
  const pos = paneMenuPosition(x, y, 220, items.length * 36 + 8);
  const dividerSet = new Set(dividersBefore);

  useEffect(() => {
    // Skip the opening pointer (drop / click that opened us).
    let armed = false;
    const armId = window.setTimeout(() => {
      armed = true;
    }, 0);

    const onPointerDown = (event: PointerEvent) => {
      if (!armed) return;
      const root = rootRef.current;
      if (root && root.contains(event.target as Node)) return;
      onClose();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(armId);
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={rootRef}
      className="fixed z-[60] bg-zinc-900 border border-zinc-700 rounded shadow-xl overflow-hidden text-xs text-white min-w-[180px]"
      style={{ top: pos.y, left: pos.x }}
      onClick={(e) => e.stopPropagation()}
      role="menu"
    >
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && dividerSet.has(item.id) ? (
            <div className="h-px bg-zinc-800 w-full" />
          ) : null}
          <Tooltip
            content={item.title}
            placement="right"
            disabled={!item.title}
            className="block w-full min-w-0"
          >
            <button
              type="button"
              role="menuitem"
              className="w-full text-left px-4 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-zinc-800"
              disabled={item.disabled}
              onClick={() => {
                item.onClick();
                onClose();
              }}
            >
              {item.label}
            </button>
          </Tooltip>
        </React.Fragment>
      ))}
    </div>
  );
}
