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
const MOVE_MS = 320;

/** Always-on compact action feed: no idle fade, no background. */
export function CompactActionHistory({
  onOpenActivity,
}: {
  onOpenActivity: () => void;
}) {
  const entries = useSyncExternalStore(
    subscribeActivity,
    getActivityEntries,
    () => [] as ReturnType<typeof getActivityEntries>
  );
  const visible = entries.slice(0, VISIBLE);
  const [enterId, setEnterId] = useState<string | null>(null);
  const prevNewestIdRef = useRef<string | null>(null);
  const newestId = visible[0]?.id ?? null;

  useEffect(() => {
    if (!newestId) return;
    if (newestId !== prevNewestIdRef.current) {
      prevNewestIdRef.current = newestId;
      setEnterId(newestId);
      const t = window.setTimeout(() => setEnterId(null), MOVE_MS + 40);
      return () => window.clearTimeout(t);
    }
  }, [newestId]);

  if (visible.length === 0) return null;

  const stackH = SLOT_PX * visible.length - GAP_PX;

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
        className="w-[132px] min-w-0 relative shrink-0 pointer-events-auto"
        style={{ height: stackH }}
        role="status"
        aria-live="polite"
        aria-label="Recent actions"
      >
        <ul className="absolute inset-0">
          {visible.map((entry, ageIndex) => {
            // ageIndex 0 = newest → bottom; older rows above, smaller and dimmer.
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
