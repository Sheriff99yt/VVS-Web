'use client';

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  getActivityEntries,
  subscribeActivity,
  formatActivityLabel,
} from '@/lib/actionActivityLog';

const VISIBLE = 3;
const ROW_PX = 22;
const GAP_PX = 2;
const SLOT_PX = ROW_PX + GAP_PX;
const IDLE_MS = 4200;
const FADE_MS = 520;
const MOVE_MS = 320;

/**
 * Action lines only — parent strip owns the shared border with log icons.
 * Newest at the bottom; older rows scale down; whole feed fades after idle.
 */
export function CompactActionHistory({
  onOpenActivity,
}: {
  /** Opens Output → Activity. */
  onOpenActivity: () => void;
}) {
  const entries = useSyncExternalStore(
    subscribeActivity,
    getActivityEntries,
    () => [] as ReturnType<typeof getActivityEntries>
  );
  const visible = entries.slice(0, VISIBLE);
  const [enterId, setEnterId] = useState<string | null>(null);
  const [faded, setFaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const prevNewestIdRef = useRef<string | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const newestId = visible[0]?.id ?? null;
  const newestAt = visible[0]?.at ?? 0;

  useEffect(() => {
    if (!newestId) return;
    if (newestId !== prevNewestIdRef.current) {
      prevNewestIdRef.current = newestId;
      setEnterId(newestId);
      const t = window.setTimeout(() => setEnterId(null), MOVE_MS + 40);
      return () => window.clearTimeout(t);
    }
  }, [newestId]);

  useEffect(() => {
    if (!newestId) return;
    setFaded(false);
    if (idleTimerRef.current != null) window.clearTimeout(idleTimerRef.current);
    if (hovered) return;
    idleTimerRef.current = window.setTimeout(() => setFaded(true), IDLE_MS);
    return () => {
      if (idleTimerRef.current != null) window.clearTimeout(idleTimerRef.current);
    };
  }, [newestId, newestAt, hovered]);

  if (visible.length === 0) return null;

  const stackH = SLOT_PX * visible.length - GAP_PX;
  const hide = faded && !hovered;

  return (
    <>
      <style>{`
        @keyframes vvs-action-enter {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .vvsActionEnter {
          animation: vvs-action-enter ${MOVE_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>
      <div
        className="w-[120px] min-w-0 relative shrink-0"
        style={{
          height: stackH,
          opacity: hide ? 0 : 1,
          transform: hide ? 'translateY(4px)' : 'translateY(0)',
          transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease, height ${MOVE_MS}ms ease`,
          // Keep hit-testing so hover can revive after idle fade.
          pointerEvents: 'auto',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        role="status"
        aria-live="polite"
        aria-label="Recent actions"
        aria-hidden={hide}
      >
        <ul className="absolute inset-0">
          {visible.map((entry, ageIndex) => {
            const scale = 1 - ageIndex * 0.1;
            const opacity = Math.max(0.38, 1 - ageIndex * 0.28);
            const bottom = ageIndex * SLOT_PX;
            const isEntering = enterId === entry.id && ageIndex === 0;
            return (
              <li
                key={entry.id}
                className="absolute right-0 left-0 flex justify-end"
                style={{
                  bottom,
                  height: ROW_PX,
                  transition: `bottom ${MOVE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                }}
              >
                <div
                  className="flex w-full justify-end"
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'right bottom',
                    opacity,
                    transition: `opacity ${MOVE_MS}ms ease, transform ${MOVE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                  }}
                >
                  <button
                    type="button"
                    onClick={onOpenActivity}
                    title="Open Activity"
                    className={`w-full truncate text-right text-[10px] text-white hover:text-zinc-100 ${
                      isEntering ? 'vvsActionEnter' : ''
                    }`}
                    style={{
                      height: ROW_PX,
                      lineHeight: `${ROW_PX}px`,
                    }}
                  >
                    {formatActivityLabel(entry)}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
