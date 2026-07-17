'use client';

import React, { useCallback, useRef } from 'react';
import { ChevronDown, ChevronUp, Pin, PinOff, X } from 'lucide-react';
import { GraphWheelShield } from '@/components/graph/GraphWheelShield';
import { PANEL_SCROLL_ATTR } from '@/components/graph/useBlockCanvasWheel';
import {
  clampDetailsPanelHeight,
  clampFloatingPanelOffsets,
  clampFloatingPanelTopOffsets,
  clampFloatingPanelWidth,
} from '@/lib/uiPreferences';
import { Tooltip } from '@/components/ui/Tooltip';

export type FloatingPanelCorner = 'top-right' | 'bottom-right';

interface FloatingPanelShellProps {
  title: string;
  /** One-line hint under/beside title — used in compact (header-only) mode */
  subtitle?: React.ReactNode;
  titleIcon?: React.ReactNode;
  corner?: FloatingPanelCorner;
  /** Content is in expanded (full) mode */
  expanded: boolean;
  /** Details panel: pin keeps expanded without hover (persisted by parent) */
  pinned?: boolean;
  onTogglePinned?: () => void;
  /** Override pin button tooltip (include shortcut when applicable). */
  pinTitle?: string;
  /** Compiler log / simple panels: chevron expand toggle */
  onToggleExpanded?: () => void;
  onClose?: () => void;
  onHoverChange?: (hovered: boolean) => void;
  /**
   * Fired while move/resize pointer gesture is active.
   * Parents should suppress auto-collapse until release.
   */
  onGestureChange?: (active: boolean) => void;
  onContextMenu?: (event: React.MouseEvent) => void;
  children?: React.ReactNode;
  /** Width class when not using widthPx (compact / edge-resize panels). */
  widthClass?: string;
  /** Max height when expanded (ignored when heightPx is set) */
  maxHeightClass?: string;
  headerExtra?: React.ReactNode;
  heightPx?: number;
  onHeightChange?: (height: number) => void;
  /** Expanded width in px — enables 2D resize from the free corner. */
  widthPx?: number;
  onWidthChange?: (width: number) => void;
  /**
   * Free position. Pair `offsetRight` with `offsetBottom` (bottom-right)
   * or `offsetTop` (top-right). Enables the top move handle.
   * `onOffsetChange(right, edgeY)` — edgeY is bottom or top matching the pair.
   */
  offsetRight?: number;
  offsetBottom?: number;
  offsetTop?: number;
  onOffsetChange?: (right: number, edgeY: number) => void;
  /** Extra classes on the outer shell (e.g. error flash). */
  shellClassName?: string;
}

const CORNER_CLASS: Record<FloatingPanelCorner, string> = {
  'top-right': 'top-2.5 right-2.5',
  'bottom-right': 'bottom-2.5 right-2.5',
};

export function FloatingPanelShell({
  title,
  subtitle,
  titleIcon,
  corner = 'top-right',
  expanded,
  pinned = false,
  onTogglePinned,
  pinTitle,
  onToggleExpanded,
  onClose,
  onHoverChange,
  onGestureChange,
  onContextMenu,
  children,
  widthClass = 'w-[min(232px,calc(100%-20px))]',
  maxHeightClass = 'max-h-[min(360px,58vh)]',
  headerExtra,
  heightPx,
  onHeightChange,
  widthPx,
  onWidthChange,
  offsetRight,
  offsetBottom,
  offsetTop,
  onOffsetChange,
  shellClassName,
}: FloatingPanelShellProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const usePin = typeof onTogglePinned === 'function';
  const showBody = expanded && children != null;
  const topAnchored = corner === 'top-right';
  const freePosition =
    offsetRight != null &&
    typeof onOffsetChange === 'function' &&
    (topAnchored ? offsetTop != null : offsetBottom != null);
  const movable = freePosition;
  const cornerResize =
    expanded &&
    heightPx != null &&
    onHeightChange != null &&
    widthPx != null &&
    onWidthChange != null;
  const edgeResize = expanded && heightPx != null && onHeightChange != null && !cornerResize;
  const resizeOnTop = corner.startsWith('bottom');
  // Free corner for 2D resize: top-left (bottom-right panel) or bottom-left (top-right panel).
  const resizeGripClass = topAnchored
    ? 'absolute left-0 bottom-0 z-20 w-3.5 h-3.5 cursor-nesw-resize group'
    : 'absolute left-0 top-0 z-20 w-3.5 h-3.5 cursor-nwse-resize group';
  const resizeGripMarkClass = topAnchored
    ? 'absolute left-0.5 bottom-0.5 w-2 h-2 border-l border-b border-zinc-500 group-hover:border-zinc-300 group-active:border-indigo-400 rounded-bl-[2px]'
    : 'absolute left-0.5 top-0.5 w-2 h-2 border-l border-t border-zinc-500 group-hover:border-zinc-300 group-active:border-indigo-400 rounded-tl-[2px]';

  const beginGesture = useCallback(() => {
    onGestureChange?.(true);
  }, [onGestureChange]);

  const endGesture = useCallback(() => {
    onGestureChange?.(false);
  }, [onGestureChange]);

  const startEdgeResize = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!onHeightChange || heightPx == null) return;
      event.preventDefault();
      event.stopPropagation();
      beginGesture();

      const startY = event.clientY;
      const startHeight = heightPx;
      const invert = corner.startsWith('bottom');

      const onMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientY - startY;
        onHeightChange(clampDetailsPanelHeight(startHeight + (invert ? -delta : delta)));
      };

      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        endGesture();
      };

      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    },
    [beginGesture, corner, endGesture, heightPx, onHeightChange]
  );

  const startCornerResize = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!onHeightChange || heightPx == null || !onWidthChange || widthPx == null) return;
      event.preventDefault();
      event.stopPropagation();
      beginGesture();

      const startX = event.clientX;
      const startY = event.clientY;
      const startWidth = widthPx;
      const startHeight = heightPx;
      const invertX = corner.endsWith('right');
      // bottom-right: grow up (invert Y); top-right from bottom-left: grow down (no invert).
      const invertY = corner.startsWith('bottom');

      const onMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        onWidthChange(clampFloatingPanelWidth(startWidth + (invertX ? -dx : dx)));
        onHeightChange(clampDetailsPanelHeight(startHeight + (invertY ? -dy : dy)));
      };

      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        endGesture();
      };

      document.body.style.cursor = topAnchored ? 'nesw-resize' : 'nwse-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    },
    [beginGesture, corner, endGesture, heightPx, onHeightChange, onWidthChange, topAnchored, widthPx]
  );

  const startMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!freePosition || offsetRight == null || !onOffsetChange) return;
      if (topAnchored && offsetTop == null) return;
      if (!topAnchored && offsetBottom == null) return;
      event.preventDefault();
      event.stopPropagation();
      beginGesture();

      const el = shellRef.current;
      const parent = el?.offsetParent as HTMLElement | null;
      const parentW = parent?.clientWidth ?? window.innerWidth;
      const parentH = parent?.clientHeight ?? window.innerHeight;
      const panelW = el?.offsetWidth ?? widthPx ?? 260;
      const panelH = el?.offsetHeight ?? heightPx ?? 120;

      const startX = event.clientX;
      const startY = event.clientY;
      const startRight = offsetRight;
      const startEdgeY = topAnchored ? offsetTop! : offsetBottom!;

      const onMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        if (topAnchored) {
          const next = clampFloatingPanelTopOffsets(
            startRight - dx,
            startEdgeY + dy,
            panelW,
            panelH,
            parentW,
            parentH
          );
          onOffsetChange(next.right, next.top);
        } else {
          const next = clampFloatingPanelOffsets(
            startRight - dx,
            startEdgeY - dy,
            panelW,
            panelH,
            parentW,
            parentH
          );
          onOffsetChange(next.right, next.bottom);
        }
      };

      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        endGesture();
      };

      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    },
    [
      beginGesture,
      endGesture,
      freePosition,
      heightPx,
      offsetBottom,
      offsetRight,
      offsetTop,
      onOffsetChange,
      topAnchored,
      widthPx,
    ]
  );

  const sizeStyle: React.CSSProperties = {
    ...(expanded && heightPx != null ? { height: heightPx } : undefined),
    ...(widthPx != null ? { width: widthPx } : undefined),
    ...(freePosition && topAnchored
      ? { right: offsetRight, top: offsetTop, bottom: 'auto', left: 'auto' }
      : undefined),
    ...(freePosition && !topAnchored
      ? { right: offsetRight, bottom: offsetBottom, top: 'auto', left: 'auto' }
      : undefined),
  };

  const heightClass =
    expanded && heightPx != null
      ? 'h-auto'
      : expanded
        ? maxHeightClass
        : 'h-auto';

  const resolvedWidthClass = widthPx != null ? '' : widthClass;
  const positionClass = freePosition ? '' : CORNER_CLASS[corner];

  const edgeResizeHandle = edgeResize ? (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize panel"
      className={`h-2.5 shrink-0 cursor-ns-resize flex items-center justify-center hover:bg-zinc-800/50 active:bg-indigo-500/20 group ${
        resizeOnTop ? 'border-b border-zinc-800/60' : 'border-t border-zinc-800/60'
      }`}
      onPointerDown={startEdgeResize}
      title="Drag to resize"
    >
      <span className="w-9 h-0.5 rounded-full bg-zinc-600 group-hover:bg-zinc-400 transition-colors" />
    </div>
  ) : null;

  return (
    <GraphWheelShield
      ref={shellRef}
      className={`absolute ${positionClass} z-[45] ${resolvedWidthClass} ${heightClass} flex flex-col bg-zinc-950/96 border border-zinc-800 rounded-md overflow-hidden pointer-events-auto shadow-lg shadow-black/20 ${shellClassName ?? ''}`}
      style={sizeStyle}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      onContextMenu={onContextMenu}
    >
      {cornerResize ? (
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize panel"
          className={resizeGripClass}
          onPointerDown={startCornerResize}
          title="Drag to resize"
        >
          <span className={resizeGripMarkClass} aria-hidden />
        </div>
      ) : null}
      {edgeResize && resizeOnTop ? edgeResizeHandle : null}
      {movable ? (
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Move panel"
          className="h-2.5 shrink-0 cursor-grab active:cursor-grabbing flex items-center justify-center hover:bg-zinc-800/40 group border-b border-zinc-800/40"
          onPointerDown={startMove}
          title="Drag to move"
        >
          <span className="w-7 h-0.5 rounded-full bg-zinc-600 group-hover:bg-zinc-400 transition-colors" />
        </div>
      ) : null}
      <div
        className={`relative flex items-center gap-1 px-2 py-1.5 shrink-0 min-h-[28px] ${
          showBody ? 'border-b border-zinc-800/80' : ''
        }`}
      >
        {titleIcon ? <span className="text-zinc-500 shrink-0">{titleIcon}</span> : null}
        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
          <span className="text-[10px] font-medium text-zinc-300 truncate leading-tight">{title}</span>
          {!expanded && subtitle ? (
            <span className="text-[9px] text-zinc-500 truncate leading-tight">{subtitle}</span>
          ) : null}
        </div>
        {headerExtra}
        {usePin ? (
          <Tooltip
            content={
              pinTitle ??
              (pinned ? 'Unpin — collapse when pointer leaves' : 'Pin — keep expanded')
            }
            placement="bottom"
          >
            <button
              type="button"
              onClick={onTogglePinned}
              className={`p-0.5 rounded hover:bg-zinc-800/80 ${
                pinned ? 'text-indigo-300 hover:text-indigo-200' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              aria-pressed={pinned}
            >
              {pinned ? <Pin size={12} /> : <PinOff size={12} />}
            </button>
          </Tooltip>
        ) : onToggleExpanded ? (
          <Tooltip content={expanded ? 'Compact view' : 'Expanded view'} placement="bottom">
            <button
              type="button"
              onClick={onToggleExpanded}
              className="p-0.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </Tooltip>
        ) : null}
        {onClose && (
          <Tooltip content="Close" placement="bottom">
            <button
              type="button"
              onClick={onClose}
              className="p-0.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80"
            >
              <X size={12} />
            </button>
          </Tooltip>
        )}
      </div>
      {showBody ? (
        <div
          className="flex-1 overflow-y-auto px-2 py-1.5 min-h-0 overscroll-contain"
          {...{ [PANEL_SCROLL_ATTR]: '' }}
        >
          {children}
        </div>
      ) : null}
      {edgeResize && !resizeOnTop ? edgeResizeHandle : null}
    </GraphWheelShield>
  );
}
