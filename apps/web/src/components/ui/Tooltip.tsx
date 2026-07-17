'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

type TooltipChildProps = {
  title?: string;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
  onBlur?: (e: React.FocusEvent) => void;
  'aria-describedby'?: string;
};

function clampTipPosition(
  placement: TooltipPlacement,
  top: number,
  left: number,
  tipWidth: number,
  tipHeight: number
): { top: number; left: number } {
  const pad = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let nextTop = top;
  let nextLeft = left;

  if (placement === 'top' || placement === 'bottom') {
    nextLeft = Math.min(vw - tipWidth / 2 - pad, Math.max(tipWidth / 2 + pad, left));
    if (placement === 'top') {
      nextTop = Math.max(tipHeight + pad, top);
    } else {
      nextTop = Math.min(vh - tipHeight - pad, top);
    }
  } else {
    nextTop = Math.min(vh - tipHeight / 2 - pad, Math.max(tipHeight / 2 + pad, top));
    if (placement === 'left') {
      nextLeft = Math.max(tipWidth + pad, left);
    } else {
      nextLeft = Math.min(vw - tipWidth - pad, left);
    }
  }
  return { top: nextTop, left: nextLeft };
}

/**
 * App-default hover tip. Prefer this over native `title=` for interactive chrome.
 * If `content` is omitted, uses the child's `title` prop and strips the native tooltip.
 */
export function Tooltip({
  content,
  children,
  placement = 'top',
  delayMs = 280,
  disabled = false,
  className = 'inline-flex',
}: {
  content?: React.ReactNode;
  children: React.ReactElement<TooltipChildProps>;
  placement?: TooltipPlacement;
  delayMs?: number;
  disabled?: boolean;
  /** Wrapper class — default `inline-flex` so buttons keep size. */
  className?: string;
}) {
  const tipId = useId();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolvedContent =
    content !== undefined && content !== null && content !== false
      ? content
      : children.props.title;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const updatePosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 6;
    let top = rect.top;
    let left = rect.left + rect.width / 2;
    if (placement === 'top') {
      top = rect.top - gap;
    } else if (placement === 'bottom') {
      top = rect.bottom + gap;
    } else if (placement === 'left') {
      top = rect.top + rect.height / 2;
      left = rect.left - gap;
    } else {
      top = rect.top + rect.height / 2;
      left = rect.right + gap;
    }

    const tip = tipRef.current;
    const tipWidth = tip?.offsetWidth ?? 160;
    const tipHeight = tip?.offsetHeight ?? 28;
    setCoords(clampTipPosition(placement, top, left, tipWidth, tipHeight));
  }, [placement]);

  const show = useCallback(() => {
    if (disabled || resolvedContent == null || resolvedContent === '') return;
    clearTimer();
    timerRef.current = setTimeout(() => {
      updatePosition();
      setOpen(true);
    }, delayMs);
  }, [clearTimer, delayMs, disabled, resolvedContent, updatePosition]);

  const hide = useCallback(() => {
    clearTimer();
    setOpen(false);
  }, [clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  useEffect(() => {
    if (!open) return;
    // Re-measure after paint so clamp uses real tip size.
    const raf = requestAnimationFrame(() => updatePosition());
    const onScroll = () => updatePosition();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, updatePosition, hide]);

  const child = (
    <span
      ref={(node) => {
        anchorRef.current = node;
      }}
      className={className}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {React.cloneElement(children, {
        // Strip native browser tooltip — we own hover tips.
        title: undefined,
        onMouseEnter: (e: React.MouseEvent) => {
          children.props.onMouseEnter?.(e);
          show();
        },
        onMouseLeave: (e: React.MouseEvent) => {
          children.props.onMouseLeave?.(e);
          hide();
        },
        onFocus: (e: React.FocusEvent) => {
          children.props.onFocus?.(e);
          show();
        },
        onBlur: (e: React.FocusEvent) => {
          children.props.onBlur?.(e);
          hide();
        },
        'aria-describedby': open ? tipId : children.props['aria-describedby'],
      })}
    </span>
  );

  const transform =
    placement === 'top'
      ? 'translate(-50%, -100%)'
      : placement === 'bottom'
        ? 'translate(-50%, 0)'
        : placement === 'left'
          ? 'translate(-100%, -50%)'
          : 'translate(0, -50%)';

  return (
    <>
      {child}
      {open && coords && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={tipRef}
              id={tipId}
              role="tooltip"
              className="pointer-events-none fixed z-[100] max-w-[240px] rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-[10px] leading-snug text-zinc-200 shadow-lg shadow-black/40"
              style={{ top: coords.top, left: coords.left, transform }}
            >
              {resolvedContent}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
