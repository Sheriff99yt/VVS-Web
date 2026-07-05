'use client';

import React, { useCallback } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { GraphWheelShield } from '@/components/graph/GraphWheelShield';
import { PANEL_SCROLL_ATTR } from '@/components/graph/useBlockCanvasWheel';
import { clampDetailsPanelHeight } from '@/lib/uiPreferences';

export type FloatingPanelCorner = 'top-right' | 'bottom-right';

interface FloatingPanelShellProps {
  title: string;
  titleIcon?: React.ReactNode;
  corner?: FloatingPanelCorner;
  expanded: boolean;
  onToggleExpanded: () => void;
  onClose?: () => void;
  children: React.ReactNode;
  /** Width when compact */
  widthClass?: string;
  /** Max height when expanded (ignored when heightPx is set) */
  maxHeightClass?: string;
  headerExtra?: React.ReactNode;
  /** Fixed panel height in px — enables bottom resize handle when onHeightChange is set */
  heightPx?: number;
  onHeightChange?: (height: number) => void;
}

const CORNER_CLASS: Record<FloatingPanelCorner, string> = {
  'top-right': 'top-2.5 right-2.5',
  'bottom-right': 'bottom-2.5 right-2.5',
};

export function FloatingPanelShell({
  title,
  titleIcon,
  corner = 'top-right',
  expanded,
  onToggleExpanded,
  onClose,
  children,
  widthClass = 'w-[min(232px,calc(100%-20px))]',
  maxHeightClass = 'max-h-[min(360px,58vh)]',
  headerExtra,
  heightPx,
  onHeightChange,
}: FloatingPanelShellProps) {
  const resizable = heightPx != null && onHeightChange != null;

  const startResize = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!onHeightChange || heightPx == null) return;
      event.preventDefault();
      event.stopPropagation();

      const startY = event.clientY;
      const startHeight = heightPx;

      const onMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientY - startY;
        onHeightChange(clampDetailsPanelHeight(startHeight + delta));
      };

      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    },
    [heightPx, onHeightChange]
  );

  const heightStyle = heightPx != null ? { height: heightPx } : undefined;
  const heightClass =
    heightPx != null ? 'h-auto' : expanded ? maxHeightClass : 'max-h-[148px]';

  return (
    <GraphWheelShield
      className={`absolute ${CORNER_CLASS[corner]} z-[45] ${widthClass} ${heightClass} flex flex-col bg-zinc-950/96 border border-zinc-800 rounded-md overflow-hidden pointer-events-auto`}
      style={heightStyle}
    >
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-zinc-800/80 shrink-0 min-h-[28px]">
        {titleIcon ? <span className="text-zinc-500 shrink-0">{titleIcon}</span> : null}
        <span className="text-[10px] font-medium text-zinc-300 truncate flex-1">{title}</span>
        {headerExtra}
        <button
          type="button"
          onClick={onToggleExpanded}
          className="p-0.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80"
          title={expanded ? 'Compact view' : 'Expanded view'}
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-0.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80"
            title="Close"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <div
        className="flex-1 overflow-y-auto px-2 py-1.5 min-h-0 overscroll-contain"
        {...{ [PANEL_SCROLL_ATTR]: '' }}
      >
        {children}
      </div>
      {resizable ? (
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize panel"
          className="h-2 shrink-0 cursor-ns-resize flex items-center justify-center border-t border-zinc-800/60 hover:bg-zinc-800/40 active:bg-indigo-500/20"
          onPointerDown={startResize}
        >
          <span className="w-8 h-0.5 rounded-full bg-zinc-700" />
        </div>
      ) : null}
    </GraphWheelShield>
  );
}
