'use client';

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

export function stepNumberInlineValue(
  current: number,
  deltaY: number,
  modifiers: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean } = {}
): number {
  const step = modifiers.shiftKey ? 10 : modifiers.ctrlKey || modifiers.metaKey ? 0.1 : 1;
  const delta = deltaY < 0 ? step : -step;
  const base = Number.isFinite(current) ? current : 0;
  const next = base + delta;
  if (step >= 1 && Number.isInteger(base)) return Math.round(next);
  return Math.round(next * 1000) / 1000;
}

/** Non-passive wheel on number inputs — scroll up/down adjusts value without zooming the canvas. */
export function useNumberInputWheel(
  onChange: (value: number) => void
): RefObject<HTMLInputElement | null> {
  const ref = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  useLayoutEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const parsed = parseFloat(el.value);
      const current = Number.isFinite(parsed) ? parsed : 0;
      const next = stepNumberInlineValue(current, event.deltaY, event);
      onChangeRef.current(next);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return ref;
}
